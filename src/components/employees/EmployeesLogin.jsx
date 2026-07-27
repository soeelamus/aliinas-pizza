import PinLogin from "../PinLogin";

export default function EmployeesLogin() {
  return (
    <PinLogin
      title="👥 Aliina's Team"
      apiEndpoint="/api/employees"
      storageKey="employeesAuth"
      redirectTo="/employees"
    />
  );
}