import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function KitchenLogin() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const login = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("/api/kitchen-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        localStorage.setItem("kitchenAuth", "true");
        navigate("/kitchen/dashboard");
      } else {
        setError("Pincode is onjuist");
      }
    } catch (err) {
      console.error(err);
      setError("Pincode is onjuist");
    }
  };

  return (
    <div className="custom-form-wrapper">
      <form className="form-container" onSubmit={login}>
        <h1>🍕 Aliina’s Kitchen</h1>
        <input
          type="password"
          placeholder="PIN"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          autoComplete="new-password"
        />
        <button type="submit" className="btn-purple">
          Login
        </button>
        {error && <p style={{ color: "red" }}>{error}</p>}
      </form>
    </div>
  );
}
