import { supabaseAdmin } from "../../src/lib/supabaseAdmin.js";
import { stripe } from "../../src/lib/stripeClient.js";

const CUSTOMER_PIN =
  process.env.BOOKING_CUSTOMER_PIN || "9080";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isAuthorized(req) {
  return req.headers["x-booking-pin"] === CUSTOMER_PIN;
}

function getBaseUrl(req) {
  const configuredUrl =
    process.env.VITE_APP_URL ||
    process.env.APP_URL;

  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, "");
  }

  const protocol =
    req.headers["x-forwarded-proto"] || "https";

  const host =
    req.headers["x-forwarded-host"] ||
    req.headers.host;

  return `${protocol}://${host}`;
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");

    return res.status(405).json({
      success: false,
      error: "Method not allowed",
    });
  }

  if (!isAuthorized(req)) {
    return res.status(401).json({
      success: false,
      code: "INVALID_PIN",
      error: "De pincode is niet correct.",
    });
  }

  const { customerToken } = req.body ?? {};

  if (
    typeof customerToken !== "string" ||
    !UUID_PATTERN.test(customerToken)
  ) {
    return res.status(400).json({
      success: false,
      error: "Ongeldige reservatie.",
    });
  }

  let paymentId = null;
  let stripeSessionId = null;

  try {
    const { data: booking, error: bookingError } =
      await supabaseAdmin
        .from("event_bookings")
        .select(`
          id,
          customer_token,
          event_date,
          first_name,
          email,
          stripe_customer_id,
          status,
          pizza_count,
          order_total_cents,
          paid_amount_cents
        `)
        .eq("customer_token", customerToken)
        .maybeSingle();

    if (bookingError) {
      throw new Error(
        `Reservatie ophalen mislukt: ${bookingError.message}`,
      );
    }

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: "Reservatie niet gevonden.",
      });
    }

    if (booking.status !== "confirmed") {
      return res.status(409).json({
        success: false,
        error: "De reservatie is nog niet bevestigd.",
      });
    }

    if (!booking.pizza_count) {
      return res.status(400).json({
        success: false,
        error:
          "Sla eerst je pizzaselectie op.",
      });
    }

    const now = new Date().toISOString();

    await supabaseAdmin
      .from("event_booking_payments")
      .update({
        status: "expired",
        updated_at: now,
      })
      .eq("booking_id", booking.id)
      .eq("status", "pending")
      .lte("expires_at", now);

    const { data: activePayments, error: activeError } =
      await supabaseAdmin
        .from("event_booking_payments")
        .select("id")
        .eq("booking_id", booking.id)
        .eq("status", "pending")
        .gt("expires_at", now)
        .limit(1);

    if (activeError) {
      throw new Error(
        `Openstaande betalingen controleren mislukt: ${activeError.message}`,
      );
    }

    if ((activePayments || []).length > 0) {
      return res.status(409).json({
        success: false,
        code: "PAYMENT_IN_PROGRESS",
        error:
          "Er is al een actieve betaling voor deze reservatie.",
      });
    }

    const orderTotalCents =
      Number(booking.order_total_cents) || 0;

    const paidAmountCents =
      Number(booking.paid_amount_cents) || 0;

    const amountDueCents = Math.max(
      0,
      orderTotalCents - paidAmountCents,
    );

    if (amountDueCents <= 0) {
      return res.status(409).json({
        success: false,
        code: "NOTHING_TO_PAY",
        error:
          "Je huidige selectie is volledig betaald.",
      });
    }

    const paymentType =
      paidAmountCents >
      Number(booking.deposit_amount_cents || 0)
        ? "adjustment"
        : "balance";

    const expiresAt = new Date(
      Date.now() + 30 * 60 * 1000,
    ).toISOString();

    const {
      data: payment,
      error: paymentError,
    } = await supabaseAdmin
      .from("event_booking_payments")
      .insert({
        booking_id: booking.id,
        payment_type: paymentType,
        amount_cents: amountDueCents,
        status: "pending",
        expires_at: expiresAt,
      })
      .select("id")
      .single();

    if (paymentError) {
      throw new Error(
        `Betaling aanmaken mislukt: ${paymentError.message}`,
      );
    }

    paymentId = payment.id;

    const baseUrl = getBaseUrl(req);

    const customerOptions =
      booking.stripe_customer_id
        ? {
            customer: booking.stripe_customer_id,
          }
        : {
            customer_email: booking.email,
            customer_creation: "always",
          };

    const session =
      await stripe.checkout.sessions.create({
        mode: "payment",

        ...customerOptions,

        client_reference_id: booking.id,

        expires_at: Math.floor(
          new Date(expiresAt).getTime() / 1000,
        ),

        invoice_creation: {
          enabled: true,

          invoice_data: {
            description:
              `Bijbetaling eventreservatie op ${booking.event_date}`,

            footer:
              "Bedankt voor je reservatie bij Aliina's Pizza.",

            metadata: {
              payment_type: "booking_adjustment",
              booking_id: booking.id,
              payment_id: payment.id,
              customer_token: booking.customer_token,
            },
          },
        },

        line_items: [
          {
            price_data: {
              currency: "eur",

              product_data: {
                name:
                  paymentType === "adjustment"
                    ? "Bijbetaling eventreservatie"
                    : "Restbedrag eventreservatie",

                description:
                  "Aanpassing van je pizzaselectie en catering. Reeds betaalde bedragen zijn verrekend.",
              },

              unit_amount: amountDueCents,
            },

            quantity: 1,
          },
        ],

        metadata: {
          payment_type: "booking_adjustment",
          booking_id: booking.id,
          payment_id: payment.id,
          customer_token: booking.customer_token,
          event_date: booking.event_date,
        },

        payment_intent_data: {
          description:
            `Bijbetaling eventreservatie ${booking.event_date}`,

          metadata: {
            payment_type: "booking_adjustment",
            booking_id: booking.id,
            payment_id: payment.id,
            customer_token: booking.customer_token,
          },
        },

        success_url:
          `${baseUrl}/reservation/${booking.customer_token}` +
          `?balance_payment=success`,

        cancel_url:
          `${baseUrl}/reservation/${booking.customer_token}` +
          `?balance_payment=cancelled`,
      });

    stripeSessionId = session.id;

    if (!session.url) {
      throw new Error(
        "Stripe heeft geen betaallink teruggegeven.",
      );
    }

    const {
      data: updatedPayment,
      error: updateError,
    } = await supabaseAdmin
      .from("event_booking_payments")
      .update({
        stripe_checkout_session_id: session.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", payment.id)
      .eq("status", "pending")
      .select("id")
      .maybeSingle();

    if (updateError) {
      throw new Error(
        `Stripe-sessie opslaan mislukt: ${updateError.message}`,
      );
    }

    if (!updatedPayment) {
      throw new Error(
        "De betaalsessie kon niet worden opgeslagen.",
      );
    }

    return res.status(200).json({
      success: true,
      paymentId: payment.id,
      checkoutUrl: session.url,
      amountDueCents,
      expiresAt,
    });
  } catch (error) {
    console.error(
      "Create adjustment checkout error:",
      error,
    );

    if (stripeSessionId) {
      await stripe.checkout.sessions
        .expire(stripeSessionId)
        .catch((expireError) => {
          console.error(
            "Stripe session cleanup error:",
            expireError,
          );
        });
    }

    if (paymentId) {
      await supabaseAdmin
        .from("event_booking_payments")
        .update({
          status: "cancelled",
          updated_at: new Date().toISOString(),
        })
        .eq("id", paymentId)
        .eq("status", "pending");
    }

    return res.status(500).json({
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "De betaling kon niet worden gestart.",
    });
  }
}