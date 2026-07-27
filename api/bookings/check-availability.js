import { supabaseAdmin } from "../../src/lib/supabaseAdmin.js";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isValidDateString(value) {
  if (!DATE_PATTERN.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00Z`);

  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
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

  try {
    const { date } = req.body ?? {};

    if (typeof date !== "string" || !isValidDateString(date)) {
      return res.status(400).json({
        success: false,
        error: "Ongeldige datum",
      });
    }

    const { data, error } = await supabaseAdmin.rpc(
      "check_booking_availability",
      {
        requested_date: date,
      },
    );

    if (error) {
      console.error("Supabase availability error:", error);

      return res.status(500).json({
        success: false,
        error: "De beschikbaarheid kon niet worden gecontroleerd.",
      });
    }

    return res.status(200).json({
      success: true,
      rawData: data,
      rawType: typeof data,
      isArray: Array.isArray(data),

      available: data?.available === true,
      maxPizzas: Number(data?.maxPizzas ?? 200),
      depositPerGuestCents: Number(data?.depositPerGuestCents ?? 600),
      message: data?.message ?? "Geen bericht ontvangen van Supabase.",
    });
  } catch (error) {
    console.error("check-availability error:", error);

    return res.status(500).json({
      success: false,
      error: "Er ging iets mis bij het controleren van de datum.",
    });
  }
}
