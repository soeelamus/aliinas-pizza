// CashCheckout.jsx
import React, { useState } from "react";
import "./../../assets/css/CashCheckout.css";

export default function CashCheckout({ total, onClose, onConfirm }) {
  const [received, setReceived] = useState(total);
  const [change, setChange] = useState(0);

  // Bereken terug te geven bedrag
  const calculateChange = (given) => {
    const c = given - total;
    setChange(c > 0 ? c : 0);
    setReceived(given);
  };

  // Sneltoetsen
  const handleExact = () => calculateChange(total);
  const handleRound = () => calculateChange(Math.ceil(total));
  const handle20 = () => calculateChange(20);
  const handle50 = () => calculateChange(50);

  const handleInputChange = (e) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val)) calculateChange(val);
  };

  const handleConfirm = () => {
    onConfirm({
      received,
      change,
    });

    onClose();
  };
  return (
    <div className="cash-popup-overlay">
      <div className="cash-popup">
        <h2>Cash Checkout</h2>
        <p>Te betalen: €{total.toFixed(2)}</p>

        <div className="quick-buttons">
          <button className="btn-purple" onClick={handleExact}>
            Gepast
          </button>
          <button className="btn-purple" onClick={handleRound}>
            Afronden
          </button>
          <button className="btn-purple" onClick={handle20}>
            €20
          </button>
          <button className="btn-purple" onClick={handle50}>
            €50
          </button>
        </div>

        <div className="calculator">
          <label>
            Ontvangen bedrag: €
            <input
              type="number"
              value={received}
              onChange={handleInputChange}
              min={total}
              step="0.01"
            />
          </label>
          <p>Teruggave: €{change.toFixed(2)}</p>
        </div>
        <div className="checkout-buttons">
          <button className="btn-purple" onClick={handleConfirm}>
            Bevestig
          </button>
          <button className="btn-purple" onClick={onClose}>
            Annuleer
          </button>
        </div>
      </div>
    </div>
  );
}
