// api/stock.js
export default async function handler(req, res) {
  const GAS_URL = "https://script.google.com/macros/s/AKfycbz6aXdGRIrBOL13BHc9dzjuPY0b_NLM1NVLFIRrwO--1ceE_a22rJ8-U-F2Kw2_iqg8ww/exec";

  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end(); // Preflight
  }

  try {
    if (req.method === "GET") {
      const response = await fetch(GAS_URL);
      const data = await response.text(); // GAS kan tekst/JSON teruggeven
      res.status(200).send(data);
    } else if (req.method === "POST") {
      const response = await fetch(GAS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body),
      });
      const text = await response.text();
      res.status(200).send(text);
    } else {
      res.status(405).send("Method not allowed");
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
}
