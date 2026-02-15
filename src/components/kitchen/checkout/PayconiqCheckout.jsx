PayconiqCheckout.jsx;
import React, { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import "./../../../assets/css/checkout.css";
import Loading from "../../Loading/Loading";
import { finalizeOrder } from "../../../utils/finalizeOrder";
import { useCart } from "../../../contexts/CartContext";

const STATIC_QR_SRC = "/images/logo.png";

export default function PayconiqCheckout({ total, cart, onClose }) {
  const { clearCart, refreshStock } = useCart();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const orderId = useMemo(() => crypto.randomUUID(), []);

  const handleConfirm = async () => {
    setErr(null);
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      onClose();
      clearCart();
    }, 1000);

    try {
      await finalizeOrder({
        cart,
        total,
        paymentMethod: "payconiq",
        customerName: "Cashier",
        orderId,
      });

      await refreshStock();
    } catch (err) {
      console.error(err);
      alert("Order opslaan mislukt");
    }
  };

  return createPortal(
    <div className="checkout-popup-overlay">
      {loading && (
        <div className="checkout-loading-overlay">
          <Loading innerHTML={"Bestelling wordt verwerkt"} />
        </div>
      )}
      <div className="checkout-popup">
        <p>
          Te betalen: <strong className="amount">€{total.toFixed(2)}</strong>
        </p>
        <p>Scan de QR-code</p>
        <div>
          <img className="payconiq--qr" src={STATIC_QR_SRC} alt="Payconiq QR" />
        </div>
        {err && <p className="error-message margin-5">{err}</p>}

        <div className="checkout-buttons">
          <button className="btn-purple" onClick={onClose} disabled={loading}>
            X
          </button>

          <button
            className="btn-purple checkout-button unset"
            onClick={handleConfirm}
            disabled={loading}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
