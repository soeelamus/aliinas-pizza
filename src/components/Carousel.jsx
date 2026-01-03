import React from "react";

const Carousel = () => (
      <section id="1" className="container-carousel">
      <div className="container-carousel-header">
        <header className="major">
          <h2>Welkom bij Aliina's – Pizza in Oost-Vlaanderen!</h2>
        </header>
        <p>
          Versgebakken pizza’s met karakter, rijke smaken en toppings die je
          smaakpapillen laten dansen – onze foodtruck
          is de plek waar echte pizzadromen tot leven komen.
          <br/><br/>
          We bereiden ons deeg elke dag opnieuw en werken uitsluitend met verse
          groenten, kazen en kwaliteitsvol vlees.
          Niets wordt ooit ingevroren, zodat elke hap de pure, volle versheid
          uit onze keuken draagt.
        </p>
      </div>
      <div className="slideshow-container" id="slideshow">
       <img loading="lazy" src="images/Mood.png" alt="Friends sitting around a table sharing a fresh Neapolitan pizza"/>
        </div>
      </section>
);

export default Carousel;