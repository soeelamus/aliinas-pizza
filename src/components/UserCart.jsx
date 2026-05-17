import React from "react";
import "../assets/css/UserCart.css";
import { useNavigate, useLocation } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import KitchenCart from "./kitchen/checkout/KitchenCart";

const UserCart = ({ isOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cart, removeItem, changeQuantity, totalAmount, getStock } = useCart();
  const isKitchen = location.pathname.startsWith("/kitchen");

  if (cart.length === 0) return null;

  const handleCheckout = () => {
    if (!isKitchen) {
      navigate("/payment");
    }
  };

  return (
    <aside className="cart">
      <ul>
        {cart.map((cartItem) => {
  const isMenu = cartItem.type === "menu";

  const stock = isMenu
    ? Math.min(
        getStock(cartItem.menu?.pizza, cart, { isKitchen }),
        getStock(cartItem.menu?.drink, cart, { isKitchen }),
        getStock(cartItem.menu?.dessert, cart, { isKitchen })
      )
    : getStock(cartItem.product, cart, { isKitchen });

  return (
    <li key={String(cartItem.product.id)} className="cart-item">
      <div className="item-info">
        <div className="item-details">

          {/* ===== DISPLAY ===== */}
          {isMenu ? (
            <div>
              <span className="quant">
                {cartItem.quantity}x {cartItem.product.name}
              </span>

              <p className="cart-subitems">
                {cartItem.menu?.drink?.name || "-"}
              </p>

              <p className="cart-subitems">
                {cartItem.menu?.dessert?.name || "-"}
              </p>
            </div>
          ) : (
            <span className="quant">
              {cartItem.quantity}x {cartItem.product.name}
            </span>
          )}

          <p>
            €{(cartItem.product.price * cartItem.quantity).toFixed(2)}
          </p>

        </div>
      </div>

      {/* ===== ACTIONS ===== */}
      <div className="item-actions">

        <button
          className="btn-purple btn-small"
          onClick={() =>
            cartItem.quantity <= 1
              ? removeItem(cartItem.product)
              : changeQuantity(cartItem.product, -1, { isKitchen: true })
          }
        >
          -
        </button>

        <button
          className="btn-purple btn-small"
          onClick={() =>
            changeQuantity(cartItem.product, 1, { isKitchen: true })
          }
          disabled={stock <= 0}
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
          <p className="total">Totaal: €{totalAmount().toFixed(2)}</p>
        </div>

        {isKitchen ? (
          <KitchenCart total={totalAmount()} cart={cart} />
        ) : (
          <button
            className="checkout-button btn-purple"
            onClick={handleCheckout}
            disabled={!isOpen}
          >
            {isOpen ? "Bestellen" : "Gesloten"}
          </button>
        )}
      </div>
    </aside>
  );
};

export default UserCart;
