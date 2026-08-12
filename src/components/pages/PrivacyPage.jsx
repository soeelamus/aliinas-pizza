import React from "react";
import LegalLayout from "../LegalLayout";

const PrivacyPage = () => {
  return (
    <LegalLayout
      title="Privacybeleid"
      intro="Hier leggen we uit welke persoonsgegevens Aliina's Pizza verwerkt, waarom we dat doen en welke rechten je hebt."
      updated="13 augustus 2026"
    >
      <section>
        <h2>1. Wie verwerkt je gegevens?</h2>

        <p>
          Wanneer je onze website gebruikt, een bestelling plaatst of contact
          met ons opneemt, kunnen persoonsgegevens worden verwerkt.
        </p>

        <div className="legal-card">
          <p>Michiel Willems</p>
          <p>Leemstraat 45, 9080 Lochristi, België</p>
          <p>BE 1032.444.046</p>
          <p>aliinas.pizza@hotmail.com</p>
        </div>
      </section>

      <section>
        <h2>2. Welke gegevens verzamelen we?</h2>

        <p>
          Afhankelijk van hoe je onze diensten gebruikt, kunnen we onder meer
          verwerken:
        </p>

        <ul>
          <li>naam</li>
          <li>e-mailadres</li>
          <li>telefoonnummer</li>
          <li>bestelgegevens</li>
          <li>betaalinformatie</li>
          <li>afhaal- of cateringgegevens</li>
          <li>technische gegevens over het gebruik van onze website</li>
        </ul>
      </section>

      <section>
        <h2>3. Waarom verwerken we deze gegevens?</h2>

        <p>
          We gebruiken persoonsgegevens onder meer om bestellingen uit te
          voeren, betalingen te verwerken, vragen te beantwoorden en onze
          diensten veilig en betrouwbaar te laten functioneren.
        </p>
      </section>

      <section>
        <h2>4. Betalingen</h2>

        <p>
          Online betalingen kunnen worden verwerkt door externe
          betalingsdienstverleners. Aliina's Pizza ontvangt daarbij niet
          noodzakelijk je volledige betaalkaartgegevens.
        </p>
      </section>

      <section>
        <h2>5. Dienstverleners</h2>

        <p>
          Voor het aanbieden van onze website en diensten kunnen we gebruik
          maken van externe partijen voor onder andere hosting, databases,
          betalingen en technische dienstverlening.
        </p>
      </section>

      <section>
        <h2>6. Cookies en lokale opslag</h2>

        <p>
          Onze website kan cookies of vergelijkbare technieken zoals
          localStorage gebruiken voor noodzakelijke functionaliteit, voorkeuren
          en technische werking.
        </p>
      </section>

      <section>
        <h2>7. Hoe lang bewaren we gegevens?</h2>

        <p>
          We bewaren persoonsgegevens niet langer dan nodig voor het doel
          waarvoor ze zijn verzameld, behalve wanneer een wettelijke
          bewaarplicht geldt.
        </p>
      </section>

      <section>
        <h2>8. Je rechten</h2>

        <p>
          Onder de AVG/GDPR kun je onder bepaalde voorwaarden vragen om inzage,
          correctie, verwijdering of beperking van je persoonsgegevens.
        </p>
      </section>

      <section>
        <h2>9. Beveiliging</h2>

        <p>
          We nemen redelijke technische en organisatorische maatregelen om
          persoonsgegevens te beschermen tegen verlies, misbruik of onbevoegde
          toegang.
        </p>
      </section>

      <section>
        <h2>10. Wijzigingen</h2>

        <p>
          Dit privacybeleid kan worden aangepast wanneer onze diensten,
          gebruikte technologie of wettelijke verplichtingen wijzigen.
        </p>
      </section>

      <section>
        <h2>11. Contact</h2>

        <p>
          Voor vragen over privacy of de verwerking van je persoonsgegevens kun
          je contact opnemen via{" "}
          <a href="mailto:aliinas.pizza@hotmail.com">
            aliinas.pizza@hotmail.com
          </a>
          .
        </p>
      </section>
    </LegalLayout>
  );
};

export default PrivacyPage;
