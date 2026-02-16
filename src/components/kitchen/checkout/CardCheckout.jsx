// CardCheckout.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "./../../../assets/css/checkout.css";
import Loading from "../../Loading/Loading";

import {
  StripeTerminal,
  TerminalEventsEnum,
} from "@capacitor-community/stripe-terminal";
import {
  startTerminalPayment,
  cancelCurrentTerminalAction,
} from "../../../payments/terminal";
import { finalizeOrder } from "../../../utils/finalizeOrder";
import { useCart } from "../../../contexts/CartContext";

function prettyStatus(s) {
  if (!s) return "";
  return String(s).replaceAll("_", " ").toLowerCase();
}

export default function CardCheckout({ total, cart, onClose }) {
  const { clearCart, refreshStock } = useCart();

  const orderId = useMemo(() => crypto.randomUUID(), []);
  const cartSnapshotRef = useRef(cart);

  const startedRef = useRef(false);
  const stoppedRef = useRef(false); // gezet bij cancel / unmount
  const finalizedRef = useRef(false); // voorkomt dubbel pushen

  const [phase, setPhase] = useState("starting");
  // starting | waiting_card | processing | success | canceled | error
  const [paymentStatus, setPaymentStatus] = useState("");
  const [displayMsg, setDisplayMsg] = useState("");
  const [readerInputMsg, setReaderInputMsg] = useState("");
  const [err, setErr] = useState(null);
  const [paymentIntentId, setPaymentIntentId] = useState(null);

  // 1) Attach listeners enkel voor UI hints (niet voor “truth”)
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
          stoppedRef.current = true;
          setPhase("canceled");
        }),
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
        }),
      );

      subs.push(
        await StripeTerminal.addListener(
          TerminalEventsEnum.ConfirmedPaymentIntent,
          () => {
            // Dit is een sterke “success hint”, maar we finalizen pas als startTerminalPayment resolve't.
            setPhase("processing");
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

  // 2) Start payment EXACT 1x en finalize direct na succes
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    let cancelled = false;

    (async () => {
      try {
        setErr(null);
        setPhase("starting");

        const res = await startTerminalPayment({ totalEur: total, orderId });
        if (cancelled || stoppedRef.current) return;

        setPaymentIntentId(res?.paymentIntentId || null);
        setPhase("success");
        clearCart();
        onClose?.();

        // ✅ push order/stock in background (NIET await)
        if (!finalizedRef.current) {
          finalizedRef.current = true;

          (async () => {
            try {
              await finalizeOrder({
                cart: cartSnapshotRef.current,
                total,
                paymentMethod: "card",
                customerName: "Cashier",
                paymentIntentId: res?.paymentIntentId,
                orderId,
              });

              await refreshStock();
            } catch (e) {
              console.error("Finalize/push failed after payment:", e);
            }
          })();
        }
      } catch (e) {
        if (cancelled) return;

        const msg = e?.message || String(e);
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
      }
    })();

    return () => {
      cancelled = true;
      stoppedRef.current = true;
    };
  }, [total, orderId, clearCart, refreshStock, onClose]);

  const hint =
    readerInputMsg ||
    displayMsg ||
    (phase === "starting"
      ? "Terminal voorbereiden"
      : phase === "waiting_card"
        ? "Klant tap/insert"
        : phase === "processing"
          ? "Verwerken"
          : phase === "success"
            ? "Betaling bevestigd"
            : phase === "canceled"
              ? "Betaling geannuleerd"
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
          <Loading innerHTML={"Kaartbetaling bezig"} margin="5" />
        )}

        <p className="largest-font">€{Number(total).toFixed(2)}</p>

        {paymentStatus && (
          <p className="large-font">Status: {prettyStatus(paymentStatus)}</p>
        )}

        <p className="large-font">{hint}</p>

        {paymentIntentId && (
          <p className="large-font" style={{ opacity: 0.7, fontSize: 12 }}>
            PI: {paymentIntentId}
          </p>
        )}

        {err && <p className="large-font error-message margin-5">{err}</p>}

        <div className="checkout-buttons">
          {canCancel ? (
            <button className="btn-purple" onClick={cancel}>
              X
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
