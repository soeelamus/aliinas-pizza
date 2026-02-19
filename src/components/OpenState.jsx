import React from "react";

const OpenState = ({ isOpen, events, onRoute }) => {
  const today = new Date().toISOString().slice(0, 10); // "2026-01-09"

  const todayEvent = events?.find(
    (e) => e.type.toLowerCase() !== "privaat" && e.date === today,
  );
  localStorage.setItem("location", JSON.stringify(todayEvent));

  return (
    <div className="menu-openStatus" style={{ fontWeight: "bold" }}>
      {isOpen ? (
        <div className="center background--purple">
          <h3 className="menu-openStatus">
            We zijn vandaag geopend van {todayEvent.startTime} tot{" "}
            {todayEvent.endTime}
          </h3>
          {!onRoute && (
            <>
              <a href="/ordering" className="btn-purple btn-order">
                ✅ Bestellen
              </a>
              <a href="/ordering" className="btn-purple cta-btn">
                ✅ Bestellen
              </a>
            </>
          )}
          <br />
          <p className="menu-openStatus-p">Ophalen: {todayEvent.address}</p>
        </div>
      ) : (
        <div className="center background--purple">
          <p className="menu-openStatus-p">❌ We zijn vandaag gesloten</p>
          <p className="menu-openStatus-p">Online bestellen is enkel mogelijk tijdens onze openingsuren</p>
        </div>
      )}
    </div>
  );
};

export default OpenState;
