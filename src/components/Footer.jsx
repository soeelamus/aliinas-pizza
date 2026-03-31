import React from "react";
import packageJson from "../../package.json";

const APP_VERSION = packageJson.version;
const APP_RELEASE = packageJson.release.date;

const Footer = () => (
  <footer id="footer">
    <ul className="icons">
      <li>
        <a
          target="_blank"
          rel="noopener noreferrer"
          href="https://facebook.com/aliinas.pizza"
          className="icon brands alt fa-facebook-f"
        >
          <span className="label">Facebook</span>
        </a>
      </li>
      <li>
        <a
          target="_blank"
          rel="noopener noreferrer"
          href="https://instagram.com/aliinas.pizza"
          className="icon brands alt fa-instagram"
        >
          <span className="label">Instagram</span>
        </a>
      </li>
    </ul>
    <ul className="copyright">
      <li>Copyright &copy; 2026 Soe Elamus OÜ</li>
      <li>aliinas.pizza@hotmail.com</li>
      <li>Leemstraat 45, 9080 Lochristi BE</li>
      <li>BE1032.444.046</li>
    </ul>
    <div className="footer--version">
      <span>Version {APP_VERSION}</span>
      <span>Last updated {APP_RELEASE}</span>
    </div>
  </footer>
);

export default Footer;
