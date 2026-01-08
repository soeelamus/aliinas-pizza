import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../assets/css/SuccessPage.css";

const SuccessPage = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
  sessionStorage.removeItem("cart");
}, []);


  return (
    <div className="success-page main style-2">
      <div className="success-card">
        <h1>🍕 Bedankt voor je bestelling!</h1>
        <p>
          Je betaling is succesvol ontvangen.<br />
          We gaan meteen aan de slag met jouw take-out bestelling.
        </p>

        <button
          className="btn-purple"
          onClick={() => navigate("/")}
        >
          Home
        </button>
      </div>
    </div>
  );
};

export default SuccessPage;
