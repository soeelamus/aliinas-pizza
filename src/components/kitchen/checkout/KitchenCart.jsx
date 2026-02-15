// KitchenCart.jsx
import React, { useState } from "react";
import CashCheckout from "./CashCheckout";
import CardCheckout from "./CardCheckout";
import PayconiqCheckout from "./PayconiqCheckout";

export default function KitchenCart({ total, cart }) {
  const [showCashPopup, setShowCashPopup] = useState(false);
  const [showCardPopup, setShowCardPopup] = useState(false);
  const [showPayconiqPopup, setShowPayconiqPopup] = useState(false);

  return (
    <div className="checkout--box">
        <div className="box--1">
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
        </div>
        <button
          className="checkout-button btn-purple"
          onClick={() => setShowPayconiqPopup(true)}
        >
          Payconiq
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

      {showPayconiqPopup && (
        <PayconiqCheckout
          total={total}
          cart={cart}
          onClose={() => setShowPayconiqPopup(false)}
        />
      )}
    </div>
  );
}
