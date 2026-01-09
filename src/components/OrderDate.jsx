import React from "react";

const OrderDate = ({ events }) => {
  const today = new Date().toISOString().slice(0, 10); // "2026-01-09"

  const todayEvent = events?.find(
    (e) => e.type.toLowerCase() === "standplaats" && e.date === today
  );

  const isOpen = !!todayEvent;

  return (
    <div className="menu-openStatus" style={{ fontWeight: "bold" }}>
      {isOpen ? (
        <div>
          <h3 className="menu-openStatus">
            We zijn vandaag geopend vanaf {todayEvent.startTime}
          </h3>
          <p className="menu-openStatus-p">Bestel nu al online</p>
          <p className="menu-openStatus-p">Ophalen: {todayEvent.address}</p>
        </div>
      ) : (
        <p className="menu-openStatus-p">❌ We zijn vandaag gesloten</p>
      )}
    </div>
  );
};

export default OrderDate;
