// PaymentPage.jsx
import React, { useState, useEffect } from "react";
import { useCart } from "../../../contexts/CartContext";
import { useNavigate } from "react-router-dom";
import { useEvents } from "../../../contexts/EventsContext";

import "./PaymentPage.css";
import "../SuccessPage/SuccessPage.css";
import Loading from "../../Loading/Loading";

const PaymentPage = () => {
  const { cart, totalAmount } = useCart();
  const [localCart, setLocalCart] = useState(cart);

  const [formData, setFormData] = useState({
    name: "",
    pickupTime: "",
    email: "",
    notes: "",
    agreeTerms: false,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { events } = useEvents();
  
  // ✅ Minuten per slot
  const SLOTS_INTERVAL = 10;

  // ✅ 1 bestelling per SLOTS_INTERVAL
  const MAX_PER_SLOT = 1;

  const [slotCounts, setSlotCounts] = useState({});
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersLoaded, setOrdersLoaded] = useState(false);
  const [timeSlots, setTimeSlots] = useState([]);

  // --- helpers ---
  const brusselsToday = () =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Brussels",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date()); // YYYY-MM-DD

  const normalizePickupTime = (t) => {
    const s = String(t || "").trim();
    if (!s) return "";
    if (s.toUpperCase() === "ASAP") return "ASAP";
    const m = s.match(/\b([01]\d|2[0-3]):([0-5]\d)\b/);
    return m ? `${m[1]}:${m[2]}` : s;
  };

  const roundUpToQuarter = (date) => {
    const ms = 1000 * 60 * SLOTS_INTERVAL;
    return new Date(Math.ceil(date.getTime() / ms) * ms);
  };

  const today = brusselsToday();
  const todaysEvent = events.find(
    (e) => e.type?.toLowerCase() !== "privaat" && e.date === today,
  );

  // ⚡ Sync localCart met context cart
  useEffect(() => setLocalCart(cart), [cart]);

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
    if (!formData.email.includes("@")) newErrors.email = "Ongeldig e-mail";
    if (!formData.agreeTerms) newErrors.agreeTerms = "Bevestig de afhaalplaats";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (!validate()) return;

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
      window.location.href = data.checkoutUrl;
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Betaling kon niet gestart worden.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ 1) haal orders van vandaag op + tel per pickuptime
  useEffect(() => {
    let cancelled = false;

    const fetchTodaysOrders = async () => {
      setOrdersLoading(true);
      setOrdersLoaded(false);

      try {
        const res = await fetch(`/api/orders?date=${today}`);
        if (!res.ok) throw new Error("Failed to fetch /api/orders");
        const orders = await res.json();

        const counts = {};
        for (const o of orders || []) {
          const t = normalizePickupTime(o?.pickuptime);
          if (!t) continue;
          if (t === "ASAP") continue; // ASAP telt niet als kwartier-slot

          const status = String(o?.status || "")
            .trim()
            .toLowerCase();
          if (status === "cancelled" || status === "canceled") continue;

          counts[t] = (counts[t] || 0) + 1;
        }

        if (!cancelled) {
          setSlotCounts(counts);
        }
      } catch (err) {
        console.error("fetchTodaysOrders error:", err);
        if (!cancelled) {
          // fallback: geen filtering (alles 0)
          setSlotCounts({});
        }
      } finally {
        if (!cancelled) {
          setOrdersLoading(false);
          setOrdersLoaded(true);
        }
      }
    };

    fetchTodaysOrders();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [today]);

  // ✅ 2) maak slots PAS nadat ordersLoaded true is
  useEffect(() => {
    // zolang we orders nog niet hebben: toon niks
    if (!ordersLoaded) {
      setTimeSlots([]);
      return;
    }

    if (!todaysEvent) {
      setTimeSlots([]);
      return;
    }

    const eventStart = new Date(`${today}T${todaysEvent.startTime}`);
    const eventEnd = new Date(`${today}T${todaysEvent.endTime}`);

    const nowPlus = roundUpToQuarter(new Date(Date.now() + 25 * 60000));
    const startTime = new Date(
      Math.max(eventStart.getTime(), nowPlus.getTime()),
    );

    const slots = [];
    let current = startTime;
    while (current <= eventEnd) {
      const hh = current.getHours().toString().padStart(2, "0");
      const mm = current.getMinutes().toString().padStart(2, "0");
      const slot = `${hh}:${mm}`;

      // ✅ filter volzette slots weg
      if ((slotCounts[slot] || 0) < MAX_PER_SLOT) {
        slots.push(slot);
      }

      current = new Date(current.getTime() + SLOTS_INTERVAL * 60000);
    }

    setTimeSlots(slots);
  }, [ordersLoaded, todaysEvent, today, slotCounts]);

  // ✅ Als gekozen pickupTime verdwijnt, reset
  useEffect(() => {
    if (formData.pickupTime && !timeSlots.includes(formData.pickupTime)) {
      setFormData((prev) => ({ ...prev, pickupTime: "" }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeSlots]);

  const slotsReady = ordersLoaded && !ordersLoading;

  return (
    <div className="payment-page-body">
      <div className="payment-page-margin">
        <form onSubmit={handleCheckout} className="payment-page">
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
                  placeholder="Naam"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={loading}
                  maxLength="25"
                />
              </div>

              <div className="option2">
                <label htmlFor="pickupTime">Afhaaltijd</label>

                <select
                  className="form-textarea form-select"
                  id="pickupTime"
                  name="pickupTime"
                  value={formData.pickupTime}
                  onChange={handleChange}
                  disabled={loading || !slotsReady}
                >
                  {!slotsReady ? (
                    <option value="">Laden</option>
                  ) : (
                    <>
                      <option value="">Kies</option>
                      {timeSlots.map((slot) => (
                        <option key={slot} value={slot}>
                          {slot}
                        </option>
                      ))}
                    </>
                  )}
                </select>
              </div>
            </div>

            <div className="option3">
              <label htmlFor="email">E-mail</label>
              <input
                className="form-textarea"
                type="email"
                id="email"
                name="email"
                placeholder="E-mail"
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
                maxLength="50"
              />
              {errors.email && (
                <span className="error-message">{errors.email}</span>
              )}
            </div>

            <label htmlFor="notes">Opmerking</label>
            <textarea
              className="form-textarea"
              id="notes"
              name="notes"
              placeholder="Opmerking"
              value={formData.notes}
              onChange={handleChange}
              rows={1}
              disabled={loading}
              maxLength="75"
            />

            {todaysEvent ? (
              slotsReady ? (
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
                      Ik zal mijn bestelling vandaag ophalen in:{" "}
                      <strong>{todaysEvent.address}</strong>
                      {formData.pickupTime && (
                        <>
                          {" "}
                          om <strong>{formData.pickupTime}</strong>
                        </>
                      )}
                    </p>
                  </div>
                ) : (
                  <h3>
                    Het is niet meer mogelijk om een bestelling te plaatsen
                  </h3>
                )
              ) : (
                <Loading innerHTML={"Tijdsloten laden"} />
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
              type="button"
              onClick={() => navigate("/ordering")}
            >
              &#60;
            </button>

            <button
              className="btn-purple"
              type="submit"
              disabled={
                !formData?.name?.trim() ||
                !formData?.pickupTime?.trim() ||
                !formData?.email?.trim() ||
                loading ||
                !slotsReady
              }
            >
              {loading ? "Bezig" : "Betalen"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentPage;
