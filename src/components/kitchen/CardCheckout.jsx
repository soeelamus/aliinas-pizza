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

  useEffect(() => {
    const subs = [];

    (async () => {
      subs.push(
        await StripeTerminal.addListener(
          TerminalEventsEnum.PaymentStatusChange,
          ({ status }) => {
            setPaymentStatus(status);
            const s = String(status || "");
            if (s.includes("WAIT") || s.includes("INPUT"))
              setPhase("waiting_card");
            if (s.includes("PROCESS")) setPhase("processing");
          },
        ),
      );

      subs.push(
        await StripeTerminal.addListener(
          TerminalEventsEnum.RequestDisplayMessage,
          ({ message }) => {
            setDisplayMsg(message || "");
          },
        ),
      );

      subs.push(
        await StripeTerminal.addListener(
          TerminalEventsEnum.RequestReaderInput,
          ({ message }) => {
            setReaderInputMsg(message || "");
            setPhase("waiting_card");
          },
        ),
      );

      subs.push(
        await StripeTerminal.addListener(TerminalEventsEnum.Canceled, () => {
          stoppedRef.current = true; // <-- voorkomt herstart
          setPhase("canceled");
        }),
      );

      subs.push(
        await StripeTerminal.addListener(TerminalEventsEnum.Failed, (info) => {
          // Als user cancelled op terminal, komt dit soms als Failed of Canceled
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
        }),
      );

      subs.push(
        await StripeTerminal.addListener(
          TerminalEventsEnum.ConfirmedPaymentIntent,
          () => {
            setPhase("success");
          },
        ),
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

  // 2) start payment: één keer per overlay
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
        setPhase("success");

        await finalizeOrder({
          cart: cartSnapshotRef.current,
          total,
          paymentMethod: "card",
          customerName: "Cashier",
          paymentIntentId: res?.paymentIntentId,
          orderId,
        });

        await refreshStock();
        clearCart();

        setTimeout(() => {
          if (!cancelled) onClose?.();
        }, 700);
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
  }, []);

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
          <Loading innerHTML={"Kaartbetaling bezig…"} />
        )}
        <p className="largest-font">€{Number(total).toFixed(2)}</p>

        {paymentStatus && (
          <p className="large-font">Status: {prettyStatus(paymentStatus)}</p>
        )}

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
    document.body,
  );
}
