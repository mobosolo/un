// src/controllers/authController.js
import { registerUser, loginUser, requestPasswordReset, resetPassword } from '../services/authService.js';
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
    next(error);
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
    if (error.message === 'Identifiants invalides.') {
      return res.status(401).json({ message: error.message });
    }
    res.status(500).json({ message: 'Erreur lors de la connexion.', error: error.message });
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
    const response = { message: 'Si le compte existe, un lien sera envoye.' };
    if (process.env.DEV_SHOW_RESET_TOKEN === 'true' && result?.token) {
      response.token = result.token;
      response.expires = result.expires;
    }
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la demande.', error: error.message });
  }
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
