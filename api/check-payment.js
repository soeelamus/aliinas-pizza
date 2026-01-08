export default async function handler(req, res) {
  const { paymentId } = req.query;

  if (!paymentId) {
    return res.status(400).json({ error: "No paymentId provided" });
  }

  try {
    const paymentRes = await fetch(`https://api.mollie.com/v2/payments/${paymentId}`, {
      headers: {
        Authorization: `Bearer ${process.env.MOLLIE_API_KEY}`,
      },
    });

    const payment = await paymentRes.json();
    console.log("Mollie payment:", payment);

    res.status(200).json({ status: payment.status });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "error" });
  }
}
