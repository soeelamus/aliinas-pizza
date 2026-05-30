import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./EmployeesDashboard.css";

export default function EmployeePersonalLogin() {
  const { employeeId } = useParams();
  const navigate = useNavigate();

  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  const login = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "employeeLogin",
          employeeId,
          pin,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        localStorage.setItem(`employeeAuth_${employeeId}`, "true");
        navigate(`/employees/${employeeId}`);
      } else {
        setError("Pincode is onjuist");
      }
    } catch (err) {
      console.error(err);
      setError("Login mislukt");
    }
  };

  return (
    <main className="employees-page">
      <form className="employee-form" onSubmit={login}>
        <h1>Werknemer login</h1>

        <label>
          Pincode
          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            autoComplete="new-password"
            required
          />
        </label>

        <button className="employee-add-btn" type="submit">
          Inloggen
        </button>

        {error && <p style={{ color: "red" }}>{error}</p>}
      </form>
    </main>
  );
}
