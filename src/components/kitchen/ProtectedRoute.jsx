import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const isLoggedIn = localStorage.getItem("kitchenAuth") === "true";

  if (!isLoggedIn) {
    return <Navigate to="/kitchen/login" replace />;
  }

  return children;
}
