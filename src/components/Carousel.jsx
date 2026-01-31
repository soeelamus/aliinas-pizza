import React from "react";

const Carousel = () => (
  <>
    <br id="next" />
    <section className="container-carousel">
      <div className="container-carousel-header">
        <header className="major">
          <h2>Aliina's Pizza - Versgebakken pizza’s voor jouw feestje!</h2>
        </header>
        <p>
          Wij houden van feestjes en willen graag bij jou langskomen! 🎉
          Aliina's heeft een aantal vaste staanplaatsen waar je alvast kan komen
          proeven. Neem een kijkje op onze kalender en kom gezellig langs.
        </p>
        <p>
          <a href="#contact" className="btn-purple scrolly">
            Contact
          </a>
        </p>
        <p>
          We bereiden ons deeg elke dag opnieuw en werken uitsluitend met verse
          groenten, kazen en kwaliteitsvol vlees. We gebruiken geen diepvriezer,
          zodat elke hap de volle versheid uit onze keuken draagt. 🍕
        </p>
      </div>
      <div className="slideshow-container" id="slideshow">
        <img
          loading="lazy"
          src="images/Mood.png"
          alt="Friends sitting around a table sharing a fresh Neapolitan pizza"
        />
      </div>
    </section>
  </>
);

export default Carousel;
