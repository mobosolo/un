// src/controllers/authController.js
import { registerUser, loginUser } from '../services/authService.js';
import { validationResult } from 'express-validator';
import prisma from '../utils/prisma.js'; // Import prisma for updateProfile

export const register = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password, displayName, phoneNumber, role } = req.body;

  try {
    const { user, token } = await registerUser(email, password, displayName, phoneNumber, role);
    res.status(201).json({ message: 'Compte créé avec succès', token, user });
  } catch (error) {
    next(error); // Passe l'erreur au gestionnaire global
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
  // L'utilisateur est attaché à l'objet req par le middleware protect
  // Assurez-vous que latitude et longitude sont des nombres
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

  const { id } = req.user; // L'ID de l'utilisateur est extrait du token JWT
  const { displayName, phoneNumber, latitude, longitude } = req.body;

  try {
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        displayName,
        phoneNumber,
        latitude: latitude ? parseFloat(latitude) : null, // Ensure parseFloat for update as well
        longitude: longitude ? parseFloat(longitude) : null, // Ensure parseFloat for update as well
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

    // Convertir Decimal en Number pour la réponse JSON
    const userResponse = {
      ...updatedUser,
      latitude: updatedUser.latitude ? parseFloat(updatedUser.latitude) : null,
      longitude: updatedUser.longitude ? parseFloat(updatedUser.longitude) : null,
    };

    res.status(200).json({ message: 'Profil mis à jour', user: userResponse });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la mise à jour du profil.', error: error.message });
  }
};