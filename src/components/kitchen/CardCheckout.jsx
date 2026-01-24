// CardCheckout.jsx
import React, { useState } from "react";
import { createPortal } from "react-dom";
import { useCart } from "../../contexts/CartContext";
import { finalizeOrder } from "../../utils/finalizeOrder";

export default function CardCheckout({ total, cart, onClose }) {
  const [loading, setLoading] = useState(false);
  const { clearCart, setCart } = useCart();

  const handlePaymentSuccess = async () => {
  try {
    await finalizeOrder({
      cart,
      total,
      paymentMethod: "card",
      customerName: "Card",
    });

    clearCart();
    if (setCart) setCart([]);

    onClose();

  } catch (err) {
    console.error(err);
    alert("Afronden mislukt");
  }
};


  // ✅ Start betaling
  const handleCardCheckout = async () => {
    try {
      setLoading(true);

      // 1️⃣ PaymentIntent
      const res1 = await fetch("/api/terminal/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: total }),
      });

      const data1 = await res1.json();

      // 2️⃣ Reader starten
      await fetch("/api/terminal/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intentId: data1.intentId,
        }),
      });

      // 3️⃣ Poll status
      pollPaymentStatus(data1.intentId);

    } catch (err) {
      console.error(err);
      alert("Betaling mislukt");
      setLoading(false);
    }
  };

  // ✅ Status check
  const pollPaymentStatus = (intentId) => {
    const interval = setInterval(async () => {
      const res = await fetch(
        `/api/terminal/status?intentId=${intentId}`,
      );

      const data = await res.json();

      if (data.status === "succeeded") {
        clearInterval(interval);
        setLoading(false);

        handlePaymentSuccess();
      }

      if (
        data.status === "canceled" ||
        data.status === "failed"
      ) {
        clearInterval(interval);
        setLoading(false);

        alert("Betaling geannuleerd");
      }
    }, 2000);
  };

  return createPortal(
    <div className="cash-popup-overlay">
      <div className="cash-popup">

        <h3>Kaartbetaling</h3>

        <p>
          Te betalen: <strong>€{total.toFixed(2)}</strong>
        </p>

        {loading ? (
          <p>⏳ Betaling bezig…</p>
        ) : (
          <>
            <button
              className="btn-purple"
              onClick={handleCardCheckout}
            >
              Start betaling
            </button>

            <button
              className="btn-purple"
              onClick={onClose}
            >
              Annuleren
            </button>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
