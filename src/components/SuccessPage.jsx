import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../assets/css/SuccessPage.css";

const SuccessPage = () => {
  const [status, setStatus] = useState("loading");
  const navigate = useNavigate();

  useEffect(() => {
    const paymentId = sessionStorage.getItem("paymentId");
    if (!paymentId) return navigate("/");

    const checkPayment = async () => {
      try {
        const res = await fetch(`/api/payment-status?paymentId=${paymentId}`);
        const data = await res.json();

        setStatus(data.status);

        if (data.status === "paid") {
          localStorage.removeItem("cart");
          sessionStorage.removeItem("paymentId");
        }

      } catch (err) {
        console.error(err);
        navigate("/");
      }
    };

    checkPayment();
  }, [navigate]);

  const renderContent = () => {
    switch (status) {
      case "paid":
        return (
          <>
            <h1>🍕 Bedankt voor je bestelling!</h1>
            <p>Je betaling is succesvol ontvangen.<br />We gaan meteen aan de slag met jouw take-out bestelling.</p>
          </>
        );
      case "canceled":
        return (
          <>
            <h1>❌ Betaling geannuleerd</h1>
            <p>Je bestelling is niet betaald.<br />Je kunt opnieuw proberen of contact opnemen.</p>
          </>
        );
      case "failed":
        return (
          <>
            <h1>⚠️ Betaling mislukt</h1>
            <p>Er is iets misgegaan met de betaling.<br />Probeer opnieuw of neem contact op.</p>
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
