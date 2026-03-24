// src/controllers/authController.js
import { registerUser, loginUser, requestPasswordReset, resetPassword } from '../services/authService.js';
import { sendResetPasswordEmail } from '../services/emailService.js';
import { validationResult } from 'express-validator';
import prisma from '../utils/prisma.js';

export const register = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password, displayName, phoneNumber, role } = req.body;

  try {
    const { user, token } = await registerUser(email, password, displayName, phoneNumber, role);
    res.status(201).json({ message: 'Compte cree avec succes', token, user });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message || 'Erreur lors de la creation du compte.' });
  }
};

export const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    const { user, token } = await loginUser(email, password);
    res.status(200).json({ token, user });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      message: error.message || 'Erreur lors de la connexion.',
    });
  }
};

export const getMe = async (req, res) => {
  const userResponse = {
    ...req.user,
    latitude: req.user.latitude ? parseFloat(req.user.latitude) : null,
    longitude: req.user.longitude ? parseFloat(req.user.longitude) : null,
  };
  res.status(200).json(userResponse);
};

export const updateProfile = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.user;
  const { displayName, phoneNumber, latitude, longitude } = req.body;

  try {
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        displayName,
        phoneNumber,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        phoneNumber: true,
        role: true,
        latitude: true,
        longitude: true,
      },
    });

    const userResponse = {
      ...updatedUser,
      latitude: updatedUser.latitude ? parseFloat(updatedUser.latitude) : null,
      longitude: updatedUser.longitude ? parseFloat(updatedUser.longitude) : null,
    };

    res.status(200).json({ message: 'Profil mis a jour', user: userResponse });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la mise a jour du profil.', error: error.message });
  }
};

export const forgotPassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email } = req.body;

  try {
    const result = await requestPasswordReset(email);
    const response = { message: 'Si le compte existe, un email de reinitialisation a ete envoye.' };
    if (result?.token) {
      try {
        await sendResetPasswordEmail(email, result.token, result.expires);
      } catch (mailError) {
        console.warn('Reset password email failed:', mailError?.message || mailError);
      }
    }
    if (process.env.DEV_SHOW_RESET_TOKEN === 'true' && result?.token) {
      response.token = result.token;
      response.expires = result.expires;
    }
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la demande.', error: error.message });
  }
};

export const resetPasswordPage = async (req, res) => {
  const { token = '', email = '' } = req.query;
  const safeToken = String(token).replace(/"/g, '&quot;');
  const safeEmail = String(email).replace(/"/g, '&quot;');

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>MealFlavor - Reinitialisation</title>
    <style>
      :root { color-scheme: light; }
      body { font-family: Arial, sans-serif; background:#f5f5f5; margin:0; padding:0; }
      .wrap { max-width:420px; margin:40px auto; background:#fff; padding:24px; border-radius:14px; box-shadow:0 10px 30px rgba(0,0,0,0.08); }
      h1 { font-size:20px; margin:0 0 8px; }
      p { margin:0 0 16px; color:#555; font-size:14px; }
      label { display:block; font-size:13px; margin:12px 0 6px; }
      input { width:100%; padding:12px; border:1px solid #ddd; border-radius:10px; font-size:14px; }
      button { width:100%; margin-top:16px; padding:12px; border:0; border-radius:999px; background:#f15a24; color:#fff; font-weight:bold; cursor:pointer; }
      .msg { margin-top:12px; font-size:13px; }
      .ok { color:#0a7a3d; }
      .err { color:#b00020; }
    </style>
  </head>
  <body>
    <div class="wrap">
      <h1>Reinitialiser le mot de passe</h1>
      <p>Entrez votre nouveau mot de passe.</p>
      <form id="resetForm">
        <label>Email</label>
        <input type="email" name="email" value="${safeEmail}" required />
        <label>Code</label>
        <input type="text" name="token" value="${safeToken}" required />
        <label>Nouveau mot de passe</label>
        <input type="password" name="newPassword" minlength="6" required />
        <button type="submit">Mettre a jour</button>
      </form>
      <div id="message" class="msg"></div>
    </div>
    <script>
      const form = document.getElementById('resetForm');
      const msg = document.getElementById('message');
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        msg.textContent = 'Envoi en cours...';
        msg.className = 'msg';
        const formData = new FormData(form);
        const payload = {
          email: formData.get('email'),
          token: formData.get('token'),
          newPassword: formData.get('newPassword'),
        };
        try {
          const resp = await fetch('/api/auth/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          const data = await resp.json();
          if (!resp.ok) throw new Error(data.message || 'Erreur');
          msg.textContent = 'Mot de passe mis a jour. Vous pouvez revenir a l application.';
          msg.className = 'msg ok';
        } catch (err) {
          msg.textContent = err.message || 'Erreur';
          msg.className = 'msg err';
        }
      });
    </script>
  </body>
</html>`);
};

export const resetPasswordHandler = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, token, newPassword } = req.body;

  try {
    await resetPassword(email, token, newPassword);
    res.status(200).json({ message: 'Mot de passe mis a jour.' });
  } catch (error) {
    if (error.message === 'Token invalide ou expire.') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Erreur lors de la reinitialisation.', error: error.message });
  }
};
