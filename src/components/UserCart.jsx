// UserCart.jsx
import React from "react";
import "../assets/css/UserCart.css";
import { useNavigate } from "react-router-dom";
import { useCart } from "../contexts/CartContext";

const UserCart = ({ isOpen }) => {
  const navigate = useNavigate();
  const { cart, removePizza, changeQuantity, totalAmount } = useCart();

  if (cart.length === 0) return null;

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
                onClick={() =>
                  pizza.quantity <= 1
                    ? removePizza(pizza.product)
                    : changeQuantity(pizza.product, -1)
                }
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
          onClick={() => navigate("/payment")}
          disabled={!isOpen}
        >
          {isOpen ? "Verder naar betalen" : "Vandaag gesloten"}
        </button>
      </div>
    </aside>
  );
};

export default UserCart;
