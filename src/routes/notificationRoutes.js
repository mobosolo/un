// src/routes/notificationRoutes.js
import { Router } from 'express';
import { body } from 'express-validator';
import {
  registerFcmToken,
  listNotifications,
  markNotificationRead,
  markAllRead,
  deleteNotification,
  deleteAllNotifications,
} from '../controllers/notificationController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = Router();

const fcmTokenValidation = [
  body('fcmToken').notEmpty().withMessage('Le token FCM est requis'),
];

router.post('/fcm-token', protect, fcmTokenValidation, registerFcmToken);
router.get('/', protect, listNotifications);
router.patch('/:id/read', protect, markNotificationRead);
router.post('/read-all', protect, markAllRead);
router.delete('/:id', protect, deleteNotification);
router.delete('/', protect, deleteAllNotifications);

export default router;
