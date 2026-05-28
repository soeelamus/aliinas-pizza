import Stripe from "stripe";
import { buffer } from "micro";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

export const config = {
  api: {
    bodyParser: false,
  },
};

const BASE_URL = "https://aliinas.com";

export default async function handler(req, res) {
  if (req.method === "GET") {
    return res.status(200).send("Stripe webhook endpoint alive");
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const sig = req.headers["stripe-signature"];

  let event;

  try {
    const rawBody = await buffer(req);

    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    console.log("✅ Webhook received:", event.type);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      console.log("✅ Checkout completed:", session.id);

      const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
        expand: ["line_items", "line_items.data.price.product"],
      });

      const itemsString = fullSession.line_items.data
        .map((li) => {
          const product = li.price.product;
          const drink = product?.metadata?.drink || "";
          const dessert = product?.metadata?.dessert || "";

          if (drink || dessert) {
            return `${li.quantity}x ${product.name} (🥤 ${drink || "-"} - 🍰 ${
              dessert || "-"
            })`;
          }

          return `${li.quantity}x ${product.name}`;
        })
        .join(", ");

      const orderObj = {
        id: fullSession.id,
        sessionId: fullSession.id,
        stripeSessionId: fullSession.id,
        paymentIntentId: fullSession.payment_intent,
        items: itemsString,
        total: (fullSession.amount_total || 0) / 100,
        pickupTime: fullSession.metadata?.pickupTime || "ASAP",
        orderedTime: new Date(fullSession.created * 1000).toISOString(),
        customerName:
          fullSession.metadata?.customerName ||
          fullSession.customer_details?.name ||
          "",
        customerEmail: fullSession.customer_details?.email || "",
        customerNotes: fullSession.metadata?.customerNotes || "",
        paymentMethod: "online",
        status: "new",
      };

      console.log("Webhook orderObj:", orderObj);

      const orderRes = await fetch(`${BASE_URL}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderObj),
      });

      let orderData = null;

      try {
        orderData = await orderRes.json();
      } catch {
        orderData = null;
      }

      if (!orderRes.ok) {
        throw new Error(
          `Order push failed: ${JSON.stringify(orderData)}`,
        );
      }

      if (orderData?.status === "already_exists") {
        console.log(
          "Order bestaat al, stock niet opnieuw aanpassen:",
          fullSession.id,
        );

        return res.status(200).json({
          received: true,
          skipped: "already_exists",
        });
      }

      console.log("✅ Order opgeslagen:", fullSession.id);

      /* -------------------
         Stock aanpassen
      -------------------- */

      const stockRes = await fetch(`${BASE_URL}/api/stock`);

      if (!stockRes.ok) {
        const text = await stockRes.text();
        throw new Error(`Stock fetch failed: ${text}`);
      }

      const stockData = await stockRes.json();

      if (!Array.isArray(stockData) || stockData.length === 0) {
        throw new Error("Stock data is leeg");
      }

      const grouped = [];

      fullSession.line_items.data.forEach((li) => {
        const product = li.price.product;
        const productName = product?.name || "";
        const quantity = li.quantity || 1;

        const cleanName = productName
          .replace(/\s+MENU$/i, "")
          .replace(/\s+PIZZA$/i, "")
          .trim();

        let stockItem =
          stockData.find((s) => s.name === cleanName) ||
          stockData.find((s) => s.name === productName);

        // fallback → deegballen
        if (!stockItem) {
          stockItem =
            stockData.find(
              (s) => s.name?.toLowerCase() === "deegballen",
            ) || stockData[0];

          console.log(`Fallback naar deegballen voor: ${productName}`);
        }

        const existing = grouped.find((g) => g.id === stockItem.id);

        if (existing) {
          existing.stock -= quantity;
        } else {
          grouped.push({
            id: stockItem.id,
            stock: Number(stockItem.stock || 0) - quantity,
          });
        }
      });

      const updateData = grouped.map((g) => ({
        id: g.id,
        stock: Math.max(0, g.stock),
      }));

      console.log("Stock updateData:", updateData);

      const stockUpdateRes = await fetch(`${BASE_URL}/api/stock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      if (!stockUpdateRes.ok) {
        const text = await stockUpdateRes.text();
        throw new Error(`Stock update failed: ${text}`);
      }

      console.log("✅ Stock aangepast:", updateData);
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error("Webhook handler failed:", err);
    return res.status(500).json({ error: err.message });
  }
}