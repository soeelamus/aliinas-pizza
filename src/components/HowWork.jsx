import React from "react";

const HowWork = () => (
  <section className="main style1 special contact-info">
    <header className="major">
      <h2>Hoe gaat het in zijn werk?</h2>
    </header>

    <div className="container">
      <div className="row gtr-150 contact-flex">
        <div className="col-4 col-12-medium">
          <div className="text-box">
            <div className="flex">
              <h3>Kies jouw menu</h3>
            </div>
            <p>
              Welke pizza’s wil je serveren? Wij bakken ze ter plaatse op
              ambachtelijke wijze. We blijven enkele uren aanwezig, zodat
              iedereen ruim de tijd heeft om alle smaken te ontdekken.
            </p>
          </div>
        </div>
        <div className="col-4 col-12-medium">
          <div className="text-box">
            <div className="flex">
              <h3>Hoeveel het kost</h3>
            </div>
            <div>
              <span>Een tuinfeest met 50 gasten:</span>
              <br />
              <br />
              <ul>
                <li>20x Margheriita (220)</li>
                <li>20x Pepperonii (240)</li>
                <li>10x Sweet Chiicken (130)</li>
                <li>Transport, Elektriciteit,.. (100)</li>
                <li>Totaal - €690.</li>
              </ul>
              <p>
                We voorzien altijd zelf elektriciteit. Zo kunnen we volledig
                off-grid werken.
              </p>
            </div>
          </div>
        </div>
        <div className="col-4 col-12-medium">
          <div className="text-box">
            <div className="flex">
              <h3>Vertel ons jouw wens</h3>
            </div>
            <p>
              Wil je dat onze foodtruck langskomt? Laat je gegevens achter via
              onderstaand contactformulier, dan helpen wij je graag verder.
            </p>
            <p><a href="#2" className="btn-purple scrolly">
              Contact
            </a></p>
            
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default HowWork;
