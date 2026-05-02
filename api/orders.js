import { Resend } from "resend";

const GAS_URL = process.env.SHEETS_ORDER;
const resend = new Resend(process.env.RESEND_KEY);

const SESSION_KEYS = ["sessionid", "session_id"];

// -------------------- CSV helpers --------------------
function splitCsvLine(line) {
  const out = [];
  let cur = "";
  let inQ = false;

  for (let i = 0; i < (line || "").length; i++) {
    const ch = line[i];

    if (ch === '"') {
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

// -------------------- handler --------------------
export default async function handler(req, res) {
  try {
    if (!GAS_URL) {
      return res.status(500).json({ error: "Missing SHEETS_ORDER env var" });
    }

    // =========================
    // GET ORDERS
    // =========================
    if (req.method === "GET") {
      const response = await fetch(GAS_URL, { cache: "no-store" });
      const csvText = await response.text();

      const { rows } = parseCsvToObjects(csvText);
      return res.status(200).json(rows);
    }

    // =========================
    // CREATE ORDER
    // =========================
    if (req.method === "POST") {
      const incoming = req.body || {};

      const incomingSessionId = String(
        incoming.sessionId || incoming.session_id || incoming.id || "",
      ).trim();

      if (!incomingSessionId) {
        return res.status(400).json({ error: "Missing sessionId" });
      }

      // ---------------------
      // 1. Check duplicate
      // ---------------------
      const existingRes = await fetch(GAS_URL, { cache: "no-store" });
      const existingCsv = await existingRes.text();
      const { rows } = parseCsvToObjects(existingCsv);

      const isNewOrder = !orderAlreadyExists(rows, incomingSessionId);

      if (!isNewOrder) {
        return res.status(200).json({ status: "already_exists" });
      }

      // ---------------------
      // 2. Save order (GAS)
      // ---------------------
      const response = await fetch(GAS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(incoming),
      });

      const text = await response.text();

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        return res.status(500).json({ error: "Invalid JSON from GAS" });
      }

      // ---------------------
      // 3. Send mail (SERVER-SIDE)
      // ---------------------
      try {
        const firstPizza =
          (incoming.items || "")
            .split(",")[0]
            ?.replace(/^\s*\d+\s*x\s*/i, "")
            ?.trim() || "je pizza";

        const getRandomEmoji = () => {
          const emojis = ["🍕", "😄", "😋", "🔥", "👀", "🤤", "🎉"];
          return emojis[Math.floor(Math.random() * emojis.length)];
        };
        if (incoming.customerEmail) {
          await resend.emails.send({
            from: "Aliina's Pizza <orders@aliinas.com>",
            replyTo: "aliinas.pizza@hotmail.com",
            to: incoming.customerEmail,
            bcc: "aliinas.pizza@hotmail.com",
            subject: `Je bestelling kan worden opgehaald om ${incoming.pickupTime} 🍕`,
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
          Psst… ik ben het, je pizza ${firstPizza}! ${getRandomEmoji()}<br/>
          </h2>        
          <p>Ik word graag opgehaald om <strong>${incoming.pickupTime}</strong></p>
        <p>Tot straks, ${incoming.customerName}!</p>
        <br />
        <p>Het afhaaladres vind je terug op onze kalender.</p>
        <br />
        <div class="order-details">
          <p><strong>Bestelling:</strong><br/>
          ${incoming.items.replace(/,/g, "<br/>")}</p>

          <p><strong>Totaal:</strong> €${Number(incoming.total || 0).toFixed(2)}</p>
          
          ${incoming.customerNotes ? `<p><strong>Opmerking:</strong> ${incoming.customerNotes}</p>` : ""}
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
  </html>`,
          });
        }
        console.log("📧 Mail sent");
      } catch (mailErr) {
        console.error("❌ Mail failed:", mailErr);
      }

      // ---------------------
      // 4. Response
      // ---------------------
      return res.status(200).json({
        status: "ok",
        order: data,
      });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("Vercel API /orders error:", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}
