// pages/api/payment.js
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

let lastPaymentStatus = "open";

export default async function handler(req, res) {
  try {
    // =========================
    // GET → Payment status check
    // =========================
    if (req.method === "GET") {
      const sessionId = req.query.sessionId;

      if (!sessionId) {
        return res.status(400).json({ error: "No sessionId provided" });
      }

      const session = await stripe.checkout.sessions.retrieve(sessionId);

      return res.status(200).json({
        status: session.payment_status, // paid / unpaid
      });
    }

    // =========================
    // POST → Nieuwe betaling
    // =========================
    if (req.method === "POST") {
      const { total } = req.body;

      if (typeof total !== "number") {
        return res
          .status(400)
          .json({ error: "POST body must contain total" });
      }

      // Maak Stripe Checkout Session
      const session = await stripe.checkout.sessions.create({
        mode: "payment",

        line_items: [
          {
            price_data: {
              currency: "eur",
              product_data: {
                name: "Take-out bestelling",
              },
              unit_amount: Math.round(total * 100), // in centen!
            },
            quantity: 1,
          },
        ],

        success_url: "https://aliinas.com/success?session_id={CHECKOUT_SESSION_ID}",
        cancel_url: "https://aliinas.com/cancel",
      });

      return res.status(200).json({
        checkoutUrl: session.url,
        sessionId: session.id,
      });
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("Stripe error:", err);
    res.status(500).json({ error: "Server error" });
  }
}

export function getLastPaymentStatus() {
  return lastPaymentStatus;
}
