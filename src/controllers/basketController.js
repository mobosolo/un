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
      return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à créer un panier.' });
    }

    if (merchant.status !== 'APPROVED') {
      return res.status(403).json({ message: 'Compte commerÃ§ant non approuvÃ©.' });
    }

    const basket = await createBasket(merchant.id, req.body);
    res.status(201).json({ message: 'Panier créé', basket });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la création du panier.', error: error.message });
  }
};

export const getAll = async (req, res) => {
  try {
    const baskets = await getBaskets(req.query);
    res.status(200).json(baskets);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des paniers.', error: error.message });
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
    res.status(500).json({ message: 'Erreur lors de la récupération du panier.', error: error.message });
  }
};

export const update = async (req, res) => {
  try {
    // S'assurer que seul le propriétaire du panier peut le modifier
    const merchant = await prisma.merchant.findUnique({ where: { userId: req.user.id } });
    const basket = await prisma.basket.findUnique({ where: { id: req.params.id } });

    if (!merchant || basket.merchantId !== merchant.id) {
      return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à modifier ce panier.' });
    }

    const updatedBasket = await updateBasket(req.params.id, req.body);
    res.status(200).json({ message: 'Panier mis à jour', basket: updatedBasket });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la mise à jour du panier.', error: error.message });
  }
};

export const remove = async (req, res) => {
  try {
    // S'assurer que seul le propriétaire ou un admin peut supprimer
    const basket = await prisma.basket.findUnique({ where: { id: req.params.id } });
    if (!basket) {
      return res.status(404).json({ message: 'Panier introuvable.' });
    }

    const merchant = await prisma.merchant.findUnique({ where: { userId: req.user.id } });

    if (req.user.role !== 'ADMIN' && (!merchant || basket.merchantId !== merchant.id)) {
      return res.status(403).json({ message: 'Vous n\'êtes pas autorisé à supprimer ce panier.' });
    }

    await deleteBasket(req.params.id);
    res.status(200).json({ message: 'Panier supprimé' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la suppression du panier.', error: error.message });
  }
};
