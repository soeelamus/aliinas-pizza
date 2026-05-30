import PinLogin from "../PinLogin";

export default function EmployeesLogin() {
  const isLocalhost =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";
  
  return (
    <PinLogin
      title="👥 Aliina's Team"
      apiEndpoint="/api/employees-login"
      storageKey="employeesAuth"
      redirectTo="/employees"
    />
  );
}