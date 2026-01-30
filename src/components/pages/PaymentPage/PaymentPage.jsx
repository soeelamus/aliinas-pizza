// PaymentPage.jsx
import React, { useState, useEffect } from "react";
import { useCart } from "../../../contexts/CartContext";
import { useNavigate } from "react-router-dom";
import { useEvents } from "../../../contexts/EventsContext";

import "./PaymentPage.css";
import "../SuccessPage/SuccessPage.css";
import Loading from "../../Loading/Loading";

const PaymentPage = ({ isOpen, onSubmit }) => {
  const { cart, totalAmount, getStock } = useCart(); // context cart
  const [localCart, setLocalCart] = useState(cart); // lokale sync cart

  const [formData, setFormData] = useState({
    name: "",
    pickupTime: "",
    notes: "",
    agreeTerms: false,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();
  const { events } = useEvents(); // globale events

  // ⚡ Sync localCart met context cart
  useEffect(() => {
    setLocalCart(cart);
  }, [cart]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Vul je naam in";
    if (!formData.pickupTime.trim())
      newErrors.pickupTime = "Kies een afhaaltijd";
    if (!formData.agreeTerms) newErrors.agreeTerms = "Bevestig de afhaalplaats";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    // Opslaan klantgegevens
    localStorage.setItem("paymentData", JSON.stringify({ formData }));

    setLoading(true);

    try {
      const res = await fetch("/api/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          total: totalAmount(),
          customer: formData,
          cart: localCart,
        }),
      });

      const data = await res.json();

      // 👉 Stripe redirect
      window.location.href = data.checkoutUrl;
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Betaling kon niet gestart worden.");
    } finally {
      setLoading(false);
    }
  };

  // --- Tijdslots ---
  const today = new Date().toISOString().slice(0, 10);
  const todaysEvent = events.find(
    (e) => e.type.toLowerCase() === "standplaats" && e.date === today,
  );

  const roundUpToQuarter = (date) => {
    const ms = 1000 * 60 * 15;
    return new Date(Math.ceil(date.getTime() / ms) * ms);
  };

  const generateTimeSlots = () => {
    if (!todaysEvent) return [];
    const todayStr = new Date().toISOString().slice(0, 10);
    const eventStart = new Date(`${todayStr}T${todaysEvent.startTime}`);
    const eventEnd = new Date(`${todayStr}T${todaysEvent.endTime}`);
    const nowPlus30 = roundUpToQuarter(new Date(Date.now() + 25 * 60000));
    const startTime = new Date(Math.max(eventStart, nowPlus30));

    const slots = [];
    let current = startTime;
    while (current <= eventEnd) {
      const hh = current.getHours().toString().padStart(2, "0");
      const mm = current.getMinutes().toString().padStart(2, "0");
      slots.push(`${hh}:${mm}`);
      current = new Date(current.getTime() + 15 * 60000);
    }

    return slots;
  };

  const timeSlots = generateTimeSlots();

  return (
    <div className="payment-page-body">
      <div className="payment-page-margin">
        <form onSubmit={handleCheckout} className="payment-page">
          {successMessage && (
            <p className="success-message">{successMessage}</p>
          )}
          <h2>Afrekenen</h2>

          <div className="payment-form">
            <div className="options">
              <div className="option1">
                <label htmlFor="name">Naam</label>
                <input
                  className="form-textarea"
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={loading}
                  maxLength="25"
                />
                {errors.name && (
                  <span className="error-message">{errors.name}</span>
                )}
              </div>

              <div className="option2">
                <label htmlFor="pickupTime">Afhaaltijd</label>
                <select
                  className="form-textarea form-select"
                  id="pickupTime"
                  name="pickupTime"
                  value={formData.pickupTime}
                  onChange={handleChange}
                  disabled={loading}
                >
                  <option value="">Tijdslot</option>
                  {timeSlots.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
                {errors.pickupTime && (
                  <span className="error-message">{errors.pickupTime}</span>
                )}
              </div>
            </div>

            <label htmlFor="notes">Opmerking</label>
            <textarea
              className="form-textarea"
              id="notes"
              name="notes"
              placeholder="Opmerking (bv. geen ui, later ophalen, …)"
              value={formData.notes}
              onChange={handleChange}
              rows={1}
              disabled={loading}
              maxLength="75"
            />

            {todaysEvent ? (
              timeSlots.length > 0 ? (
                <div className="checkbox-wrapper-39 form-checkbox">
                  <label>
                    <input
                      type="checkbox"
                      name="agreeTerms"
                      checked={formData.agreeTerms}
                      onChange={handleChange}
                      disabled={loading}
                    />
                    <span className="checkbox"></span>
                  </label>
                  <p>
                    Ik kom straks ophalen in {todaysEvent.address}, om{" "}
                    {formData.pickupTime}
                  </p>
                </div>
              ) : (
                <h3>Het is niet meer mogelijk om een bestelling te plaatsen</h3>
              )
            ) : (
              <Loading innerHTML={"Wordt geladen"} />
            )}

            {errors.agreeTerms && (
              <span className="error-message">{errors.agreeTerms}</span>
            )}
          </div>

          <h3>Bestelling</h3>
          <ul className="payment-cart">
            {localCart.map((item) => (
              <li key={item.product.id}>
                {item.quantity}x {item.product.name} — €
                {(item.product.price * item.quantity).toFixed(2)}
              </li>
            ))}
          </ul>

          <p className="payment-total">
            <strong>Totaal: €{totalAmount().toFixed(2)}</strong>
          </p>

          <div className="nav-btns">
            <button
              className="btn-purple btn-small"
              onClick={() => navigate("/")}
            >
              &#60;
            </button>

            <button
              className="btn-purple"
              onClick={handleCheckout}
              disabled={
                !formData?.name?.trim() ||
                !formData?.pickupTime?.trim() ||
                loading
              }
            >
              {loading ? "Even geduld..." : "Betalen"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentPage;
