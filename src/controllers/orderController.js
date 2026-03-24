// src/controllers/orderController.js
import {
  createOrder,
  getMyOrders,
  getMerchantOrders,
  getOrderById,
  validateOrderPickup,
  cancelOrder,
  confirmOrderPayment,
} from '../services/orderService.js';
import { validationResult } from 'express-validator';
import prismaPkg from '@prisma/client';
import prisma from '../utils/prisma.js';
const { Role } = prismaPkg;

export const create = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { basketId, paymentMethod } = req.body;
  const { id: userId } = req.user;

  try {
    const { order, qrCodeImage, paymentUrl } = await createOrder(userId, basketId, paymentMethod);
    res.status(201).json({
      order: {
        id: order.id,
        status: order.orderStatus,
        qrCode: order.qrCode,
        amount: order.price,
      },
      qrCodeImage,
      paymentUrl,
      message: 'Commande creee avec succes.',
    });
  } catch (error) {
    if (error.message === 'Panier introuvable.' || error.message === "Ce panier n'est plus disponible.") {
      return res.status(400).json({ message: error.message });
    }
    const status = error.statusCode || 500;
    const message = status !== 500 && error.message ? error.message : 'Erreur lors de la creation de la commande.';
    res.status(status).json({ message });
  }
};

export const getClientOrders = async (req, res) => {
  const { id: userId } = req.user;

  try {
    const orders = await getMyOrders(userId);
    res.status(200).json(orders);
  } catch (error) {
    const status = error.statusCode || 500;
    const message = status !== 500 && error.message ? error.message : 'Erreur lors de la recuperation des commandes.';
    res.status(status).json({ message });
  }
};

export const getCommerceOrders = async (req, res) => {
  const { id: userId } = req.user;

  try {
    const merchant = await prisma.merchant.findUnique({ where: { userId } });
    if (!merchant) {
      return res.status(403).json({ message: "Vous n'etes pas un commercant valide." });
    }

    const orders = await getMerchantOrders(merchant.id);
    res.status(200).json(orders);
  } catch (error) {
    const status = error.statusCode || 500;
    const message =
      status !== 500 && error.message
        ? error.message
        : 'Erreur lors de la recuperation des commandes du commercant.';
    res.status(status).json({ message });
  }
};

export const getOne = async (req, res) => {
  const { id: orderId } = req.params;
  const { id: userId, role } = req.user;

  try {
    const order = await getOrderById(orderId);

    if (role === Role.CLIENT && order.userId !== userId) {
      return res.status(403).json({ message: 'Acces interdit.' });
    }
    if (role === Role.MERCHANT) {
      const merchant = await prisma.merchant.findUnique({ where: { userId } });
      if (!merchant || order.merchantId !== merchant.id) {
        return res.status(403).json({ message: 'Acces interdit.' });
      }
    }

    res.status(200).json(order);
  } catch (error) {
    if (error.message === 'Commande introuvable.') {
      return res.status(404).json({ message: error.message });
    }
    const status = error.statusCode || 500;
    const message = status !== 500 && error.message ? error.message : 'Erreur lors de la recuperation de la commande.';
    res.status(status).json({ message });
  }
};

export const validatePickup = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id: orderId } = req.params;
  const { qrCode } = req.body;
  const { id: merchantUserId } = req.user;

  try {
    const updatedOrder = await validateOrderPickup(orderId, qrCode, merchantUserId);
    res.status(200).json({ message: 'Commande validee', order: updatedOrder });
  } catch (error) {
    if (
      error.message === 'Commande introuvable.' ||
      error.message === 'QR Code invalide.' ||
      error.message === "Vous n'etes pas autorise a valider cette commande." ||
      error.message === 'Cette commande a deja ete retiree.'
    ) {
      return res.status(400).json({ message: error.message });
    }
    const status = error.statusCode || 500;
    const message = status !== 500 && error.message ? error.message : 'Erreur lors de la validation du retrait.';
    res.status(status).json({ message });
  }
};

export const cancel = async (req, res) => {
  const { id: orderId } = req.params;
  const { id: userId } = req.user;

  try {
    const updated = await cancelOrder(orderId, userId);
    res.status(200).json({ message: 'Commande annulee.', order: updated });
  } catch (error) {
    if (
      error.message === 'Commande introuvable.' ||
      error.message === 'Acces interdit.' ||
      error.message === 'Cette commande a deja ete retiree.'
    ) {
      return res.status(400).json({ message: error.message });
    }
    const status = error.statusCode || 500;
    const message = status !== 500 && error.message ? error.message : "Erreur lors de l'annulation.";
    res.status(status).json({ message });
  }
};

export const confirmPayment = async (req, res) => {
  const { id: orderId } = req.params;
  const { id: userId } = req.user;
  const { transactionRef } = req.body;

  try {
    const updated = await confirmOrderPayment(orderId, userId, transactionRef);
    res.status(200).json({ message: 'Paiement confirme.', order: updated });
  } catch (error) {
    if (
      error.message === 'Commande introuvable.' ||
      error.message === 'Acces interdit.' ||
      error.message === 'Commande annulee.'
    ) {
      return res.status(400).json({ message: error.message });
    }
    const status = error.statusCode || 500;
    const message = status !== 500 && error.message ? error.message : 'Erreur lors de la confirmation du paiement.';
    res.status(status).json({ message });
  }
};
