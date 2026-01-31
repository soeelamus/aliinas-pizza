import React from "react";

const Header = () => (
  <>
    <header id="top" className="header-container">
      <div className="planet-box">
        <div className="text">
          <p className="text-h1 monoton-regular">Foodtruck</p>
        </div>
        <a href="#next" className="planet scrolly">
          <img src="/images/pinker.png" alt="Pink planet" className="planet-image" />
        </a>
      </div>
      <a href="#next" className="planet scrolly">
        <img src="/images/Image-3.png" alt="People" className="people" />
      </a>
    </header>
    <p className="scroll-dwn left">scroll down</p>
    <p className="scroll-dwn">scroll down</p>
  </>
);

export default Header;
