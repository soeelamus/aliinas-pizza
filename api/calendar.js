import { supabaseAdmin } from "../src/lib/serverClients.js";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_PATTERN = /^\d{4}-\d{2}$/;

function isValidDate(value) {
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

function getMonthRange(month) {
  if (
    typeof month !== "string" ||
    !MONTH_PATTERN.test(month)
  ) {
    return null;
  }

  const [year, monthNumber] = month
    .split("-")
    .map(Number);

  const start = new Date(
    Date.UTC(year, monthNumber - 1, 1),
  );

  const end = new Date(
    Date.UTC(year, monthNumber, 1),
  );

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime())
  ) {
    return null;
  }

  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
}

/*
 * Koppel hier je bestaande employees-authenticatie.
 *
 * Laat deze route niet publiek schrijfbaar.
 *
 * Voorlopig is dit een placeholder. Vervang dit door
 * dezelfde server-side cookiecontrole die je voor je
 * employee dashboard gebruikt.
 */
function isEmployeeAuthorized(req) {
  const cookie = req.headers.cookie || "";

  return cookie.includes("employeesAuth=");
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (!isEmployeeAuthorized(req)) {
    return res.status(401).json({
      success: false,
      error: "Niet ingelogd",
    });
  }

  if (req.method === "GET") {
    return handleGetCalendar(req, res);
  }

  if (req.method === "POST") {
    return handleSaveOverride(req, res);
  }

  if (req.method === "DELETE") {
    return handleDeleteOverride(req, res);
  }

  res.setHeader("Allow", "GET, POST, DELETE");

  return res.status(405).json({
    success: false,
    error: "Method not allowed",
  });
}

async function handleGetCalendar(req, res) {
  try {
    const range = getMonthRange(req.query.month);

    if (!range) {
      return res.status(400).json({
        success: false,
        error: "Ongeldige maand",
      });
    }

    const [
      weekdayRulesResult,
      overridesResult,
      bookingsResult,
      settingsResult,
    ] = await Promise.all([
      supabaseAdmin
        .from("booking_weekday_rules")
        .select("weekday, is_available")
        .order("weekday"),

      supabaseAdmin
        .from("booking_date_overrides")
        .select(
          "event_date, is_available, reason",
        )
        .gte("event_date", range.startDate)
        .lt("event_date", range.endDate)
        .order("event_date"),

      supabaseAdmin
        .from("event_bookings")
        .select(
          `
            id,
            event_date,
            first_name,
            email,
            guest_count,
            pizza_count,
            status,
            hold_expires_at
          `,
        )
        .gte("event_date", range.startDate)
        .lt("event_date", range.endDate)
        .in("status", [
          "confirmed",
          "pending_payment",
        ])
        .order("event_date"),

      supabaseAdmin
        .from("booking_settings")
        .select(
          `
            max_pizzas,
            deposit_per_guest_cents,
            booking_hold_minutes,
            direct_booking_enabled
          `,
        )
        .order("id")
        .limit(1)
        .maybeSingle(),
    ]);

    const firstError =
      weekdayRulesResult.error ||
      overridesResult.error ||
      bookingsResult.error ||
      settingsResult.error;

    if (firstError) {
      console.error(
        "Calendar fetch error:",
        firstError,
      );

      return res.status(500).json({
        success: false,
        error:
          "De kalender kon niet worden geladen.",
      });
    }

    const now = new Date();

    const activeBookings =
      (bookingsResult.data || []).filter(
        (booking) => {
          if (booking.status === "confirmed") {
            return true;
          }

          if (
            booking.status === "pending_payment" &&
            booking.hold_expires_at
          ) {
            return (
              new Date(booking.hold_expires_at) > now
            );
          }

          return false;
        },
      );

    return res.status(200).json({
      success: true,
      weekdayRules: weekdayRulesResult.data || [],
      overrides: overridesResult.data || [],
      bookings: activeBookings,
      settings: settingsResult.data || null,
    });
  } catch (error) {
    console.error("Calendar GET error:", error);

    return res.status(500).json({
      success: false,
      error:
        "De kalender kon niet worden geladen.",
    });
  }
}

async function handleSaveOverride(req, res) {
  try {
    const {
      date,
      isAvailable,
      reason = "",
    } = req.body ?? {};

    if (!isValidDate(date)) {
      return res.status(400).json({
        success: false,
        error: "Ongeldige datum",
      });
    }

    if (typeof isAvailable !== "boolean") {
      return res.status(400).json({
        success: false,
        error:
          "isAvailable moet true of false zijn",
      });
    }

    const cleanedReason =
      typeof reason === "string"
        ? reason.trim().slice(0, 500)
        : "";

    const { data, error } = await supabaseAdmin
      .from("booking_date_overrides")
      .upsert(
        {
          event_date: date,
          is_available: isAvailable,
          reason: cleanedReason || null,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "event_date",
        },
      )
      .select(
        "event_date, is_available, reason",
      )
      .single();

    if (error) {
      console.error(
        "Save calendar override error:",
        error,
      );

      return res.status(500).json({
        success: false,
        error:
          "De datum kon niet worden aangepast.",
      });
    }

    return res.status(200).json({
      success: true,
      override: data,
    });
  } catch (error) {
    console.error("Calendar POST error:", error);

    return res.status(500).json({
      success: false,
      error:
        "De datum kon niet worden aangepast.",
    });
  }
}

async function handleDeleteOverride(req, res) {
  try {
    const { date } = req.body ?? {};

    if (!isValidDate(date)) {
      return res.status(400).json({
        success: false,
        error: "Ongeldige datum",
      });
    }

    const { error } = await supabaseAdmin
      .from("booking_date_overrides")
      .delete()
      .eq("event_date", date);

    if (error) {
      console.error(
        "Delete calendar override error:",
        error,
      );

      return res.status(500).json({
        success: false,
        error:
          "De uitzondering kon niet worden verwijderd.",
      });
    }

    return res.status(200).json({
      success: true,
    });
  } catch (error) {
    console.error("Calendar DELETE error:", error);

    return res.status(500).json({
      success: false,
      error:
        "De uitzondering kon niet worden verwijderd.",
    });
  }
}