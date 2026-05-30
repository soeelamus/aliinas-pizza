import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./EmployeesDashboard.css";

const EmployeeCreatePage = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "Helper",
    hourlyWage: "",
    iban: "",
    status: "active",
    nextPayout: "",
    loginCode: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newEmployee = {
      id: crypto.randomUUID(),
      name: form.name,
      email: form.email,
      phone: form.phone,
      role: form.role,
      hourlyWage: Number(form.hourlyWage),
      iban: form.iban,
      status: form.status,
      nextPayout: form.nextPayout,
      loginCode: form.loginCode,
    };

    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "create",
          employee: newEmployee,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Employee save failed");
      }

      navigate("/employees");
    } catch (err) {
      console.error("Employee save error:", err);
      alert("Werknemer kon niet opgeslagen worden.");
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
          Email
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
          />
        </label>

        <label>
          Telefoon
          <input name="phone" value={form.phone} onChange={handleChange} />
        </label>

        <label>
          Rol
          <select name="role" value={form.role} onChange={handleChange}>
            <option>Owner</option>
            <option>Manager</option>
            <option>Pizzaiolo</option>
            <option>Kitchen Crew</option>
            <option>Cleaning Crew</option>
            <option>Service Crew</option>
            <option>Driver</option>
            <option>Babysitter</option>
            <option>Student Worker</option>
            <option>Flexi Job</option>
            <option>Freelancer</option>
          </select>
        </label>

        <label>
          Loon per uur
          <input
            name="hourlyWage"
            type="number"
            step="0.01"
            value={form.hourlyWage}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          IBAN
          <input name="iban" value={form.iban} onChange={handleChange} />
        </label>

        <label>
          Volgende uitbetaling
          <input
            name="nextPayout"
            type="date"
            value={form.nextPayout}
            onChange={handleChange}
          />
        </label>

        <label>
          Status
          <select name="status" value={form.status} onChange={handleChange}>
            <option value="active">Actief</option>
            <option value="inactive">Inactief</option>
          </select>
        </label>

        <label>
          Login code
          <input
            type="password"
            value={form.loginCode}
            onChange={(e) =>
              setForm({
                ...form,
                loginCode: e.target.value,
              })
            }
          />
        </label>

        <button className="employee-add-btn" type="submit">
          Werknemer opslaan
        </button>
      </form>
    </main>
  );
};

export default EmployeeCreatePage;
