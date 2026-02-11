import type { Express, Request, Response } from "express";
import express from "express";
import Stripe from "stripe";
import { ENV } from "./_core/env";
import { getDb } from "./db";
import { bookings, courseEnrollments } from "../drizzle/schema";
import { eq } from "drizzle-orm";

export function registerStripeWebhook(app: Express) {
  // Must use raw body for signature verification
  app.post(
    "/api/stripe/webhook",
    express.raw({ type: "application/json" }),
    async (req: Request, res: Response) => {
      if (!ENV.stripeSecretKey || !ENV.stripeWebhookSecret) {
        console.warn("[Stripe Webhook] Stripe not configured");
        return res.status(400).json({ error: "Stripe not configured" });
      }

      const stripe = new Stripe(ENV.stripeSecretKey);
      const sig = req.headers["stripe-signature"] as string;

      let event: Stripe.Event;
      try {
        event = stripe.webhooks.constructEvent(req.body, sig, ENV.stripeWebhookSecret);
      } catch (err: any) {
        console.error("[Stripe Webhook] Signature verification failed:", err.message);
        return res.status(400).json({ error: "Webhook signature verification failed" });
      }

      // Handle test events
      if (event.id.startsWith("evt_test_")) {
        console.log("[Webhook] Test event detected, returning verification response");
        return res.json({ verified: true });
      }

      console.log(`[Stripe Webhook] Received event: ${event.type} (${event.id})`);

      try {
        switch (event.type) {
          case "checkout.session.completed": {
            const session = event.data.object as Stripe.Checkout.Session;
            const metadata = session.metadata || {};
            const db = await getDb();
            if (!db) break;

            if (metadata.type === "booking" && metadata.bookingId) {
              await db
                .update(bookings)
                .set({ paymentStatus: "paid", status: "confirmed" })
                .where(eq(bookings.id, parseInt(metadata.bookingId)));
              console.log(`[Stripe Webhook] Booking ${metadata.bookingId} marked as paid`);
            } else if (metadata.type === "enrollment" && metadata.enrollmentId) {
              await db
                .update(courseEnrollments)
                .set({ paymentStatus: "paid", status: "enrolled" })
                .where(eq(courseEnrollments.id, parseInt(metadata.enrollmentId)));
              console.log(`[Stripe Webhook] Enrollment ${metadata.enrollmentId} marked as paid`);
            }
            break;
          }
          default:
            console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
        }
      } catch (error) {
        console.error("[Stripe Webhook] Error processing event:", error);
      }

      res.json({ received: true });
    }
  );
}
