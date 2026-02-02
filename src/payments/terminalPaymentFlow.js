import { StripeTerminal, TerminalEventsEnum } from "@capacitor-community/stripe-terminal";
import { connectReaderOnce } from "./terminal";
import { TerminalConnectTypes } from "@capacitor-community/stripe-terminal";
console.log("TerminalConnectTypes =", TerminalConnectTypes);

const API_BASE = import.meta.env.VITE_API_BASE_URL;

function once(eventName) {
  return new Promise(async (resolve) => {
    const handle = await StripeTerminal.addListener(eventName, async (payload) => {
      try { await handle.remove(); } catch {}
      resolve(payload);
    });
  });
}

export async function takeCardPayment({ totalEur, orderId }) {
  await connectReaderOnce();

  // 1) create PI
  const amount = Math.round(Number(totalEur) * 100);
  const r = await fetch(`${API_BASE}/api/terminal/payment_intent`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount, currency: "eur", orderId }),
  });
  if (!r.ok) throw new Error(await r.text());
  const { client_secret, id } = await r.json();

  // 2) setup one-shot listeners before starting
  const confirmedP = once(TerminalEventsEnum.ConfirmedPaymentIntent);
  const failedP = once(TerminalEventsEnum.Failed);

  // 3) collect + confirm
  await StripeTerminal.collectPaymentMethod({ paymentIntent: client_secret });
  await StripeTerminal.confirmPaymentIntent();

  // 4) race success/fail
  const outcome = await Promise.race([
    confirmedP.then(() => ({ ok: true })),
    failedP.then((info) => ({ ok: false, info })),
  ]);

  if (!outcome.ok) {
    const msg = outcome.info?.message || "Payment failed";
    const code = outcome.info?.code ? ` (${outcome.info.code})` : "";
    throw new Error(msg + code);
  }

  return { paymentIntentId: id };
}
