import { useParams, Navigate, Link } from "react-router-dom";
import { seoPages } from "../../../data/seoPages";
import SEO from "../../SEO";
import "./SeoLandingPage.css";


export default function SeoLandingPage() {
  const { slug } = useParams();
  const page = seoPages.find((p) => p.slug === slug);

  if (!page) return <Navigate to="/" replace />;

  return (
    <>
      <SEO title={page.title} description={page.description} />

      <main className="seo-page">
        <section className="seo-hero">
          <div className="seo-hero__content">
            <span className="seo-badge">{page.badge}</span>

            <h1>{page.h1}</h1>
            <p>{page.intro}</p>

            <div className="seo-actions">
              <Link to={page.ctaLink || "/ordering"} className="seo-btn">
                {page.ctaText || "Bestel pizza"}
              </Link>
              <Link to="/calendar" className="seo-btn seo-btn--ghost">
                Bekijk kalender
              </Link>
            </div>
          </div>

          <div className="seo-image-card">
            <img src={page.image} alt={page.imageAlt} loading="eager" />
          </div>
        </section>

        <section className="seo-card-grid">
          <article className="seo-card">
            <h2>Verse Napolitaanse pizza</h2>
            <p>
              Dagelijks vers deeg, kwaliteitsvolle mozzarella, verse groenten en
              zorgvuldig gekozen toppings.
            </p>
          </article>

          <article className="seo-card">
            <h2>Afhalen of op locatie</h2>
            <p>
              Kom langs op onze vaste standplaatsen of boek Aliina's voor jouw
              feest, communie, huwelijk of bedrijfsevent.
            </p>
          </article>

          <article className="seo-card">
            <h2>Actief in {page.location}</h2>
            <p>
              Aliina's is actief in {page.location} en verschillende gemeenten in
              Oost-Vlaanderen.
            </p>
          </article>
        </section>
        <section className="seo-card-grid">
  {page.sections.map((section) => (
    <article className="seo-card" key={section.title}>
      <h2>{section.title}</h2>
      <p>{section.text}</p>
    </article>
  ))}
</section>

<section className="seo-keywords">
  <h2>Populaire zoekopdrachten</h2>
  <div>
    {page.keywords.map((keyword) => (
      <span key={keyword}>{keyword}</span>
    ))}
  </div>
</section>

<section className="seo-faq">
  <h2>Veelgestelde vragen</h2>

  {page.faq.map((item) => (
    <details key={item.question}>
      <summary>{item.question}</summary>
      <p>{item.answer}</p>
    </details>
  ))}
</section>
      </main>
    </>
  );
}