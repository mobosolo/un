// src/services/notificationService.js
import admin from '../config/firebase.js';
import prisma from '../utils/prisma.js';

export const sendNotification = async (userId, title, body, type, data = {}) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user || !user.fcmToken) {
    console.warn(`Impossible d'envoyer une notification à l'utilisateur ${userId} : Token FCM manquant ou utilisateur introuvable.`);
    return;
  }

  const message = {
    notification: {
      title,
      body,
    },
    data: {
      type,
      ...data,
      click_action: 'FLUTTER_NOTIFICATION_CLICK', // Nécessaire pour Flutter
    },
    token: user.fcmToken,
  };

  try {
    const response = await admin.messaging().send(message);
    console.log('Notification envoyée avec succès :', response);

    // Enregistrer la notification dans la base de données
    await prisma.notification.create({
      data: {
        userId,
        title,
        body,
        type,
        data: data || {}, // S'assurer que 'data' est un objet valide
        isRead: false,
      },
    });

    return response;
  } catch (error) {
    console.error('Erreur lors de l\'envoi de la notification :', error);
    throw new Error('Erreur lors de l\'envoi de la notification.');
  }
};

export const saveFcmToken = async (userId, fcmToken) => {
  await prisma.user.update({
    where: { id: userId },
    data: { fcmToken },
  });
};
