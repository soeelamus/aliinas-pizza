import React from "react";
import "../assets/css/UserCart.css";
import { useNavigate, useLocation } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import KitchenCart from "./kitchen/KitchenCart";

const UserCart = ({ isOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cart, removeItem, changeQuantity, totalAmount, getStock } = useCart();
  const isKitchen = location.pathname.startsWith("/kitchen");

  if (cart.length === 0) return null;

  const handleCheckout = () => {
    navigate(isKitchen ?? "/payment");
  };

  return (
    <aside className="cart">
      <ul>
        {cart.map((cartItem) => {
          const stock = getStock(cartItem.product, cart);

          return (
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
                {/* Verlaag quantity */}
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

                {/* Verhoog quantity, disabled als stock bereikt */}
                <button
                  className="btn-purple btn-small"
                  onClick={() => changeQuantity(cartItem.product, 1)}
                  disabled={stock <= 0}
                  title={stock <= 0 ? "Uitverkocht" : "Aantal verhogen"}
                >
                  +
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="checkout-section">
        <div className="checkout-total">
          <p className="total">Totaal: €{totalAmount()}</p>
        </div>

        {isKitchen ? (
          <KitchenCart total={totalAmount()} cart={cart}/>
        ) : (
          <button
            className="checkout-button btn-purple"
            onClick={handleCheckout}
            disabled={!isOpen}
          >
            {isOpen ? "Bestellen" : "Vandaag gesloten"}
          </button>
        )}
      </div>
    </aside>
  );
};

export default UserCart;
