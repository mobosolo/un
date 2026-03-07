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
  const { id: userId } = req.user; // Extrait de l'utilisateur authentifié via le middleware

  try {
    const merchant = await registerMerchant(userId, businessName, type, address, latitude, longitude, phoneNumber, photoURL);
    res.status(201).json({ message: 'Demande enregistrée. En attente de validation.', merchant });
  } catch (error) {
    if (error.message === 'Cet utilisateur est déjà associé à un commerce.') {
      return res.status(409).json({ message: error.message });
    }
    res.status(500).json({ message: 'Erreur lors de l\'inscription du commerce.', error: error.message });
  }
};

export const getMyCommerce = async (req, res) => {
  const { id: userId } = req.user;

  try {
    const merchant = await getMyMerchant(userId);
    res.status(200).json(merchant);
  } catch (error) {
    if (error.message === 'Aucun commerce trouvé pour cet utilisateur.') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Erreur lors de la récupération du commerce.', error: error.message });
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
      return res.status(403).json({ message: 'AccÃ¨s interdit.' });
    }

    const updated = await updateMerchant(merchantId, req.body);
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la mise Ã  jour du commerce.', error: error.message });
  }
};
