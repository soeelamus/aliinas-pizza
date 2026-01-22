// KitchenCart.jsx
import React, { useState } from "react";
import CashCheckout from "./CashCheckout";

export default function KitchenCart({ total, cart }) {
  const [showCashPopup, setShowCashPopup] = useState(false);

  const handleCashCheckout = () => {
    setShowCashPopup(true);
  };

  const handleCardCheckout = () => {
    console.log("Card payment in kitchen!");
  };

  const handleClosePopup = () => setShowCashPopup(false);
  const handleConfirmCash = ({ received, change }) => {
    console.log(
      `Order bevestigd! Gekregen: €${received}, Teruggave: €${change}`,
    );
    // Hier kan je API call toevoegen
  };

  return (
    <div className="checkout-buttons">
      <button
        className="checkout-button btn-purple"
        onClick={handleCashCheckout}
      >
        Cash
      </button>
      <button
        className="checkout-button btn-purple"
        onClick={handleCardCheckout}
      >
        Card
      </button>

      {showCashPopup && (
        <CashCheckout
          total={total}
          onClose={handleClosePopup}
          onConfirm={handleConfirmCash}
        />
      )}
    </div>
  );
}
