// src/controllers/notificationController.js
import { saveFcmToken } from '../services/notificationService.js';
import { validationResult } from 'express-validator';

export const registerFcmToken = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { fcmToken } = req.body;
  const { id: userId } = req.user;

  try {
    await saveFcmToken(userId, fcmToken);
    res.status(200).json({ message: 'Token FCM enregistré avec succès.' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de l\'enregistrement du token FCM.', error: error.message });
  }
};
