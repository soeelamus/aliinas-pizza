// CashCheckout.jsx
import React, { useState } from "react";
import { createPortal } from "react-dom";
import { useCart } from "../../contexts/CartContext";
import { finalizeOrder } from "../../utils/finalizeOrder";
import "./../../assets/css/CashCheckout.css";
import Loading from "../Loading/Loading";

export default function CashCheckout({ total, onClose, onConfirm }) {
  const { cart, clearCart, setCart, refreshStock } = useCart();
  const [received, setReceived] = useState(0);
  const [change, setChange] = useState(0);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const euros = [1, 2, 5, 10, 20, 50, 100, 200];
  const coins = [0.05, 0.1, 0.2, 0.5];
  const round2 = (num) => Math.round(num * 100) / 100;

  // Voeg bedrag toe + history
  const addAmount = (amount) => {
    const newTotal = round2(received + amount);
    setReceived(newTotal);
    setChange(round2(newTotal - total > 0 ? newTotal - total : 0));

    // History bijhouden
    setHistory([...history, amount]);
  };

  // Undo laatste klik
  const handleUndo = () => {
    if (history.length === 0) return;

    const last = history[history.length - 1];
    const newReceived = Number((received - last).toFixed(2));
    setReceived(newReceived);
    setChange(
      newReceived - total > 0 ? Number((newReceived - total).toFixed(2)) : 0,
    );

    setHistory(history.slice(0, -1));
  };

  // Reset
  const handleClear = () => {
    setReceived(0);
    setChange(0);
    setHistory([]);
  };

  // Bevestig
  const handleConfirm = async () => {
    if (received < total) return;
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
        paymentMethod: "cash",
        customerName: "Cashier",
      });

      await refreshStock();

      onConfirm({ received, change });
    } catch (err) {
      console.error(err);
      alert("Order opslaan mislukt");
    }
  };

  return createPortal(
    <div className="cash-popup-overlay">
      {loading && (
        <div className="cash-loading-overlay">
          <Loading innerHTML={"Bestelling wordt verwerkt"} />
        </div>
      )}
      <div className="cash-popup">
        <p>
          Te betalen: <strong className="amount">€{total.toFixed(2)}</strong>
        </p>
        <div className="amounts">
          <p className="amount-text">
            Ontvangen:{" "}
            <strong className="amount">€{received.toFixed(2)}</strong>
          </p>
          <p className="amount-text">
            {received >= total ? (
              <>
                Terug: <strong className="amount">€{change.toFixed(2)}</strong>
              </>
            ) : (
              <>
                Nog:{" "}
                <strong className="amount red">
                  €{(total - received).toFixed(2)}
                </strong>
              </>
            )}
          </p>
        </div>

        <div className="quick-buttons">
          {coins.map((coin) => (
            <button
              key={coin}
              className="btn-purple"
              onClick={() => addAmount(coin)}
            >
              €{coin.toFixed(2)}
            </button>
          ))}
          {euros.map((bill) => (
            <button
              key={bill}
              className="btn-purple"
              onClick={() => addAmount(bill)}
            >
              €{bill}
            </button>
          ))}
        </div>

        {/* Geschiedenis */}
        <div className="margin-2">
          <h4 className="unset">Geschiedenis</h4>
          <div className="history">
            {history.length <= 0 ? (
              <ul className="history-list">
                <li>-</li>
              </ul>
            ) : (
              <ul className="history-list">
                {history.map((amt, idx) => (
                  <li key={idx}>+ €{amt.toFixed(2)}</li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Acties */}
        <div className="checkout-buttons">
          <button className="btn-purple" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-purple btn-small-5"
            onClick={handleClear}
            disabled={history.length === 0}
          >
            Res
          </button>
          <button
            className="btn-purple btn-small-5"
            onClick={handleUndo}
            disabled={history.length === 0}
          >
            Un
          </button>

          <button
            className="btn-purple checkout-button unset"
            disabled={received < total}
            onClick={handleConfirm}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
