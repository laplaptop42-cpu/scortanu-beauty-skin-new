import Stripe from "stripe";
import { ENV } from "./_core/env";

let stripe: Stripe | null = null;

if (ENV.stripeSecretKey && ENV.stripeSecretKey !== "sk_test_dummy_key_for_development") {
  stripe = new Stripe(ENV.stripeSecretKey);
} else {
  console.warn("[Stripe] Running without valid Stripe key");
}

export function getStripe() {
  return stripe;
}

export async function createCheckoutSession(params: {
  userId: string;
  userEmail: string;
  userName: string;
  itemName: string;
  amount: number; // in cents
  currency: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}) {
  if (!stripe) throw new Error("Stripe is not configured");

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: params.currency.toLowerCase(),
          product_data: { name: params.itemName },
          unit_amount: params.amount,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    customer_email: params.userEmail,
    client_reference_id: params.userId,
    metadata: {
      user_id: params.userId,
      customer_email: params.userEmail,
      customer_name: params.userName,
      ...params.metadata,
    },
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    allow_promotion_codes: true,
  });

  return session;
}
