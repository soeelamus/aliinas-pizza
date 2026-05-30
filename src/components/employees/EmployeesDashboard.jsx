import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./EmployeesDashboard.css";

const EmployeesDashboard = () => {
  const [employees, setEmployees] = useState([]);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/employees");

        if (!res.ok) throw new Error("API unavailable");

        const data = await res.json();

        setEmployees(data.employees || []);
        setStatus("success");
      } catch (err) {
        console.warn("Employees API unavailable, using local JSON.");

        const res = await fetch("/json/employees.json");
        const data = await res.json();

        setEmployees(data);
        setStatus("success");
      }
    })();
  }, []);

  if (status === "loading") return <p>Team laden...</p>;
  if (status === "error") return <p>Kon Team niet laden.</p>;

  return (
    <main className="employees-page">
      <h1>Aliina's teamleden</h1>

      <div className="employee-list">
        {employees.map((employee) => (
          <Link
            key={employee.id}
            to={`/employees/${employee.id}`}
            className="employee-card"
          >
            <div className="name-box">
              <p>{employee.name}</p>
              <p className="pink">{employee.role}</p>
            </div>
            {["Owner", "Manager"].includes(employee.role) && (
              <>
                <p>{employee.phone}</p>
                <p>{employee.email}</p>
              </>
            )}
          </Link>
        ))}
      </div>
    </main>
  );
};

export default EmployeesDashboard;
