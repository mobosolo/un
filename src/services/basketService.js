// src/services/basketService.js
import prisma from '../utils/prisma.js';
import { haversineDistance } from '../utils/haversine.js';

export const createBasket = async (merchantId, data) => {
  const { title, description, category, originalPrice, discountedPrice, quantity, pickupTimeStart, pickupTimeEnd, photoURL } = data;

  const basket = await prisma.basket.create({
    data: {
      merchantId,
      title,
      description,
      category,
      originalPrice,
      discountedPrice,
      quantity,
      availableQuantity: quantity,
      pickupTimeStart: new Date(pickupTimeStart),
      pickupTimeEnd: new Date(pickupTimeEnd),
      photoURL,
    },
    select: {
      id: true,
      availableQuantity: true,
      status: true,
    }
  });

  return basket;
};

export const getBaskets = async (filters) => {
  const { lat, lon, radius, category, maxPrice } = filters;

  const where = {
    status: 'AVAILABLE', // Ne retourner que les paniers disponibles
    availableQuantity: { gt: 0 } // Ne retourner que les paniers avec une quantité disponible
  };

  if (category) {
    where.category = category;
  }

  if (maxPrice) {
    where.discountedPrice = { lte: parseInt(maxPrice) };
  }

  let baskets = await prisma.basket.findMany({
    where,
    include: {
      merchant: {
        select: {
          businessName: true,
          latitude: true,
          longitude: true,
        },
      },
    },
  });

  // Si lat, lon et radius sont fournis, on filtre par géolocalisation
  if (lat && lon && radius) {
    baskets = baskets.map(basket => {
      const distance = haversineDistance(parseFloat(lat), parseFloat(lon), parseFloat(basket.merchant.latitude), parseFloat(basket.merchant.longitude));
      return { ...basket, distanceKm: distance };
    }).filter(basket => basket.distanceKm <= parseFloat(radius))
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }

  return baskets;
};

export const getBasketById = async (id) => {
  const basket = await prisma.basket.findUnique({
    where: { id },
    include: {
      merchant: {
        select: {
          businessName: true,
          address: true,
          latitude: true,
          longitude: true,
        },
      },
    },
  });
  if (!basket) {
    throw new Error('Panier introuvable.');
  }
  return basket;
};

export const updateBasket = async (id, data) => {
  const basket = await prisma.basket.update({
    where: { id },
    data,
  });
  return basket;
};

export const deleteBasket = async (id) => {
  await prisma.basket.delete({ where: { id } });
};