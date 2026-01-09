let lastPaymentStatus = "open";

export default async function handler(req, res) {
  try {
    const { id } = req.body;

    const mollieRes = await fetch(`https://api.mollie.com/v2/payments/${id}`, {
      headers: {
        Authorization: `Bearer ${process.env.MOLLIE_API_KEY}`,
      },
    });

    const payment = await mollieRes.json();
    console.log("Webhook payment:", payment.status);

    lastPaymentStatus = payment.status;

    res.status(200).send("OK");
  } catch (err) {
    console.error(err);
    res.status(500).send("error");
  }
}

export function getLastPaymentStatus() {
  return lastPaymentStatus;
}
