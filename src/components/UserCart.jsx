// UserCart.jsx
import React from "react";
import "../assets/css/UserCart.css";

const UserCart = ({ cart = [], removePizzaFromCart, changeQuantity, totalAmount, isOpen }) => {
  if (cart.length === 0) return null;

  
  
const handleCheckout = async () => {
  if (!isOpen) return; // Safety: geen betaling als gesloten
  try {
    const res = await fetch("/api/create-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ total: totalAmount() }),
    });

    const data = await res.json();

    localStorage.setItem("paymentId", data.paymentId);

    window.location.href = data.checkoutUrl;
  } catch (error) {
    console.error("Checkout error:", error);
    alert("Betaling kon niet gestart worden.");
  }
};

  return (
    <aside className="cart">
      <ul>
        {cart.map((pizza) => (
          <li key={pizza.product.id} className="cart-item">
            <div className="item-info">
              <div className="item-details">
                <span className="quant">{pizza.quantity}x {pizza.product.name}</span>
                <p>€{pizza.product.price}</p>
              </div>
            </div>
            <div className="item-actions">
              <button
                className="btn-purple btn-small"
                onClick={() => pizza.quantity <= 1 ? removePizzaFromCart(pizza.product) : changeQuantity(pizza.product, -1)}
              >-</button>
              <button
                className="btn-purple btn-small"
                onClick={() => changeQuantity(pizza.product, 1)}
              >+</button>
            </div>
          </li>
        ))}
      </ul>

      <div className="checkout-section">
        <div className="checkout-total">
          <p className="total">Totaal: €{totalAmount()}</p>
        </div>
        <button
          className="checkout-button btn-purple"
          onClick={handleCheckout}
          disabled={!isOpen} // knop uitgeschakeld als gesloten
        >
          {isOpen ? "Bestel Take-out" : "Vandaag gesloten"} {/* dynamische tekst */}
        </button>
      </div>
    </aside>
  );
};

export default UserCart;
