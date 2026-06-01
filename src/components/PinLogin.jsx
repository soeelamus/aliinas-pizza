import { useState } from "react";
import { useNavigate } from "react-router-dom";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

export default function PinLogin({
  title,
  apiEndpoint,
  storageKey,
  redirectTo,
}) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const login = async () => {
    setError("");

    try {
      const res = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pin }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        localStorage.setItem(storageKey, "true");
        navigate(redirectTo);
      } else {
        setError("Pincode is onjuist");
        setPin("");
      }
    } catch (err) {
      console.error(err);
      setError("Pincode is onjuist");
      setPin("");
    }
  };

const addDigit = async (digit) => {
  if (pin.length >= 4) return;

  const newPin = pin + digit;

  setPin(newPin);

  if (newPin.length === 4) {
    setError("");

    try {
      const res = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pin: newPin }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        localStorage.setItem(storageKey, "true");
        navigate(redirectTo);
      } else {
        setError("Pincode is onjuist");
        setPin("");
      }
    } catch (err) {
      console.error(err);
      setError("Pincode is onjuist");
      setPin("");
    }
  }
};

  const removeDigit = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  return (
    <div className="custom-form-wrapper">
      <div className="form-container">
        <h1>{title}</h1>

        <div className="pin-display">
          {Array.from({ length: 4 }).map((_, i) => (
            <span key={i} className="pin-dot">
              {pin[i] ? "●" : "○"}
            </span>
          ))}
        </div>

        <div className="pin-pad">
          {KEYS.map((key) => (
            <button
              key={key}
              type="button"
              className="btn-purple pin-key"
              onClick={() => addDigit(key)}
            >
              {key}
            </button>
          ))}

          <button
            type="button"
            className="btn-purple pin-key"
            onClick={() => setPin("")}
          >
            C
          </button>

          <button
            type="button"
            className="btn-purple pin-key"
            onClick={() => addDigit("0")}
          >
            0
          </button>

          <button
            type="button"
            className="btn-purple pin-key"
            onClick={removeDigit}
          >
            ⌫
          </button>
        </div>

        {error && <p style={{ color: "red" }}>{error}</p>}
      </div>
    </div>
  );
}