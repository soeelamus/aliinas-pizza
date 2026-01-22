import { useState } from "react";
import { Navigate } from "react-router-dom";
import KitchenScreen from "./KitchenScreen";
import KitchenCashier from "./KitchenCashier";
import "./../../assets/css/kitchen.css";

export default function KitchenDashboard() {
  const isAuthed = localStorage.getItem("kitchenAuth") === "true";
  const [cashierActive, setCashierActive] = useState(false);

  if (!isAuthed) {
    return <Navigate to="/kitchen" />;
  }

  return (
    <div className="kitchen-dashboard">
      <div className="kitchen-screen">
        <KitchenScreen
          onStartKitchen={() => setCashierActive(true)}
        />
      </div>
      <div className="kitchen-cashier">
        {cashierActive && <KitchenCashier />}
      </div>
    </div>
  );
}
