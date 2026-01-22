import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../assets/css/SuccessPage.css";
import Success from "./SuccessCard";

const SuccessPage = () => {
  const [status, setStatus] = useState("loading");
  const [order, setOrder] = useState(null);
  const [pushed, setPushed] = useState(false);
  const navigate = useNavigate();

  const paymentId = localStorage.getItem("paymentId");
  const cart = JSON.parse(localStorage.getItem("cart") || "[]");
  const paymentData = JSON.parse(localStorage.getItem("paymentData") || "{}");

  // 🔹 parse items string naar array { name, quantity }
  const parseOrderItems = (itemsStr) => {
    return itemsStr
      .split(",")
      .map((item) => {
        const match = item.trim().match(/^(\d+)x\s+(.+)$/);
        if (!match) return null;
        return { quantity: parseInt(match[1], 10), name: match[2].trim() };
      })
      .filter(Boolean);
  };

  // 🔹 push stock update (batch)
  const pushStock = async (orderItems, currentStock) => {
    if (!orderItems || orderItems.length === 0) return;

    // Map alle items naar stock update
    const updateData = orderItems.map((item) => {
      let stockItem = currentStock.find((s) => s.name === item.name);

      // fallback: eerste rij (Deegballen)
      if (!stockItem) {
        stockItem = currentStock[0];
        console.warn(
          `Item "${item.name}" niet gevonden in stock, aftrekken van "${stockItem.name}"`,
        );
      }

      return {
        id: stockItem.id,
        stock: Math.max(0, stockItem.stock - item.quantity),
      };
    });

    console.log("Stock update payload:", updateData);

    try {
      const res = await fetch("/api/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      const text = await res.text(); // Apps Script geeft plain text
      console.log("Stock API response:", text);
    } catch (err) {
      console.error("❌ Failed to push stock:", err);
    }
  };

  // 🔹 check payment status
  useEffect(() => {
    if (!paymentId) return;

    const checkPayment = async () => {
      try {
        const res = await fetch(`/api/payment?paymentId=${paymentId}`);
        const data = await res.json();
        setStatus(data.status);

        if (data.status === "paid") {
          // Build order object
          const orderObj = {
            id: Date.now().toString(),
            paymentId,
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

          // clear local storage
          localStorage.removeItem("cart");
          localStorage.removeItem("paymentId");
          localStorage.removeItem("paymentData");
        }
      } catch (err) {
        console.error(err);
        navigate("/"); // fallback
      }
    };

    checkPayment();
  }, [navigate, paymentId, cart, paymentData]);

  // 🔹 push order & stock
  useEffect(() => {
    if (!order || pushed) return;

    const pushOrderAndStock = async () => {
      try {
        // 1️⃣ push order
        const res = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(order),
        });

        const result = await res.json();

        if (result.status !== "ok") {
          console.error("❌ Failed to push order:", result);
          return;
        }

        console.log("✅ Order pushed:", result);

        // 2️⃣ fetch current stock
        const stockRes = await fetch("/api/stock");
        const stockData = await stockRes.json(); // [{ id, name, stock }]

        // 3️⃣ parse order items
        const parsedItems = parseOrderItems(order.items);

        // 4️⃣ batch update stock
        await pushStock(parsedItems, stockData);

        setPushed(true);
        console.log("✅ Order pushed & stock updated!");
      } catch (err) {
        console.error("❌ Failed to push order or update stock:", err);
      }
    };

    pushOrderAndStock();
  }, [order, pushed]);

  // 🔹 render content based on payment status
  const renderContent = () => {
    switch (status) {
      case "paid":
        return <Success order={order} />;
      case "canceled":
        return (
          <>
            <h2>❌ Betaling geannuleerd</h2>
            <p>
              Je bestelling is niet betaald.
              <br />
              Probeer opnieuw of neem contact op.
            </p>
          </>
        );
      case "failed":
        return (
          <>
            <h2>⚠️ Betaling mislukt</h2>
            <p>
              Er is iets misgegaan met de betaling.
              <br />
              Probeer opnieuw of neem contact op.
            </p>
          </>
        );
      case "open":
        return <p>⏳ Betaling wordt verwerkt…</p>;
      default:
        return <p>⏳ Laden…</p>;
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
