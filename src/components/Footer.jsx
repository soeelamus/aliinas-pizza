import React from "react";

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
      <li>
        &copy;
        <a
          target="_blank"
          rel="noopener noreferrer"
          href="https://ariregister.rik.ee/eng/company/17342118/Soe-Elamus-O%C3%9C"
        >
          Soe Elamus OÜ
        </a>
      </li>
      <li>Design: Michiel Willems</li>
      <li>VAT/KM: EE102909436</li>
      <p>
        <a
          href="https://apps.emta.ee/saqu/public/taxdebt?lang=en"
          target="_blank"
          rel="noopener noreferrer"
        >
          Controleer onze fiscale betrouwbaarheid
        </a>
        met registratiecode:17342118
      </p>
    </ul>
  </footer>
);

export default Footer;
