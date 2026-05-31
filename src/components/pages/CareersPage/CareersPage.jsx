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
    return <p>Jobs laden...</p>;
  }

  const postedJobs = jobs.filter((job) => job.posted);

  if (!postedJobs.length) {
    return (
      <>
        <div className="careers-empty">
          <h2>Momenteel geen openstaande vacatures</h2>
          <p>We zijn niet actief op zoek naar nieuwe collega's</p>
          <p>
            Je mag altijd spontaan sollicteren als je interesse hebt om bij
            Aliina's te werken
          </p>
        </div>
      </>
    );
  }

  return (
    <div className="careers">
      {postedJobs.map((job) => (
        <Link key={job.id} to={`/careers/${job.id}`}>
          <h2>{job.title}</h2>
          <p>{job.shortDescription}</p>
        </Link>
      ))}
    </div>
  );
};

export default CareersPage;
