// src/services/merchantService.js
import prisma from '../utils/prisma.js';

export const registerMerchant = async (userId, businessName, type, address, latitude, longitude, phoneNumber, photoURL) => {
  // Vérifier si l'utilisateur a déjà un commerce
  const existingMerchant = await prisma.merchant.findUnique({ where: { userId } });
  if (existingMerchant) {
    throw new Error('Cet utilisateur est déjà associé à un commerce.');
  }

  // Créer le commerce
  const merchant = await prisma.merchant.create({
    data: {
      userId,
      businessName,
      type,
      address,
      latitude,
      longitude,
      phoneNumber,
      photoURL,
    },
    select: {
      id: true,
      businessName: true,
      type: true,
      address: true,
      latitude: true,
      longitude: true,
      phoneNumber: true,
      photoURL: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    }
  });

  // Convertir les Decimal en Number pour la réponse JSON
  const merchantResponse = {
    ...merchant,
    latitude: merchant.latitude ? parseFloat(merchant.latitude) : null,
    longitude: merchant.longitude ? parseFloat(merchant.longitude) : null,
  };

  return merchantResponse;
};

export const getMyMerchant = async (userId) => {
  const merchant = await prisma.merchant.findUnique({ where: { userId } });
  if (!merchant) {
    throw new Error('Aucun commerce trouvé pour cet utilisateur.');
  }
  
  // Convertir les Decimal en Number pour la réponse JSON
  const merchantResponse = {
    ...merchant,
    latitude: merchant.latitude ? parseFloat(merchant.latitude) : null,
    longitude: merchant.longitude ? parseFloat(merchant.longitude) : null,
  };

  return merchantResponse;
};

export const approveMerchant = async (merchantId) => {
  const merchant = await prisma.merchant.update({
    where: { id: merchantId },
    data: { status: 'APPROVED' },
  });
  return merchant;
};

export const rejectMerchant = async (merchantId) => {
  const merchant = await prisma.merchant.update({
    where: { id: merchantId },
    data: { status: 'REJECTED' },
  });
  return merchant;
};

export const updateMerchant = async (merchantId, data) => {
  const updated = await prisma.merchant.update({
    where: { id: merchantId },
    data,
  });

  const merchantResponse = {
    ...updated,
    latitude: updated.latitude ? parseFloat(updated.latitude) : null,
    longitude: updated.longitude ? parseFloat(updated.longitude) : null,
  };

  return merchantResponse;
};
