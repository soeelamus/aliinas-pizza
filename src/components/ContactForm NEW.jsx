import React, { useState } from "react";
import Wave from "./Wave";

const INITIAL_FORM_DATA = {
  locatie: "",
  datum: "",
  voornaam: "",
  email: "",
  gasten: "",
  info: "",
};

const ContactForm = () => {
  const [currentStep, setCurrentStep] = useState(0);

  // null = nog geen keuze
  // contact = gewone aanvraag
  // direct = directe reservatie
  const [bookingMode, setBookingMode] = useState(null);

  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [availability, setAvailability] = useState({
    status: "idle", // idle | checking | available | unavailable | error
    message: "",
  });

  const [bookingSettings, setBookingSettings] = useState({
    depositPerGuestCents: 600,
  });

  const depositAmount =
    Number(formData.gasten || 0) * (bookingSettings.depositPerGuestCents / 100);

  const formattedDeposit = new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
  }).format(depositAmount);

  const today = new Date().toISOString().split("T")[0];

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));

    setSuccessMessage("");

    // Bij een andere datum moet opnieuw gecontroleerd worden.
    if (name === "datum") {
      setAvailability({
        status: "idle",
        message: "",
      });

      setBookingMode(null);
    }
  };

  const validateFields = (fields) => {
    const newErrors = {};

    fields.forEach((field) => {
      const value = String(formData[field] ?? "").trim();

      if (!value) {
        newErrors[field] = `Vul ${field} in`;
      }
    });

    if (
      fields.includes("email") &&
      formData.email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
    ) {
      newErrors.email = "Vul een geldig e-mailadres in";
    }

    if (fields.includes("gasten") && Number(formData.gasten) < 1) {
      newErrors.gasten = "Vul minstens 1 gast in";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const checkAvailability = async () => {
    const valid = validateFields(["locatie", "datum"]);

    if (!valid) return;

    setAvailability({
      status: "checking",
      message: "",
    });

    setBookingMode(null);

    try {
      const response = await fetch("/api/bookings/check-availability", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date: formData.datum,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Controle mislukt");
      }

      setBookingSettings({
        depositPerGuestCents: Number(result.depositPerGuestCents) || 600,
      });

      setAvailability({
        status: result.available ? "available" : "unavailable",
        message: result.message || "",
      });
    } catch (error) {
      console.error(error);

      setAvailability({
        status: "error",
        message:
          "We kunnen de beschikbaarheid voor deze datum niet controleren. Je kunt wel een vrijblijvende offerte voor jouw feestje aanvragen.",
      });
    }
  };

  const chooseBookingMode = (mode) => {
    setBookingMode(mode);
    setErrors({});
    setCurrentStep(1);
  };

  const nextStep = () => {
    if (currentStep === 1) {
      const valid = validateFields(["voornaam", "email"]);

      if (valid) {
        setCurrentStep(2);
      }
    }
  };

  const prevStep = () => {
    setErrors({});

    if (currentStep === 1) {
      setCurrentStep(0);
      return;
    }

    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const resetForm = () => {
    setFormData(INITIAL_FORM_DATA);
    setErrors({});
    setCurrentStep(0);
    setBookingMode(null);

    setAvailability({
      status: "idle",
      message: "",
    });
  };

  const handleContactRequest = async () => {
    const payload = {
      access_key: "f5f89190-0e09-46e5-9b69-92b1e5419a42",
      subject: "Nieuwe contactaanvraag",
      from_name: "aliinas.com",

      message: `
🟣 Nieuwe eventaanvraag

📍 Locatie
${formData.locatie}

📅 Datum
${formData.datum}

👥 Aantal gasten
${formData.gasten}

──────────────────────
👤 Contactpersoon
Naam: ${formData.voornaam}
E-mail: ${formData.email}

💬 Wens / extra informatie
${formData.info}

Verzonden via het contactformulier
      `,
    };

    const response = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error("Contactaanvraag verzenden mislukt");
    }

    setSuccessMessage(
      "Succesvol verzonden! We beantwoorden je aanvraag meestal binnen de 2 uur.",
    );

    resetForm();
  };

  const handleDirectBooking = async () => {
    const response = await fetch("/api/bookings/create-checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        eventDate: formData.datum,
        location: formData.locatie,
        firstName: formData.voornaam,
        email: formData.email,
        guestCount: Number(formData.gasten),
        extraInfo: formData.info,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      if (result.code === "DATE_UNAVAILABLE") {
        setAvailability({
          status: "unavailable",
          message:
            "Deze datum werd reeds gereserveerd. We kunnen bekijken wat de mogelijkheden nog zijn",
        });

        setBookingMode(null);
        setCurrentStep(0);
        return;
      }

      throw new Error(result.error || "Reservatie starten mislukt");
    }

    if (!result.checkoutUrl) {
      throw new Error("Geen betaallink ontvangen");
    }

    window.location.href = result.checkoutUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const valid = validateFields(["gasten", "info"]);

    if (!valid) return;

    setIsSubmitting(true);

    try {
      if (bookingMode === "direct") {
        await handleDirectBooking();
      } else {
        await handleContactRequest();
      }
    } catch (error) {
      console.error(error);

      alert(
        bookingMode === "direct"
          ? "De reservatie kon niet worden gestart. Probeer opnieuw of stuur een vrijblijvende aanvraag."
          : "De aanvraag kon niet worden verzonden. Probeer later opnieuw.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <br id="contact" />

      <Wave reverse />

      <section className="main style2 special">
        <h4 className="text-h4 monoton-regular">Aanvraag</h4>

        <img
          loading="lazy"
          src="images/regular.png"
          className="planet-image side"
          alt=""
        />

        <div className="custom-form-wrapper">
          <div className="form-container">
            {successMessage && (
              <p className="success-message">{successMessage}</p>
            )}

            <form onSubmit={handleSubmit} id="multiForm">
              <div className="progress-container">
                {[0, 1, 2].map((step) => (
                  <div
                    key={step}
                    className={`progress-step ${
                      step <= currentStep ? "active" : ""
                    }`}
                  />
                ))}
              </div>

              {/* STAP 1: DATUM CONTROLEREN */}
              {currentStep === 0 && (
                <div className="step active">
                  <label htmlFor="locatie">Locatie van je event</label>

                  <input
                    id="locatie"
                    type="text"
                    name="locatie"
                    value={formData.locatie}
                    onChange={handleChange}
                    placeholder="Het adres in Oost-Vlaanderen"
                  />

                  {errors.locatie && (
                    <span className="error-message">{errors.locatie}</span>
                  )}

                  <label htmlFor="datum">Datum van je event</label>

                  <input
                    id="datum"
                    type="date"
                    name="datum"
                    min={today}
                    value={formData.datum}
                    onChange={handleChange}
                  />

                  {errors.datum && (
                    <span className="error-message">{errors.datum}</span>
                  )}

                  <div className="clearfix">
                    <button
                      type="button"
                      className="btn-purple margin-2"
                      onClick={checkAvailability}
                      disabled={availability.status === "checking"}
                    >
                      {availability.status === "checking"
                        ? "Checking..."
                        : "Check"}
                    </button>
                  </div>

                  {availability.status === "available" && (
                    <div className="availability-result available">
                      <h3>Deze datum is beschikbaar</h3>

                      <p>
                        Je kunt onmiddellijk reserveren of eerst een
                        vrijblijvende offerte aanvragen.
                      </p>

                      <div className="booking-choice-buttons">
                        <button
                          type="button"
                          className="btn-purple btn-submit"
                          onClick={() => chooseBookingMode("direct")}
                        >
                          Reserveer
                        </button>

                        <button
                          type="button"
                          className="btn-purple btn-secondary"
                          onClick={() => chooseBookingMode("contact")}
                        >
                          Aanvraag
                        </button>
                      </div>
                    </div>
                  )}

                  {availability.status === "unavailable" && (
                    <div className="availability-result unavailable">
                      <h3>We zijn niet zeker of deze datum beschikbaar is</h3>

                      <p>
                        Stuur gerust een vrijblijvende aanvraag. Dan bekijken we
                        samen de mogelijkheden
                      </p>

                      <button
                        type="button"
                        className="btn-purple"
                        onClick={() => chooseBookingMode("contact")}
                      >
                        Aanvraag
                      </button>
                    </div>
                  )}

                  {availability.status === "error" && (
                    <div className="availability-result unavailable">
                      <p>{availability.message}</p>

                      <button
                        type="button"
                        className="btn-purple"
                        onClick={() => chooseBookingMode("contact")}
                      >
                        Aanvraag
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* STAP 2: CONTACTGEGEVENS */}
              {currentStep === 1 && (
                <div className="step active">
                  <h3>
                    {bookingMode === "direct"
                      ? "Jouw reservatie"
                      : "Jouw aanvraag"}
                  </h3>

                  <label htmlFor="voornaam">Voornaam</label>

                  <input
                    id="voornaam"
                    type="text"
                    name="voornaam"
                    value={formData.voornaam}
                    onChange={handleChange}
                  />

                  {errors.voornaam && (
                    <span className="error-message">{errors.voornaam}</span>
                  )}

                  <label htmlFor="email">E-mailadres</label>

                  <input
                    id="email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                  />

                  {errors.email && (
                    <span className="error-message">{errors.email}</span>
                  )}

                  <div className="clearfix">
                    <button
                      type="button"
                      className="btn-purple"
                      onClick={prevStep}
                    >
                      Terug
                    </button>

                    <button
                      type="button"
                      className="btn-purple"
                      onClick={nextStep}
                    >
                      Verder
                    </button>
                  </div>
                </div>
              )}

              {/* STAP 3: EVENTGEGEVENS */}
              {currentStep === 2 && (
                <div className="step active">
                  <label htmlFor="gasten">Hoeveel gasten verwacht je?</label>

                  <input
                    id="gasten"
                    type="number"
                    name="gasten"
                    min="1"
                    value={formData.gasten}
                    onChange={handleChange}
                  />

                  {errors.gasten && (
                    <span className="error-message">{errors.gasten}</span>
                  )}

                  <label htmlFor="info">Vertel ons meer over jouw event</label>

                  <textarea
                    id="info"
                    name="info"
                    value={formData.info}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Bijvoorbeeld: Voor onze bruiloft willen we onze gasten verrassen met verse pizza’s."
                  />

                  {errors.info && (
                    <span className="error-message">{errors.info}</span>
                  )}

                  {bookingMode === "direct" && (
                    <div className="booking-summary">
                      <h3>Overzicht</h3>
                      <p>
                        <strong>Datum:</strong> {formData.datum}
                      </p>
                      <p>
                        <strong>Locatie:</strong> {formData.locatie}
                      </p>
                      <p>
                        <strong>Aantal gasten:</strong> {formData.gasten || 0}
                      </p>
                      <p className="deposit-total">
                        <strong>Voorschot:</strong> {formattedDeposit}
                      </p>
                      <small>
                        Het voorschot bedraagt €6 per gast. Na je reservatie kun
                        je het aantal gewenste pizza’s doorgeven.
                      </small>{" "}
                    </div>
                  )}

                  <div className="clearfix">
                    <button
                      type="button"
                      className="btn-purple"
                      onClick={prevStep}
                      disabled={isSubmitting}
                    >
                      Terug
                    </button>

                    <button
                      type="submit"
                      className="btn-purple btn-submit"
                      disabled={isSubmitting}
                    >
                      {isSubmitting
                        ? bookingMode === "direct"
                          ? "maken..."
                          : "verzenden..."
                        : bookingMode === "direct"
                          ? `Reserveer`
                          : "Verzend"}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      </section>

      <Wave />
    </>
  );
};

export default ContactForm;
