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

  useEffect(() => {
    if (status !== "paid") return;

    const timer = setTimeout(() => {
      localStorage.removeItem("cart");
      localStorage.removeItem("paymentData");
    }, 5000);

    return () => clearTimeout(timer);
  }, [status]);

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
