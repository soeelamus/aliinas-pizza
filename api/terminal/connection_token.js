import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY_TEST);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const token = await stripe.terminal.connectionTokens.create();
  res.json({ secret: token.secret });
}
