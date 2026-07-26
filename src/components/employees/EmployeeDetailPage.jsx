import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import "./EmployeesDashboard.css";

const formatDateTime = (value) => {
  if (!value) return "-";

  return new Intl.DateTimeFormat("nl-BE", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
};

const calculateHours = (clockIn, clockOut) => {
  if (!clockIn || !clockOut) return 0;

  const start = new Date(clockIn).getTime();
  const end = new Date(clockOut).getTime();

  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    return 0;
  }

  return (end - start) / 1000 / 60 / 60;
};

const EmployeeDetailPage = () => {
  const { employeeId } = useParams();

  const [employee, setEmployee] = useState(null);
  const [timeEntries, setTimeEntries] = useState([]);
  const [activeShift, setActiveShift] = useState(null);
  const [status, setStatus] = useState("loading");
  const [clockStatus, setClockStatus] = useState("idle");
  const [error, setError] = useState("");

  const loadEmployeeData = useCallback(async () => {
    setError("");

    const [employeeRes, entriesRes, currentShiftRes] = await Promise.all([
      fetch(`/api/employees?id=${employeeId}`),
      fetch(
        `/api/employees?action=timeEntries&employeeId=${employeeId}`,
      ),
      fetch(
        `/api/employees?action=currentShift&employeeId=${employeeId}`,
      ),
    ]);

    const employeeData = await employeeRes.json();
    const entriesData = await entriesRes.json();
    const currentShiftData = await currentShiftRes.json();

    if (!employeeRes.ok) {
      throw new Error(employeeData.error || "Werknemer laden mislukt");
    }

    if (!entriesRes.ok) {
      throw new Error(entriesData.error || "Werkuren laden mislukt");
    }

    if (!currentShiftRes.ok) {
      throw new Error(
        currentShiftData.error || "Actieve shift laden mislukt",
      );
    }

    setEmployee(employeeData.employee);
    setTimeEntries(entriesData.timeEntries || []);
    setActiveShift(currentShiftData.shift || null);
  }, [employeeId]);

  useEffect(() => {
    (async () => {
      try {
        await loadEmployeeData();
        setStatus("success");
      } catch (err) {
        console.error(err);
        setError(err.message);
        setStatus("error");
      }
    })();
  }, [loadEmployeeData]);

  const completedEntries = useMemo(
    () => timeEntries.filter((entry) => entry.clock_out),
    [timeEntries],
  );

  const totalHours = useMemo(
    () =>
      completedEntries.reduce(
        (total, entry) =>
          total + calculateHours(entry.clock_in, entry.clock_out),
        0,
      ),
    [completedEntries],
  );

  const grossPay = useMemo(() => {
    const hourlyRate = Number(employee?.hourly_rate || 0);
    return totalHours * hourlyRate;
  }, [employee, totalHours]);

  const handleClock = async () => {
    setClockStatus("loading");
    setError("");

    try {
      const action = activeShift ? "clockOut" : "clockIn";

      const res = await fetch("/api/employees", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          employeeId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Actie mislukt");
      }

      await loadEmployeeData();
      setClockStatus("success");
    } catch (err) {
      console.error(err);
      setError(err.message);
      setClockStatus("error");
    }
  };

  if (status === "loading") {
    return <p>Werknemer laden...</p>;
  }

  if (status === "error") {
    return <p>{error || "Kon werknemer niet laden."}</p>;
  }

  if (!employee) {
    return <p>Werknemer niet gevonden.</p>;
  }

  const isOwner = employee.role?.toLowerCase() === "owner";

  return (
    <main className="employees-page">
      {isOwner && (
        <Link to="/employees/new" className="employee-add-btn">
          + Werknemer toevoegen
        </Link>
      )}

      <h1>{employee.name}</h1>

      <section className="employee-detail-card">
        <p>
          <strong>Rol:</strong> {employee.role}
        </p>

        <p>
          <strong>Email:</strong> {employee.email || "-"}
        </p>

        <p>
          <strong>Telefoon:</strong> {employee.phone || "-"}
        </p>

        <p>
          <strong>IBAN:</strong> {employee.iban || "-"}
        </p>

        <p>
          <strong>Uurloon:</strong> €
          {Number(employee.hourly_rate).toFixed(2)}/u
        </p>

        <p>
          <strong>Status:</strong>{" "}
          {employee.active ? "Actief" : "Inactief"}
        </p>

        {employee.notes && (
          <p>
            <strong>Notities:</strong> {employee.notes}
          </p>
        )}
      </section>

      <section className="employee-detail-card">
        <h2>Aanwezigheid</h2>

        {activeShift ? (
          <>
            <p>
              Ingeklokt sinds{" "}
              <strong>{formatDateTime(activeShift.clock_in)}</strong>
            </p>

            <button
              type="button"
              className="btn-purple"
              onClick={handleClock}
              disabled={clockStatus === "loading"}
            >
              {clockStatus === "loading"
                ? "Bezig..."
                : "Stop werk"}
            </button>
          </>
        ) : (
          <>
            <p>Je bent momenteel niet ingeklokt.</p>

            <button
              type="button"
              className="btn-purple"
              onClick={handleClock}
              disabled={
                clockStatus === "loading" || !employee.active
              }
            >
              {clockStatus === "loading"
                ? "Bezig..."
                : "Start werk"}
            </button>
          </>
        )}

        {error && <p style={{ color: "red" }}>{error}</p>}
      </section>

      <section>
        <h2>Werkuren</h2>

        {timeEntries.length > 0 ? (
          timeEntries.map((entry) => {
            const hours = calculateHours(
              entry.clock_in,
              entry.clock_out,
            );

            return (
              <div key={entry.id} className="employee-card">
                <p>
                  <strong>Start:</strong>{" "}
                  {formatDateTime(entry.clock_in)}
                </p>

                <p>
                  <strong>Einde:</strong>{" "}
                  {entry.clock_out
                    ? formatDateTime(entry.clock_out)
                    : "Nog bezig"}
                </p>

                <p>
                  <strong>Locatie:</strong>{" "}
                  {entry.locations?.name || "-"}
                </p>

                <p>
                  <strong>Uren:</strong>{" "}
                  {entry.clock_out ? hours.toFixed(2) : "-"}
                </p>
              </div>
            );
          })
        ) : (
          <p>Nog geen werkuren.</p>
        )}
      </section>

      <section>
        <h2>Loonoverzicht</h2>

        <div className="employee-card">
          <p>
            <strong>Gewerkte uren:</strong> {totalHours.toFixed(2)}
          </p>

          <p>
            <strong>Uurloon:</strong> €
            {Number(employee.hourly_rate).toFixed(2)}
          </p>

          <p>
            <strong>Berekend brutoloon:</strong> €
            {grossPay.toFixed(2)}
          </p>
        </div>
      </section>
    </main>
  );
};

export default EmployeeDetailPage;