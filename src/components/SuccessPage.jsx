// SuccessPage.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../assets/css/SuccessPage.css";
import Success from "./Success";

const SuccessPage = () => {
  const [status, setStatus] = useState("loading");
  const [order, setOrder] = useState(null);
  const [pushed, setPushed] = useState(false);
  const navigate = useNavigate();
  const paymentId = localStorage.getItem("paymentId");
  const cart = JSON.parse(localStorage.getItem("cart"));
  const paymentData = JSON.parse(localStorage.getItem("paymentData"));

  useEffect(() => {
    if (!paymentId) {
      return;
    }

    const checkPayment = async () => {
      try {
        const res = await fetch(`/api/payment-status?paymentId=${paymentId}`);
        const data = await res.json();
        setStatus(data.status);

        if (data.status === "paid") {
          // Build order object
          const orderObj = {
            id: Date.now().toString(),
            paymentId: paymentId,
            items: cart
              .map((i) => `${i.quantity}x ${i.product.name}`)
              .join(", "),
            total: cart.reduce(
              (sum, i) => sum + i.product.price * i.quantity,
              0
            ),
            pickupTime: paymentData.formData.pickupTime,
            orderedTime: new Date().toISOString(),
            customerName: paymentData.formData.name,
            customerNotes: paymentData.formData.notes,
            status: "new",
          };

          setOrder(orderObj);

          localStorage.removeItem("cart");
          localStorage.removeItem("paymentId");
          localStorage.removeItem("paymentData");
        }
      } catch (err) {
        console.error(err);
        navigate("/"); // fallback if API fails
      }
    };

    checkPayment();
  }, [navigate]);

  useEffect(() => {
    if (!order || pushed) return;
    const pushOrder = async () => {
      try {
        const res = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: order.id,
            paymentId: order.paymentId,
            items: order.items,
            total: order.total,
            pickupTime: order.pickupTime,
            orderedTime: order.orderedTime,
            customerName: order.customerName,
            customerNotes: order.customerNotes,
            status: order.status,
          }),
        });

        const result = await res.json();
        if (result.status === "ok") {
          console.log("✅ Order successfully pushed to Database!");
          setPushed(true);
        } else {
          console.error("❌ Failed to push order:", result);
        }
      } catch (err) {
        console.error("❌ Failed to push order:", err);
      }
    };

    pushOrder();
  }, [order, pushed]);

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
        // return <p>⏳ Laden…</p>;
        return <Success order={order}/>
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
