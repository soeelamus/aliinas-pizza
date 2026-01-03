import React from "react";

const Header = () => (
  <header className="header-container">
    <div className="planet-box">
      <div className="text">
        <p className="text-h1 monoton-regular">Foodtruck</p>
      </div>
      <a href="#1" className="planet scrolly">
        <img src="/images/pinker.png" alt="Pink planet" className="planet-image" />
      </a>
    </div>
    <p className="scroll-dwn left">scroll down</p>
    <p className="scroll-dwn">scroll down</p>
    <a href="#1" className="planet scrolly">
      <img src="/images/Image-3.png" alt="People" className="people" />
    </a>
  </header>
);

export default Header;
