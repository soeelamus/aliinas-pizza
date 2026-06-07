import { useParams, Navigate, Link } from "react-router-dom";
import { seoPages } from "../../../data/seoPages";
import SEO from "../../SEO";
import "./SeoLandingPage.css";


export default function SeoLandingPage() {
  const { slug } = useParams();
  const page = seoPages.find((p) => p.slug === slug);
  if (!page) return <Navigate to="/" replace />;

  const schema = {
  "@context": "https://schema.org",
  "@type": "Restaurant",
  name: "Aliina's",
  url: "https://aliinas.com",
  image: "https://aliinas.com/images/logo.png",
  servesCuisine: "Pizza",
  email: "aliinas.pizza@hotmail.com",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Leemstraat 45",
    postalCode: "9080",
    addressLocality: "Lochristi",
    addressCountry: "BE"
  },
  sameAs: [
    "https://facebook.com/aliinas.pizza",
    "https://instagram.com/aliinas.pizza"
  ]
};


  return (
    <>
      <SEO title={page.title} description={page.description} schema={schema} />

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