// KitchenCart.jsx
import React, { useState } from "react";
import CashCheckout from "./CashCheckout";
import CardCheckout from "./CardCheckout";

export default function KitchenCart({ total, cart }) {
  const [showCashPopup, setShowCashPopup] = useState(false);
  const [showCardPopup, setShowCardPopup] = useState(false);

  return (
    <div className="checkout-buttons">
      <button
        className="checkout-button btn-purple"
        onClick={() => setShowCashPopup(true)}
      >
        Cash
      </button>

      <button
        className="checkout-button btn-purple"
        onClick={() => setShowCardPopup(true)}
      >
        Card
      </button>

      {showCashPopup && (
        <CashCheckout
          total={total}
          onClose={() => setShowCashPopup(false)}
          onConfirm={(data) => console.log("Order bevestigd!", data)}
        />
      )}

      {showCardPopup && (
        <CardCheckout
          total={total}
          cart={cart}
          onClose={() => setShowCardPopup(false)}
        />
      )}
    </div>
  );
}
