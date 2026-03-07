// src/routes/authRoutes.js
import { Router } from 'express';
import { body } from 'express-validator';
import { register, login, getMe, updateProfile } from '../controllers/authController.js';
import { registerFcmToken } from '../controllers/notificationController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';
import { Role } from '@prisma/client'; // Importation de l'énumération Role

const router = Router();

// Validation pour l'inscription
const registerValidation = [
  body('email').isEmail().withMessage('Email invalide'),
  body('password').isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères'),
  body('displayName').notEmpty().withMessage('Le nom d\'affichage est requis'),
  body('phoneNumber').optional().isMobilePhone('any').withMessage('Numéro de téléphone invalide'),
  body('role').isIn([Role.CLIENT, Role.MERCHANT, Role.ADMIN]).withMessage('Rôle invalide'),
];

// Validation pour la connexion
const loginValidation = [
  body('email').isEmail().withMessage('Email invalide'),
  body('password').notEmpty().withMessage('Le mot de passe est requis'),
];

// Validation pour la mise à jour du profil
const updateProfileValidation = [
  body('displayName').optional().notEmpty().withMessage('Le nom d\'affichage ne peut pas être vide'),
  body('phoneNumber').optional().isMobilePhone('any').withMessage('Numéro de téléphone invalide'),
  body('latitude').optional().isFloat().withMessage('Latitude invalide'),
  body('longitude').optional().isFloat().withMessage('Longitude invalide'),
];

const fcmTokenValidation = [
  body('fcmToken').notEmpty().withMessage('Le token FCM est requis'),
];

router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfileValidation, updateProfile);
router.post('/fcm-token', protect, fcmTokenValidation, registerFcmToken);


export default router;
