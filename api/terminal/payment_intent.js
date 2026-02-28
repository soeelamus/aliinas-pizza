import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY_TEST);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { amount, currency = "eur", orderId } = req.body;

  const pi = await stripe.paymentIntents.create({
    amount, // CENTEN
    currency,
    payment_method_types: ["card_present"],
    metadata: { orderId: String(orderId || "") },
  });

  res.json({ id: pi.id, client_secret: pi.client_secret });
}
