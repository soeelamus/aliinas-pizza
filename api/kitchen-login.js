export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { pin } = req.body;

  const realPin = process.env.KITCHEN_PIN;

  if (!realPin) {
    return res.status(500).json({ error: "Server PIN not set" });
  }

  if (pin === realPin) {
    return res.status(200).json({ success: true });
  } else {
    return res.status(401).json({ success: false });
  }
}
