import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../assets/css/SuccessPage.css";

const SuccessPage = () => {
  const [status, setStatus] = useState("loading");
  const navigate = useNavigate();

useEffect(() => {
  const paymentId = sessionStorage.getItem("paymentId");

  if (!paymentId) {
    navigate("/");
    return;
  }

  const check = async () => {
    const res = await fetch(`/api/payment-status?paymentId=${paymentId}`);
    const data = await res.json();

    if (data.status === "paid") {
      localStorage.removeItem("cart");
      sessionStorage.removeItem("paymentId");
      setStatus("paid");
    } else if (data.status === "open") {
      setStatus("loading");
    } else {
      navigate("/"); // canceled / failed
    }
  };

  check();
}, []);




  return (
    <div className="success-page main style-2">
      <div className="success-card">
        <h1>🍕 Bedankt voor je bestelling!</h1>
        <p>
          Je betaling is succesvol ontvangen.<br />
          We gaan meteen aan de slag met jouw take-out bestelling.
        </p>
        <button className="btn-purple" onClick={() => navigate("/")}>
          Home
        </button>
      </div>
    </div>
  );
};

export default SuccessPage;
