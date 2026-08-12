import React from "react";
import LegalLayout from "../LegalLayout";

const LegalPage = () => {
  return (
    <LegalLayout
      title="Juridische kennisgeving"
      intro="De afspraken die gelden wanneer je bestelt bij Aliina's Pizza, onze website gebruikt of een cateringopdracht boekt."
      updated="13 augustus 2026"
    >
      <section>
        <h2>1. Over deze website</h2>

        <p>
          Deze website wordt beheerd door Soe Baltic Capital OÜ en wordt
          gebruikt voor de online diensten van Aliina's.
        </p>

        <p>
          Soe Baltic Capital OÜ is eigenaar van deze website, het merk Aliina's en de bijbehorende
          software en digitale infrastructuur.
        </p>
        <div className="legal-card">
          <p>Soe Baltic Capital OÜ</p>
          <p>
            Ingeschreven in het Handels- en Vennootschapsregister van Estland
          </p>
          <p>Registratienummer: 17342118</p>
          <p>BTW-identificatienummer: EE102909436</p>
        </div>

      </section>
      <section>

                <h2>2. Toegankelijkheid</h2>

        <p>
          De website is 24 uur per dag, 7 dagen per week toegankelijk,
          onafhankelijk van eventueel onderhoud.
        </p>
        <p>
          Deze website en alle daarin aanwezige elementen (merk, tekeningen,
          logo's, modellen, grafieken...) evenals hun samenstelling en opmaak
          zijn eigendom van Soe Baltic Capital OÜ. De gebruiker verbindt zich er daarom
          toe de website geheel of gedeeltelijk, in welke vorm dan ook, niet te
          verspreiden of te reproduceren.
        </p>
      </section>

      <section>
        <h2>3. Intellectuele eigendom</h2>

        <p>
          Teksten, foto's, ontwerpen, software, logo's en andere inhoud op deze
          website mogen niet zonder toestemming worden gekopieerd of commercieel
          gebruikt.
        </p>
      </section>

      <section>
        <h2>4. Aansprakelijkheid</h2>

        <p>
          Soe Baltic Capital OÜ is niet aansprakelijk voor indirecte schade of schade
          veroorzaakt door omstandigheden buiten onze redelijke controle, voor
          zover wettelijk toegestaan.
        </p>
      </section>

      <section>
        <h2>5. Toepasselijk recht</h2>

        <p>
          Deze voorwaarden vallen onder het Estse recht en in geval van geschillen zijn uitsluitend de rechtbanken van Estland bevoegd.
        </p>
      </section>
    </LegalLayout>
  );
};

export default LegalPage;
