// src/contexts/CartContext.jsx
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useEvents } from "../contexts/EventsContext";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [stockSheetState, setStockSheetState] = useState([]);
  const { isOpen } = useEvents();

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

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  // =========================
  // Stock fetch (API -> fallback)
  // =========================
  const lastDoughStock = useRef(null);
  const lastStockVersion = useRef(null);
  const lastFullFetchAt = useRef(0);
  const versionCheckDisabledUntil = useRef(0);

  const API_URL = "/api/stock";
  const VERSION_URL = "/api/stock-version";
  const LOCAL_URL = "/json/stock.json";

  const normalizeStockArray = (data) => {
    if (!Array.isArray(data)) return [];
    return data
      .filter((x) => x && (x.id !== undefined || x.name))
      .map((x) => ({
        id: String(x.id ?? x.name ?? ""),
        name: x.name ?? "",
        stock: Number(x.stock ?? 0),
        category: (x.category ?? "").toString().trim(),
        price: Number(x.price ?? x.Price ?? 0),
      }));
  };

  // ✅ Leest response als text, checkt content-type, parse JSON zelf
  const fetchJsonStrict = async (url) => {
    const res = await fetch(url, { cache: "no-store" });

    const ct = res.headers.get("content-type") || "";
    const text = await res.text();

    // Dev servers geven bij 404 soms index.html terug (text/html)
    if (!ct.includes("application/json")) {
      throw new Error(
        `[${url}] Expected JSON but got "${ct}". Snippet: ${text.slice(0, 80)}`,
      );
    }

    let json;
    try {
      json = JSON.parse(text);
    } catch (e) {
      throw new Error(`[${url}] Invalid JSON. Snippet: ${text.slice(0, 80)}`);
    }

    // Als jouw API { ok:false } terugstuurt
    if (json && typeof json === "object" && json.ok === false) {
      throw new Error(
        `[${url}] API returned ok:false: ${json.error || "unknown"}`,
      );
    }

    if (!res.ok) {
      throw new Error(`[${url}] HTTP ${res.status}`);
    }

    return json;
  };

  const fetchStockWithFallback = async () => {
    // 1) probeer API
    try {
      const apiData = await fetchJsonStrict(API_URL);
      return { source: "api", items: normalizeStockArray(apiData) };
    } catch (apiErr) {
      // 2) fallback naar local JSON (ook strict!)
      try {
        const localData = await fetchJsonStrict(LOCAL_URL);
        return { source: "local", items: normalizeStockArray(localData) };
      } catch (localErr) {
        // Geef beide fouten terug (heel nuttig in console)
        throw new Error(
          `Stock fetch failed.\nAPI error: ${apiErr.message}\nLOCAL error: ${localErr.message}`,
        );
      }
    }
  };

  const refreshStock = async () => {
    if (!isOpen) return;

    const nowMs = Date.now();

    // ✅ throttle full fetch: max 1x per 20s (pas aan indien nodig)
    const MIN_FETCH_INTERVAL_MS = 20_000;
    if (nowMs - lastFullFetchAt.current < MIN_FETCH_INTERVAL_MS) {
      return;
    }

    try {
      // 1) version check (optioneel) — met cooldown als endpoint stuk is
      if (nowMs >= versionCheckDisabledUntil.current) {
        try {
          const vRes = await fetchJsonStrict(VERSION_URL);
          const version = String(vRes?.version ?? "");

          if (version && version === lastStockVersion.current) {
            console.log(
              "📦 Stock unchanged → skip full fetch (version:",
              version,
              ")",
            );
            return;
          }

          console.log(
            "📦 Stock changed",
            lastStockVersion.current,
            "→",
            version,
          );
          lastStockVersion.current = version;
        } catch (e) {
          console.warn(
            "⚠️ Stock version check failed → disabling version-check 60s:",
            e.message,
          );
          // ✅ 60s geen version-check meer proberen (voorkomt spam loop)
          versionCheckDisabledUntil.current = nowMs + 60_000;
        }
      }

      // 2) full stock fetch (throttled)
      lastFullFetchAt.current = nowMs;

      const { source, items } = await fetchStockWithFallback();
      console.log(`📦 Full stock fetch (${source}) → items:`, items.length);

      setStockSheetState(items);

      const dough = items.find(
        (item) => (item.name || "").toLowerCase() === "deegballen",
      );
      const doughStock = dough ? Number(dough.stock) : 0;

      if (doughStock !== lastDoughStock.current) {
        console.log("🍕 Deegballen stock changed:", doughStock);
        lastDoughStock.current = doughStock;
      }
    } catch (err) {
      console.error("❌ Refresh stock error:", err.message || err);
    }
  };

  // =========================
  // Stock helper
  // =========================
  const DOUGH_RESERVE_ONLINE = 10;

  /**
   * getStock(product, currentCart, { isKitchen })
   * - Pizza's (category leeg) gebruiken deegballen stock
   * - Online reserveert 10 deegballen (dus online max = stock - 10)
   * - Kitchen gebruikt volledige stock (geen reserve)
   */
  const getStock = (product, currentCart = [], { isKitchen = false } = {}) => {
    if (!stockSheetState.length) return 0;

    const isPizza = !product.category || product.category === "";

    if (isPizza) {
      const dough = stockSheetState.find(
        (item) => (item.name || "").toLowerCase() === "deegballen",
      );
      const totalStock = dough ? Number(dough.stock) : 0;

      // ✅ reserve enkel online
      const effectiveStock = isKitchen
        ? totalStock
        : Math.max(0, totalStock - DOUGH_RESERVE_ONLINE);

      const pizzasInCart = currentCart
        .filter((p) => !p.product.category || p.product.category === "")
        .reduce((sum, p) => sum + p.quantity, 0);

      return Math.max(0, effectiveStock - pizzasInCart);
    }

    // Niet-pizza items: normale stock per item id
    const itemStock =
      stockSheetState.find((s) => String(s.id) === String(product.id))?.stock ??
      0;

    const quantityInCart = currentCart
      .filter((p) => String(p.product.id) === String(product.id))
      .reduce((sum, p) => sum + p.quantity, 0);

    return Math.max(0, Number(itemStock) - quantityInCart);
  };

  // =========================
  // Cart actions
  // =========================
  // Default isKitchen=false (online). Kitchen kan optioneel true meegeven.
  const addItem = (product, { isKitchen = false } = {}) => {
    setCart((prev) => {
      const remaining = getStock(product, prev, { isKitchen });
      if (remaining <= 0) return prev;

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

  const changeQuantity = (product, amount, { isKitchen = false } = {}) => {
    setCart((prev) => {
      return prev
        .map((p) => {
          if (String(p.product.id) !== String(product.id)) return p;

          const newQty = p.quantity + amount;
          const maxAllowed =
            p.quantity + getStock(p.product, prev, { isKitchen });

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

  return (
    <CartContext.Provider
      value={{
        cart,
        addItem, // addItem(product, { isKitchen:true })
        removeItem,
        changeQuantity, // changeQuantity(product, +1/-1, { isKitchen:true })
        clearCart,
        totalAmount,
        getStock, // getStock(product, cart, { isKitchen:true })
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
