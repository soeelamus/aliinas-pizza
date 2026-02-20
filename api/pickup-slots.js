// pages/api/pickup-slots.js
const GAS_URL = process.env.SHEETS_ORDER;

function todayBrusselsYYYYMMDD() {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Brussels",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date()); // "YYYY-MM-DD"
}

function parseCsvToObjects(csvText) {
  const lines = (csvText || "").split("\n").filter(Boolean);
  if (lines.length <= 1) return { headers: [], rows: [] };

  const headers = lines[0]
    .split(",")
    .map((h) => h.replace(/^"|"$/g, "").trim().toLowerCase());

  const rows = lines.slice(1).map((line) => {
    const cols = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = cols[i] ? cols[i].replace(/^"|"$/g, "").trim() : "";
    });
    return obj;
  });

  return { headers, rows };
}

export default async function handler(req, res) {
  try {
    if (req.method !== "GET") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    if (!GAS_URL) {
      return res.status(500).json({ error: "Missing SHEETS_ORDER env var" });
    }

    // ✅ cache: Vercel edge cache 20s + stale while revalidate
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=60");

    const date = String(req.query.date || todayBrusselsYYYYMMDD()).trim();

    const response = await fetch(GAS_URL);
    const csvText = await response.text();
    const { rows } = parseCsvToObjects(csvText);

    const booked = rows
      .filter((row) => {
        const orderedTime = (row.orderedtime || "").trim(); // ISO string
        const orderedDate = orderedTime.slice(0, 10);
        return orderedDate === date;
      })
      .map((row) => (row.pickuptime || "").trim())
      .filter((t) => t && t.toUpperCase() !== "ASAP");

    return res.status(200).json({
      date,
      booked: [...new Set(booked)],
    });
  } catch (err) {
    console.error("Vercel API /pickup-slots error:", err);
    return res.status(500).json({ error: err.message });
  }
}