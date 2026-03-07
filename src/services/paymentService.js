import Stripe from "stripe";
import dotenv from "dotenv";
import prisma from "../utils/prisma.js";

dotenv.config();

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_CURRENCY = (process.env.STRIPE_CURRENCY || "xof").toLowerCase();
const STRIPE_SUCCESS_URL =
  process.env.STRIPE_SUCCESS_URL || "http://localhost:3000/payment/success?session_id={CHECKOUT_SESSION_ID}";
const STRIPE_CANCEL_URL = process.env.STRIPE_CANCEL_URL || "http://localhost:3000/payment/cancel";

const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY) : null;

const isStripeConfigured = () => Boolean(stripe && STRIPE_SECRET_KEY);

export const initiateStripePayment = async (orderId, amount, customerEmail, customerName, paymentMethod) => {
  if (!isStripeConfigured()) {
    throw new Error("Stripe non configure.");
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: STRIPE_SUCCESS_URL,
      cancel_url: STRIPE_CANCEL_URL,
      customer_email: customerEmail || undefined,
      metadata: {
        orderId,
        paymentMethod: paymentMethod || "",
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: STRIPE_CURRENCY,
            unit_amount: Math.round(Number(amount)),
            product_data: {
              name: `Commande MealFlavor #${orderId}`,
              description: customerName ? `Client: ${customerName}` : "Paiement commande",
            },
          },
        },
      ],
    });

    return {
      status: "success",
      link: session.url,
      tx_ref: session.id,
    };
  } catch (error) {
    console.error("Erreur initiateStripePayment:", error?.message || error);
    throw new Error("Erreur lors de l'initialisation du paiement Stripe.");
  }
};

export const handleStripeWebhookEvent = async (event) => {
  if (!event || !event.type) {
    throw new Error("Evenement Stripe invalide.");
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data?.object;
    const orderId = session?.metadata?.orderId;
    if (!orderId) {
      throw new Error("orderId manquant dans metadata Stripe.");
    }

    const existingOrder = await prisma.order.findUnique({ where: { id: orderId } });
    if (!existingOrder) {
      throw new Error("Commande introuvable.");
    }

    if (existingOrder.paymentStatus !== "PAID") {
      return prisma.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: "PAID",
          paidAt: new Date(),
          transactionRef: session.id || existingOrder.transactionRef,
        },
      });
    }

    return existingOrder;
  }

  if (event.type === "checkout.session.expired" || event.type === "payment_intent.payment_failed") {
    const object = event.data?.object;
    const orderId = object?.metadata?.orderId;
    if (!orderId) {
      return null;
    }

    const existingOrder = await prisma.order.findUnique({ where: { id: orderId } });
    if (!existingOrder) return null;

    if (existingOrder.paymentStatus !== "FAILED" && existingOrder.orderStatus !== "CANCELLED") {
      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: "FAILED",
          orderStatus: "CANCELLED",
        },
      });
      await prisma.basket.update({
        where: { id: existingOrder.basketId },
        data: { availableQuantity: { increment: 1 } },
      });
      return updatedOrder;
    }

    return existingOrder;
  }

  return null;
};

export { stripe };
