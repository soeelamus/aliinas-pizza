// UserCart.jsx
import React from "react";
import "../assets/css/UserCart.css";
import { useNavigate } from "react-router-dom";
import { useCart } from "../contexts/CartContext";

const UserCart = ({ isOpen }) => {
  const navigate = useNavigate();
  const { cart, removeItem, changeQuantity, totalAmount } = useCart();

  if (cart.length === 0) return null;

  return (
    <aside className="cart">
      <ul>
        {cart.map((cartItem) => (
          <li key={String(cartItem.product.id)} className="cart-item">
            <div className="item-info">
              <div className="item-details">
                <span className="quant">
                  {cartItem.quantity}x {cartItem.product.name}
                </span>
                <p>€{cartItem.product.price}</p>
              </div>
            </div>

            <div className="item-actions">
              <button
                className="btn-purple btn-small"
                onClick={() =>
                  cartItem.quantity <= 1
                    ? removeItem(cartItem.product)
                    : changeQuantity(cartItem.product, -1)
                }
              >
                -
              </button>

              <button
                className="btn-purple btn-small"
                onClick={() => changeQuantity(cartItem.product, 1)}
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
          {isOpen ? "Bestellen" : "Vandaag gesloten"}
        </button>
      </div>
    </aside>
  );
};

export default UserCart;
