import React from "react";
import "../assets/css/UserCart.css"; // optioneel voor styling

const UserCart = ({ cart = [], removePizzaFromCart, changeQuantity, totalAmount }) => {
  // Alleen tonen als er items in de cart zitten
  if (cart.length === 0) return null;

  return (
    <aside className="cart">
      <h2>My Cart</h2>
      <ul>
        {cart.map((item) => (
          <li key={item.product.id} className="cart-item">
            <div className="item-info">
              <div className="item-details">
                <h3>{item.product.name}</h3>
                <p>€{item.product.price}</p>
              </div>
            </div>

            <div className="item-actions">
              <div className="quantity">
                <button onClick={() => changeQuantity(item.product, 1)}>+</button>
                <p className="quant">{item.quantity}</p>
                <button
                  onClick={() => {
                    // Als quantity 1 is en je op - klikt → verwijderen
                    if (item.quantity <= 1) {
                      removePizzaFromCart(item.product);
                    } else {
                      changeQuantity(item.product, -1);
                    }
                  }}
                >
                  -
                </button>
              </div>

              <button
                className="remove-button"
                onClick={() => removePizzaFromCart(item.product)}
              >
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>

      <div className="checkout-section">
        <div className="checkout-total">
          <p className="total">Totaal: €{totalAmount()}</p>
        </div>
        <button className="checkout-button">Proceed to Payment</button>
      </div>
    </aside>
  );
};

export default UserCart;
