import React from "react";
import { Link } from "react-router-dom";

import packageJson from "../../package.json";
import { seoPages } from "../data/seoPages";

const APP_VERSION = packageJson.version;
const APP_RELEASE = packageJson.release.date;

const Footer = () => (
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
      <div className="version-box">
        <span>Version {APP_VERSION}</span>
        <span>Last updated {APP_RELEASE}</span>
      </div>
      <div className="version-box">
        <Link to="/careers">Vacatures</Link>
        <Link to="/employees">Login</Link>
      </div>
    </div>
    <div className="seo-links gap">
      {seoPages.map((page) => (
        <Link key={page.slug} to={`/${page.slug}`}>
          {page.h1}
        </Link>
      ))}
    </div>
  </footer>
);

export default Footer;
