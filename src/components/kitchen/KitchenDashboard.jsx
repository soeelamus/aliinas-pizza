import { useState } from "react";
import { Navigate } from "react-router-dom";
import KitchenScreen from "./KitchenScreen";
import KitchenCashier from "./KitchenCashier";
import "./../../assets/css/kitchen.css";

export default function KitchenDashboard() {
  const isAuthed = localStorage.getItem("kitchenAuth") === "true";
  const [cashierActive, setCashierActive] = useState(false);

  // 👇 bepaalt welke view fullscreen is op mobile
  const [showScreen, setShowScreen] = useState(true);

  if (!isAuthed) {
    return <Navigate to="/kitchen" />;
  }

  return (
    <>
      <button
        className="btn-settings btn-purple btn-small btn-phone"
        onClick={() => setShowScreen((v) => !v)}
      >
        {showScreen ? "Orders" : "Kassa"}
      </button>

      <div className={`kitchen-dashboard ${showScreen ? "screen-active" : ""}`}>
        <div className="kitchen-screen">
          <KitchenScreen onStartKitchen={() => setCashierActive(true)} />
        </div>

        <div className="kitchen-cashier">
          {cashierActive && <KitchenCashier />}
        </div>
      </div>
    </>
  );
}
