import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY_TEST_TEST, {
  apiVersion: "2023-10-16",
});

function getBaseUrl(req) {
  const proto = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host;

  return `${proto}://${host}`;
}

function getBrusselsDate() {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Brussels",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export default async function handler(req, res) {
  try {
    // =====================================================
    // GET CHECKOUT SESSION
    // =====================================================

    if (req.method === "GET") {
      const sessionId = String(
        req.query.sessionId || req.query.session_id || "",
      ).trim();

      if (!sessionId) {
        return res.status(400).json({
          error: "Missing sessionId",
        });
      }

      const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ["line_items", "line_items.data.price.product"],
      });

      const itemsString = (session.line_items?.data || [])
        .map((lineItem) => {
          const product = lineItem.price?.product;
          const drink = product?.metadata?.drink || "";

          if (drink) {
            return `${lineItem.quantity}x ${product?.name} (🥤 ${drink})`;
          }

          return `${lineItem.quantity}x ${product?.name}`;
        })
        .join(", ");

      return res.status(200).json({
        status: session.payment_status,
        sessionId: session.id,
        itemsString,
        total: Number(session.amount_total || 0) / 100,
        pickupTime: session.metadata?.pickupTime || "",
        pickupDate: session.metadata?.pickupDate || "",
        customerName:
          session.metadata?.customerName ||
          session.customer_details?.name ||
          "",
        customerEmail: session.customer_details?.email || "",
        customerNotes: session.metadata?.customerNotes || "",
        created: session.created,
      });
    }

    // =====================================================
    // CREATE CHECKOUT SESSION
    // =====================================================

    if (req.method === "POST") {
      const { cart, customer } = req.body || {};

      console.log("PAYMENT BODY:", req.body);

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

      const pickupDate = customer.pickupDate || getBrusselsDate();

      const lineItems = cart.map((item, index) => {
        const quantity = Number(item?.quantity);
        const unitPrice = Number(item?.product?.price);

        if (
          !item?.product?.name ||
          !Number.isFinite(unitPrice) ||
          !Number.isInteger(quantity) ||
          quantity <= 0
        ) {
          throw new Error(`Invalid cart item at index ${index}`);
        }

        const isMenu = item.type === "menu" && Boolean(item.menu?.pizza);

        // Bij een menu is item.product.id een kunstmatig ID,
        // bijvoorbeeld "menu-1489-2006".
        // Daarom gebruiken we item.menu.pizza.id.
        const productId = isMenu ? item.menu.pizza.id : item.product.id;

        const productName = isMenu ? item.menu.pizza.name : item.product.name;

        const drink = isMenu ? item.menu?.drink : null;

        const dessert = isMenu ? item.menu?.dessert : null;

        if (!productId) {
          throw new Error(`Product-ID ontbreekt voor ${productName}`);
        }

        if (drink && !drink.id) {
          throw new Error(`Product-ID ontbreekt voor drank ${drink.name}`);
        }

        if (dessert && !dessert.id) {
          throw new Error(`Product-ID ontbreekt voor dessert ${dessert.name}`);
        }

        const descriptionParts = [];

        if (drink?.name) {
          descriptionParts.push(`🥤 ${drink.name}`);
        }

        if (dessert?.name) {
          descriptionParts.push(`🍰 ${dessert.name}`);
        }

        return {
          price_data: {
            currency: "eur",

            product_data: {
              name: isMenu ? `${productName} MENU` : productName,

              description:
                descriptionParts.length > 0
                  ? descriptionParts.join(" · ")
                  : undefined,

              metadata: {
                product_id: String(productId),
                pizza_name: String(productName),

                item_type: isMenu ? "menu" : "product",

                drink: drink?.name ? String(drink.name) : "",

                drink_id: drink?.id ? String(drink.id) : "",

                dessert: dessert?.name ? String(dessert.name) : "",

                dessert_id: dessert?.id ? String(dessert.id) : "",
              },
            },

            unit_amount: Math.round(unitPrice * 100),
          },

          quantity,
        };
      });

      const baseUrl = getBaseUrl(req);

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: lineItems,

        // success_url:
        //   `${baseUrl}/success` +
        //   "?session_id={CHECKOUT_SESSION_ID}",

        success_url: `${baseUrl}/?booking_success=1`,

        cancel_url: `${baseUrl}/ordering`,

        customer_email: customer.email || undefined,

        customer_creation: "always",

        metadata: {
          pickupTime: customer.pickupTime || "ASAP",
          pickupDate,
          customerName: customer.name || "",
          customerNotes: customer.notes || "",
        },

        payment_intent_data: {
          metadata: {
            pickupTime: customer.pickupTime || "ASAP",
            pickupDate,
            customerName: customer.name || "",
            customerNotes: customer.notes || "",
          },
        },
      });

      return res.status(200).json({
        checkoutUrl: session.url,
        sessionId: session.id,
      });
    }

    res.setHeader("Allow", ["GET", "POST"]);

    return res.status(405).json({
      error: "Method not allowed",
    });
  } catch (error) {
    console.error("STRIPE ERROR:", error);

    return res.status(500).json({
      error: error.message || "Server error",
    });
  }
}
