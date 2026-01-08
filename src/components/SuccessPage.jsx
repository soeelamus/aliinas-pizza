import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const SuccessPage = () => {
  const [status, setStatus] = useState("loading");
  const navigate = useNavigate();

  useEffect(() => {
    const checkPayment = async () => {
      try {
        // Hier kun je checken via Mollie webhook database of via server endpoint
        // Voor testmodus: we gaan ervan uit dat betaling geslaagd is
        setStatus("paid");
        localStorage.removeItem("cart");
      } catch (err) {
        console.error(err);
        navigate("/"); // Niet betaald → terug naar root
      }
    };

    checkPayment();
  }, [navigate]);

  if (status === "loading") return <p>Laden…</p>;

  return (
    <div className="success-page main style-2">
      <div className="success-card">
        <h1>🍕 Bedankt voor je bestelling!</h1>
        <p>Je betaling is succesvol ontvangen. We gaan meteen aan de slag met jouw take-out bestelling.</p>
        <button className="btn-purple" onClick={() => navigate("/")}>
          Home
        </button>
      </div>
    </div>
  );
};

export default SuccessPage;
