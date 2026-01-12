// pages/api/orders.js
const SHEET_CSV_URL =
  "https://script.google.com/macros/s/AKfycbw1Yc946gxEPAUXKwGU0pA2OUmxI5VdZ8unUgnIH2liN4Fz7ZKqoEM1r5Jr-2mh4tloiw/exec";

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      // Fetch CSV from Google Sheets
      const response = await fetch(SHEET_CSV_URL);
      const csvText = await response.text();

      const lines = csvText.split("\n").filter(Boolean);
      if (lines.length <= 1) return res.status(200).json([]);

      const headers = lines[0].split(",").map((h) =>
        h.replace(/^"|"$/g, "").trim().toLowerCase()
      );

      const orders = lines.slice(1).map((line) => {
        const cols = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
        const obj = {};
        headers.forEach((h, i) => {
          obj[h] = cols[i] ? cols[i].replace(/^"|"$/g, "").trim() : "";
        });
        return obj;
      });

      return res.status(200).json(orders);
    }

    if (req.method === "POST") {
      // Send POST to Apps Script
      const response = await fetch(SHEET_CSV_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body),
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
