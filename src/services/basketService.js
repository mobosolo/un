// src/services/basketService.js
import prisma from '../utils/prisma.js';
import { haversineDistance } from '../utils/haversine.js';

const RETENTION_HOURS = 2;

const markExpiredBaskets = async () => {
  const now = new Date();
  await prisma.basket.updateMany({
    where: {
      status: 'AVAILABLE',
      pickupTimeEnd: { lt: now },
    },
    data: { status: 'EXPIRED' },
  });
};

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

  await markExpiredBaskets();

  const now = new Date();
  const retentionCutoff = new Date(now.getTime() - RETENTION_HOURS * 60 * 60 * 1000);

  const where = {
    pickupTimeEnd: { gte: retentionCutoff },
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

  if (lat && lon && radius) {
    const userLat = parseFloat(lat);
    const userLon = parseFloat(lon);
    const maxRadius = parseFloat(radius);

    baskets = baskets
      .filter((basket) => basket.merchant?.latitude != null && basket.merchant?.longitude != null)
      .map((basket) => {
        const merchantLat = parseFloat(basket.merchant.latitude);
        const merchantLon = parseFloat(basket.merchant.longitude);
        const distance = haversineDistance(userLat, userLon, merchantLat, merchantLon);
        return { ...basket, distanceKm: distance };
      })
      .filter((basket) => basket.distanceKm <= maxRadius)
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }

  return baskets;
};

export const getBasketById = async (id) => {
  await markExpiredBaskets();

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
