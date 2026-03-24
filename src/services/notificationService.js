// src/services/notificationService.js
import { admin, isFirebaseEnabled } from '../config/firebase.js';
import prisma from '../utils/prisma.js';

export const sendNotification = async (userId, title, body, type, data = {}) => {
  // Always save in DB (in-app notifications)
  try {
    await prisma.notification.create({
      data: {
        userId,
        title,
        body,
        type,
        data: data || {},
        isRead: false,
      },
    });
  } catch (error) {
    console.warn('Notification en base non enregistree:', error?.message || error);
  }

  if (!isFirebaseEnabled) {
    return;
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.fcmToken) {
    console.warn(`Impossible d'envoyer une notification push a l'utilisateur ${userId}: token FCM manquant.`);
    return;
  }

  const message = {
    notification: { title, body },
    data: {
      type: type ?? '',
      ...data,
      click_action: 'FLUTTER_NOTIFICATION_CLICK',
    },
    token: user.fcmToken,
  };

  try {
    await admin.messaging().send(message);
  } catch (error) {
    console.warn("Erreur d'envoi push:", error?.message || error);
  }
};

export const saveFcmToken = async (userId, fcmToken) => {
  await prisma.user.update({
    where: { id: userId },
    data: { fcmToken },
  });
};
