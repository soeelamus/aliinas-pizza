import { Navigate } from "react-router-dom";
import KitchenScreen from "./KitchenScreen";
import KitchenCashier from "./KitchenCashier";
import "./../../assets/css/kitchen.css";

export default function KitchenDashboard() {
  const isAuthed = localStorage.getItem("kitchenAuth") === "true";

  if (!isAuthed) {
    return <Navigate to="/kitchen" />;
  }

  return (
    <div className="kitchen-dashboard">
      <div className="kitchen-screen">
        <KitchenScreen />
      </div>
      <div className="kitchen-cashier">
        <KitchenCashier />
      </div>
    </div>
  );
}
