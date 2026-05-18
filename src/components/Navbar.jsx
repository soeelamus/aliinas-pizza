import React from "react";

const Navbar = ({ onMain = true }) => (
  <nav className="nav-box">
    <div className="nav-btns">
      {!onMain && (
        <a href="/" className="btn-purple scrolly">
          Home
        </a>
      )}
      {onMain && (
        <>
          <a href="#menu" className="btn-purple scrolly">
            Menu
          </a>
          <a href="#contact" className="btn-purple scrolly">
            Contact
          </a>
          <a href="#kalender" className="btn-purple scrolly">
            Kalender
          </a>
        </>
      )}
    </div>
  </nav>
);

export default Navbar;
