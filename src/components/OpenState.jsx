import React from "react";

const OpenState = ({ isOpen, events }) => {
  if (events.length === 0) {
    return;
  }

  const today = new Date().toLocaleDateString("en-CA");

  const todayEvent = events.find(
    (e) => e.type.toLowerCase() !== "privaat" && e.date === today,
  );

  const now = new Date();

  const endTime = todayEvent
    ? new Date(`${today}T${todayEvent.endTime}`)
    : null;

  const isPastClosingTime = endTime && now >= endTime;

  localStorage.setItem("location", JSON.stringify(todayEvent));

  return (
    <div className="menu-openStatus" style={{ fontWeight: "bold" }}>
      {isOpen ? (
        <div className="center background--purple">
          <h3 className="menu-openStatus">
            🟢 We zijn vandaag geopend van {todayEvent.startTime} tot{" "}
            {todayEvent.endTime}
          </h3>

          <a href="#ad" className="btn-purple btn-order">
            ✅ Bestellen
          </a>

          <br />

          <p className="menu-openStatus-p">Ophalen: {todayEvent.address}</p>
        </div>
      ) : todayEvent && !isPastClosingTime ? (
        <div className="center background--purple">
          <p className="menu-openStatus-p">
            🟠 Online bestellen kan niet meer.{" "}
            <p>Kom gerust langs tot {todayEvent.endTime}.</p>
          </p>
        </div>
      ) : todayEvent && isPastClosingTime ? (
        <div className="center background--purple">
          <p className="menu-openStatus-p">
            🔴 Online bestellen kan niet meer. We zijn reeds gesloten.
          </p>
        </div>
      ) : (
        <div className="center background--purple">
          <p className="menu-openStatus-p">🔴 We zijn vandaag gesloten</p>

          <p className="menu-openStatus-p">
            Online bestellen is enkel mogelijk op de dag van afhaal
          </p>
        </div>
      )}
    </div>
  );
};

export default OpenState;
