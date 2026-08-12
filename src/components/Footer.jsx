import React from "react";
import { Link } from "react-router-dom";
import confetti from "canvas-confetti";
import packageJson from "../../package.json";
import { FaFacebookF, FaInstagram } from "react-icons/fa";

const APP_VERSION = packageJson.version;
const APP_RELEASE = packageJson.release.date;

const Footer = () => {
  const launchConfetti = () => {
    const duration = 2000;
    const end = Date.now() + duration;

    const interval = window.setInterval(() => {
      const timeLeft = end - Date.now();

      if (timeLeft <= 0) {
        window.clearInterval(interval);
        return;
      }

      const particleCount = Math.ceil(100 * (timeLeft / duration));

      confetti({
        particleCount,
        angle: 60,
        spread: 70,
        origin: { x: 0, y: 0.8 },
        zIndex: 9999,
      });

      confetti({
        particleCount,
        angle: 120,
        spread: 70,
        origin: { x: 1, y: 0.8 },
        zIndex: 9999,
      });
    }, 250);
  };

  return (
    <footer id="footer">
      <div className="footer-container">
        {/* BRAND */}
        <div className="footer-brand">
          <Link to="/" className="footer-logo">
            Aliina's
            <span>Pizza</span>
          </Link>

          <p>
            Verse pizza, gebakken op locatie.
            <br />
            Vanuit onze foodtruck in Lochristi.
          </p>

          <div className="footer-socials">
            <a
              href="https://facebook.com/aliinas.pizza"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
            >
              <FaFacebookF />
            </a>

            <a
              href="https://instagram.com/aliinas.pizza"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
            >
              <FaInstagram />
            </a>
          </div>
        </div>

        {/* LINKS */}
        <div className="footer-column">
          <h4>Aliina's</h4>

          <Link to="/locaties">Locaties</Link>
          <Link to="/pizza-catering-oost-vlaanderen">Pizza catering</Link>
          <Link to="/foodtruck-huren-oost-vlaanderen">Foodtruck huren</Link>
          <Link to="/careers">Vacatures</Link>
        </div>

        {/* CONTACT */}
        <div className="footer-column">
          <h4>Contact</h4>

          <a href="mailto:aliinas.pizza@hotmail.com">
            aliinas.pizza@hotmail.com
          </a>

          <span>Leemstraat 45</span>
          <span>9080 Lochristi BE</span>
        </div>

        {/* BUSINESS */}
        <div className="footer-column">
          <h4>Bedrijfsinfo</h4>
          <span>BE 1032.444.046</span>

          <Link to="/employees" className="footer-login">
            Medewerkers →
          </Link>
        </div>
      </div>

      <div className="footer-bottom">
        <span>© 2026 Soe Baltic Capital OÜ</span>
        <div className="footer-bottom--box">
          <Link to="/legal" target="_blank">
            Juridische kennisgeving
          </Link>
          <Link to="/privacy" target="_blank">
            Privacybeleid
          </Link>
        </div>

        <button
          type="button"
          className="footer-version"
          onClick={launchConfetti}
        >
          v{APP_VERSION} · {APP_RELEASE}
        </button>
      </div>
    </footer>
  );
};

export default Footer;
