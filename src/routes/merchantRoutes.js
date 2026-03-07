// src/routes/merchantRoutes.js
import { Router } from 'express';
import { body } from 'express-validator';
import { register, getMyCommerce, updateMyCommerce } from '../controllers/merchantController.js';
import { getCommerceOrders } from '../controllers/orderController.js'; // Import getCommerceOrders
import { protect, authorize } from '../middlewares/authMiddleware.js';
import { Role } from '@prisma/client';

const router = Router();

const registerValidation = [
  body('businessName').notEmpty().withMessage('Le nom de l\'entreprise est requis'),
  body('type').optional().isString(),
  body('address').notEmpty().withMessage('L\'adresse est requise'),
  body('latitude').optional({ values: 'null' }).isFloat().withMessage('Latitude invalide'),
  body('longitude').optional({ values: 'null' }).isFloat().withMessage('Longitude invalide'),
  body('phoneNumber').optional({ values: 'falsy' }).isMobilePhone('any').withMessage('Numéro de téléphone invalide'),
  body('photoURL').optional().isURL().withMessage('URL de photo invalide'),
];

const updateValidation = [
  body('businessName').optional().notEmpty(),
  body('type').optional().isString(),
  body('address').optional().notEmpty(),
  body('latitude').optional().isFloat().withMessage('Latitude invalide'),
  body('longitude').optional().isFloat().withMessage('Longitude invalide'),
  body('phoneNumber').optional().isMobilePhone('any').withMessage('NumÃ©ro de tÃ©lÃ©phone invalide'),
  body('photoURL').optional().isURL().withMessage('URL de photo invalide'),
];

router.post('/register', protect, authorize([Role.CLIENT, Role.MERCHANT]), registerValidation, register);
router.get('/me', protect, authorize(Role.MERCHANT), getMyCommerce);
router.put('/:id', protect, authorize([Role.MERCHANT, Role.ADMIN]), updateValidation, updateMyCommerce);
router.get('/orders', protect, authorize(Role.MERCHANT), getCommerceOrders); // New route

export default router;
