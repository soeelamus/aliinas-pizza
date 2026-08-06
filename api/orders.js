import { Resend } from "resend";
import { supabase } from "../src/lib/supabase.js";

const resend = new Resend(process.env.RESEND_KEY);

function hasKitchenAccess(req) {
  const cookies = req.headers.cookie || "";
  const headerToken = req.headers["x-kitchen-token"];

  return (
    cookies.includes(`kitchenAuth=${process.env.API_TOKEN}`) ||
    headerToken === process.env.API_TOKEN
  );
}

function getBelgianDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Brussels",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function getPaymentMethod(incoming) {
  if (incoming.paymentMethod) {
    return String(incoming.paymentMethod).toLowerCase();
  }

  const paymentId = String(
    incoming.sessionId || incoming.id || "",
  ).toLowerCase();

  if (paymentId.startsWith("cash-")) return "cash";
  if (paymentId.startsWith("card-")) return "card";
  if (paymentId.startsWith("payconiq-")) return "payconiq";
  if (paymentId.startsWith("cs_")) return "online";

  return "unknown";
}

function normalizeItems(items) {
  if (!Array.isArray(items)) return [];

  return items
    .map((item) => {
      const productId = Number(item.product_id);
      const quantity = Number(item.quantity || 1);
      const unitPrice = Number(item.unit_price || 0);
      const lineTotal = Number(
        item.line_total ?? unitPrice * quantity,
      );

      return {
        product_id: productId,
        product_name: String(
          item.product_name || "",
        ).trim(),
        quantity,
        unit_price: unitPrice,
        line_total: lineTotal,
        item_type: item.item_type || "product",
        metadata:
          item.metadata &&
          typeof item.metadata === "object"
            ? item.metadata
            : {},
      };
    })
    .filter((item) => {
      return (
        Number.isInteger(item.product_id) &&
        item.product_id > 0 &&
        item.product_name &&
        Number.isInteger(item.quantity) &&
        item.quantity > 0
      );
    });
}

function buildItemsText(items = []) {
  return items
    .map((item) => {
      const drink = item.drink_name
        ? ` + 🥤 ${item.drink_name}`
        : "";

      return `${item.quantity}x ${item.product_name}${drink}`;
    })
    .join(", ");
}

function mapOrderForKitchen(order) {
  const items = order.order_items || [];

  return {
    id: order.external_id,
    order_id: order.id,

    paymentid: order.payment_id,
    payment_id: order.payment_id,

    paymentmethod: order.payment_method,
    payment_method: order.payment_method,

    items: buildItemsText(items),
    order_items: items,

    total: order.total,

    pickuptime: order.pickup_time,
    pickup_time: order.pickup_time,

    pickup_date: order.pickup_date,

    orderedtime: order.ordered_at,
    ordered_time: order.ordered_at,

    customername: order.customer_name || "",
    customer_name: order.customer_name || "",

    customeremail: order.customer_email || "",
    customer_email: order.customer_email || "",

    customernotes: order.customer_notes || "",
    customer_notes: order.customer_notes || "",

    status: order.status,
  };
}

async function sendOrderEmail(incoming, items) {
  if (!incoming.customerEmail) return;

  const itemsText = buildItemsText(items);
  const firstPizza =
    items[0]?.product_name || "je pizza";

  const emojis = [
    "🍕",
    "😄",
    "😋",
    "🔥",
    "👀",
    "🎉",
  ];

  const emoji =
    emojis[Math.floor(Math.random() * emojis.length)];

  await resend.emails.send({
    from: "Aliina's Pizza <orders@aliinas.com>",
    replyTo: "aliinas.pizza@hotmail.com",
    to: incoming.customerEmail,
    bcc: "aliinas.pizza@hotmail.com",
    subject: `Je bestelling kan worden opgehaald om ${incoming.pickupTime} 🍕`,

    html: `
      <!DOCTYPE html>

      <html lang="nl">
        <head>
          <meta charset="UTF-8" />

          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />
        </head>

        <body
          style="
            font-family: Helvetica, Arial, sans-serif;
            background:#fefaf4;
            color:#333;
            margin:0;
            padding:20px;
          "
        >
          <div
            style="
              max-width:600px;
              margin:auto;
              background:#fefaf4;
              border-top:6px solid #6237c8;
            "
          >
            <div
              style="
                background:#6237c8;
                color:white;
                text-align:center;
                padding:20px;
                font-size:24px;
                font-weight:bold;
              "
            >
              Aliina's Pizza
            </div>

            <div
              style="
                padding:20px;
                line-height:1.6;
              "
            >
              <h2 style="color:#6237c8;">
                Psst… ik ben het, je pizza
                ${firstPizza}! ${emoji}
              </h2>

              <p>
                Ik word graag opgehaald om
                <strong>
                  ${incoming.pickupTime}
                </strong>.
              </p>

              <p>
                Tot straks,
                ${incoming.customerName || ""}!
              </p>

              <p>
                Het afhaaladres vind je terug
                op onze kalender.
              </p>

              <div
                style="
                  margin:20px 0;
                  padding:10px 0;
                  border-top:1px solid #ddd;
                  border-bottom:1px solid #ddd;
                "
              >
                <p>
                  <strong>Bestelling:</strong>
                  <br />

                  ${itemsText.replace(/,/g, "<br />")}
                </p>

                <p>
                  <strong>Totaal:</strong>

                  €${Number(
                    incoming.total || 0,
                  ).toFixed(2)}
                </p>

                ${
                  incoming.customerNotes
                    ? `
                      <p>
                        <strong>Opmerking:</strong>

                        ${incoming.customerNotes}
                      </p>
                    `
                    : ""
                }
              </div>

              <a
                href="https://aliinas.com/"
                style="
                  display:inline-block;
                  background:#6237c8;
                  color:#fff;
                  padding:10px 20px;
                  border-radius:5px;
                  text-decoration:none;
                "
              >
                Website
              </a>
            </div>

            <div
              style="
                text-align:center;
                font-size:12px;
                color:#888;
                padding:15px;
              "
            >
              Een vraag? Je kan ze stellen door
              op deze mail te antwoorden.
            </div>
          </div>
        </body>
      </html>
    `,
  });
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  try {
    // =====================================================
    // GET ORDERS
    // =====================================================

    if (req.method === "GET") {
      if (!hasKitchenAccess(req)) {
        return res.status(401).json({
          ok: false,
          error: "Unauthorized",
        });
      }

      const pickupDate = getBelgianDate();

      const { data, error } = await supabase
        .from("orders")
        .select(
          `
            id,
            external_id,
            payment_id,
            payment_method,
            total,
            pickup_time,
            pickup_date,
            ordered_at,
            customer_name,
            customer_email,
            customer_notes,
            status,
            order_items (
              id,
              product_id,
              product_name,
              quantity,
              unit_price,
              line_total,
              item_type,
              metadata,
              drink_name
            )
          `,
        )
        .eq("pickup_date", pickupDate)
        .in("status", [
          "new",
          "preparing",
          "ready",
          "done",
          "pickedup",
        ])
        .order("ordered_at", {
          ascending: true,
        })
        .limit(200);

      if (error) {
        console.error(
          "Supabase GET orders error:",
          error,
        );

        throw error;
      }

      const orders = (data || []).map(
        mapOrderForKitchen,
      );

      return res.status(200).json(orders);
    }

    // =====================================================
    // POST
    // =====================================================

    if (req.method === "POST") {
      const incoming = req.body || {};

      // -----------------------------------
      // Bestaande order bijwerken
      // -----------------------------------

      if (
        incoming.action === "updateOrder" ||
        incoming.action === "updateStatus"
      ) {
        if (!hasKitchenAccess(req)) {
          return res.status(401).json({
            ok: false,
            error: "Unauthorized",
          });
        }

        const externalId = String(
          incoming.id ||
            incoming.externalId ||
            "",
        ).trim();

        if (!externalId) {
          return res.status(400).json({
            ok: false,
            error: "Order ID ontbreekt",
          });
        }

        const updates = {
          updated_at: new Date().toISOString(),
        };

        if (incoming.status !== undefined) {
          updates.status = incoming.status;
        }

        if (
          incoming.pickupTime !== undefined ||
          incoming.pickuptime !== undefined
        ) {
          updates.pickup_time =
            incoming.pickupTime ??
            incoming.pickuptime;
        }

        if (
          incoming.customerName !== undefined ||
          incoming.customername !== undefined
        ) {
          updates.customer_name =
            incoming.customerName ??
            incoming.customername;
        }

        const { data, error } = await supabase
          .from("orders")
          .update(updates)
          .eq("external_id", externalId)
          .select()
          .single();

        if (error) throw error;

        return res.status(200).json({
          ok: true,
          status: "ok",
          order: data,
        });
      }

      // -----------------------------------
      // Nieuwe bestelling
      // -----------------------------------

      const externalId = String(
        incoming.id || Date.now(),
      ).trim();

      const paymentId = String(
        incoming.sessionId ||
          incoming.paymentId ||
          incoming.id ||
          "",
      ).trim();

      if (!paymentId) {
        return res.status(400).json({
          ok: false,
          error: "Missing payment ID",
        });
      }

      const items = normalizeItems(incoming.items);

      console.log(
        "NORMALIZED ITEMS:",
        JSON.stringify(items, null, 2),
      );

      if (items.length === 0) {
        return res.status(400).json({
          ok: false,
          error:
            "Bestelling bevat geen geldige items",
        });
      }

      const {
        data: existingOrder,
        error: existingError,
      } = await supabase
        .from("orders")
        .select(
          "id, external_id, payment_id",
        )
        .eq("payment_id", paymentId)
        .maybeSingle();

      if (existingError) {
        throw existingError;
      }

      if (existingOrder) {
        return res.status(200).json({
          ok: true,
          status: "already_exists",
          order: existingOrder,
        });
      }

      const {
        data: createdOrder,
        error: createError,
      } = await supabase.rpc(
        "create_order_with_items",
        {
          p_external_id: externalId,
          p_payment_id: paymentId,

          p_payment_method:
            getPaymentMethod(incoming),

          p_total: Number(
            incoming.total || 0,
          ),

          p_pickup_time:
            incoming.pickupTime || "ASAP",

          p_pickup_date:
            incoming.pickupDate,

          p_ordered_at:
            incoming.orderedTime ||
            new Date().toISOString(),

          p_customer_name:
            incoming.customerName || "",

          p_customer_email:
            incoming.customerEmail || "",

          p_customer_notes:
            incoming.customerNotes || "",

          p_status:
            incoming.status || "new",

          p_items: items,
        },
      );

      if (createError) {
        throw createError;
      }

      try {
        await sendOrderEmail(
          incoming,
          items,
        );

        console.log("📧 Mail sent");
      } catch (mailError) {
        console.error(
          "❌ Mail failed:",
          mailError,
        );
      }

      return res.status(201).json({
        ok: true,
        status: "ok",
        order: createdOrder,
      });
    }

    return res.status(405).json({
      ok: false,
      error: "Method not allowed",
    });
  } catch (error) {
    console.error(
      "Vercel API /orders error:",
      error,
    );

    return res.status(500).json({
      ok: false,
      error:
        error.message || "Server error",
    });
  }
}