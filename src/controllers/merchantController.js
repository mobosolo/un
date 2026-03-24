// src/controllers/merchantController.js
import { registerMerchant, getMyMerchant, updateMerchant } from '../services/merchantService.js';
import prisma from '../utils/prisma.js';
import { validationResult } from 'express-validator';

export const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { businessName, type, address, latitude, longitude, phoneNumber, photoURL } = req.body;
  const { id: userId } = req.user;

  try {
    const merchant = await registerMerchant(userId, businessName, type, address, latitude, longitude, phoneNumber, photoURL);
    res.status(201).json({ message: 'Demande enregistree. En attente de validation.', merchant });
  } catch (error) {
    if (error.message === 'Cet utilisateur est deja associe a un commerce.') {
      return res.status(409).json({ message: error.message });
    }
    const status = error.statusCode || 500;
    const message = status !== 500 && error.message ? error.message : "Erreur lors de l'inscription du commerce.";
    res.status(status).json({ message });
  }
};

export const getMyCommerce = async (req, res) => {
  const { id: userId } = req.user;

  try {
    const merchant = await getMyMerchant(userId);
    res.status(200).json(merchant);
  } catch (error) {
    if (error.message === 'Aucun commerce trouve pour cet utilisateur.') {
      return res.status(404).json({ message: error.message });
    }
    const status = error.statusCode || 500;
    const message = status !== 500 && error.message ? error.message : 'Erreur lors de la recuperation du commerce.';
    res.status(status).json({ message });
  }
};

export const updateMyCommerce = async (req, res) => {
  const { id: userId, role } = req.user;
  const { id: merchantId } = req.params;

  try {
    const merchant = await prisma.merchant.findUnique({ where: { id: merchantId } });
    if (!merchant) {
      return res.status(404).json({ message: 'Commerce introuvable.' });
    }

    if (role !== 'ADMIN' && merchant.userId !== userId) {
      return res.status(403).json({ message: 'Acces interdit.' });
    }

    const updated = await updateMerchant(merchantId, req.body);
    res.status(200).json(updated);
  } catch (error) {
    const status = error.statusCode || 500;
    const message = status !== 500 && error.message ? error.message : 'Erreur lors de la mise a jour du commerce.';
    res.status(status).json({ message });
  }
};

export const getDailyStats = async (req, res) => {
  const { id: userId } = req.user;
  try {
    const merchant = await prisma.merchant.findUnique({ where: { userId } });
    if (!merchant) {
      return res.status(404).json({ message: 'Commerce introuvable.' });
    }

    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const pickedUpCount = await prisma.order.count({
      where: {
        merchantId: merchant.id,
        orderStatus: 'PICKED_UP',
        pickedUpAt: { gte: start, lte: end },
      },
    });

    const paidTodayCount = await prisma.order.count({
      where: {
        merchantId: merchant.id,
        paymentStatus: 'PAID',
        orderStatus: { not: 'CANCELLED' },
        paidAt: { gte: start, lte: end },
      },
    });

    const revenueAgg = await prisma.order.aggregate({
      where: {
        merchantId: merchant.id,
        paymentStatus: 'PAID',
        orderStatus: { not: 'CANCELLED' },
        paidAt: { gte: start, lte: end },
      },
      _sum: { price: true },
    });

    const revenue = revenueAgg._sum.price || 0;
    const foodSavedKg = pickedUpCount * 2;

    return res.status(200).json({
      basketsSoldToday: paidTodayCount,
      revenueToday: revenue,
      foodSavedKg,
    });
  } catch (error) {
    const status = error.statusCode || 500;
    const message = status !== 500 && error.message ? error.message : 'Erreur lors de la recuperation des statistiques.';
    return res.status(status).json({ message });
  }
};
