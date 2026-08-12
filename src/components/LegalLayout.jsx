// components/LegalLayout.jsx

import React from "react";
import { Link } from "react-router-dom";

const LegalLayout = ({ title, intro, updated, children }) => {
  return (
    <main className="legal-page">
      <div className="legal-hero">
        <div className="legal-container legal-hero--inner">
          <span className="legal-eyebrow">Aliina's Pizza</span>

          <h1>{title}</h1>

          {intro && <p className="legal-intro">{intro}</p>}

          {updated && (
            <span className="legal-updated">
              Laatst bijgewerkt: {updated}
            </span>
          )}
        </div>
      </div>

      <div className="legal-container legal-layout">
        <aside className="legal-sidebar">
          <span>Juridisch</span>

          <nav>
            <Link to="/legal">Juridische kennisgeving</Link>
            <Link to="/privacy">Privacybeleid</Link>
          </nav>
        </aside>

        <article className="legal-content">{children}</article>
      </div>
    </main>
  );
};

export default LegalLayout;