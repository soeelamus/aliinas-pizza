// PaymentPage.jsx
import React, { useState } from "react";
import { useCart } from "../components/CartContext";
import { useNavigate } from "react-router-dom";

const PaymentPage = ({ isOpen }) => {
  const { cart, totalAmount } = useCart();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  // Als cart leeg is
  if (cart.length === 0) {
    return (
      <div className="payment-page">
        <h2>Je winkelmandje is leeg</h2>
        <button className="btn-purple" onClick={() => navigate("/")}>
          Terug naar shop
        </button>
      </div>
    );
  }

  // 🔹 Hier is je checkout handler
  const handleCheckout = async () => {
    if (!isOpen) return; // Safety: geen betaling als gesloten
    if (!name || !phone) {
      alert("Vul je naam en telefoonnummer in.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          total: totalAmount(),
          customer: { name, phone, notes },
          cart,
        }),
      });

      const data = await res.json();

      localStorage.setItem("paymentId", data.paymentId);

      window.location.href = data.checkoutUrl;
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Betaling kon niet gestart worden.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="payment-page">
      <h2>Afrekenen</h2>

      <div className="payment-form">
        <input
          type="text"
          placeholder="Naam"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          type="tel"
          placeholder="Telefoonnummer"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        <textarea
          placeholder="Opmerking (bv. geen ui, later ophalen, …)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <h3>Bestelling</h3>
      <ul className="payment-cart">
        {cart.map((pizza) => (
          <li key={pizza.product.id}>
            {pizza.quantity}x {pizza.product.name} — €
            {(pizza.product.price * pizza.quantity).toFixed(2)}
          </li>
        ))}
      </ul>

      <p className="payment-total">
        <strong>Totaal: €{totalAmount().toFixed(2)}</strong>
      </p>

      <button
        className="btn-purple"
        onClick={handleCheckout}
        disabled={loading || !isOpen}
      >
        {loading ? "Even geduld..." : "Betalen"}
      </button>
    </div>
  );
};

export default PaymentPage;
