import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "./../../assets/css/checkout.css";
import Loading from "../Loading/Loading";
import {
  StripeTerminal,
  TerminalEventsEnum,
} from "@capacitor-community/stripe-terminal";
import {
  startTerminalPayment,
  cancelCurrentTerminalAction,
} from "../../payments/terminal";
import { finalizeOrder } from "../../utils/finalizeOrder";
import { useCart } from "../../contexts/CartContext";

function prettyStatus(s) {
  if (!s) return "";
  return String(s).replaceAll("_", " ").toLowerCase();
}

export default function CardCheckout({ total, cart, onClose }) {
  const { clearCart, refreshStock } = useCart();

  const [phase, setPhase] = useState("starting"); // starting | waiting_card | processing | success | canceled | error
  const [paymentStatus, setPaymentStatus] = useState("");
  const [displayMsg, setDisplayMsg] = useState("");
  const [readerInputMsg, setReaderInputMsg] = useState("");
  const [err, setErr] = useState(null);
  const [paymentIntentId, setPaymentIntentId] = useState(null);

  const orderId = useMemo(() => crypto.randomUUID(), []);
  const cartSnapshotRef = useRef(cart);

  const startedRef = useRef(false);
  const stoppedRef = useRef(false);
  const finalizedRef = useRef(false); // <-- voorkomt dubbele finalize bij meerdere "paid" events

  useEffect(() => {
    const subs = [];

    (async () => {
      subs.push(
        await StripeTerminal.addListener(
          TerminalEventsEnum.PaymentStatusChange,
          ({ status }) => {
            setPaymentStatus(status);
            const s = String(status || "").toUpperCase();

            if (s.includes("WAIT") || s.includes("INPUT")) setPhase("waiting_card");
            if (s.includes("PROCESS")) setPhase("processing");
          }
        )
      );

      subs.push(
        await StripeTerminal.addListener(
          TerminalEventsEnum.RequestDisplayMessage,
          ({ message }) => {
            setDisplayMsg(message || "");
          }
        )
      );

      subs.push(
        await StripeTerminal.addListener(
          TerminalEventsEnum.RequestReaderInput,
          ({ message }) => {
            setReaderInputMsg(message || "");
            setPhase("waiting_card");
          }
        )
      );

      subs.push(
        await StripeTerminal.addListener(TerminalEventsEnum.Canceled, () => {
          stoppedRef.current = true;
          setPhase("canceled");
        })
      );

      subs.push(
        await StripeTerminal.addListener(TerminalEventsEnum.Failed, (info) => {
          const msg = info?.message || "Payment failed";

          if (
            msg.toLowerCase().includes("canceled") ||
            msg.toLowerCase().includes("cancelled")
          ) {
            stoppedRef.current = true;
            setPhase("canceled");
            return;
          }

          setErr(msg);
          setPhase("error");
        })
      );

      subs.push(
        await StripeTerminal.addListener(
          TerminalEventsEnum.ConfirmedPaymentIntent,
          () => {
            // NIET sluiten hier, enkel "paid" bepaalt sluiten
            setPhase("processing");
          }
        )
      );
    })();

    return () => {
      (async () => {
        for (const s of subs) {
          try {
            await s.remove();
          } catch {}
        }
      })();
    };
  }, []);

  // Start payment: één keer per overlay
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    let cancelled = false;

    (async () => {
      try {
        setPhase("starting");
        setErr(null);

        const res = await startTerminalPayment({ totalEur: total, orderId });
        if (cancelled || stoppedRef.current) return;

        setPaymentIntentId(res?.paymentIntentId || null);
        setPhase("waiting_card");
      } catch (e) {
        if (cancelled) return;

        const msg = e?.message || String(e);

        if (
          msg.toLowerCase().includes("canceled") ||
          msg.toLowerCase().includes("cancelled")
        ) {
          stoppedRef.current = true;
          setPhase("canceled");
        } else {
          setErr(msg);
          setPhase("error");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [total, orderId]);

  // Sluit popup ENKEL wanneer status = paid (en finalize ook pas dan)
  useEffect(() => {
    if (!paymentStatus) return;
    if (stoppedRef.current) return;

    const s = String(paymentStatus).toLowerCase();

    if (s === "paid") {
      if (finalizedRef.current) return;
      finalizedRef.current = true;

      (async () => {
        try {
          setPhase("success");

          await finalizeOrder({
            cart: cartSnapshotRef.current,
            total,
            paymentMethod: "card",
            customerName: "Cashier",
            paymentIntentId,
            orderId,
          });

          await refreshStock();
          clearCart();

          onClose?.(); // <-- ENKEL HIER
        } catch (e) {
          // Als finalize faalt, NIET sluiten
          finalizedRef.current = false;
          setErr(e?.message || String(e));
          setPhase("error");
        }
      })();
    }
  }, [paymentStatus, total, paymentIntentId, orderId, refreshStock, clearCart, onClose]);

  const hint =
    readerInputMsg ||
    displayMsg ||
    (phase === "starting"
      ? "Terminal voorbereiden…"
      : phase === "waiting_card"
        ? "Klant tap/insert."
        : phase === "processing"
          ? "Verwerken…"
          : phase === "success"
            ? "Betaling bevestigd."
            : phase === "canceled"
              ? "Betaling geannuleerd."
              : "Er ging iets mis.");

  const canCancel =
    phase === "starting" || phase === "waiting_card" || phase === "processing";

  const cancel = async () => {
    try {
      stoppedRef.current = true;
      await cancelCurrentTerminalAction();
      setPhase("canceled");
    } catch (e) {
      setErr(e?.message || String(e));
      setPhase("error");
    }
  };

  return createPortal(
    <div className="checkout-popup-overlay">
      <div className="checkout-popup">
        {(phase === "starting" ||
          phase === "waiting_card" ||
          phase === "processing") && (
          <Loading innerHTML={"Kaartbetaling bezig…"} margin="5" />
        )}

        <p className="largest-font">€{Number(total).toFixed(2)}</p>

        {paymentStatus && (
          <p className="large-font">Status: {prettyStatus(paymentStatus)}</p>
        )}

        <p className="large-font">{hint}</p>

        {err && <p className="large-font error-message margin-5">{err}</p>}

        <div className="checkout-buttons">
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
