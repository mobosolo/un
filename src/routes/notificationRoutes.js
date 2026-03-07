// src/routes/notificationRoutes.js
import { Router } from 'express';
import { body } from 'express-validator';
import { registerFcmToken } from '../controllers/notificationController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = Router();

const fcmTokenValidation = [
  body('fcmToken').notEmpty().withMessage('Le token FCM est requis'),
];

router.post('/fcm-token', protect, fcmTokenValidation, registerFcmToken);

export default router;
