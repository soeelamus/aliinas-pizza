// CashCheckout.jsx
import React, { useState } from "react";
import { createPortal } from "react-dom";
import { useCart } from "../../contexts/CartContext";
import "./../../assets/css/CashCheckout.css";

export default function CashCheckout({ total, onClose, onConfirm }) {
  const { cart, clearCart, setCart } = useCart();
  const [received, setReceived] = useState(0);
  const [change, setChange] = useState(0);
  const [history, setHistory] = useState([]);

  const euros = [1, 2, 5, 10, 20, 50, 100, 200];
  const coins = [0.05, 0.1, 0.2, 0.5];
  const round2 = (num) => Math.round(num * 100) / 100;

  // Voeg bedrag toe + history
  const addAmount = (amount) => {
    const newTotal = round2(received + amount);
    setReceived(newTotal);
    setChange(round2(newTotal - total > 0 ? newTotal - total : 0));

    // History bijhouden
    setHistory([...history, amount]);
  };

  // Undo laatste klik
  const handleUndo = () => {
    if (history.length === 0) return;

    const last = history[history.length - 1];
    const newReceived = Number((received - last).toFixed(2));
    setReceived(newReceived);
    setChange(
      newReceived - total > 0 ? Number((newReceived - total).toFixed(2)) : 0,
    );

    setHistory(history.slice(0, -1));
  };

  // Reset
  const handleClear = () => {
    setReceived(0);
    setChange(0);
    setHistory([]);
  };

  // Bevestig
  const handleConfirm = async () => {
    if (received < total) return;

    // Zorg dat cart een array is
    const safeCart = Array.isArray(cart) ? cart : [];

    const orderItemsStr = safeCart
      .map((i) => `${i.quantity}x ${i.product.name}`)
      .join(", ");

    const orderObj = {
      id: Date.now().toString(),
      paymentId: "cash",
      items: orderItemsStr,
      total,
      received,
      pickupTime: "ASAP",
      orderedTime: new Date().toISOString(),
      customerName: "Cashier",
      status: "new",
    };

    try {
      // 1️⃣ Push order
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderObj),
      });
      if (!res.ok) throw new Error("Failed to push order");
      const result = await res.json();
      console.log("✅ Order pushed:", result);

      // 2️⃣ Fetch current stock
      const stockRes = await fetch("/api/stock");
      if (!stockRes.ok) throw new Error("Failed to fetch stock");
      const stockData = await stockRes.json(); // [{ id, name, stock }]

      // 3️⃣ Map cart naar stock update en stapel fallback-items
      const parsedItems = safeCart.reduce((acc, item) => {
        const itemName = item?.product?.name || "Onbekend";
        let stockItem = stockData.find((s) => s.name === itemName);

        if (!stockItem) {
          // fallback naar eerste rij (Deegballen)
          stockItem = stockData[0];
          console.warn(
            `Item "${itemName}" niet gevonden in stock, aftrekken van "${stockItem.name}"`,
          );
        }

        // Check of deze stockItem al in acc zit
        const existing = acc.find((a) => a.id === stockItem.id);
        if (existing) {
          existing.stock = Math.max(0, existing.stock - item.quantity);
        } else {
          acc.push({
            id: stockItem.id,
            stock: Math.max(0, stockItem.stock - item.quantity),
          });
        }

        return acc;
      }, []);

      // 4️⃣ Push stock update
      await fetch("/api/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsedItems),
      });

      console.log("✅ Stock updated:", parsedItems);

      // 5️⃣ Clear local cart
      localStorage.removeItem("cart");
      if (setCart) setCart([]);

      // 6️⃣ Close popup
      clearCart();
      onConfirm({ received, change });
      onClose();
    } catch (err) {
      console.error("❌ Error in handleConfirm:", err);
    }
  };

  return createPortal(
    <div className="cash-popup-overlay">
      <div className="cash-popup">
        <p>
          Te betalen: <strong className="amount">€{total.toFixed(2)}</strong>
        </p>
        <div className="amounts">
          <p className="amount-text">
            Ontvangen:{" "}
            <strong className="amount">€{received.toFixed(2)}</strong>
          </p>
          <p className="amount-text">
            {received >= total ? (
              <>
                Terug: <strong className="amount">€{change.toFixed(2)}</strong>
              </>
            ) : (
              <>
                Nog:{" "}
                <strong className="amount red">
                  €{(total - received).toFixed(2)}
                </strong>
              </>
            )}
          </p>
        </div>

        <div className="quick-buttons">
          {coins.map((coin) => (
            <button
              key={coin}
              className="btn-purple"
              onClick={() => addAmount(coin)}
            >
              €{coin.toFixed(2)}
            </button>
          ))}
          {euros.map((bill) => (
            <button
              key={bill}
              className="btn-purple"
              onClick={() => addAmount(bill)}
            >
              €{bill}
            </button>
          ))}
        </div>

        {/* Geschiedenis */}
        {history.length > 0 && (
          <div className="margin-2">
            <h4 className="unset">Geschiedenis</h4>
            <div className="history">
              <ul className="history-list">
                {history.map((amt, idx) => (
                  <li key={idx}>+ €{amt.toFixed(2)}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Acties */}
        <div className="checkout-buttons">
          <button className="btn-purple" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-purple btn-small-5"
            onClick={handleClear}
            disabled={history.length === 0}
          >
            Reset
          </button>
          <button
            className="btn-purple btn-small-5"
            onClick={handleUndo}
            disabled={history.length === 0}
          >
            Undo
          </button>

          <button
            className="btn-purple checkout-button unset"
            disabled={received < total}
            onClick={handleConfirm}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
