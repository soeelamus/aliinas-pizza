import React, { useState } from "react";
import Wave from "./Wave";

const ContactForm = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    locatie: "",
    datum: "",
    voornaam: "",
    email: "",
    gasten: "",
    info: "",
  });
  const [errors, setErrors] = useState({});

  const steps = [
    ["locatie", "datum"],
    ["voornaam", "email"],
    ["gasten", "info"],
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateStep = () => {
    const fields = steps[currentStep];
    let valid = true;
    let newErrors = {};

    fields.forEach((name) => {
      if (!formData[name].trim()) {
        newErrors[name] = "Vul dit veld in";
        valid = false;
      }
    });

    setErrors(newErrors);
    return valid;
  };

  const nextStep = () => {
    if (validateStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const [successMessage, setSuccessMessage] = useState("");
  const handleSubmit = async (e) => {
    e.preventDefault();

    let allValid = true;
    let allErrors = {};

    steps.forEach((stepFields) => {
      stepFields.forEach((name) => {
        if (!formData[name].trim()) {
          allErrors[name] = "Vul dit veld in";
          allValid = false;
        }
      });
    });

    if (!allValid) {
      setErrors(allErrors);
      return;
    }

    const payload = {
      access_key: "f5f89190-0e09-46e5-9b69-92b1e5419a42",
      subject: "Nieuwe contactaanvraag",
      from_name: "aliinas.com",
      message: `
    🟣 Nieuwe Eventaanvraag

    📍 Locatie
    ${formData.locatie}

    📅 Datum
    ${formData.datum}

    👥 Aantal gasten
    ${formData.gasten}

    ──────────────────────
    👤 Contactpersoon
    Naam: ${formData.voornaam}
    Email: ${formData.email}

    
    💬 Wens / extra info
    ${formData.info}

    
    Verzonden via het contactformulier
    `,
    };

    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        setSuccessMessage(
          "Succesvol verzonden! We bekijken je aanvraag vandaag nog.",
        );
        setFormData({
          locatie: "",
          datum: "",
          voornaam: "",
          email: "",
          gasten: "",
          info: "",
        });
        setCurrentStep(0);
      } else {
        alert("Er ging iets mis. Probeer later opnieuw.");
      }
    } catch (error) {
      console.error(error);
      alert("Netwerkfout. Probeer later opnieuw.");
    }
  };

  return (
    <>
      <br id="2" />
      <Wave reverse={true}/>
      <section className="main style2 special">
        <h4 className="text-h4 monoton-regular">contact</h4>
        <img
          loading="lazy"
          src="images/regular.png"
          className="planet-image side"
          alt="Decorative"
        />
        <div className="custom-form-wrapper">
          <div className="form-container">
            <form onSubmit={handleSubmit} id="multiForm">
              {/* Progress bar */}
              <div className="progress-container">
                {steps.map((_, i) => (
                  <div
                    key={i}
                    className={`progress-step ${i <= currentStep ? "active" : ""}`}
                  />
                ))}
              </div>
              {successMessage && (
                <p className="success-message">{successMessage}</p>
              )}

              {/* STEP 1 */}
              {currentStep === 0 && (
                <div className="step active">
                  <label>Locatie van je event</label>
                  <input
                    type="text"
                    name="locatie"
                    value={formData.locatie}
                    onChange={handleChange}
                    placeholder="Het adres in Oost-Vlaanderen"
                  />
                  {errors.locatie && (
                    <span className="error-message">{errors.locatie}</span>
                  )}

                  <label>Datum van je event</label>
                  <input
                    type="date"
                    name="datum"
                    value={formData.datum}
                    onChange={handleChange}
                  />
                  {errors.datum && (
                    <span className="error-message">{errors.datum}</span>
                  )}

                  <div className="clearfix">
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

              {/* STEP 2 */}
              {currentStep === 1 && (
                <div className="step active">
                  <label>Voornaam</label>
                  <input
                    type="text"
                    name="voornaam"
                    value={formData.voornaam}
                    onChange={handleChange}
                  />
                  {errors.voornaam && (
                    <span className="error-message">{errors.voornaam}</span>
                  )}

                  <label>Email</label>
                  <input
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

              {/* STEP 3 */}
              {currentStep === 2 && (
                <div className="step active">
                  <label>Hoeveel gasten?</label>
                  <input
                    type="number"
                    name="gasten"
                    min="1"
                    value={formData.gasten}
                    onChange={handleChange}
                  />
                  {errors.gasten && (
                    <span className="error-message">{errors.gasten}</span>
                  )}

                  <label>Vertel ons jouw wens</label>
                  <textarea
                    name="info"
                    value={formData.info}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Bijvoorbeeld: Voor onze bruiloft willen we 70 gasten verrassen met lekkere pizza’s."
                  />
                  {errors.info && (
                    <span className="error-message">{errors.info}</span>
                  )}

                  <div className="clearfix">
                    <button
                      type="button"
                      className="btn-purple"
                      onClick={prevStep}
                    >
                      Terug
                    </button>
                    <button type="submit" className="btn-purple btn-submit">
                      Zend
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      </section>
      <Wave/>
    </>
  );
};

export default ContactForm;
