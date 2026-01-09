// SuccessPage.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../assets/css/SuccessPage.css";

const SuccessPage = () => {
  const [status, setStatus] = useState("loading");
  const [order, setOrder] = useState(null);
  const [pushed, setPushed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const paymentId = localStorage.getItem("paymentId");
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");

    if (!paymentId) {
      return;
    }

    const checkPayment = async () => {
      try {
        const res = await fetch(`/api/payment-status?paymentId=${paymentId}`);
        const data = await res.json();
        setStatus(data.status);

        let selectedPickupTime = 1700;
        let customerName = "Loes";

        if (data.status === "paid") {
          // Build order object
          const orderObj = {
            id: Date.now().toString(),
            paymentId: paymentId,
            items: cart.map(i => `${i.quantity}x ${i.product.name}`),
            total: cart.reduce((sum, i) => sum + i.product.price * i.quantity, 0),
            pickupTime: selectedPickupTime,
            orderedTime: new Date().toISOString(),
            customerName: customerName,
          };

          setOrder(orderObj);

          // Clear localStorage
          localStorage.removeItem("cart");
          localStorage.removeItem("paymentId");
        }
      } catch (err) {
        console.error(err);
        navigate("/"); // fallback if API fails
      }
    };

    checkPayment();
  }, [navigate]);

  // Push order to Google Sheets via Vercel API
  useEffect(() => {
    if (!order || pushed) return;
    console.log('order: ', order);
    console.log('id: ', order.id);
    console.log('paymentId: ', order.paymentId);
    console.log('items: ', order.items);
    console.log('total: ', order.total);
    console.log('pickupTime: ', order.pickupTime);
    console.log('customerName: ', order.customerName);
    
    const pushOrder = async () => {
      try {
        const res = await fetch("/api/push-order", {
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
        return (
          <>
            <h2>🍕 Bedankt voor je bestelling!</h2>
            <p>
              Je betaling is succesvol ontvangen.
              <br />
            </p>
            {!pushed && <p>⏳ Je bestelling wordt geaccepteerd…</p>}
            {pushed && <p>De pizza's worden klaargemaakt!</p> }
          </>
        );
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
    <div className="success-page main style-2">
      <div className="success-card">
        {renderContent()}
        <button className="btn-purple" onClick={() => navigate("/")}>
          Home
        </button>
      </div>
    </div>
  );
};

export default SuccessPage;
