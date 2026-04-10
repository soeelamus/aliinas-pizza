import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import "./SuccessPage.css";
import Success from "../../SuccessCard";
import Loading from "../../Loading/Loading";

const SuccessPage = () => {
  const [status, setStatus] = useState("loading");
  const [order, setOrder] = useState(null);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const sessionId = searchParams.get("session_id");

  const parseOrderItems = (itemsStr) => {
    if (!itemsStr) return [];

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

  const pushStock = async (orderItems, currentStock) => {
    if (!orderItems || orderItems.length === 0) return;

    const grouped = [];

    orderItems.forEach((item) => {
      let stockItem = currentStock.find((s) => s.name === item.name);

      if (!stockItem) stockItem = currentStock[0];

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
      const res = await fetch("/api/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      if (!res.ok) throw new Error("Stock update failed");
    } catch (err) {
      console.error("❌ Stock update failed:", err);
    }
  };

  // Stripe payment check
  useEffect(() => {
    if (!sessionId) return;

    (async () => {
      try {
        const res = await fetch(`/api/payment?sessionId=${sessionId}`);

        if (!res.ok) throw new Error("Payment check failed");

        const data = await res.json();

        setStatus(data.status);

        if (data.status === "paid") {
          setOrder({
            id: sessionId,
            sessionId,
            items: data.itemsString || "",
            total: Number(data.total || 0),
            pickupTime: data.pickupTime || "",
            orderedTime: new Date().toISOString(),
            customerName: data.customerName || "",
            customerEmail: data.customerEmail || "",
            customerNotes: data.customerNotes || "",
            status: "new",
          });
        } else {
          setOrder(null);
        }
      } catch (err) {
        console.error(err);
        navigate("/");
      }
    })();
  }, [sessionId, navigate]);

  // Push order + stock (met retry)
  useEffect(() => {
    if (!order) return;
    if (status !== "paid") return;

    if (!order.items) return;
    if (!order.customerEmail) return;

    const pushedKey = `pushed_${sessionId}`;
    if (localStorage.getItem(pushedKey)) return;

    const pushOrderAndStock = async (retry = 0) => {
      try {
        const res = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(order),
        });

        if (!res.ok) throw new Error("Order API error");

        const result = await res.json();

        if (result.status !== "ok" && result.status !== "already_exists") {
          throw new Error("Order push failed");
        }

        const stockRes = await fetch("/api/stock");
        if (!stockRes.ok) throw new Error("Stock fetch failed");

        const stockData = await stockRes.json();

        const parsedItems = parseOrderItems(order.items);

        await pushStock(parsedItems, stockData);

        localStorage.setItem(pushedKey, "1");

        console.log("✅ Order pushed");
      } catch (err) {
        if (retry < 3) {
          console.log("Retry order push...", retry + 1);

          setTimeout(() => {
            pushOrderAndStock(retry + 1);
          }, 1500);
        } else {
          console.error("❌ Order definitief mislukt:", err);
        }
      }
    };

    pushOrderAndStock();
  }, [order, status, sessionId]);

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
        return <Loading innerHTML={"Bestelling controleren"} />;
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
              localStorage.removeItem("cart");
              localStorage.removeItem("paymentData");

              if (sessionId) {
                localStorage.removeItem(`pushed_${sessionId}`);
                localStorage.removeItem(`mail_${sessionId}`);
              }

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