import React from "react";
import { Link } from "react-router-dom";
import confetti from "canvas-confetti";
import packageJson from "../../package.json";

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

      // Confetti vanaf links
      confetti({
        particleCount,
        angle: 60,
        spread: 70,
        origin: { x: 0, y: 0.7 },
        zIndex: 9999,
      });

      // Confetti vanaf rechts
      confetti({
        particleCount,
        angle: 120,
        spread: 70,
        origin: { x: 1, y: 0.7 },
        zIndex: 9999,
      });
    }, 250);
  };

  return (
    <footer id="footer">
      <ul className="icons">
        <li>
          <Link
            target="_blank"
            rel="noopener noreferrer"
            to="https://facebook.com/aliinas.pizza"
            className="icon facebook"
          >
            <span className="label">Facebook</span>
          </Link>
        </li>

        <li>
          <Link
            target="_blank"
            rel="noopener noreferrer"
            to="https://instagram.com/aliinas.pizza"
            className="icon instagram"
          >
            <span className="label">Instagram</span>
          </Link>
        </li>
      </ul>

      <ul className="info">
        <li>Copyright &copy; 2026 Soe Elamus OÜ</li>
        <li>aliinas.pizza@hotmail.com</li>
        <li>Leemstraat 45, 9080 Lochristi BE</li>
        <li>BE1032444046</li>
      </ul>

      <div className="footer--version">
        <div
          className="version-box"
          onClick={launchConfetti}
          style={{ cursor: "pointer" }}
        >
          <span>Version {APP_VERSION}</span>
          <span>Last updated {APP_RELEASE}</span>
        </div>

        <div className="version-box">
          <Link to="/careers">Vacatures</Link>
          <Link to="/employees">Login</Link>
        </div>
      </div>

      <nav className="seo-links gap" aria-label="Populaire pagina's">
        <Link to="/locaties">Pizza in jouw buurt</Link>
        <Link to="/foodtruck-huren-oost-vlaanderen">Foodtruck huren</Link>
        <Link to="/pizza-catering-oost-vlaanderen">Pizza catering</Link>
      </nav>
    </footer>
  );
};

export default Footer;