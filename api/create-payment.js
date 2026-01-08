export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  const { total } = req.body;

  try {
    const response = await fetch("https://api.mollie.com/v2/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.MOLLIE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: { currency: "EUR", value: total.toFixed(2) },
        description: "Take-out bestelling",
        redirectUrl: "https://aliinas.com/success", // ❌ geen paymentId in URL
        webhookUrl: "https://aliinas.com/api/mollie-webhook",
      }),
    });

    const data = await response.json();
    console.log("Created Mollie payment:", data);

    res.status(200).json({
      checkoutUrl: data._links.checkout.href,
    });
  } catch (error) {
    console.error("Mollie API error:", error);
    res.status(500).json({ error: "Failed to create payment" });
  }
}
