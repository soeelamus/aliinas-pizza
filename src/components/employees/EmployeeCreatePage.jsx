import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./EmployeesDashboard.css";

const EmployeeCreatePage = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "Flexi Job",
    hourlyRate: "12.50",
    iban: "",
    active: "true",
    pincode: "",
    nfcUid: "",
    notes: "",
  });

  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setStatus("loading");
    setError("");

    const pincode = Number(form.pincode);
    const hourlyRate = Number(form.hourlyRate);

    if (!Number.isFinite(hourlyRate) || hourlyRate < 0) {
      setError("Vul een geldig uurloon in.");
      setStatus("error");
      return;
    }

    if (!Number.isInteger(pincode) || form.pincode.length !== 4) {
      setError("De pincode moet exact 4 cijfers bevatten.");
      setStatus("error");
      return;
    }

    const newEmployee = {
      name: form.name.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      role: form.role,
      hourly_rate: hourlyRate,
      iban: form.iban.trim() || null,
      active: form.active === "true",
      pincode,
      nfc_uid: form.nfcUid.trim() || null,
      notes: form.notes.trim() || null,
    };

    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "createEmployee",
          employee: newEmployee,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(
          data.error || "Werknemer kon niet opgeslagen worden",
        );
      }

      navigate(`/employees/${data.employee.id}`);
    } catch (err) {
      console.error("Employee save error:", err);
      setError(err.message || "Werknemer kon niet opgeslagen worden.");
      setStatus("error");
    }
  };

  return (
    <main className="employees-page">
      <h1>Werknemer toevoegen</h1>

      <form className="employee-form" onSubmit={handleSubmit}>
        <label>
          Naam
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          E-mail
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
          />
        </label>

        <label>
          Telefoon
          <input
            name="phone"
            value={form.phone}
            onChange={handleChange}
          />
        </label>

        <label>
          Rol
          <select
            name="role"
            value={form.role}
            onChange={handleChange}
          >
            <option value="Manager">Manager</option>
            <option value="Pizzaiolo">Pizzaiolo</option>
            <option value="Kitchen Crew">Kitchen Crew</option>
            <option value="Cleaning Crew">Cleaning Crew</option>
            <option value="Service Crew">Service Crew</option>
            <option value="Driver">Driver</option>
            <option value="Babysitter">Babysitter</option>
            <option value="Student Worker">Student Worker</option>
            <option value="Flexi Job">Flexi Job</option>
            <option value="Freelancer">Freelancer</option>
          </select>
        </label>

        <label>
          Loon per uur
          <input
            name="hourlyRate"
            type="number"
            min="0"
            step="0.01"
            value={form.hourlyRate}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          IBAN
          <input
            name="iban"
            value={form.iban}
            onChange={handleChange}
          />
        </label>

        <label>
          Status
          <select
            name="active"
            value={form.active}
            onChange={handleChange}
          >
            <option value="true">Actief</option>
            <option value="false">Inactief</option>
          </select>
        </label>

        <label>
          Pincode
          <input
            name="pincode"
            type="password"
            inputMode="numeric"
            pattern="[0-9]{4}"
            maxLength={4}
            value={form.pincode}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, "").slice(0, 4);

              setForm((prev) => ({
                ...prev,
                pincode: value,
              }));
            }}
            required
          />
        </label>

        <label>
          NFC UID
          <input
            name="nfcUid"
            value={form.nfcUid}
            onChange={handleChange}
            placeholder="Later automatisch invullen"
          />
        </label>

        <label>
          Notities
          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            rows={4}
          />
        </label>

        {error && <p style={{ color: "red" }}>{error}</p>}

        <button
          className="employee-add-btn"
          type="submit"
          disabled={status === "loading"}
        >
          {status === "loading"
            ? "Werknemer opslaan..."
            : "Werknemer opslaan"}
        </button>
      </form>
    </main>
  );
};

export default EmployeeCreatePage;