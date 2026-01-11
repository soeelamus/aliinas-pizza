import { createContext, useContext, useEffect, useState } from "react";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem("cart");
    return saved ? JSON.parse(saved) : [];
  });

  // 🔥 Elke wijziging opslaan
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  const addPizza = (product) => {
    setCart((prev) => {
      const existing = prev.find(p => p.product.id === product.id);
      if (existing) {
        return prev.map(p =>
          p.product.id === product.id
            ? { ...p, quantity: p.quantity + 1 }
            : p
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const removePizza = (product) =>
    setCart(prev => prev.filter(p => p.product.id !== product.id));

  const changeQuantity = (product, amount) =>
    setCart(prev =>
      prev.map(p =>
        p.product.id === product.id
          ? { ...p, quantity: Math.max(1, p.quantity + amount) }
          : p
      )
    );

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem("cart");
  };

  const totalAmount = () =>
    cart.reduce((sum, p) => sum + p.product.price * p.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addPizza,
        removePizza,
        changeQuantity,
        clearCart,
        totalAmount
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
