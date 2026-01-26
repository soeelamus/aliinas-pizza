// KitchenCart.jsx
import React, { useState } from "react";
import CashCheckout from "./CashCheckout";
import CardCheckout from "./CardCheckout";

export default function KitchenCart({ total, cart }) {
  const [showCashPopup, setShowCashPopup] = useState(false);
  const [showCardPopup, setShowCardPopup] = useState(false);

  const handleCashCheckout = () => {
    setShowCashPopup(true);
  };

  const handleCardCheckout = () => {
    setShowCardPopup(true);
  };

  const handleCloseCash = () => setShowCashPopup(false);
  const handleCloseCard = () => setShowCardPopup(false);

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

      {/* Cash popup */}
      {showCashPopup && (
        <CashCheckout
          total={total}
          onClose={handleCloseCash}
          onConfirm={(data) => {
            console.log("Order bevestigd!", data);
          }}
        />
      )}

      {/* Card popup */}
      {showCardPopup && (
        <CardCheckout total={total} cart={cart} onClose={handleCloseCard} />
      )}
    </div>
  );
}
