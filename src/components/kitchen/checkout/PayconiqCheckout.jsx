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

  const confirmPaid = async () => {
    setErr(null);
    setLoading(true);

    try {
      await finalizeOrder({
        cart,
        total,
        paymentMethod: "payconiq",
        customerName: "Cashier",
        orderId,
      });

      await refreshStock();
      clearCart();

      onClose?.();
    } catch (e) {
      setErr(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="checkout-popup-overlay">
      <div className="checkout-popup">
        {loading && <Loading innerHTML={"Bestelling verwerken"} margin="5" />}
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
            onClick={confirmPaid}
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
