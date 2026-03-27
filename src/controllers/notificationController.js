// src/controllers/notificationController.js
import { saveFcmToken } from '../services/notificationService.js';
import prisma from '../utils/prisma.js';
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
    res.status(200).json({ message: 'Token FCM enregistre avec succes.' });
  } catch (error) {
    const status = error.statusCode || 500;
    const message =
      status !== 500 && error.message ? error.message : "Erreur lors de l'enregistrement du token FCM.";
    res.status(status).json({ message });
  }
};

export const listNotifications = async (req, res) => {
  const { id: userId } = req.user;
  const limit = Math.min(parseInt(req.query.limit || '50', 10), 200);
  const offset = parseInt(req.query.offset || '0', 10);

  try {
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
    res.status(200).json(notifications);
  } catch (error) {
    const status = error.statusCode || 500;
    const message =
      status !== 500 && error.message ? error.message : 'Erreur lors de la recuperation des notifications.';
    res.status(status).json({ message });
  }
};

export const markNotificationRead = async (req, res) => {
  const { id: userId } = req.user;
  const { id } = req.params;

  try {
    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification || notification.userId !== userId) {
      return res.status(404).json({ message: 'Notification introuvable.' });
    }
    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
    res.status(200).json(updated);
  } catch (error) {
    const status = error.statusCode || 500;
    const message =
      status !== 500 && error.message ? error.message : 'Erreur lors de la mise a jour de la notification.';
    res.status(status).json({ message });
  }
};

export const markAllRead = async (req, res) => {
  const { id: userId } = req.user;
  try {
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    res.status(200).json({ message: 'Toutes les notifications ont ete marquees lues.' });
  } catch (error) {
    const status = error.statusCode || 500;
    const message =
      status !== 500 && error.message ? error.message : 'Erreur lors de la mise a jour des notifications.';
    res.status(status).json({ message });
  }
};

export const deleteNotification = async (req, res) => {
  const { id: userId } = req.user;
  const { id } = req.params;

  try {
    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification || notification.userId !== userId) {
      return res.status(404).json({ message: 'Notification introuvable.' });
    }
    await prisma.notification.delete({ where: { id } });
    res.status(200).json({ message: 'Notification supprimee.' });
  } catch (error) {
    const status = error.statusCode || 500;
    const message =
      status !== 500 && error.message ? error.message : 'Erreur lors de la suppression de la notification.';
    res.status(status).json({ message });
  }
};

export const deleteAllNotifications = async (req, res) => {
  const { id: userId } = req.user;
  try {
    await prisma.notification.deleteMany({ where: { userId } });
    res.status(200).json({ message: 'Toutes les notifications ont ete supprimees.' });
  } catch (error) {
    const status = error.statusCode || 500;
    const message =
      status !== 500 && error.message ? error.message : 'Erreur lors de la suppression des notifications.';
    res.status(status).json({ message });
  }
};
