// src/routes/orderRoutes.js
import { Router } from 'express';
import { body } from 'express-validator';
import { create, getClientOrders, getOne, validatePickup } from '../controllers/orderController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';
import { Role, PaymentMethod } from '@prisma/client';

const router = Router();

const createOrderValidation = [
  body('basketId').isUUID().withMessage('ID de panier invalide'),
  body('paymentMethod').isIn(Object.values(PaymentMethod)).withMessage('Méthode de paiement invalide'),
];

const validatePickupValidation = [
  body('qrCode').notEmpty().withMessage('Le QR Code est requis'),
];

router.post('/', protect, authorize(Role.CLIENT), createOrderValidation, create);
router.get('/my-orders', protect, authorize(Role.CLIENT), getClientOrders);
router.get('/:id', protect, getOne); // Accessible par CLIENT, MERCHANT, ADMIN
router.post('/:id/pickup', protect, authorize(Role.MERCHANT), validatePickupValidation, validatePickup);

export default router;
