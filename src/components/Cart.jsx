// Cart.jsx
import React, { useState } from "react";
import UserCart from "./UserCart";
import { FaShoppingCart } from "react-icons/fa";
import { useCart } from "../contexts/CartContext";

const Cart = ({ isOpen }) => {
  const { cart } = useCart();
  const [isCartOpen, setIsCartOpen] = useState(false);

  if (!cart || cart.length === 0) return null;

  const toggleCart = () => setIsCartOpen(prev => !prev);

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="btn-cta">
      <button className="btn-purple btn-cart" onClick={toggleCart}>
        <FaShoppingCart />
        <span className="cart-count">{totalItems}</span>
      </button>

      {isCartOpen && <UserCart isOpen={isOpen} />}
    </div>
  );
};

export default Cart;
