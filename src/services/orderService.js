// src/services/orderService.js
import prisma from '../utils/prisma.js';
import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import { sendNotification } from './notificationService.js';
import prismaPkg from '@prisma/client';
const { PaymentMethod, Role } = prismaPkg;

export const createOrder = async (userId, basketId, paymentMethod) => {
  const basket = await prisma.basket.findUnique({
    where: { id: basketId },
    include: {
        merchant: {
            include: {
                user: true // Pour obtenir l'email et le nom de l'utilisateur commerçant
            }
        }
    }
  });

  if (!basket) {
    throw new Error('Panier introuvable.');
  }

  if (basket.availableQuantity <= 0) {
    throw new Error('Ce panier n\'est plus disponible.');
  }
  if (basket.status !== 'AVAILABLE') {
    throw new Error('Ce panier n\'est plus disponible.');
  }
  if (basket.pickupTimeEnd && new Date(basket.pickupTimeEnd).getTime() < Date.now()) {
    throw new Error('Ce panier n\'est plus disponible.');
  }

  // Vérifier si l'utilisateur existe pour récupérer ses infos de paiement
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new Error('Utilisateur introuvable.');
  }


  // Décrémenter la quantité disponible
  const updatedBasket = await prisma.basket.update({
    where: { id: basketId },
    data: { availableQuantity: { decrement: 1 } },
    select: { availableQuantity: true, status: true },
  });
  if (updatedBasket.availableQuantity <= 0 && updatedBasket.status !== 'SOLD_OUT') {
    await prisma.basket.update({
      where: { id: basketId },
      data: { status: 'SOLD_OUT' },
    });
  }

  const qrCodeData = uuidv4();
  const qrCodeImage = await QRCode.toDataURL(qrCodeData);

  let paymentStatus = 'PENDING';
  let paidAt = null;

  if (paymentMethod === PaymentMethod.CASH) {
    paymentStatus = 'PAID';
    paidAt = new Date();
  }

  const order = await prisma.order.create({
    data: {
      userId,
      basketId,
      merchantId: basket.merchantId,
      price: basket.discountedPrice,
      paymentMethod,
      paymentStatus,
      orderStatus: 'RESERVED',
      qrCode: qrCodeData,
      paidAt,
    },
  });



  // Envoyer une notification au client pour la confirmation de réservation
  try {
    await sendNotification(
      userId,
      'Réservation confirmée !',
      `Votre commande pour "${basket.title}" a été réservée.`,
      'ORDER_CONFIRMATION',
      { orderId: order.id, basketId: basket.id }
    );
  } catch (e) {
    console.warn('Notification client échouée:', e?.message || e);
  }

  // Envoyer une notification au commerçant pour la nouvelle commande
  if (basket.merchant && basket.merchant.user && basket.merchant.user.id) {
    try {
      await sendNotification(
        basket.merchant.user.id,
        'Nouvelle commande reçue !',
        `Vous avez reçu une nouvelle commande pour "${basket.title}".`,
        'NEW_ORDER',
        { orderId: order.id, basketId: basket.id }
      );
    } catch (e) {
      console.warn('Notification commerçant échouée:', e?.message || e);
    }
  }


  return { order, qrCodeImage, paymentUrl: null };
};

export const confirmOrderPayment = async (orderId, userId, transactionRef = null) => {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    throw new Error('Commande introuvable.');
  }
  if (order.userId !== userId) {
    throw new Error('Acces interdit.');
  }
  if (order.orderStatus === 'CANCELLED') {
    throw new Error('Commande annulee.');
  }
  if (order.paymentStatus === 'PAID') {
    return order;
  }

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: {
      paymentStatus: 'PAID',
      paidAt: new Date(),
      transactionRef: transactionRef ?? order.transactionRef,
    },
  });

  try {
    await sendNotification(
      userId,
      'Paiement confirme',
      'Votre paiement a ete confirme avec succes.',
      'PAYMENT_CONFIRMED',
      { orderId: updated.id }
    );
  } catch (e) {
    console.warn('Notification paiement echouee:', e?.message || e);
  }

  return updated;
};

export const getMyOrders = async (userId) => {
  const orders = await prisma.order.findMany({
    where: { userId },
    include: {
      basket: {
        select: {
          title: true,
          photoURL: true,
          pickupTimeStart: true,
          pickupTimeEnd: true,
          originalPrice: true,
          discountedPrice: true,
        },
      },
      merchant: {
        select: {
          businessName: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
  return orders;
};

export const getMerchantOrders = async (merchantId) => {
  const orders = await prisma.order.findMany({
    where: { merchantId },
    include: {
      user: {
        select: {
          displayName: true,
          phoneNumber: true,
        },
      },
      basket: {
        select: {
          title: true,
          pickupTimeStart: true,
          pickupTimeEnd: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
  return orders;
};

export const getOrderById = async (orderId) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: {
        select: {
          displayName: true,
          phoneNumber: true,
        },
      },
      basket: {
        select: {
          title: true,
          description: true,
          photoURL: true,
          pickupTimeStart: true,
          pickupTimeEnd: true,
          originalPrice: true,
          discountedPrice: true,
        },
      },
      merchant: {
        select: {
          businessName: true,
          address: true,
        },
      },
    },
  });

  if (!order) {
    throw new Error('Commande introuvable.');
  }
  return order;
};

export const validateOrderPickup = async (orderId, qrCode, merchantUserId) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      basket: true,
      merchant: true,
    },
  });

  if (!order) {
    throw new Error('Commande introuvable.');
  }

  // Vérifier si la commande appartient bien au commerçant qui tente de valider
  if (order.merchant.userId !== merchantUserId) {
    throw new Error('Vous n\'êtes pas autorisé à valider cette commande.');
  }

  if (order.qrCode !== qrCode) {
    throw new Error('QR Code invalide.');
  }

  if (order.orderStatus === 'PICKED_UP') {
    throw new Error('Cette commande a déjà été retirée.');
  }

  // Marquer la commande comme retirée
  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: {
      orderStatus: 'PICKED_UP',
      pickedUpAt: new Date(),
    },
  });

  try {
    await sendNotification(
      order.userId,
      'Retrait valide',
      `Votre commande "${order.basket?.title ?? 'Panier'}" a ete retiree.`,
      'PICKUP_VALIDATED',
      { orderId: order.id }
    );
  } catch (e) {
    console.warn('Notification client pickup echouee:', e?.message || e);
  }

  if (order.merchant?.userId) {
    try {
      await sendNotification(
        order.merchant.userId,
        'Commande retiree',
        `La commande "${order.basket?.title ?? 'Panier'}" a ete retiree.`,
        'PICKUP_VALIDATED',
        { orderId: order.id }
      );
    } catch (e) {
      console.warn('Notification commercant pickup echouee:', e?.message || e);
    }
  }

  return updatedOrder;
};

export const cancelOrder = async (orderId, userId) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    throw new Error('Commande introuvable.');
  }

  if (order.userId !== userId) {
    throw new Error('Acces interdit.');
  }

  if (order.orderStatus === 'PICKED_UP') {
    throw new Error('Cette commande a deja ete retiree.');
  }

  if (order.orderStatus === 'CANCELLED') {
    return order;
  }

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: {
      orderStatus: 'CANCELLED',
      paymentStatus: order.paymentStatus === 'PAID' ? order.paymentStatus : 'FAILED',
    },
  });

  await prisma.basket.update({
    where: { id: order.basketId },
    data: { availableQuantity: { increment: 1 }, status: 'AVAILABLE' },
  });

  try {
    await sendNotification(
      order.userId,
      'Commande annulee',
      'Votre commande a ete annulee.',
      'ORDER_CANCELLED',
      { orderId: order.id }
    );
  } catch (e) {
    console.warn('Notification client annulation echouee:', e?.message || e);
  }

  try {
    const basket = await prisma.basket.findUnique({ where: { id: order.basketId } });
    const merchant = await prisma.merchant.findUnique({ where: { id: order.merchantId } });
    if (merchant?.userId) {
      await sendNotification(
        merchant.userId,
        'Commande annulee',
        `Une commande${basket?.title ? ` pour "${basket.title}"` : ''} a ete annulee.`,
        'ORDER_CANCELLED',
        { orderId: order.id }
      );
    }
  } catch (e) {
    console.warn('Notification commercant annulation echouee:', e?.message || e);
  }

  return updated;
};



