import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import "./CareersPage.css";

const CareerDetailPage = () => {
  const { jobId } = useParams();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const loadJob = async () => {
      try {
        const res = await fetch("/json/jobs.json");

        if (!res.ok) {
          throw new Error("Jobs konden niet geladen worden");
        }

        const jobs = await res.json();
        const foundJob = jobs.find((item) => item.id === jobId);

        setJob(foundJob || null);
      } catch (err) {
        console.error(err);
        setHasError(true);
      } finally {
        setLoading(false);
      }
    };

    loadJob();
  }, [jobId]);

  if (loading) {
    return (
      <main className="career-detail">
        <p>Job laden...</p>
      </main>
    );
  }

  if (hasError) {
    return (
      <main className="career-detail">
        <h1>Er ging iets mis</h1>
        <p>De job kon niet geladen worden.</p>
        <Link to="/careers">Terug naar jobs</Link>
      </main>
    );
  }

  if (!job) {
    return <Navigate to="/careers" replace />;
  }

  return (
    <main className="career-detail">
      <Link to="/careers" className="career-detail__back">
        ← Terug naar jobs
      </Link>

      <section className="career-detail__hero">
        {job.type && <p className="career-detail__type">{job.type}</p>}

        <h1>{job.title}</h1>

        {job.shortDescription && (
          <p className="career-detail__intro">{job.shortDescription}</p>
        )}

        <div className="career-detail__meta">
          {job.location && <span>📍 {job.location}</span>}
          {job.hours && <span>🕒 {job.hours}</span>}
          {job.schedule && <span>📅 {job.schedule}</span>}
        </div>
      </section>

      {job.description && (
        <section className="career-detail__section">
          <h2>Over deze job</h2>
          <p>{job.description}</p>
        </section>
      )}

      {job.tasks?.length > 0 && (
        <section className="career-detail__section">
          <h2>Wat ga je doen?</h2>
          <ul>
            {job.tasks.map((task) => (
              <li key={task}>{task}</li>
            ))}
          </ul>
        </section>
      )}

      {job.requirements?.length > 0 && (
        <section className="career-detail__section">
          <h2>Wie zoeken we?</h2>
          <ul>
            {job.requirements.map((requirement) => (
              <li key={requirement}>{requirement}</li>
            ))}
          </ul>
        </section>
      )}

      {job.offer?.length > 0 && (
        <section className="career-detail__section">
          <h2>Wat bieden we?</h2>
          <ul>
            {job.offer.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="career-detail__cta">
        <h2>Interesse?</h2>
        <p>
          Denk je dat deze job iets voor jou is? Stuur ons gerust een berichtje.
        </p>

        <Link to="/contact" className="career-detail__button">
          Solliciteren
        </Link>
      </section>
    </main>
  );
};

export default CareerDetailPage;