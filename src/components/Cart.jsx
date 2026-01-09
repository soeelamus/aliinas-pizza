import React, { useState } from "react";
import UserCart from "./UserCart";
import { FaShoppingCart } from "react-icons/fa";

const Cart = ({ cart, removePizzaFromCart, changeQuantity, totalAmount, isOpen }) => {
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Geen cart-items? Toon niets
  if (!cart || cart.length === 0) return null;

  const toggleCart = () => setIsCartOpen((prev) => !prev);

  return (
       <div className="btn-cta"> 
        {cart?.length > 0 && (
          <button className="btn-purple btn-cart" onClick={toggleCart}>
            <FaShoppingCart />
            <span className="cart-count">{cart.length}</span>
          </button>
        )}

        {/* UserCart tonen als isCartOpen true */}
        {isCartOpen && cart.length > 0 && (
          <UserCart
            cart={cart}
            removePizzaFromCart={removePizzaFromCart}
            changeQuantity={changeQuantity}
            totalAmount={totalAmount}
            isOpen={isOpen}
          />
        )}
        </div>
  );
};

export default Cart;
