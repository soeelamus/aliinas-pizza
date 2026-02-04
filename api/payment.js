// api/payment.js

import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

export default async function handler(req, res) {
  try {
    // =========================
    // GET → Status check
    // =========================
    if (req.method === "GET") {
      const { sessionId } = req.query;

      if (!sessionId) {
        return res.status(400).json({ error: "Missing sessionId" });
      }

      const session = await stripe.checkout.sessions.retrieve(sessionId);

      return res.status(200).json({
        status: session.payment_status,
      });
    }

    // =========================
    // POST → Create payment
    // =========================
    if (req.method === "POST") {
      console.log("PAYMENT BODY:", req.body);

      const { cart, customer } = req.body;

      // -------------------------
      // Validate
      // -------------------------

      if (!Array.isArray(cart) || cart.length === 0) {
        return res.status(400).json({
          error: "Cart is empty",
        });
      }

      if (!customer?.name || !customer?.pickupTime) {
        return res.status(400).json({
          error: "Invalid customer data",
        });
      }

      // -------------------------
      // Build line items
      // -------------------------

      const lineItems = cart.map((item, index) => {
        if (
          !item?.product?.name ||
          typeof item?.product?.price !== "number" ||
          typeof item?.quantity !== "number"
        ) {
          throw new Error(`Invalid cart item at index ${index}`);
        }

        return {
          price_data: {
            currency: "eur",

            product_data: {
              name: item.product.name,
            },

            unit_amount: Math.round(item.product.price * 100),
          },

          quantity: item.quantity,
        };
      });

      // -------------------------
      // Create session
      // -------------------------

      
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        customer_email: customer.email,
        line_items: lineItems,
        customer_creation: "always",
        success_url:
          "https://aliinas.com/success?session_id={CHECKOUT_SESSION_ID}",
        cancel_url: "https://aliinas.com/ordering",
      });

      return res.status(200).json({
        checkoutUrl: session.url,
        sessionId: session.id,
      });
    }

    // =========================

    return res.status(405).json({
      error: "Method not allowed",
    });
  } catch (err) {
    console.error("STRIPE ERROR:", err);

    return res.status(500).json({
      error: err.message || "Server error",
    });
  }
}
