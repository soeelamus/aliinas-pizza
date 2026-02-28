// api/payment.js
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY_TEST, {
  apiVersion: "2023-10-16",
});

function getBaseUrl(req) {
  const proto = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  return `${proto}://${host}`;
}

export default async function handler(req, res) {
  try {
    // =========================
    // GET → Status check
    // =========================
    if (req.method === "GET") {
      const sessionId = (req.query.sessionId || req.query.session_id || "")
        .toString()
        .trim();
      if (!sessionId)
        return res.status(400).json({ error: "Missing sessionId" });

      const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ["line_items"],
      });

      const itemsString = (session.line_items?.data || [])
        .map(
          (li) =>
            `${li.quantity}x ${li.description || li.price?.product?.name || "Item"}`,
        )
        .join(", ");

      const total = (session.amount_total || 0) / 100;

      return res.status(200).json({
        status: session.payment_status, // "paid" / "unpaid"
        sessionId: session.id,
        itemsString,
        total,
        pickupTime: session.metadata?.pickupTime || "",
        customerName:
          session.metadata?.customerName ||
          session.customer_details?.name ||
          "",
        customerEmail: session.customer_details?.email || "",
        customerNotes: session.metadata?.customerNotes || "",
      });
    }

    // =========================
    // POST → Create payment
    // =========================
    if (req.method === "POST") {
      console.log("PAYMENT BODY:", req.body);

      const { cart, customer } = req.body;

      if (!Array.isArray(cart) || cart.length === 0) {
        return res.status(400).json({ error: "Cart is empty" });
      }

      if (!customer?.name || !customer?.pickupTime) {
        return res.status(400).json({ error: "Invalid customer data" });
      }

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
            product_data: { name: item.product.name },
            unit_amount: Math.round(item.product.price * 100),
          },
          quantity: item.quantity,
        };
      });

      const baseUrl = getBaseUrl(req);

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        customer_email: customer.email,
        line_items: lineItems,
        customer_creation: "always",
        success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/ordering`,
        metadata: {
          pickupTime: customer.pickupTime || "",
          customerName: customer.name || "",
          customerNotes: customer.notes || "",
        },
      });

      return res.status(200).json({
        checkoutUrl: session.url,
        sessionId: session.id,
      });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("STRIPE ERROR:", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}
