// src/pages/LocationsPage.jsx

import { Link } from "react-router-dom";
import { seoPages } from "../../../data/seoPages";

import "./LocationsPage.css";

export default function LocationsPage() {
  const pizzaPages = seoPages.filter(
    (page) =>
      page.type === "pizza" &&
      page.location !== "Oost-Vlaanderen"
  );

  const foodtruckPages = seoPages.filter(
    (page) =>
      page.type === "foodtruck" &&
      page.location !== "Oost-Vlaanderen"
  );

  return (
    <main className="locations-page">
      <div className="locations-container">
        <h1>Locaties & Regio's</h1>

        <p className="locations-intro">
          Aliina's is actief in verschillende gemeenten in
          Oost-Vlaanderen. Ontdek waar je onze pizza's kan
          afhalen of waar je onze foodtruck kan boeken.
        </p>

        <section className="locations-section">
          <h2>Pizza afhalen</h2>

          <div className="locations-grid">
            {pizzaPages.map((page) => (
              <Link
                key={page.slug}
                to={`/${page.slug}`}
                className="location-card"
              >
                <h3>{page.location}</h3>
                <span>Bekijk pagina →</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="locations-section">
          <h2>Pizza Foodtruck</h2>

          <div className="locations-grid">
            {foodtruckPages.map((page) => (
              <Link
                key={page.slug}
                to={`/${page.slug}`}
                className="location-card"
              >
                <h3>{page.location}</h3>
                <span>Bekijk pagina →</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="locations-section">
          <h2>Populaire pagina's</h2>

          <div className="locations-grid">
            <Link
              to="/foodtruck-huren-oost-vlaanderen"
              className="location-card"
            >
              <h3>Foodtruck Huren</h3>
            </Link>

            <Link
              to="/pizza-catering-oost-vlaanderen"
              className="location-card"
            >
              <h3>Pizza Catering</h3>
            </Link>

            <Link
              to="/napolitaanse-pizza-oost-vlaanderen"
              className="location-card"
            >
              <h3>Napolitaanse Pizza</h3>
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}