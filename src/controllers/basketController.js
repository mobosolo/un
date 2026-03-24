// src/controllers/basketController.js
import { createBasket, getBaskets, getBasketById, updateBasket, deleteBasket } from '../services/basketService.js';
import { validationResult } from 'express-validator';
import prisma from '../utils/prisma.js';

export const create = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const merchant = await prisma.merchant.findUnique({ where: { userId: req.user.id } });
    if (!merchant) {
      return res.status(403).json({ message: "Vous n'etes pas autorise a creer un panier." });
    }

    if (merchant.status !== 'APPROVED') {
      return res.status(403).json({ message: 'Compte commercant non approuve.' });
    }

    const basket = await createBasket(merchant.id, req.body);
    res.status(201).json({ message: 'Panier cree', basket });
  } catch (error) {
    const status = error.statusCode || 500;
    const message = status !== 500 && error.message ? error.message : 'Erreur lors de la creation du panier.';
    res.status(status).json({ message });
  }
};

export const getAll = async (req, res) => {
  try {
    const baskets = await getBaskets(req.query);
    res.status(200).json(baskets);
  } catch (error) {
    const status = error.statusCode || 500;
    const message = status !== 500 && error.message ? error.message : 'Erreur lors de la recuperation des paniers.';
    res.status(status).json({ message });
  }
};

export const getOne = async (req, res) => {
  try {
    const basket = await getBasketById(req.params.id);
    res.status(200).json(basket);
  } catch (error) {
    if (error.message === 'Panier introuvable.') {
      return res.status(404).json({ message: error.message });
    }
    const status = error.statusCode || 500;
    const message = status !== 500 && error.message ? error.message : 'Erreur lors de la recuperation du panier.';
    res.status(status).json({ message });
  }
};

export const update = async (req, res) => {
  try {
    const merchant = await prisma.merchant.findUnique({ where: { userId: req.user.id } });
    const basket = await prisma.basket.findUnique({ where: { id: req.params.id } });

    if (!merchant || basket.merchantId !== merchant.id) {
      return res.status(403).json({ message: "Vous n'etes pas autorise a modifier ce panier." });
    }

    const updates = { ...req.body };

    if (updates.quantity !== undefined) {
      const newQty = Number(updates.quantity);
      if (!Number.isNaN(newQty)) {
        const currentQty = Number(basket.quantity || 0);
        const currentAvail = Number(basket.availableQuantity || 0);
        const soldCount = Math.max(0, currentQty - currentAvail);
        const nextAvail = Math.max(0, newQty - soldCount);
        updates.availableQuantity = nextAvail;

        if (nextAvail === 0) {
          updates.status = 'SOLD_OUT';
        } else if (basket.status === 'SOLD_OUT') {
          const isExpired = basket.pickupTimeEnd && new Date(basket.pickupTimeEnd).getTime() < Date.now();
          updates.status = isExpired ? 'EXPIRED' : 'AVAILABLE';
        }
      }
    }

    const updatedBasket = await updateBasket(req.params.id, updates);
    res.status(200).json({ message: 'Panier mis a jour', basket: updatedBasket });
  } catch (error) {
    const status = error.statusCode || 500;
    const message = status !== 500 && error.message ? error.message : 'Erreur lors de la mise a jour du panier.';
    res.status(status).json({ message });
  }
};

export const remove = async (req, res) => {
  try {
    const basket = await prisma.basket.findUnique({ where: { id: req.params.id } });
    if (!basket) {
      return res.status(404).json({ message: 'Panier introuvable.' });
    }

    const merchant = await prisma.merchant.findUnique({ where: { userId: req.user.id } });

    if (req.user.role !== 'ADMIN' && (!merchant || basket.merchantId !== merchant.id)) {
      return res.status(403).json({ message: "Vous n'etes pas autorise a supprimer ce panier." });
    }

    await deleteBasket(req.params.id);
    res.status(200).json({ message: 'Panier supprime' });
  } catch (error) {
    const status = error.statusCode || 500;
    const message = status !== 500 && error.message ? error.message : 'Erreur lors de la suppression du panier.';
    res.status(status).json({ message });
  }
};

export const quickUpdate = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const merchant = await prisma.merchant.findUnique({ where: { userId: req.user.id } });
    const basket = await prisma.basket.findUnique({ where: { id: req.params.id } });

    if (!merchant || !basket || basket.merchantId !== merchant.id) {
      return res.status(403).json({ message: "Vous n'etes pas autorise a modifier ce panier." });
    }

    const { delta, status, shiftMinutes } = req.body;
    const updates = {};

    if (typeof delta === 'number') {
      const maxQty = basket.quantity ?? 0;
      const current = basket.availableQuantity ?? maxQty;
      let next = current + delta;
      if (next < 0) next = 0;
      if (maxQty > 0 && next > maxQty) next = maxQty;
      updates.availableQuantity = next;

      if (next === 0) {
        updates.status = 'SOLD_OUT';
      } else if (basket.status === 'SOLD_OUT') {
        const isExpired = basket.pickupTimeEnd && new Date(basket.pickupTimeEnd).getTime() < Date.now();
        updates.status = isExpired ? 'EXPIRED' : 'AVAILABLE';
      }
    }

    if (status) {
      updates.status = status;
    }

    if (typeof shiftMinutes === 'number' && basket.pickupTimeStart && basket.pickupTimeEnd) {
      const start = new Date(basket.pickupTimeStart);
      const end = new Date(basket.pickupTimeEnd);
      const ms = shiftMinutes * 60 * 1000;
      updates.pickupTimeStart = new Date(start.getTime() + ms);
      updates.pickupTimeEnd = new Date(end.getTime() + ms);
    }

    const updatedBasket = await updateBasket(req.params.id, updates);
    res.status(200).json({ message: 'Panier mis a jour', basket: updatedBasket });
  } catch (error) {
    const status = error.statusCode || 500;
    const message = status !== 500 && error.message ? error.message : 'Erreur lors de la mise a jour du panier.';
    res.status(status).json({ message });
  }
};

export const duplicate = async (req, res) => {
  try {
    const merchant = await prisma.merchant.findUnique({ where: { userId: req.user.id } });
    const basket = await prisma.basket.findUnique({ where: { id: req.params.id } });

    if (!merchant || !basket || basket.merchantId !== merchant.id) {
      return res.status(403).json({ message: "Vous n'etes pas autorise a dupliquer ce panier." });
    }

    const now = new Date();
    const start =
      basket.pickupTimeStart && basket.pickupTimeStart > now
        ? basket.pickupTimeStart
        : new Date(now.getTime() + 60 * 60 * 1000);
    const end =
      basket.pickupTimeEnd && basket.pickupTimeEnd > now
        ? basket.pickupTimeEnd
        : new Date(start.getTime() + 2 * 60 * 60 * 1000);

    const duplicateBasket = await prisma.basket.create({
      data: {
        merchantId: basket.merchantId,
        title: basket.title,
        description: basket.description,
        category: basket.category,
        originalPrice: basket.originalPrice,
        discountedPrice: basket.discountedPrice,
        quantity: basket.quantity,
        availableQuantity: basket.quantity,
        pickupTimeStart: start,
        pickupTimeEnd: end,
        photoURL: basket.photoURL,
        status: 'AVAILABLE',
      },
    });

    res.status(201).json({ message: 'Panier duplique', basket: duplicateBasket });
  } catch (error) {
    const status = error.statusCode || 500;
    const message = status !== 500 && error.message ? error.message : 'Erreur lors de la duplication.';
    res.status(status).json({ message });
  }
};
