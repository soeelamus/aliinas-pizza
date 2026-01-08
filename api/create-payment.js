// /api/create-payment.js
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { total } = req.body;

  const response = await fetch("https://api.mollie.com/v2/payments", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.MOLLIE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: {
        currency: "EUR",
        value: total.toFixed(2),
      },
      description: "Take-out bestelling (test)",
      redirectUrl: "https://aliinas-pizza.vercel.app/success",
      webhookUrl: "https://aliinas-pizza.vercel.app/api/mollie-webhook",
    }),
  });

  const data = await response.json();

  res.status(200).json({
    checkoutUrl: data._links.checkout.href,
  });
}
