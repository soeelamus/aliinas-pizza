import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

import "./EmployeesDashboard.css";

const isLocalhost =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

const fetchJsonLocalOnly = async (apiUrl, fallbackUrl) => {
  try {
    const res = await fetch(apiUrl);

    if (!res.ok) throw new Error("API unavailable");

    return await res.json();
  } catch (err) {
    if (!isLocalhost) throw err;

    console.warn(`${apiUrl} unavailable, using ${fallbackUrl}`);

    const fallbackRes = await fetch(fallbackUrl);

    if (!fallbackRes.ok) throw new Error("Fallback unavailable");

    return await fallbackRes.json();
  }
};

const EmployeeDetailPage = () => {
  const { employeeId } = useParams();

  const [employee, setEmployee] = useState(null);
  const [shifts, setShifts] = useState([]);
  const [payroll, setPayroll] = useState(null);
  const [status, setStatus] = useState("loading");
  const OWNER = "b351951e-6a6b-4af2-8119-be82a61d7a83"

  useEffect(() => {
    (async () => {
      try {
        const employeesData = await fetchJsonLocalOnly(
          "/api/employees",
          "/json/employees.json"
        );

        const shiftsData = await fetchJsonLocalOnly(
          `/api/employees?action=shifts&employeeId=${employeeId}`,
          "/json/shifts.json"
        );

        const payrollData = await fetchJsonLocalOnly(
          `/api/employees?action=payroll&employeeId=${employeeId}`,
          "/json/payroll.json"
        );

        const employees = Array.isArray(employeesData)
          ? employeesData
          : employeesData.employees || [];

        const foundEmployee = employees.find((e) => e.id === employeeId);

        const employeeShifts = Array.isArray(shiftsData)
          ? shiftsData.filter((s) => s.employeeId === employeeId)
          : shiftsData.shifts || [];

        const employeePayroll = Array.isArray(payrollData)
          ? payrollData.find((p) => p.employeeId === employeeId)
          : payrollData.payroll?.[0] || null;

        setEmployee(foundEmployee);
        setShifts(employeeShifts);
        setPayroll(employeePayroll);
        setStatus("success");
      } catch (err) {
        console.error(err);
        setStatus("error");
      }
    })();
  }, [employeeId]);

  if (status === "loading") return <p>Werknemer laden...</p>;
  if (status === "error") return <p>Kon werknemer niet laden.</p>;
  if (!employee) return <p>Werknemer niet gevonden.</p>;

  return (
    <main className="employees-page">
        {employee.id === OWNER &&
      <Link to="/employees/new" className="employee-add-btn">
        + Werknemer toevoegen
      </Link>
        }
      <h1>{employee.name}</h1>

      <section className="employee-detail-card">
        <p><strong>Rol:</strong> {employee.role}</p>
        <p><strong>Email:</strong> {employee.email}</p>
        <p><strong>Telefoon:</strong> {employee.phone}</p>
        <p><strong>Loon:</strong> €{employee.hourlyWage}/u</p>
        <p><strong>Status:</strong> {employee.status}</p>
        <p><strong>Volgende uitbetaling:</strong> {employee.nextPayout}</p>
      </section>

      <section>
        <h2>Werkuren</h2>

        {shifts.length > 0 ? (
          shifts.map((shift) => (
            <div key={shift.id} className="employee-card">
              <p>{shift.date}</p>
              <p>{shift.startTime} - {shift.endTime}</p>
              <p>{shift.location}</p>
              <p>Status: {shift.status}</p>
            </div>
          ))
        ) : (
          <p>Nog geen werkuren.</p>
        )}
      </section>

      <section>
        <h2>Loon</h2>

        {payroll ? (
          <div className="employee-card">
            <p>Periode: {payroll.period}</p>
            <p>Uren: {payroll.hoursWorked}</p>
            <p>Totaal: €{payroll.grossPay}</p>
            <p>Betaald: {payroll.paid ? "Ja" : "Nee"}</p>
          </div>
        ) : (
          <p>Nog geen loondata.</p>
        )}
      </section>
    </main>
  );
};

export default EmployeeDetailPage;