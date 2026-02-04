// pages/api/orders.js
const GAS_URL = process.env.SHEETS_ORDER;
const SESSION_ID_HEADER = "sessionid";

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

function orderAlreadyExists(rows, incomingSessionId) {
  if (!incomingSessionId) return false;

  return rows.some((row) => {
    const existing = (row[SESSION_ID_HEADER] || "").trim();
    return existing && existing === incomingSessionId;
  });
}

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const response = await fetch(GAS_URL);
      const csvText = await response.text();

      const { rows } = parseCsvToObjects(csvText);

      return res.status(200).json(rows);
    }

    if (req.method === "POST") {
      const incoming = req.body || {};

      const incomingSessionId = String(
        incoming.sessionId || incoming.id || "",
      ).trim();

      const existingRes = await fetch(GAS_URL);
      const existingCsv = await existingRes.text();
      const { headers, rows } = parseCsvToObjects(existingCsv);

      const hasSessionIdHeader = headers.includes(SESSION_ID_HEADER);

      if (hasSessionIdHeader && incomingSessionId) {
        const exists = orderAlreadyExists(rows, incomingSessionId);
        if (exists) {
          return res.status(200).json({ status: "already_exists" });
        }
      }

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
    return res.status(500).json({ error: err.message });
  }
}
