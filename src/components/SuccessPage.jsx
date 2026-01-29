// SuccessPage.jsx
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "../assets/css/SuccessPage.css";
import Success from "./SuccessCard";

const SuccessPage = () => {
  const [status, setStatus] = useState("loading");
  const [order, setOrder] = useState(null);
  const [pushed, setPushed] = useState(false);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // 👉 Stripe session id uit URL
  const sessionId = searchParams.get("session_id");

  const cart = JSON.parse(localStorage.getItem("cart") || "[]");
  const paymentData = JSON.parse(localStorage.getItem("paymentData") || "{}");

  console.log("2. paymentData: ", paymentData);

  // 🔹 parse items string naar array
  const parseOrderItems = (itemsStr) => {
    return itemsStr
      .split(",")
      .map((item) => {
        const match = item.trim().match(/^(\d+)x\s+(.+)$/);
        if (!match) return null;
        return {
          quantity: parseInt(match[1], 10),
          name: match[2].trim(),
        };
      })
      .filter(Boolean);
  };

  // 🔹 push stock update
  const pushStock = async (orderItems, currentStock) => {
    if (!orderItems || orderItems.length === 0) return;

    const grouped = [];

    orderItems.forEach((item) => {
      let stockItem = currentStock.find((s) => s.name === item.name);

      if (!stockItem) {
        stockItem = currentStock[0];
        console.warn(
          `Item "${item.name}" niet gevonden, fallback naar "${stockItem.name}"`,
        );
      }

      const existing = grouped.find((g) => g.id === stockItem.id);

      if (existing) {
        existing.stock -= item.quantity;
      } else {
        grouped.push({
          id: stockItem.id,
          stock: stockItem.stock - item.quantity,
        });
      }
    });

    const updateData = grouped.map((g) => ({
      id: g.id,
      stock: Math.max(0, g.stock),
    }));

    try {
      await fetch("/api/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });
    } catch (err) {
      console.error("❌ Stock update failed:", err);
    }
  };

  // 🔹 check Stripe payment
  useEffect(() => {
    if (!sessionId) return;

    const checkPayment = async () => {
      try {
        const res = await fetch(`/api/payment?sessionId=${sessionId}`);
        const data = await res.json();

        setStatus(data.status); // paid / unpaid

        if (data.status === "paid") {
          const orderObj = {
            id: Date.now().toString(),
            sessionId,

            items: cart
              .map((i) => `${i.quantity}x ${i.product.name}`)
              .join(", "),

            total: cart.reduce(
              (sum, i) => sum + i.product.price * i.quantity,
              0,
            ),

            pickupTime: paymentData.formData?.pickupTime || "",
            orderedTime: new Date().toISOString(),
            customerName: paymentData.formData?.name || "",
            customerNotes: paymentData.formData?.notes || "",
            status: "new",
          };

          setOrder(orderObj);
        }
      } catch (err) {
        console.error(err);
        navigate("/");
      }
    };

    checkPayment();
  }, [sessionId]);

  // 🔹 push order & stock
  useEffect(() => {
    if (!order || pushed) return;

    const pushOrderAndStock = async () => {
      try {
        // push order
        const res = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(order),
        });

        const result = await res.json();

        if (result.status !== "ok") return;

        // fetch stock
        const stockRes = await fetch("/api/stock");
        const stockData = await stockRes.json();

        // parse
        const parsedItems = parseOrderItems(order.items);

        // update
        await pushStock(parsedItems, stockData);

        setPushed(true);
      } catch (err) {
        console.error("❌ Push failed:", err);
      }
    };

    pushOrderAndStock();
  }, [order, pushed]);

  console.log("3. Order: ", order);
  
  // 🔹 UI
  const renderContent = () => {
    switch (status) {
      case "paid":
        return <Success order={order} />;

      case "unpaid":
        return (
          <>
            <h2>❌ Betaling niet voltooid</h2>
            <p>Je betaling is niet afgerond.</p>
          </>
        );

      case "canceled":
        return (
          <>
            <h2>❌ Betaling geannuleerd</h2>
            <p>Je bestelling is niet betaald.</p>
          </>
        );

      default:
        return <p>⏳ Betaling controleren…</p>;
    }
  };

  return (
    <div className="success-page-body">
      <div className="success-page style-2">
        <div className="success-card">
          {renderContent()}

          <button
            className="btn-purple"
            onClick={() => {
              // clear storage
              localStorage.removeItem("cart");
              localStorage.removeItem("paymentData");
              navigate("/");
              window.location.reload();
            }}
          >
            Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuccessPage;
