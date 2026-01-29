import { createContext, useContext, useEffect, useState } from "react";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [stockSheetState, setStockSheetState] = useState([]);

  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem("cart");
      if (!saved) return [];

      const parsed = JSON.parse(saved);

      if (!parsed || !Array.isArray(parsed)) return [];

      return parsed
        .filter((item) => item && item.product)
        .map((item) => ({
          quantity: item.quantity || 0,
          product: {
            id: String(item.product.id ?? ""),
            name: item.product.name ?? "",
            price: item.product.price ?? 0,
            type: item.product.type ?? "",
            ingredients: Array.isArray(item.product.ingredients)
              ? item.product.ingredients
              : [],
            category: item.product.category ?? "",
          },
        }));
    } catch (e) {
      console.error("Failed to parse cart from localStorage:", e);
      return [];
    }
  });

  // Save cart in localStorage
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  // =========================
  // Refresh stock every 30s
  // =========================
  const refreshStock = async () => {
    try {
      const res = await fetch("/api/stock"); // API moet actuele DB stock geven
      if (!res.ok) throw new Error("Stock fetch failed");

      const data = await res.json();
      setStockSheetState(data);

      // Log deegballen alleen als voorraad veranderd
      const dough = data.find((item) => item.name.toLowerCase() === "deegballen");
      const doughStock = dough ? Number(dough.stock) : 0;

      if (doughStock !== lastDoughStock) {
        console.log("Refreshing stock... Deegballen:", doughStock);
        lastDoughStock = doughStock;
      }
    } catch (err) {
      console.error("Refresh stock error:", err);
    }
  };

  // houd laatste deegballen voorraad bij
  let lastDoughStock = null;

  useEffect(() => {
    // Eerst meteen laden
    refreshStock();

    // Interval elke 30 seconden
    const interval = setInterval(refreshStock, 30000);

    // Cleanup bij unmount
    return () => clearInterval(interval);
  }, []);

  // =========================
  // Stock helper
  // =========================
  const getStock = (product, currentCart = []) => {
    if (!stockSheetState.length) return 0;

    // Pizzas → deegballen
    if (!product.category || product.category === "") {
      const dough = stockSheetState.find((item) => item.name.toLowerCase() === "deegballen");
      const totalStock = dough ? Number(dough.stock) : 0;

      const pizzasInCart = currentCart
        .filter((p) => !p.product.category || p.product.category === "")
        .reduce((sum, p) => sum + p.quantity, 0);

      return Math.max(0, totalStock - pizzasInCart);
    }

    // Drinks / other items
    const itemStock = stockSheetState.find((s) => s.id === product.id)?.stock ?? 0;
    const quantityInCart = currentCart
      .filter((p) => p.product.id === product.id)
      .reduce((sum, p) => sum + p.quantity, 0);

    return Math.max(0, itemStock - quantityInCart);
  };

  // =========================
  // Cart actions
  // =========================
  const addItem = (product) => {
    setCart((prev) => {
      const remaining = getStock(product, prev);
      if (remaining <= 0) return prev;

      const existing = prev.find((p) => String(p.product.id) === String(product.id));
      if (existing) {
        return prev.map((p) =>
          String(p.product.id) === String(product.id)
            ? { ...p, quantity: p.quantity + 1 }
            : p
        );
      }

      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeItem = (product) =>
    setCart((prev) =>
      prev.filter((p) => String(p.product.id) !== String(product.id))
    );

  const changeQuantity = (product, amount) => {
    setCart((prev) => {
      return prev
        .map((p) => {
          if (String(p.product.id) !== String(product.id)) return p;

          const newQty = p.quantity + amount;
          const maxAllowed = p.quantity + getStock(p.product, prev);

          if (newQty <= 0) return null;
          if (newQty > maxAllowed) return { ...p, quantity: maxAllowed };

          return { ...p, quantity: newQty };
        })
        .filter(Boolean);
    });
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem("cart");
  };

  const totalAmount = () =>
    cart.reduce((sum, p) => sum + p.product.price * p.quantity, 0);

  // =========================
  // Provider
  // =========================
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
        stockSheetState,
        setStockSheetState,
        refreshStock,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
