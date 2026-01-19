// api/stock.js
export default async function handler(req, res) {
  const GAS_URL =
    "https://script.google.com/macros/s/AKfycbwWXO257hSAM3xViRi4uF-wZvfvQ3KEs4oR2Hf8SKeIav0OX3yokPDmOqN69ySy9hF7/exec";

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const { type } = req.query;

    // 🔹 GET
    if (req.method === "GET") {
      const url = type ? `${GAS_URL}?type=${type}` : GAS_URL;
      const response = await fetch(url);
      const data = await response.json(); // force JSON
      return res.status(200).json(data);
    }

    // 🔹 POST
    if (req.method === "POST") {
      const response = await fetch(GAS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body),
      });

      const text = await response.text();
      return res.status(200).send(text);
    }

    res.status(405).send("Method not allowed");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
}
