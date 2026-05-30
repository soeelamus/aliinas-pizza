import { Navigate, useParams } from "react-router-dom";

export default function EmployeeProtectedRoute({ children }) {
  const { employeeId } = useParams();

  const isLocalhost = window.location.hostname === "localhost";

  if (isLocalhost) {
    return children;
  }

  const isLoggedIn =
    localStorage.getItem(`employeeAuth_${employeeId}`) === "true";

  if (!isLoggedIn) {
    return <Navigate to={`/employees/${employeeId}/login`} replace />;
  }

  return children;
}