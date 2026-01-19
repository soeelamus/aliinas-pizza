// pages/api/payment.js
let lastPaymentStatus = "open";

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      // 🔹 GET: status ophalen via query
      const paymentId = req.query.paymentId;
      if (!paymentId)
        return res.status(400).json({ error: "No paymentId provided" });

      const response = await fetch(
        `https://api.mollie.com/v2/payments/${paymentId}`,
        {
          headers: { Authorization: `Bearer ${process.env.MOLLIE_API_KEY}` },
        },
      );

      const payment = await response.json();
      return res.status(200).json({ status: payment.status });
    }

    if (req.method === "POST") {
      const { total, id } = req.body;

      // 🔹 Nieuwe betaling creëren
      if (typeof total === "number") {
        const response = await fetch("https://api.mollie.com/v2/payments", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.MOLLIE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: { currency: "EUR", value: total.toFixed(2) },
            description: "Take-out bestelling",
            redirectUrl: "https://aliinas.com/success",
            webhookUrl: "https://aliinas.com/api/payment",
          }),
        });

        const data = await response.json();
        return res.status(200).json({
          checkoutUrl: data._links.checkout.href,
          paymentId: data.id,
        });
      }

      // 🔹 Status ophalen en updaten
      if (id) {
        const mollieRes = await fetch(
          `https://api.mollie.com/v2/payments/${id}`,
          {
            headers: {
              Authorization: `Bearer ${process.env.MOLLIE_API_KEY}`,
            },
          },
        );
        const payment = await mollieRes.json();
        lastPaymentStatus = payment.status;
        return res.status(200).send("OK");
      }

      return res
        .status(400)
        .json({ error: "POST body must contain total or id" });
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("Mollie API error:", err);
    res.status(500).json({ error: "Server error" });
  }
}

export function getLastPaymentStatus() {
  return lastPaymentStatus;
}
