import { getLastPaymentStatus } from "./mollie-webhook";

export default function handler(req, res) {
  res.json({ status: getLastPaymentStatus() });
}
