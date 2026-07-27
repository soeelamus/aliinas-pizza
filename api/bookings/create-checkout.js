import { supabaseAdmin } from "../../src/lib/supabaseAdmin.js";
import { stripe } from "../../src/lib/stripeClient.js";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function cleanText(value, maxLength = 500) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().slice(0, maxLength);
}

function isValidDateString(value) {
  if (
    typeof value !== "string" ||
    !DATE_PATTERN.test(value)
  ) {
    return false;
  }

  const date = new Date(`${value}T00:00:00Z`);

  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  );
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

function getRpcErrorCode(error) {
  const message = [
    error?.message,
    error?.details,
    error?.hint,
  ]
    .filter(Boolean)
    .join(" ");

  const knownCodes = [
    "DATE_UNAVAILABLE",
    "DIRECT_BOOKING_DISABLED",
    "INVALID_DATE",
    "INVALID_LOCATION",
    "INVALID_FIRST_NAME",
    "INVALID_EMAIL",
    "INVALID_GUEST_COUNT",
    "BOOKING_SETTINGS_NOT_FOUND",
  ];

  return knownCodes.find((code) =>
    message.includes(code),
  );
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

  let bookingId = null;
  let stripeSessionId = null;

  try {
    const {
      eventDate,
      location,
      firstName,
      email,
      guestCount,
      extraInfo,
    } = req.body ?? {};

    const cleanedLocation = cleanText(
      location,
      300,
    );

    const cleanedFirstName = cleanText(
      firstName,
      100,
    );

    const cleanedEmail = cleanText(
      email,
      254,
    ).toLowerCase();

    const cleanedExtraInfo = cleanText(
      extraInfo,
      3000,
    );

    const parsedGuestCount = Number(guestCount);

    const validationErrors = {};

    if (!isValidDateString(eventDate)) {
      validationErrors.eventDate =
        "Ongeldige datum";
    }

    if (!cleanedLocation) {
      validationErrors.location =
        "Vul de locatie in";
    }

    if (!cleanedFirstName) {
      validationErrors.firstName =
        "Vul je voornaam in";
    }

    if (!EMAIL_PATTERN.test(cleanedEmail)) {
      validationErrors.email =
        "Vul een geldig e-mailadres in";
    }

    if (
      !Number.isInteger(parsedGuestCount) ||
      parsedGuestCount < 1
    ) {
      validationErrors.guestCount =
        "Het aantal gasten is ongeldig";
    }

    if (
      Object.keys(validationErrors).length > 0
    ) {
      return res.status(400).json({
        success: false,
        code: "VALIDATION_ERROR",
        errors: validationErrors,
      });
    }

    /*
     * Deze RPC:
     * - controleert de datum;
     * - controleert weekregels en uitzonderingen;
     * - controleert bestaande boekingen;
     * - blokkeert de datum tijdelijk;
     * - berekent het voorschot.
     */
    const {
      data: hold,
      error: holdError,
    } = await supabaseAdmin.rpc(
      "create_booking_hold",
      {
        requested_date: eventDate,
        requested_location: cleanedLocation,
        requested_first_name: cleanedFirstName,
        requested_email: cleanedEmail,
        requested_guest_count:
          parsedGuestCount,
        requested_extra_info:
          cleanedExtraInfo || null,
      },
    );

    if (holdError) {
      console.error(
        "create_booking_hold error:",
        holdError,
      );

      const errorCode =
        getRpcErrorCode(holdError);

      if (
        errorCode === "DATE_UNAVAILABLE"
      ) {
        return res.status(409).json({
          success: false,
          code: "DATE_UNAVAILABLE",
          error:
            "Deze datum is ondertussen niet meer beschikbaar.",
        });
      }

      if (
        errorCode ===
        "DIRECT_BOOKING_DISABLED"
      ) {
        return res.status(409).json({
          success: false,
          code: "DIRECT_BOOKING_DISABLED",
          error:
            "Direct reserveren is momenteel uitgeschakeld.",
        });
      }

      if (
        errorCode ===
        "BOOKING_SETTINGS_NOT_FOUND"
      ) {
        return res.status(500).json({
          success: false,
          code: errorCode,
          error:
            "De reservatie-instellingen ontbreken.",
        });
      }

      if (
        errorCode?.startsWith("INVALID_")
      ) {
        return res.status(400).json({
          success: false,
          code: errorCode,
          error:
            "Controleer de ingevulde gegevens.",
        });
      }

      return res.status(500).json({
        success: false,
        error:
          "De reservatie kon niet worden aangemaakt.",
      });
    }

    if (
      !hold?.bookingId ||
      !hold?.customerToken ||
      !hold?.holdExpiresAt
    ) {
      throw new Error(
        "De database gaf geen volledige reservatie terug",
      );
    }

    bookingId = hold.bookingId;

    const baseUrl = getBaseUrl(req);

    const holdExpirationSeconds = Math.floor(
      new Date(
        hold.holdExpiresAt,
      ).getTime() / 1000,
    );

    const minimumStripeExpiration =
      Math.floor(Date.now() / 1000) +
      30 * 60;

    const stripeExpiration = Math.max(
      holdExpirationSeconds,
      minimumStripeExpiration,
    );

    const pricePerGuest =
      Number(
        hold.depositPerGuestCents,
      ) || 600;

    const session =
      await stripe.checkout.sessions.create({
        mode: "payment",

        customer_email: cleanedEmail,

        /*
         * Maakt een Stripe Customer aan.
         * Die kunnen we later hergebruiken
         * voor het restbedrag.
         */
        customer_creation: "always",

        client_reference_id: bookingId,

        expires_at: stripeExpiration,

        /*
         * Stripe maakt na betaling een
         * betaalde factuur aan.
         */
        invoice_creation: {
          enabled: true,

          invoice_data: {
            description:
              `Voorschot eventreservatie op ${eventDate}`,

            footer:
              "Bedankt voor je reservatie bij Aliina's Pizza.",

            metadata: {
              payment_type:
                "booking_deposit",

              booking_id: bookingId,

              customer_token:
                hold.customerToken,

              event_date: eventDate,
            },
          },
        },

        line_items: [
          {
            price_data: {
              currency: "eur",

              product_data: {
                name:
                  "Voorschot eventreservatie",

                description:
                  `${parsedGuestCount} gasten × ` +
                  `${(
                    pricePerGuest / 100
                  ).toLocaleString("nl-NL", {
                    style: "currency",
                    currency: "EUR",
                  })}`,
              },

              unit_amount: pricePerGuest,
            },

            quantity: parsedGuestCount,
          },
        ],

        metadata: {
          payment_type:
            "booking_deposit",

          booking_id: bookingId,

          customer_token:
            hold.customerToken,

          event_date: eventDate,

          guest_count:
            String(parsedGuestCount),
        },

        payment_intent_data: {
          description:
            `Voorschot eventreservatie ${eventDate}`,

          metadata: {
            payment_type:
              "booking_deposit",

            booking_id: bookingId,

            customer_token:
              hold.customerToken,

            event_date: eventDate,
          },
        },

        success_url:
          `${baseUrl}/reservation/` +
          `${hold.customerToken}` +
          `?payment=success` +
          `&session_id={CHECKOUT_SESSION_ID}`,

        cancel_url:
          `${baseUrl}/#contact` +
          `?booking_cancelled=1`,
      });

    stripeSessionId = session.id;

    if (!session.url) {
      throw new Error(
        "Stripe heeft geen Checkout URL teruggegeven",
      );
    }

    /*
     * Sla de Stripe-session eerst op.
     * De webhook controleert later of
     * dezelfde sessie betaald werd.
     */
    const {
      data: updatedBooking,
      error: updateError,
    } = await supabaseAdmin
      .from("event_bookings")
      .update({
        stripe_checkout_session_id:
          session.id,

        updated_at:
          new Date().toISOString(),
      })
      .eq("id", bookingId)
      .eq("status", "pending_payment")
      .select(
        `
          id,
          customer_token,
          status,
          stripe_checkout_session_id
        `,
      )
      .maybeSingle();

    if (updateError) {
      console.error(
        "Booking Stripe session update error:",
        updateError,
      );

      await stripe.checkout.sessions
        .expire(session.id)
        .catch((expireError) => {
          console.error(
            "Stripe session expire error:",
            expireError,
          );
        });

      throw new Error(
        "De Stripe-sessie kon niet aan de reservatie gekoppeld worden",
      );
    }

    if (!updatedBooking) {
      await stripe.checkout.sessions
        .expire(session.id)
        .catch((expireError) => {
          console.error(
            "Stripe session expire error:",
            expireError,
          );
        });

      throw new Error(
        "De tijdelijke reservatie is niet meer actief",
      );
    }

    return res.status(200).json({
      success: true,

      bookingId,

      customerToken:
        hold.customerToken,

      checkoutUrl:
        session.url,

      expiresAt:
        hold.holdExpiresAt,

      depositAmountCents:
        Number(
          hold.depositAmountCents,
        ),

      depositPerGuestCents:
        pricePerGuest,
    });
  } catch (error) {
    console.error(
      "create-checkout error:",
      error,
    );

    /*
     * Als Stripe al een sessie heeft gemaakt,
     * maar de API daarna faalt, laten we
     * die Checkout Session vervallen.
     */
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

    /*
     * Geef de datum onmiddellijk weer vrij
     * wanneer de Checkout niet kon starten.
     */
    if (bookingId) {
      const {
        error: cancelError,
      } = await supabaseAdmin
        .from("event_bookings")
        .update({
          status: "cancelled",
          updated_at:
            new Date().toISOString(),
        })
        .eq("id", bookingId)
        .eq(
          "status",
          "pending_payment",
        );

      if (cancelError) {
        console.error(
          "Booking cancellation error:",
          cancelError,
        );
      }
    }

    return res.status(500).json({
      success: false,
      error:
        "De betaling kon niet worden voorbereid. Probeer opnieuw.",
    });
  }
}