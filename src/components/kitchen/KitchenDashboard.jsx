import { Navigate } from "react-router-dom";
import KitchenScreen from "./KitchenScreen";


export default function KitchenDashboard() {
  if (localStorage.getItem("kitchenAuth") !== "true") {
    return <Navigate to="/kitchen" />;
  }

  return <KitchenScreen />;
}
