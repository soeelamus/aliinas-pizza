import { buffer } from "micro";
import { supabaseAdmin } from "../../src/lib/supabaseAdmin.js";
import { stripe } from "../../src/lib/stripeClient.js";

export const config = {
  api: {
    bodyParser: false,
  },
};

function getPaymentIntentId(session) {
  return typeof session.payment_intent === "string"
    ? session.payment_intent
    : session.payment_intent?.id || null;
}

function getStripeCustomerId(session) {
  return typeof session.customer === "string"
    ? session.customer
    : session.customer?.id || null;
}

function requirePaid(session) {
  if (session.payment_status !== "paid") {
    throw new Error(
      `Betaling is niet voltooid: ${session.payment_status}`,
    );
  }
}

async function recalculateBookingPayments(bookingId) {
  const { data: payments, error: paymentsError } =
    await supabaseAdmin
      .from("event_booking_payments")
      .select("amount_cents")
      .eq("booking_id", bookingId)
      .eq("status", "paid");

  if (paymentsError) {
    throw new Error(
      `Betalingen optellen mislukt: ${paymentsError.message}`,
    );
  }

  const paidAmountCents = (payments || []).reduce(
    (total, payment) =>
      total + Number(payment.amount_cents || 0),
    0,
  );

  const { data: booking, error: bookingError } =
    await supabaseAdmin
      .from("event_bookings")
      .select("order_total_cents")
      .eq("id", bookingId)
      .single();

  if (bookingError) {
    throw new Error(
      `Reservatie ophalen mislukt: ${bookingError.message}`,
    );
  }

  const remainingAmountCents = Math.max(
    0,
    Number(booking.order_total_cents || 0) -
      paidAmountCents,
  );

  const { error: updateError } = await supabaseAdmin
    .from("event_bookings")
    .update({
      paid_amount_cents: paidAmountCents,
      remaining_amount_cents: remainingAmountCents,
      updated_at: new Date().toISOString(),
    })
    .eq("id", bookingId);

  if (updateError) {
    throw new Error(
      `Reservatietotalen bijwerken mislukt: ${updateError.message}`,
    );
  }

  return {
    paidAmountCents,
    remainingAmountCents,
  };
}

async function confirmDeposit(session) {
  requirePaid(session);

  const bookingId =
    session.metadata?.booking_id ||
    session.client_reference_id;

  if (!bookingId) {
    throw new Error(
      "Voorschot bevat geen booking_id.",
    );
  }

  const paymentIntentId =
    getPaymentIntentId(session);

  const stripeCustomerId =
    getStripeCustomerId(session);

  const { data: booking, error: bookingError } =
    await supabaseAdmin
      .from("event_bookings")
      .select(`
        id,
        customer_token,
        status,
        deposit_amount_cents,
        stripe_checkout_session_id
      `)
      .eq("id", bookingId)
      .maybeSingle();

  if (bookingError) {
    throw new Error(
      `Reservatie ophalen mislukt: ${bookingError.message}`,
    );
  }

  if (!booking) {
    throw new Error(
      `Reservatie ${bookingId} bestaat niet.`,
    );
  }

  if (
    booking.stripe_checkout_session_id !== session.id
  ) {
    throw new Error(
      "Stripe-sessie hoort niet bij deze reservatie.",
    );
  }

  const metadataToken =
    session.metadata?.customer_token;

  if (
    metadataToken &&
    metadataToken !== booking.customer_token
  ) {
    throw new Error(
      "Customer token komt niet overeen.",
    );
  }

  /*
   * Betaling idempotent opslaan.
   */
  const { error: paymentError } = await supabaseAdmin
    .from("event_booking_payments")
    .upsert(
      {
        booking_id: booking.id,
        payment_type: "deposit",
        amount_cents:
          Number(booking.deposit_amount_cents),
        status: "paid",
        stripe_checkout_session_id: session.id,
        stripe_payment_intent_id: paymentIntentId,
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "stripe_checkout_session_id",
      },
    );

  if (paymentError) {
    throw new Error(
      `Voorschot opslaan mislukt: ${paymentError.message}`,
    );
  }

  const { error: updateError } = await supabaseAdmin
    .from("event_bookings")
    .update({
      status: "confirmed",
      confirmed_at:
        booking.status === "confirmed"
          ? undefined
          : new Date().toISOString(),

      hold_expires_at: null,
      stripe_customer_id: stripeCustomerId,
      stripe_payment_intent_id: paymentIntentId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", booking.id);

  if (updateError) {
    throw new Error(
      `Reservatie bevestigen mislukt: ${updateError.message}`,
    );
  }

  const totals = await recalculateBookingPayments(
    booking.id,
  );

  return {
    status:
      booking.status === "confirmed"
        ? "already_confirmed"
        : "confirmed",

    bookingId: booking.id,
    customerToken: booking.customer_token,
    ...totals,
  };
}

async function confirmAdjustment(session) {
  requirePaid(session);

  const bookingId =
    session.metadata?.booking_id ||
    session.client_reference_id;

  const paymentId =
    session.metadata?.payment_id;

  if (!bookingId || !paymentId) {
    throw new Error(
      "Bijbetaling bevat geen booking_id of payment_id.",
    );
  }

  const paymentIntentId =
    getPaymentIntentId(session);

  const { data: payment, error: paymentError } =
    await supabaseAdmin
      .from("event_booking_payments")
      .select(`
        id,
        booking_id,
        amount_cents,
        status,
        stripe_checkout_session_id
      `)
      .eq("id", paymentId)
      .maybeSingle();

  if (paymentError) {
    throw new Error(
      `Betaling ophalen mislukt: ${paymentError.message}`,
    );
  }

  if (!payment) {
    throw new Error(
      `Betaling ${paymentId} bestaat niet.`,
    );
  }

  if (payment.booking_id !== bookingId) {
    throw new Error(
      "Betaling hoort niet bij deze reservatie.",
    );
  }

  if (
    payment.stripe_checkout_session_id !== session.id
  ) {
    throw new Error(
      "Stripe-sessie hoort niet bij deze betaling.",
    );
  }

  if (payment.status === "paid") {
    const totals = await recalculateBookingPayments(
      bookingId,
    );

    return {
      status: "already_paid",
      bookingId,
      paymentId,
      ...totals,
    };
  }

  if (payment.status !== "pending") {
    throw new Error(
      `Betaling heeft ongeldige status: ${payment.status}`,
    );
  }

  if (
    Number(session.amount_total) !==
    Number(payment.amount_cents)
  ) {
    throw new Error(
      "Het ontvangen bedrag komt niet overeen met de openstaande betaling.",
    );
  }

  const {
    data: updatedPayment,
    error: updateError,
  } = await supabaseAdmin
    .from("event_booking_payments")
    .update({
      status: "paid",
      stripe_payment_intent_id: paymentIntentId,
      paid_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", payment.id)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  if (updateError) {
    throw new Error(
      `Betaling bevestigen mislukt: ${updateError.message}`,
    );
  }

  if (!updatedPayment) {
    throw new Error(
      "De betaling kon niet worden bevestigd.",
    );
  }

  const totals = await recalculateBookingPayments(
    bookingId,
  );

  return {
    status: "paid",
    bookingId,
    paymentId,
    ...totals,
  };
}

export default async function handler(req, res) {
  if (req.method === "GET") {
    return res
      .status(200)
      .send(
        "Booking Stripe webhook endpoint alive",
      );
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");

    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  const signature =
    req.headers["stripe-signature"];

  if (!signature) {
    return res.status(400).json({
      error: "Missing Stripe signature",
    });
  }

  const webhookSecret =
    process.env.STRIPE_BOOKING_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return res.status(500).json({
      error:
        "STRIPE_BOOKING_WEBHOOK_SECRET ontbreekt.",
    });
  }

  let event;

  try {
    const rawBody = await buffer(req);

    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      webhookSecret,
    );
  } catch (error) {
    console.error(
      "Booking webhook signature error:",
      error.message,
    );

    return res
      .status(400)
      .send(`Webhook Error: ${error.message}`);
  }

  try {
    if (
      event.type !==
      "checkout.session.completed"
    ) {
      return res.status(200).json({
        received: true,
        ignored: event.type,
      });
    }

    const eventSession = event.data.object;

    const session =
      await stripe.checkout.sessions.retrieve(
        eventSession.id,
        {
          expand: ["payment_intent"],
        },
      );

    const paymentType =
      session.metadata?.payment_type;

    if (paymentType === "booking_deposit") {
      const result = await confirmDeposit(session);

      return res.status(200).json({
        received: true,
        type: "booking_deposit",
        ...result,
      });
    }

    if (
      paymentType === "booking_adjustment" ||
      paymentType === "booking_balance"
    ) {
      const result =
        await confirmAdjustment(session);

      return res.status(200).json({
        received: true,
        type: "booking_adjustment",
        ...result,
      });
    }

    return res.status(200).json({
      received: true,
      ignored: "unknown_payment_type",
      paymentType: paymentType || null,
    });
  } catch (error) {
    console.error(
      "Booking webhook handler failed:",
      error,
    );

    return res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Booking webhook handler failed",
    });
  }
}