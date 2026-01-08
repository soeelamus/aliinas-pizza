import React from "react";
import "../assets/css/UserCart.css";

const UserCart = ({
  cart = [],
  removePizzaFromCart,
  changeQuantity,
  totalAmount,
}) => {
  if (cart.length === 0) return null;

const handleCheckout = async () => {
  try {
    const res = await fetch("/api/create-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ total: totalAmount() }),
    });

    const data = await res.json();
    console.log("Checkout URL:", data.checkoutUrl);

    // Redirect naar Mollie checkout
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
                <span className="quant">
                  {pizza.quantity}x {pizza.product.name}
                </span>
                <p>€{pizza.product.price}</p>
              </div>
            </div>

            <div className="item-actions">
              <button
                className="btn-purple btn-small"
                onClick={() => {
                  if (pizza.quantity <= 1) {
                    removePizzaFromCart(pizza.product);
                  } else {
                    changeQuantity(pizza.product, -1);
                  }
                }}
              >
                -
              </button>
              <button
                className="btn-purple btn-small"
                onClick={() => changeQuantity(pizza.product, 1)}
              >
                +
              </button>
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
        >
          Bestel Take-out
        </button>
      </div>
    </aside>
  );
};

export default UserCart;
