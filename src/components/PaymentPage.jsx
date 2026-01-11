import React, { useState } from "react";
import { useCart } from "../components/CartContext";
import { useNavigate } from "react-router-dom";

import "../assets/css/PaymentPage.css";
import "../assets/css/SuccessPage.css";

const PaymentPage = ({ isOpen, onSubmit }) => {
  const { cart, totalAmount } = useCart();
  const [formData, setFormData] = useState({
    name: "",
    pickupTime: "",
    notes: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 17; hour <= 22; hour++) {
      for (let min of [0, 15, 30, 45]) {
        if (hour === 22 && min > 0) break;
        const hh = hour.toString().padStart(2, "0");
        const mm = min.toString().padStart(2, "0");
        slots.push(`${hh}:${mm}`);
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Vul je name in";
    if (!formData.pickupTime.trim()) newErrors.pickupTime = "Kies een afhaaltijd";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await onSubmit(formData); // ✅ trigger optional parent submit logic
      setSuccessMessage(
        `Bedankt ${formData.name}, je afhaaltijd is gekozen om ${formData.pickupTime}`
      );
      setFormData({ name: "", pickupTime: "", notes: "" });
    } catch (err) {
      console.error(err);
      alert("Er ging iets mis, probeer opnieuw");
    }
  };

  // 🔹 Add this: handleCheckout for the "Betalen" button
  const handleCheckout = async (e) => {
    e.preventDefault();
    if (!validate()) {
      alert("Vul je naam en afhaaltijd in.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          total: totalAmount(),
          customer: formData,
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
    <div className="payment-page-body">
      <form onSubmit={handleSubmit} className="payment-page">
        {successMessage && (
          <p className="success-message">{successMessage}</p>
        )}
        <h2>Afrekenen</h2>

        <div className="payment-form">
          <label htmlFor="name">Naam</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            disabled={loading}
          />
          {errors.name && (
            <span className="error-message">{errors.name}</span>
          )}

          <label htmlFor="pickupTime">Afhaaltijd</label>
          <select
            id="pickupTime"
            name="pickupTime"
            value={formData.pickupTime}
            onChange={handleChange}
            disabled={loading}
          >
            <option value="">Kies een tijd</option>
            {timeSlots.map((slot) => (
              <option key={slot} value={slot}>
                {slot}
              </option>
            ))}
          </select>
          {errors.pickupTime && (
            <span className="error-message">{errors.pickupTime}</span>
          )}

          <label htmlFor="notes">Opmerking</label>
          <textarea
            id="notes"
            name="notes"
            placeholder="Opmerking (bv. geen ui, later ophalen, …)"
            value={formData.notes}
            onChange={handleChange}
            rows={1}
            disabled={loading}
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

        <div className="nav-btns">
          <button className="btn-purple btn-small" onClick={() => navigate("/")}>
            &#60;
          </button>
          <button
            className="btn-purple"
            onClick={handleCheckout}
            disabled={loading || !isOpen}
          >
            {loading ? "Even geduld..." : "Betalen"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PaymentPage;
