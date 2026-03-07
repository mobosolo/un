import dotenv from "dotenv";
import { handleStripeWebhookEvent, stripe } from "../services/paymentService.js";

dotenv.config();

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

export const webhook = async (req, res) => {
  if (!stripe) {
    return res.status(500).json({ status: "error", message: "Stripe non configure" });
  }

  try {
    let event;

    if (STRIPE_WEBHOOK_SECRET) {
      const signature = req.headers["stripe-signature"];
      if (!signature) {
        return res.status(400).json({ status: "error", message: "Signature Stripe manquante" });
      }

      event = stripe.webhooks.constructEvent(req.rawBody, signature, STRIPE_WEBHOOK_SECRET);
    } else {
      // Fallback for local tests without webhook secret.
      event = req.body;
    }

    await handleStripeWebhookEvent(event);
    return res.status(200).json({ status: "success", message: "Webhook recu" });
  } catch (error) {
    console.error("Erreur webhook Stripe:", error?.message || error);
    return res.status(400).json({ status: "error", message: "Webhook invalide" });
  }
};
