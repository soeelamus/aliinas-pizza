import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import "./../../assets/css/CashCheckout.css"; // hergebruik overlay styling
import Loading from "../Loading/Loading";

import { StripeTerminal, TerminalEventsEnum } from "@capacitor-community/stripe-terminal";
import { startTerminalPayment, cancelCurrentTerminalAction } from "../../payments/terminal";
import { finalizeOrder } from "../../utils/finalizeOrder";
import { useCart } from "../../contexts/CartContext";

function prettyStatus(s) {
  // status strings komen uit plugin (READY / WAITING_FOR_INPUT / PROCESSING / etc.)
  if (!s) return "";
  return String(s).replaceAll("_", " ").toLowerCase();
}

export default function CardCheckout({ total, cart, onClose }) {
  const { clearCart, refreshStock } = useCart();

  const [phase, setPhase] = useState("starting"); 
  // starting | waiting_card | processing | success | canceled | error

  const [paymentStatus, setPaymentStatus] = useState("");
  const [displayMsg, setDisplayMsg] = useState("");
  const [readerInputMsg, setReaderInputMsg] = useState("");
  const [err, setErr] = useState(null);
  const [paymentIntentId, setPaymentIntentId] = useState(null);

  const orderId = useMemo(() => {
    // stabiel per overlay
    return (crypto?.randomUUID?.() || `order_${Date.now()}`);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const subs = [];

    async function attachListeners() {
      // Payment status updates
      subs.push(
        await StripeTerminal.addListener(TerminalEventsEnum.PaymentStatusChange, ({ status }) => {
          setPaymentStatus(status);
          // “waiting card” heuristiek
          const s = String(status || "");
          if (s.includes("WAIT") || s.includes("INPUT")) setPhase("waiting_card");
          if (s.includes("PROCESS")) setPhase("processing");
        })
      );

      // Reader display messages (tap/insert/swipe)
      subs.push(
        await StripeTerminal.addListener(TerminalEventsEnum.RequestDisplayMessage, ({ message }) => {
          setDisplayMsg(message || "");
        })
      );

      subs.push(
        await StripeTerminal.addListener(TerminalEventsEnum.RequestReaderInput, ({ message }) => {
          setReaderInputMsg(message || "");
          setPhase("waiting_card");
        })
      );

      // Errors
      subs.push(
        await StripeTerminal.addListener(TerminalEventsEnum.Failed, (info) => {
          // Dit event kan ook komen bij cancel/decline
          setErr(info?.message || "Payment failed");
          setPhase("error");
        })
      );

      // Confirm success event
      subs.push(
        await StripeTerminal.addListener(TerminalEventsEnum.ConfirmedPaymentIntent, () => {
          setPhase("success");
        })
      );

      // Canceled event (als cancelCollectPaymentMethod lukt)
      subs.push(
        await StripeTerminal.addListener(TerminalEventsEnum.Canceled, () => {
          setPhase("canceled");
        })
      );
    }

    async function runPayment() {
      try {
        setPhase("starting");
        setErr(null);

        await attachListeners();

        // Start payment immediately
        const res = await startTerminalPayment({ totalEur: total, orderId });
        if (cancelled) return;

        setPaymentIntentId(res?.paymentIntentId || null);
        setPhase("success");

        // Order opslaan (Google Sheets etc.)
        await finalizeOrder({
          cart,
          total,
          paymentMethod: "card",
          customerName: "Cashier",
          paymentIntentId: res?.paymentIntentId,
          orderId,
        });

        await refreshStock();
        clearCart();

        // kleine “done” pauze (optioneel)
        setTimeout(() => {
          if (!cancelled) onClose?.();
        }, 700);
      } catch (e) {
        if (cancelled) return;
        const msg = e?.message || String(e);

        // Stripe Terminal cancel kan er zo uitzien; we tonen als canceled
        if (msg.toLowerCase().includes("canceled") || msg.toLowerCase().includes("cancelled")) {
          setPhase("canceled");
        } else {
          setErr(msg);
          setPhase("error");
        }
      }
    }

    runPayment();

    return () => {
      cancelled = true;
      // remove listeners
      (async () => {
        for (const s of subs) {
          try { await s.remove(); } catch {}
        }
      })();
    };
  }, [total, cart, orderId, onClose, clearCart, refreshStock]);

  const title =
    phase === "success" ? "Betaald ✅" :
    phase === "canceled" ? "Geannuleerd" :
    phase === "error" ? "Mislukt" :
    "Kaartbetaling";

  const hint =
    readerInputMsg ||
    displayMsg ||
    (phase === "starting" ? "Terminal voorbereiden…" :
     phase === "waiting_card" ? "Laat klant tap/insert/swipe." :
     phase === "processing" ? "Verwerken…" :
     phase === "success" ? "Betaling bevestigd." :
     phase === "canceled" ? "Betaling geannuleerd." :
     phase === "error" ? "Er ging iets mis." : "");

  const canCancel =
    phase === "starting" || phase === "waiting_card" || phase === "processing";

  const cancel = async () => {
    try {
      await cancelCurrentTerminalAction();
      setPhase("canceled");
    } catch (e) {
      setErr(e?.message || String(e));
      setPhase("error");
    }
  };

  return createPortal(
    <div className="cash-popup-overlay">
      {/* Loading overlay alleen in actieve phases */}
      {(phase === "starting" || phase === "waiting_card" || phase === "processing") && (
        <div className="cash-loading-overlay">
          <Loading innerHTML={"Kaartbetaling bezig…"} />
        </div>
      )}

      <div className="cash-popup">
        <h3 style={{ marginTop: 0 }}>{title}</h3>

        <p>
          Te betalen: <strong className="amount">€{Number(total).toFixed(2)}</strong>
        </p>

        {paymentStatus && (
          <p className="amount-text">
            Status: <strong className="amount">{prettyStatus(paymentStatus)}</strong>
          </p>
        )}

        {hint && (
          <p className="amount-text" style={{ opacity: 0.9 }}>
            {hint}
          </p>
        )}

        {paymentIntentId && (
          <p className="amount-text" style={{ fontSize: 12, opacity: 0.7 }}>
            PI: {paymentIntentId}
          </p>
        )}

        {err && (
          <div style={{ color: "red", marginTop: 10, whiteSpace: "pre-wrap" }}>
            {err}
          </div>
        )}

        <div className="checkout-buttons" style={{ marginTop: 14 }}>
          {/* Geen start-knop. Alleen cancel/close. */}
          {canCancel ? (
            <button className="btn-purple" onClick={cancel}>
              Cancel
            </button>
          ) : (
            <button className="btn-purple" onClick={onClose}>
              Close
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
