import { supabaseAdmin } from "../../src/lib/supabaseAdmin.js";

const CUSTOMER_PIN =
  process.env.BOOKING_CUSTOMER_PIN || "9080";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getToken(req) {
  const value = req.query.token;

  return Array.isArray(value) ? value[0] : value;
}

function isAuthorized(req) {
  return req.headers["x-booking-pin"] === CUSTOMER_PIN;
}

async function getSettings() {
  const { data, error } = await supabaseAdmin
    .from("booking_settings")
    .select(`
      max_pizzas,
      catering_fee_cents
    `)
    .order("id", {
      ascending: true,
    })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Instellingen ophalen mislukt: ${error.message}`,
    );
  }

  if (!data) {
    throw new Error("Reservatie-instellingen ontbreken.");
  }

  return data;
}

async function getBooking(token) {
  const { data, error } = await supabaseAdmin
    .from("event_bookings")
    .select(`
      id,
      customer_token,
      event_date,
      location,
      first_name,
      email,
      phone,
      guest_count,
      pizza_count,
      extra_info,

      deposit_amount_cents,
      catering_fee_cents,
      pizza_subtotal_cents,
      order_total_cents,
      paid_amount_cents,
      remaining_amount_cents,

      status,
      confirmed_at,
      details_completed_at,

      event_booking_items (
        product_id,
        product_name,
        quantity,
        unit_price_cents,
        line_total_cents
      )
    `)
    .eq("customer_token", token)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Reservatie ophalen mislukt: ${error.message}`,
    );
  }

  return data;
}

async function expireOldPendingPayments(bookingId) {
  const now = new Date().toISOString();

  const { error } = await supabaseAdmin
    .from("event_booking_payments")
    .update({
      status: "expired",
      updated_at: now,
    })
    .eq("booking_id", bookingId)
    .eq("status", "pending")
    .lte("expires_at", now);

  if (error) {
    throw new Error(
      `Oude betalingen bijwerken mislukt: ${error.message}`,
    );
  }
}

async function hasActivePendingPayment(bookingId) {
  await expireOldPendingPayments(bookingId);

  const { data, error } = await supabaseAdmin
    .from("event_booking_payments")
    .select("id")
    .eq("booking_id", bookingId)
    .eq("status", "pending")
    .gt("expires_at", new Date().toISOString())
    .limit(1);

  if (error) {
    throw new Error(
      `Openstaande betaling controleren mislukt: ${error.message}`,
    );
  }

  return (data || []).length > 0;
}

function toPublicBooking(booking, settings) {
  const defaultCateringFee =
    Number(settings.catering_fee_cents) || 0;

  const cateringFeeCents =
    booking.catering_fee_cents == null
      ? defaultCateringFee
      : Number(booking.catering_fee_cents);

  const orderTotalCents =
    Number(booking.order_total_cents) || 0;

  const paidAmountCents =
    Number(booking.paid_amount_cents) || 0;

  return {
    id: booking.id,
    customerToken: booking.customer_token,

    eventDate: booking.event_date,
    location: booking.location,

    firstName: booking.first_name,
    email: booking.email,
    phone: booking.phone,

    guestCount: Number(booking.guest_count),
    pizzaCount: Number(booking.pizza_count) || 0,
    extraInfo: booking.extra_info,

    depositAmountCents:
      Number(booking.deposit_amount_cents) || 0,

    cateringFeeCents,

    pizzaSubtotalCents:
      Number(booking.pizza_subtotal_cents) || 0,

    orderTotalCents,
    paidAmountCents,

    remainingAmountCents: Math.max(
      0,
      orderTotalCents - paidAmountCents,
    ),

    status: booking.status,
    confirmedAt: booking.confirmed_at,
    detailsCompletedAt: booking.details_completed_at,

    maxPizzas: Number(settings.max_pizzas) || 200,

    items: (booking.event_booking_items || [])
      .map((item) => ({
        productId: Number(item.product_id),
        name: item.product_name,
        quantity: Number(item.quantity),
        unitPriceCents: Number(item.unit_price_cents),
        lineTotalCents: Number(item.line_total_cents),
      }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  };
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  const token = getToken(req);

  if (
    typeof token !== "string" ||
    !UUID_PATTERN.test(token)
  ) {
    return res.status(400).json({
      success: false,
      error: "Ongeldige reservatielink.",
    });
  }

  if (!isAuthorized(req)) {
    return res.status(401).json({
      success: false,
      code: "INVALID_PIN",
      error: "De ingevoerde pincode is niet correct.",
    });
  }

  try {
    if (req.method === "GET") {
      return await handleGet(token, res);
    }

    if (req.method === "PATCH") {
      return await handlePatch(token, req, res);
    }

    res.setHeader("Allow", "GET, PATCH");

    return res.status(405).json({
      success: false,
      error: "Method not allowed",
    });
  } catch (error) {
    console.error("Reservation API error:", error);

    return res.status(500).json({
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "De reservatie kon niet worden verwerkt.",
    });
  }
}

async function handleGet(token, res) {
  const [booking, settings] = await Promise.all([
    getBooking(token),
    getSettings(),
  ]);

  if (!booking) {
    return res.status(404).json({
      success: false,
      error: "Reservatie niet gevonden.",
    });
  }

  if (booking.status !== "confirmed") {
    return res.status(409).json({
      success: false,
      code: "BOOKING_NOT_CONFIRMED",
      error: "De reservatie is nog niet bevestigd.",
    });
  }

  await expireOldPendingPayments(booking.id);

  const activePayment = await hasActivePendingPayment(
    booking.id,
  );

  return res.status(200).json({
    success: true,
    activePayment,
    booking: toPublicBooking(booking, settings),
  });
}

async function handlePatch(token, req, res) {
  const rawItems = Array.isArray(req.body?.items)
    ? req.body.items
    : [];

  const cleanedItems = rawItems.map((item) => ({
    productId: Number(item.productId),
    quantity: Number(item.quantity),
  }));

  const hasInvalidItem = cleanedItems.some(
    (item) =>
      !Number.isInteger(item.productId) ||
      !Number.isInteger(item.quantity) ||
      item.quantity <= 0,
  );

  if (
    cleanedItems.length === 0 ||
    hasInvalidItem
  ) {
    return res.status(400).json({
      success: false,
      error: "Selecteer minstens één geldige pizza.",
    });
  }

  const uniqueProductIds = [
    ...new Set(
      cleanedItems.map((item) => item.productId),
    ),
  ];

  if (uniqueProductIds.length !== cleanedItems.length) {
    return res.status(400).json({
      success: false,
      error:
        "Dezelfde pizza werd meerdere keren doorgestuurd.",
    });
  }

  const [booking, settings] = await Promise.all([
    getBooking(token),
    getSettings(),
  ]);

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

  const activePayment = await hasActivePendingPayment(
    booking.id,
  );

  if (activePayment) {
    return res.status(409).json({
      success: false,
      code: "PAYMENT_IN_PROGRESS",
      error:
        "Er is momenteel een betaling actief. Rond die betaling eerst af of probeer later opnieuw.",
    });
  }

  const pizzaCount = cleanedItems.reduce(
    (total, item) => total + item.quantity,
    0,
  );

  const maxPizzas = Number(settings.max_pizzas) || 200;

  if (pizzaCount > maxPizzas) {
    return res.status(400).json({
      success: false,
      error:
        `Je kunt maximaal ${maxPizzas} pizza’s reserveren.`,
    });
  }

  const { data: products, error: productsError } =
    await supabaseAdmin
      .from("products")
      .select(`
        id,
        name,
        price
      `)
      .in("id", uniqueProductIds)
      .eq("active", true)
      .eq("product_type", "pizza");

  if (productsError) {
    throw new Error(
      `Pizza’s ophalen mislukt: ${productsError.message}`,
    );
  }

  if (
    !products ||
    products.length !== uniqueProductIds.length
  ) {
    return res.status(400).json({
      success: false,
      error:
        "Eén of meer geselecteerde pizza’s zijn niet meer beschikbaar.",
    });
  }

  const productsById = new Map(
    products.map((product) => [
      Number(product.id),
      product,
    ]),
  );

  const pricedItems = cleanedItems.map((item) => {
    const product = productsById.get(item.productId);

    const unitPriceCents = Math.round(
      Number(product.price) * 100,
    );

    return {
      booking_id: booking.id,
      product_id: Number(product.id),
      product_name: product.name,
      quantity: item.quantity,
      unit_price_cents: unitPriceCents,
    };
  });

  const pizzaSubtotalCents = pricedItems.reduce(
    (total, item) =>
      total +
      item.quantity * item.unit_price_cents,
    0,
  );

  /*
   * De cateringkost wordt bij de eerste selectie
   * op de booking vastgezet.
   */
  const cateringFeeCents =
    booking.catering_fee_cents == null
      ? Number(settings.catering_fee_cents) || 0
      : Number(booking.catering_fee_cents);

  const orderTotalCents =
    pizzaSubtotalCents + cateringFeeCents;

  const paidAmountCents =
    Number(booking.paid_amount_cents) || 0;

  if (orderTotalCents < paidAmountCents) {
    return res.status(409).json({
      success: false,
      code: "REFUND_REQUIRED",
      error:
        "Deze aanpassing maakt het totaal lager dan het reeds betaalde bedrag. Neem contact met ons op om dit te wijzigen.",
    });
  }

  const remainingAmountCents =
    orderTotalCents - paidAmountCents;

  /*
   * Oude selectie vervangen.
   */
  const { error: deleteError } = await supabaseAdmin
    .from("event_booking_items")
    .delete()
    .eq("booking_id", booking.id);

  if (deleteError) {
    throw new Error(
      `Oude pizzaselectie verwijderen mislukt: ${deleteError.message}`,
    );
  }

  const { error: insertError } = await supabaseAdmin
    .from("event_booking_items")
    .insert(pricedItems);

  if (insertError) {
    throw new Error(
      `Pizzaselectie opslaan mislukt: ${insertError.message}`,
    );
  }

  const {
    data: updatedBooking,
    error: bookingUpdateError,
  } = await supabaseAdmin
    .from("event_bookings")
    .update({
      pizza_count: pizzaCount,
      catering_fee_cents: cateringFeeCents,
      pizza_subtotal_cents: pizzaSubtotalCents,
      order_total_cents: orderTotalCents,
      remaining_amount_cents: remainingAmountCents,
      details_completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", booking.id)
    .eq("status", "confirmed")
    .select(`
      id,
      customer_token,
      event_date,
      location,
      first_name,
      email,
      phone,
      guest_count,
      pizza_count,
      extra_info,

      deposit_amount_cents,
      catering_fee_cents,
      pizza_subtotal_cents,
      order_total_cents,
      paid_amount_cents,
      remaining_amount_cents,

      status,
      confirmed_at,
      details_completed_at
    `)
    .maybeSingle();

  if (bookingUpdateError) {
    throw new Error(
      `Reservatie bijwerken mislukt: ${bookingUpdateError.message}`,
    );
  }

  if (!updatedBooking) {
    throw new Error(
      "De reservatie kon niet worden bijgewerkt.",
    );
  }

  updatedBooking.event_booking_items = pricedItems.map(
    (item) => ({
      product_id: item.product_id,
      product_name: item.product_name,
      quantity: item.quantity,
      unit_price_cents: item.unit_price_cents,
      line_total_cents:
        item.quantity * item.unit_price_cents,
    }),
  );

  return res.status(200).json({
    success: true,
    activePayment: false,
    booking: toPublicBooking(
      updatedBooking,
      settings,
    ),
  });
}