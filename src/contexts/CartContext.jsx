// CartContext.jsx
import { createContext, useContext, useEffect, useState } from "react";

const CartContext = createContext();

export const CartProvider = ({ children, stockSheet = [] }) => {
  const [stockSheetState, setStockSheetState] = useState(stockSheet);
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem("cart");
    if (!saved) return [];
    try {
      return JSON.parse(saved).map((item) => ({
        ...item,
        product: { ...item.product, id: String(item.product.id) },
      }));
    } catch {
      return [];
    }
  });
  console.log(cart);

  useEffect(() => {
    setStockSheetState(stockSheet);
  }, [stockSheet]);

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  // Helper om stock te checken
  const getStock = (product, currentCart = []) => {
    if (!stockSheetState.length) return Infinity; // <-- gebruik stockSheetState

    // Pizzas follow 'deegballen'
    if (!product.category || product.category === "") {
      const dough = stockSheetState.find(
        (item) => item.name.toLowerCase() === "deegballen",
      );
      const totalStock = dough ? Number(dough.stock) : 0;

      const pizzasInCart = currentCart
        .filter((p) => !p.product.category || p.product.category === "")
        .reduce((sum, p) => sum + p.quantity, 0);

      return Math.max(0, totalStock - pizzasInCart);
    }

    // Drinks / other items
    const itemStock =
      stockSheetState.find((s) => s.id === product.id)?.stock ?? 0;
    const quantityInCart = currentCart
      .filter((p) => p.product.id === product.id)
      .reduce((sum, p) => sum + p.quantity, 0);

    return Math.max(0, itemStock - quantityInCart);
  };
  // Voeg item toe rekening houdend met stock
  const addItem = (product) => {
    setCart((prev) => {
      const remaining = getStock(product, prev); // remaining stock
      if (remaining <= 0) return prev; // cannot add more

      const existing = prev.find(
        (p) => String(p.product.id) === String(product.id),
      );

      if (existing) {
        return prev.map((p) =>
          String(p.product.id) === String(product.id)
            ? { ...p, quantity: p.quantity + 1 }
            : p,
        );
      }

      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeItem = (product) =>
    setCart((prev) =>
      prev.filter((p) => String(p.product.id) !== String(product.id)),
    );

  const changeQuantity = (product, amount) => {
    setCart((prev) => {
      return prev
        .map((p) => {
          if (String(p.product.id) !== String(product.id)) return p;

          const newQty = p.quantity + amount;
          const maxAllowed = p.quantity + getStock(p.product, prev);

          if (newQty <= 0) return null; // ❗ verwijderen
          if (newQty > maxAllowed) return { ...p, quantity: maxAllowed };

          return { ...p, quantity: newQty };
        })
        .filter(Boolean); // ❗ verwijder nulls
    });
  };

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
        totalAmount,
        getStock,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
