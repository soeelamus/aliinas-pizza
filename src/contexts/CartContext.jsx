import { createContext, useContext, useEffect, useState } from "react";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
const [cart, setCart] = useState(() => {
  const saved = localStorage.getItem("cart");
  if (!saved) return [];
  try {
    return JSON.parse(saved).map(item => ({
      ...item,
      product: { ...item.product, id: String(item.product.id) }
    }));
  } catch {
    return [];
  }
});

useEffect(() => {
  localStorage.setItem("cart", JSON.stringify(cart));
}, [cart]);

  // 🔹 Algemeen: voeg elk product toe, ongeacht categorie
const addItem = (product) => {
  setCart((prev) => {
    const existing = prev.find(p => String(p.product.id) === String(product.id));
    if (existing) {
      return prev.map(p =>
        String(p.product.id) === String(product.id)
          ? { ...p, quantity: p.quantity + 1 }
          : p
      );
    }
    return [...prev, { product, quantity: 1 }];
  });
};

const removeItem = (product) =>
  setCart(prev => prev.filter(p => String(p.product.id) !== String(product.id)));

const changeQuantity = (product, amount) =>
  setCart(prev =>
    prev.map(p =>
      String(p.product.id) === String(product.id)
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
        addItem,
        removeItem,
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
