import Stripe from "stripe";
import { buffer } from "micro";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY_TEST_TEST, {
  apiVersion: "2023-10-16",
});

export const config = {
  api: {
    bodyParser: false,
  },
};

const BASE_URL = "https://aliinas.com";

// Tijdelijke fallback zolang niet elke Stripe-regel product-ID's
// in metadata bevat.
const PRODUCT_IDS_BY_NAME = {
  Margheriita: 1489,
  Fungii: 2652,
  Formagii: 4535,
  Vegii: 3498,
  Pepperonii: 9445,
  Hawaii: 2357,
  Jaeger: 5321,
  "Sweet Chiicken": 6897,
  "Spicy Chiicken": 8123,
  Diiavola: 7565,

  "Ice Tea Zero": 2001,
  "Ice Tea Peach": 2002,
  Sprite: 2003,
  Fanta: 2004,
  "Coca Cola": 2005,
  "Coca Cola Zero": 2006,
  "Spa Reine": 2007,
  Perrier: 2008,

  Jupiler: 3001,
  "Stella Artois": 3002,

  "Monster Regular": 4001,
  "Monster Mango Loco": 4002,

  Chocomousse: 8001,
  Appeltaart: 8002,
  Donut: 8003,
  "Vanille Hoorntje": 8004,
  "Chocolade Stick": 8005,

  Groenten: 9001,
  "Pesto, Ananas": 9002,
  "Vlees, Gorgonzola": 9003,
};

function cleanProductName(name = "") {
  return String(name)
    .replace(/\s+MENU$/i, "")
    .replace(/\s+PIZZA$/i, "")
    .trim();
}

function resolveProductId(product, fallbackName) {
  const metadataId =
    product?.metadata?.product_id ?? product?.metadata?.productId;

  const numericMetadataId = Number(metadataId);

  if (Number.isInteger(numericMetadataId) && numericMetadataId > 0) {
    return numericMetadataId;
  }

  return PRODUCT_IDS_BY_NAME[fallbackName] ?? null;
}

function resolveDrinkId(product, drinkName) {
  const metadataId = product?.metadata?.drink_id ?? product?.metadata?.drinkId;

  const numericMetadataId = Number(metadataId);

  if (Number.isInteger(numericMetadataId) && numericMetadataId > 0) {
    return numericMetadataId;
  }

  return PRODUCT_IDS_BY_NAME[drinkName] ?? null;
}

function buildOrderItems(lineItems = []) {
  const orderItems = [];

  lineItems.forEach((lineItem) => {
    const stripeProduct = lineItem.price?.product;
    const quantity = Number(lineItem.quantity || 1);

    const productName = cleanProductName(
      stripeProduct?.metadata?.pizza_name ||
        stripeProduct?.metadata?.pizzaName ||
        stripeProduct?.name ||
        "",
    );

    const drinkName = String(stripeProduct?.metadata?.drink || "").trim();

    const dessertName = String(stripeProduct?.metadata?.dessert || "").trim();

    const productId = resolveProductId(stripeProduct, productName);

    if (!productId) {
      throw new Error(
        `Geen product-ID gevonden voor Stripe-product "${productName}"`,
      );
    }

    const lineTotal = Number(lineItem.amount_total || 0) / 100;

    const unitPrice = quantity > 0 ? lineTotal / quantity : 0;

    const isMenu =
      Boolean(drinkName) ||
      Boolean(dessertName) ||
      stripeProduct?.metadata?.item_type === "menu" ||
      stripeProduct?.metadata?.itemType === "menu";

    // Hoofdproduct: pizza of ander los product
    orderItems.push({
      product_id: productId,
      product_name: productName,
      quantity,
      unit_price: unitPrice,
      line_total: lineTotal,
      item_type: isMenu ? "menu_main" : "product",
      metadata: isMenu
        ? {
            menu: true,
            component: "pizza",
          }
        : {},
    });

    // Drank in menu
    if (drinkName) {
      const drinkId = resolveDrinkId(stripeProduct, drinkName);

      if (!drinkId) {
        throw new Error(`Geen product-ID gevonden voor drank "${drinkName}"`);
      }

      orderItems.push({
        product_id: drinkId,
        product_name: drinkName,
        quantity,
        unit_price: 0,
        line_total: 0,
        item_type: "menu_component",
        metadata: {
          component: "drink",
          included_in_menu: true,
        },
      });
    }

    // Dessert in menu
    if (dessertName) {
      const dessertId =
        Number(
          stripeProduct?.metadata?.dessert_id ??
            stripeProduct?.metadata?.dessertId,
        ) || PRODUCT_IDS_BY_NAME[dessertName];

      if (!dessertId) {
        throw new Error(
          `Geen product-ID gevonden voor dessert "${dessertName}"`,
        );
      }

      orderItems.push({
        product_id: dessertId,
        product_name: dessertName,
        quantity,
        unit_price: 0,
        line_total: 0,
        item_type: "menu_component",
        metadata: {
          component: "dessert",
          included_in_menu: true,
        },
      });
    }
  });

  return orderItems;
}

export default async function handler(req, res) {
  if (req.method === "GET") {
    return res.status(200).send("Stripe webhook endpoint alive");
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  const signature = req.headers["stripe-signature"];

  if (!signature) {
    return res.status(400).json({
      error: "Missing Stripe signature",
    });
  }

  let event;

  try {
    const rawBody = await buffer(req);

    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (error) {
    console.error("Webhook signature verification failed:", error.message);

    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  try {
    console.log("✅ Webhook received:", event.type);

    if (event.type !== "checkout.session.completed") {
      return res.status(200).json({
        received: true,
        ignored: event.type,
      });
    }

    const session = event.data.object;

    console.log("✅ Checkout completed:", session.id);

    const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
      expand: ["line_items", "line_items.data.price.product"],
    });

    const stripeLineItems = fullSession.line_items?.data || [];

    if (stripeLineItems.length === 0) {
      throw new Error("Stripe Checkout Session bevat geen orderregels");
    }

    const orderItems = buildOrderItems(stripeLineItems);

    console.log("Webhook order items:", JSON.stringify(orderItems, null, 2));

    const orderObj = {
      id: fullSession.id,
      sessionId: fullSession.id,
      stripeSessionId: fullSession.id,
      paymentIntentId: fullSession.payment_intent || null,

      paymentMethod: "online",

      items: orderItems,

      total: Number(fullSession.amount_total || 0) / 100,

      pickupDate: new Date(fullSession.created * 1000)
        .toISOString()
        .slice(0, 10),

      pickupTime: fullSession.metadata?.pickupTime || "ASAP",

      orderedTime: new Date(fullSession.created * 1000).toISOString(),

      customerName:
        fullSession.metadata?.customerName ||
        fullSession.customer_details?.name ||
        "",

      customerEmail: fullSession.customer_details?.email || "",

      customerNotes: fullSession.metadata?.customerNotes || "",

      status: "new",
    };

    console.log("Webhook orderObj:", JSON.stringify(orderObj, null, 2));

    const orderResponse = await fetch(`${BASE_URL}/api/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(orderObj),
    });

    let orderData;

    try {
      orderData = await orderResponse.json();
    } catch {
      throw new Error("Ongeldige response van /api/orders");
    }

    if (!orderResponse.ok) {
      throw new Error(
        orderData?.error ||
          `Order push failed met HTTP ${orderResponse.status}`,
      );
    }

    if (orderData?.status === "already_exists") {
      console.log("Order bestaat al:", fullSession.id);

      return res.status(200).json({
        received: true,
        skipped: "already_exists",
      });
    }

    console.log("✅ Online order opgeslagen:", fullSession.id);

    return res.status(200).json({
      received: true,
      order: orderData.order,
    });
  } catch (error) {
    console.error("Webhook handler failed:", error);

    return res.status(500).json({
      error: error.message || "Webhook handler failed",
    });
  }
}
