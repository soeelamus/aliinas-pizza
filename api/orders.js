// pages/api/orders.js
const GAS_URL = process.env.SHEETS_ORDER;

// Accept multiple possible header names from your sheet
const SESSION_KEYS = ["sessionid", "session_id"];

// -------------------- CSV helpers (quote-aware) --------------------
function splitCsvLine(line) {
  const out = [];
  let cur = "";
  let inQ = false;

  for (let i = 0; i < (line || "").length; i++) {
    const ch = line[i];

    if (ch === '"') {
      // handle escaped quotes ("")
      if (inQ && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQ = !inQ;
      }
      continue;
    }

    if (ch === "," && !inQ) {
      out.push(cur.trim());
      cur = "";
      continue;
    }

    cur += ch;
  }

  out.push(cur.trim());
  return out;
}

function parseCsvToObjects(csvText) {
  const lines = (csvText || "").split(/\r?\n/).filter(Boolean);
  if (lines.length <= 1) return { headers: [], rows: [] };

  const headers = splitCsvLine(lines[0])
    .map((h) => h.replace(/^"|"$/g, "").trim().toLowerCase());

  const rows = lines.slice(1).map((line) => {
    const cols = splitCsvLine(line).map((c) => c.replace(/^"|"$/g, "").trim());
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = cols[i] ?? "";
    });
    return obj;
  });

  return { headers, rows };
}

// -------------------- idempotency --------------------
function getRowSessionId(row) {
  for (const k of SESSION_KEYS) {
    const v = String(row?.[k] || "").trim();
    if (v) return v;
  }
  return "";
}

function orderAlreadyExists(rows, incomingSessionId) {
  if (!incomingSessionId) return false;
  return rows.some((row) => getRowSessionId(row) === incomingSessionId);
}

// ✅ Brussels date (YYYY-MM-DD) from orderedTime (ISO string with Z)
function brusselsIsoDate(orderedTime) {
  const v = String(orderedTime || "").trim();
  if (!v) return "";

  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Brussels",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

// -------------------- handler --------------------
export default async function handler(req, res) {
  try {
    if (!GAS_URL) {
      return res.status(500).json({ error: "Missing SHEETS_ORDER env var" });
    }

    // =========================
    // GET → Read CSV rows
    // =========================
    if (req.method === "GET") {
      const response = await fetch(GAS_URL, { cache: "no-store" });
      const csvText = await response.text();

      const { headers, rows } = parseCsvToObjects(csvText);

      const dateQuery = req.query?.date ? String(req.query.date).trim() : "";
      const pickupTimeQuery = req.query?.pickupTime
        ? String(req.query.pickupTime).trim()
        : "";

      // No filters? Return all
      if (!dateQuery && !pickupTimeQuery) {
        return res.status(200).json(rows);
      }

      let filtered = rows;

      // Filter by Brussels "day" derived from orderedtime column
      if (dateQuery) {
        if (!headers.includes("orderedtime")) {
          return res.status(200).json([]);
        }

        filtered = filtered.filter((row) => {
          const rowDate = brusselsIsoDate(row.orderedtime);
          return rowDate && rowDate === dateQuery;
        });
      }

      // Optional filter by pickuptime
      if (pickupTimeQuery) {
        if (!headers.includes("pickuptime")) {
          return res.status(200).json([]);
        }

        filtered = filtered.filter(
          (row) => String(row.pickuptime || "").trim() === pickupTimeQuery,
        );
      }

      return res.status(200).json(filtered);
    }

    // =========================
    // POST → Insert (idempotent by sessionId)
    // =========================
    if (req.method === "POST") {
      const incoming = req.body || {};

      // normalize sessionId
      const incomingSessionId = String(
        incoming.sessionId || incoming.session_id || incoming.id || "",
      ).trim();

      // If we have a sessionId, check existing sheet first (prevents duplicates)
      if (incomingSessionId) {
        const existingRes = await fetch(GAS_URL, { cache: "no-store" });
        const existingCsv = await existingRes.text();
        const { rows } = parseCsvToObjects(existingCsv);

        if (orderAlreadyExists(rows, incomingSessionId)) {
          return res.status(200).json({ status: "already_exists" });
        }
      }

      // Forward to Apps Script
      const response = await fetch(GAS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(incoming),
      });

      const text = await response.text();

      let data;
      try {
        data = JSON.parse(text);
      } catch (err) {
        console.error("Apps Script returned invalid JSON:", text);
        return res.status(500).json({
          error: "Apps Script did not return valid JSON",
          raw: text,
        });
      }

      return res.status(200).json(data);
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("Vercel API /orders error:", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}