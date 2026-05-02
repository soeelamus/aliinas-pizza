import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import "./SuccessPage.css";
import Success from "../../SuccessCard";
import Loading from "../../Loading/Loading";

import { finalizeOrder } from "../../../utils/finalizeOrder";

/* -------------------
   Helper: string → cart
-------------------- */
const itemsStringToCart = (itemsString) => {
  if (!itemsString) return [];

  return itemsString
    .split(",")
    .map((item) => {
      const match = item.trim().match(/^(\d+)x\s+(.+)$/);
      if (!match) return null;

      return {
        quantity: parseInt(match[1], 10),
        product: {
          name: match[2].trim(),
        },
      };
    })
    .filter(Boolean);
};

const SuccessPage = () => {
  const [status, setStatus] = useState("loading");
  const [order, setOrder] = useState(null);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const sessionId = searchParams.get("session_id");

  /* -------------------
     1️⃣ Check payment
  -------------------- */
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
            pickupTime: data.pickupTime || "ASAP",
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

  /* -------------------
     2️⃣ Finalize order (via centrale functie)
  -------------------- */
  useEffect(() => {
    if (!order) return;
    if (status !== "paid") return;

    const pushedKey = `pushed_${sessionId}`;
    const mailKey = `mail_${sessionId}`;

    const run = async () => {
      try {
        const cart = itemsStringToCart(order.items);

        // 🔹 Order enkel 1x
        if (!localStorage.getItem(pushedKey)) {
          await finalizeOrder({
            cart,
            total: order.total,
            paymentMethod: "online",
            customerName: order.customerName,
            customerEmail: order.customerEmail,
            pickupTime: order.pickupTime,
            sessionId: order.sessionId
          });

          localStorage.setItem(pushedKey, "1");
          console.log("✅ Order verwerkt");
        }

      } catch (err) {
        console.error("❌ finalizeOrder failed:", err);
      }
    };

    run();
  }, [order, status, sessionId]);

  /* -------------------
     UI rendering
  -------------------- */
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
