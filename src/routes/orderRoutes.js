// src/routes/orderRoutes.js
import { Router } from 'express';
import { body } from 'express-validator';
import { create, getClientOrders, getOne, validatePickup, cancel, confirmPayment } from '../controllers/orderController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';
import prismaPkg from '@prisma/client';

const router = Router();
const { Role } = prismaPkg;

const createOrderValidation = [
  body('basketId').isUUID().withMessage('ID de panier invalide'),
  body('paymentMethod').isIn(['FLOOZ', 'TMONEY', 'CASH']).withMessage('Méthode de paiement invalide'),
];

const validatePickupValidation = [
  body('qrCode').notEmpty().withMessage('Le QR Code est requis'),
];

const confirmPaymentValidation = [
  body('transactionRef').optional().isString(),
];

router.post('/', protect, authorize(Role.CLIENT), createOrderValidation, create);
router.get('/my-orders', protect, authorize(Role.CLIENT), getClientOrders);
router.get('/:id', protect, getOne); // Accessible par CLIENT, MERCHANT, ADMIN
router.post('/:id/pickup', protect, authorize(Role.MERCHANT), validatePickupValidation, validatePickup);
router.post('/:id/cancel', protect, authorize(Role.CLIENT), cancel);
router.post('/:id/confirm-payment', protect, authorize(Role.CLIENT), confirmPaymentValidation, confirmPayment);

export default router;


