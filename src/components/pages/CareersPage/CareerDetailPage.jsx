import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import "./CareersPage.css";

const CareerDetailPage = () => {
  const { jobId } = useParams();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [emailCopied, setEmailCopied] = useState(false);

const copyEmail = async () => {
  await navigator.clipboard.writeText("aliinas.pizza@hotmail.com");

  setEmailCopied(true);

  setTimeout(() => {
    setEmailCopied(false);
  }, 2000);
};

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
        <div className="career-detail__container">
          <p className="careers-loading">Job laden...</p>
        </div>
      </main>
    );
  }

  if (hasError) {
    return (
      <main className="career-detail">
        <div className="career-detail__container">
          <section className="careers-empty">
            <h1>Er ging iets mis</h1>
            <p>De vacature kon niet geladen worden.</p>

            <Link to="/careers" className="career-detail__button">
              Terug naar jobs
            </Link>
          </section>
        </div>
      </main>
    );
  }

  if (!job) {
    return <Navigate to="/careers" replace />;
  }

  return (
    <main className="career-detail">
      <div className="career-detail__container">
        <Link to="/careers" className="career-detail__back">
          ← Terug naar vacatures
        </Link>

        <section className="career-detail__hero">
          {job.type && (
            <span className="career-detail__type">{job.type}</span>
          )}

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

        <div className="career-detail__content">
          {job.description && (
            <section className="career-detail__section career-detail__section--intro">
              <span className="career-detail__label">DE JOB</span>
              <h2>Over deze job</h2>
              <p>{job.description}</p>
            </section>
          )}

          {job.tasks?.length > 0 && (
            <section className="career-detail__section">
              <span className="career-detail__label">JOUW TAKEN</span>
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
              <span className="career-detail__label">JOUW PROFIEL</span>
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
              <span className="career-detail__label">ONS AANBOD</span>
              <h2>Wat bieden we?</h2>

              <ul>
                {job.offer.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          )}

          <section className="career-detail__cta">
            <div className="career-detail__cta-icon">🍕</div>

            <div>
              <span className="career-detail__cta-label">
                IETS VOOR JOU?
              </span>

              <p>
                Denk je dat deze job bij je past? Laat iets van je horen en
                vertel kort wie je bent en wanneer je beschikbaar bent.
              </p>

<button
  type="button"
  className="career-detail__button"
  onClick={copyEmail}
>
  {emailCopied ? "E-mailadres gekopieerd!" : "aliinas.pizza@hotmail.com"}
  <span>{emailCopied ? "✓" : "⧉"}</span>
</button>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
};

export default CareerDetailPage;