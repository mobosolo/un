// src/controllers/orderController.js
import { createOrder, getMyOrders, getMerchantOrders, getOrderById, validateOrderPickup, cancelOrder } from '../services/orderService.js';
import { validationResult } from 'express-validator';
import { Role } from '@prisma/client';
import prisma from '../utils/prisma.js';

export const create = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { basketId, paymentMethod } = req.body;
  const { id: userId } = req.user;

  try {
    const { order, qrCodeImage, paymentUrl } = await createOrder(userId, basketId, paymentMethod);
    // Dans le cas de paiement en ligne, il y aura une paymentUrl à retourner
    res.status(201).json({
      order: {
        id: order.id,
        status: order.orderStatus,
        qrCode: order.qrCode,
        amount: order.price,
      },
      qrCodeImage,
      paymentUrl,
      message: 'Commande créée avec succès.'
    });
  } catch (error) {
    if (error.message === 'Panier introuvable.' || error.message === 'Ce panier n\'est plus disponible.') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Erreur lors de la création de la commande.', error: error.message });
  }
};

export const getClientOrders = async (req, res) => {
  const { id: userId } = req.user;

  try {
    const orders = await getMyOrders(userId);
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des commandes.', error: error.message });
  }
};

export const getCommerceOrders = async (req, res) => {
  const { id: userId } = req.user;

  try {
    // Récupérer l'ID du commerçant associé à l'utilisateur
    const merchant = await prisma.merchant.findUnique({ where: { userId } });
    if (!merchant) {
      return res.status(403).json({ message: 'Vous n\'êtes pas un commerçant valide.' });
    }

    const orders = await getMerchantOrders(merchant.id);
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des commandes du commerçant.', error: error.message });
  }
};

export const getOne = async (req, res) => {
  const { id: orderId } = req.params;
  const { id: userId, role } = req.user;

  try {
    const order = await getOrderById(orderId);

    // S'assurer que seul le client ou le commerçant concerné (ou l'admin) peut voir la commande
    if (role === Role.CLIENT && order.userId !== userId) {
      return res.status(403).json({ message: 'Accès interdit.' });
    }
    if (role === Role.MERCHANT) {
      const merchant = await prisma.merchant.findUnique({ where: { userId } });
      if (!merchant || order.merchantId !== merchant.id) {
        return res.status(403).json({ message: 'Accès interdit.' });
      }
    }

    res.status(200).json(order);
  } catch (error) {
    if (error.message === 'Commande introuvable.') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Erreur lors de la récupération de la commande.', error: error.message });
  }
};

export const validatePickup = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id: orderId } = req.params;
  const { qrCode } = req.body;
  const { id: merchantUserId } = req.user; // ID de l'utilisateur commerçant authentifié

  try {
    const updatedOrder = await validateOrderPickup(orderId, qrCode, merchantUserId);
    res.status(200).json({ message: 'Commande validée', order: updatedOrder });
  } catch (error) {
    if (error.message === 'Commande introuvable.' || error.message === 'QR Code invalide.' || error.message === 'Vous n\'êtes pas autorisé à valider cette commande.' || error.message === 'Cette commande a déjà été retirée.') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Erreur lors de la validation du retrait.', error: error.message });
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
    res.status(500).json({ message: 'Erreur lors de l\'annulation.', error: error.message });
  }
};
