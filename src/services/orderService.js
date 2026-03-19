// src/services/orderService.js
import prisma from '../utils/prisma.js';
import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import { sendNotification } from './notificationService.js';
import { initiateStripePayment } from './paymentService.js';
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
  let paymentUrl = null;
  let transactionRef = null;

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

  // Si le paiement n'est pas en CASH, initier le paiement Stripe
  if (paymentMethod !== PaymentMethod.CASH) {
    try {
      const stripeResponse = await initiateStripePayment(
        order.id,
        order.price,
        user.email,
        user.displayName,
        paymentMethod
      );
      paymentUrl = stripeResponse.link;
      transactionRef = stripeResponse.tx_ref;

      // Mettre à jour la commande avec la référence de transaction
      await prisma.order.update({
        where: { id: order.id },
        data: { transactionRef },
      });
    } catch (paymentError) {
      console.warn("Stripe non disponible, passage en mode test CASH:", paymentError?.message || paymentError);
      paymentStatus = 'PAID';
      paidAt = new Date();
      await prisma.order.update({
        where: { id: order.id },
        data: { paymentStatus, paidAt },
      });
      paymentUrl = null;
    }
  }


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


  return { order, qrCodeImage, paymentUrl };
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

  // Notification push disabled for pickup validation.
  // The app confirms success directly in UI after scan.

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

  return updated;
};


