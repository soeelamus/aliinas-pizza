// /api/pickup-slots.js
import { supabase } from "../src/lib/supabase.js";

function todayBrusselsYYYYMMDD() {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Brussels",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function getBrusselsDayBounds(date) {
  const start = new Date(`${date}T00:00:00+02:00`);
  const end = new Date(`${date}T23:59:59.999+02:00`);

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "s-maxage=10, stale-while-revalidate=10");

  try {
    if (req.method !== "GET") {
      return res.status(405).json({
        ok: false,
        error: "Method not allowed",
      });
    }

    const date = String(req.query.date || todayBrusselsYYYYMMDD()).trim();

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        ok: false,
        error: "Ongeldige datum",
      });
    }

    const { start, end } = getBrusselsDayBounds(date);

    const { data, error } = await supabase
      .from("orders")
      .select("pickup_time")
      .eq("pickup_date", date)
      .neq("status", "cancelled");

    if (error) {
      throw error;
    }

    const booked = (data || [])
      .map((order) => String(order.pickup_time || "").trim())
      .filter((time) => time && time.toUpperCase() !== "ASAP");

    return res.status(200).json({
      ok: true,
      date,
      booked: [...new Set(booked)],
    });
  } catch (error) {
    console.error("API /pickup-slots error:", error);

    return res.status(500).json({
      ok: false,
      error: error.message || "Server error",
    });
  }
}
