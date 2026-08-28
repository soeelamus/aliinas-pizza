import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./CareersPage.css";

const CareersPage = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadJobs = async () => {
      try {
        const res = await fetch("/json/jobs.json");

        if (!res.ok) {
          throw new Error("Jobs konden niet geladen worden");
        }

        const data = await res.json();
        setJobs(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadJobs();
  }, []);

  if (loading) {
    return (
      <main className="careers-page">
        <div className="careers-loading">Jobs laden...</div>
      </main>
    );
  }

  const postedJobs = jobs.filter((job) => job.posted);

  if (!postedJobs.length) {
    return (
      <main className="careers-page">
        <section className="careers-hero">
          <span className="careers-eyebrow">WERKEN BIJ ALIINA'S</span>

          <h1>Kom bij ons team 🍕</h1>

          <p>
            Zin om mee te draaien in onze foodtruck? Bekijk onze openstaande
            vacatures of stuur ons gerust een spontane sollicitatie.
          </p>
        </section>

        <section className="careers-empty">
          <div className="careers-empty-icon">🍕</div>

          <h2>Momenteel geen openstaande vacatures</h2>

          <p>
            We zijn momenteel niet actief op zoek naar nieuwe collega's,
            maar leuk volk is altijd welkom.
          </p>

          <p>
            Interesse om bij Aliina's te werken? Je mag ons altijd spontaan
            contacteren.
          </p>

          <a
            href="mailto:info@aliinas.com?subject=Spontane sollicitatie"
            className="careers-button"
          >
            Spontaan solliciteren
          </a>
        </section>
      </main>
    );
  }

  return (
    <main className="careers-page">
      <section className="careers-hero">
        <span className="careers-eyebrow">WERKEN BIJ ALIINA'S</span>

        <h1>Kom bij ons team 🍕</h1>

        <p>
          Help mee om elke service vlot te laten draaien. Ontdek onze
          openstaande vacatures en misschien zien we je binnenkort!
        </p>
      </section>

      <section className="careers-content">
        <div className="careers-heading">
          <div>
            <span className="careers-heading-label">VACATURES</span>
            <h2>Openstaande jobs</h2>
          </div>

          <span className="careers-count">
            {postedJobs.length}{" "}
            {postedJobs.length === 1 ? "vacature" : "vacatures"}
          </span>
        </div>

        <div className="careers-grid">
          {postedJobs.map((job) => (
            <Link
              key={job.id}
              to={`/careers/${job.id}`}
              className="career-card"
            >
              <div className="career-card-top">
                <span className="career-card-type">{job.type}</span>
                <span className="career-card-arrow">→</span>
              </div>

              <h3>{job.title}</h3>

              <p className="career-card-description">
                {job.shortDescription}
              </p>

              <div className="career-card-meta">
                <span>📍 {job.location}</span>
                <span>🕒 {job.hours}</span>
                <span>📅 {job.schedule}</span>
              </div>

              <div className="career-card-footer">
                Bekijk vacature
                <span>→</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
};

export default CareersPage;