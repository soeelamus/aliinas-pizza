// pages/api/orders.js
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_KEY);
const GAS_URL = process.env.SHEETS_ORDER;
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

  const headers = splitCsvLine(lines[0]).map((h) =>
    h.replace(/^"|"$/g, "").trim().toLowerCase(),
  );

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

async function sendMail(order) {
  if (!order.customerEmail) {
    throw new Error("No email");
  }

  const firstPizza =
    (order.items || "")
      .split(",")[0]
      ?.replace(/^\s*\d+\s*x\s*/i, "")
      ?.trim() || "je pizza";

  return resend.emails.send({
    from: "Aliina's Pizza <orders@aliinas.com>",
    replyTo: "aliinas.pizza@hotmail.com",
    to: order.customerEmail,
    bcc: "aliinas.pizza@hotmail.com",
    subject: `Je bestelling kan worden opgehaald om ${order.pickupTime} 🍕`,

    html: `
 <!DOCTYPE html>
  <html lang="nl">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body {
        font-family: 'Helvetica', Arial, sans-serif;
        background-color: #fefaf4;
        color: #333;
        margin: 0;
        padding: 0;
      }
      .container {
        max-width: 600px;
        margin: 20px auto;
        background: #fefaf4;
        border-radius: 10px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        overflow: hidden;
        border-top: 6px solid #6237c8;
      }
      .header {
        background-color: #6237c8;
        color: white;
        text-align: center;
        padding: 20px;
        font-size: 24px;
        font-weight: bold;
      }
      .content {
        padding: 20px;
        line-height: 1.6;
      }
      .content h2 {
        color: #6237c8;
      }
      .order-details {
        margin: 20px 0;
        border-top: 1px solid #fefaf4;
        border-bottom: 1px solid #fefaf4;
        padding: 10px 0;
      }
      .order-details p {
        margin: 5px 0;
      }
      .footer {
        text-align: center;
        font-size: 12px;
        color: #888;
        padding: 15px;
      }
      @media(max-width: 640px) {
        .container { width: 90%; }
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">Aliina's Pizza</div>
      <div class="content">
<h2>
  Psst… ik ben het, je pizza ${firstPizza}! 😄<br/>
  </h2>        
  <p>Ik word graag opgehaald om <strong>${order.pickupTime}</strong></p>
<p>Tot straks, ${order.customerName}!</p>
<br />
<p>Het afhaaladres vind je terug op onze kalender.</p>
        <br />
        <div class="order-details">
          <p><strong>Bestelling:</strong><br/>
          ${order.items.replace(/,/g, "<br/>")}</p>

          <p><strong>Totaal:</strong> €${Number(order.total || 0).toFixed(2)}</p>
          
          ${order.customerNotes ? `<p><strong>Opmerking:</strong> ${order.customerNotes}</p>` : ""}
          </div>
          <br />
          <a href="https://aliinas.com/" 
            style="display:inline-block; background:#6237c8; color:#fff; padding:10px 20px; border-radius:5px; text-decoration:none;">
            Website
          </a>        
          </div>
        <div class="footer">
        Een vraag? Je kan ze stellen door op deze mail te antwoorden<br/>
        <a href="mailto:aliinas.pizza@hotmail.com" style="color:#888;">aliinas.pizza@hotmail.com</a>
      </div>
    </div>
  </body>
  </html>
  `,
  });
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

    if (req.method === "POST") {
      const incoming = req.body || {};

      // 🔹 Genereer sessionId uit data
      const incomingSessionId = String(
        incoming.sessionId || incoming.session_id || incoming.id || "",
      ).trim();

      let isNewOrder = true;

      if (incomingSessionId) {
        const existingRes = await fetch(GAS_URL, { cache: "no-store" });
        const existingCsv = await existingRes.text();
        const { rows } = parseCsvToObjects(existingCsv);

        if (orderAlreadyExists(rows, incomingSessionId)) {
          isNewOrder = false; // order bestaat al
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
        return res.status(500).json({ error: "Invalid JSON from GAS" });
      }

      // 🔹 Mail sturen:
      if (isNewOrder) {
        try {
          await sendMail(incoming);
          console.log("✅ Mail sent (backend)");
        } catch (err) {
          console.error("❌ Mail failed:", err);
        }
      }

      return res.status(200).json(data);
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("Vercel API /orders error:", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}
