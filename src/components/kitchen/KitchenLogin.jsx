import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function KitchenLogin() {
  const [pin, setPin] = useState("");
  const navigate = useNavigate();

  const login = () => {
    if (pin === "4872") { // your secret pin
      localStorage.setItem("kitchenAuth", "true");
      navigate("/kitchen/dashboard");
    } else {
      alert("Verkeerde code");
    }
  };

  return (
    <div className="kitchen-login">
      <h1>🍕 Aliina’s Kitchen</h1>
      <input
        type="password"
        placeholder="PIN"
        value={pin}
        onChange={(e) => setPin(e.target.value)}
      />
      <button className="btn-purple" onClick={login}>Login</button>
    </div>
  );
}
