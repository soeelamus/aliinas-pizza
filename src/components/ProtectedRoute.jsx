import { Navigate } from "react-router-dom";

export default function ProtectedRoute({
  children,
  storageKey = "kitchenAuth",
  redirectTo = "/kitchen/login",
}) {
  const isLocalhost = window.location.hostname === "localhost";

  if (isLocalhost) {
    return children;
  }

  const isLoggedIn = localStorage.getItem(storageKey) === "true";

  if (!isLoggedIn) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
}