import React, { useState } from "react";
import "leaflet/dist/leaflet.css";
import { useEvents } from "../contexts/EventsContext";
import Map from "../components/Map";
import Wave from "./Wave";
import Loading from "./Loading/Loading";

const months = [
  "Januari",
  "Februari",
  "Maart",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Augustus",
  "September",
  "Oktober",
  "November",
  "December",
];

const Calendar = () => {
  const today = new Date();
  const [date, setDate] = useState(today);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const { events, loading } = useEvents();
  const month = date.getMonth();
  const year = date.getFullYear();

  const generateCalendarDates = () => {
    if (!Array.isArray(events)) return [];

    const start = (new Date(year, month, 1).getDay() + 6) % 7; // maandag=0
    const endDate = new Date(year, month + 1, 0).getDate();
    const end = (new Date(year, month, endDate).getDay() + 6) % 7;
    const endDatePrev = new Date(year, month, 0).getDate();

    const datesArr = [];

    // ✅ BELANGRIJK: gebruik window.Map zodat we niet jouw Map-component "new Map()" doen
    const eventByDate = new window.Map();
    for (const ev of events) {
      if (ev?.date) eventByDate.set(ev.date, ev);
    }

    const makeCell = (cellYear, cellMonthIndex, day, inactive) => {
      const fullDate = `${cellYear}-${String(cellMonthIndex + 1).padStart(
        2,
        "0",
      )}-${String(day).padStart(2, "0")}`;

      const event = eventByDate.get(fullDate);

      const isToday =
        day === today.getDate() &&
        cellMonthIndex === today.getMonth() &&
        cellYear === today.getFullYear();

      let className = isToday ? "today" : "";
      if (inactive) className += (className ? " " : "") + "outside-month";

      if (event) {
        className +=
          (className ? " " : "") +
          `event type-${event.type.toLowerCase().replace(/\s+/g, "-")}`;
      } else {
        className += (className ? " " : "") + "no-event";
      }

      return { day, fullDate, event, className, inactive };
    };

    // Previous month trailing days
    const prevMonthDate = new Date(year, month, 0);
    const prevYear = prevMonthDate.getFullYear();
    const prevMonthIndex = prevMonthDate.getMonth();

    for (let i = start; i > 0; i--) {
      const day = endDatePrev - i + 1;
      datesArr.push(makeCell(prevYear, prevMonthIndex, day, true));
    }

    // Current month days
    for (let i = 1; i <= endDate; i++) {
      datesArr.push(makeCell(year, month, i, false));
    }

    // Next month leading days
    const nextMonthDate = new Date(year, month + 1, 1);
    const nextYear = nextMonthDate.getFullYear();
    const nextMonthIndex = nextMonthDate.getMonth();

    for (let i = end; i < 6; i++) {
      const day = i - end + 1;
      datesArr.push(makeCell(nextYear, nextMonthIndex, day, true));
    }

    return datesArr;
  };

  const handleNav = (dir) => {
    let newMonth = month,
      newYear = year;

    if (dir === "prev") {
      if (month === 0) {
        newYear--;
        newMonth = 11;
      } else newMonth--;
    }

    if (dir === "next") {
      if (month === 11) {
        newYear++;
        newMonth = 0;
      } else newMonth++;
    }

    if (
      newYear < today.getFullYear() ||
      (newYear === today.getFullYear() && newMonth < today.getMonth())
    )
      return;

    setDate(new Date(newYear, newMonth, 1));
  };

  const handleEventClick = (event) => {
    if (!event) return;
    setSelectedEvent(event);
  };

  const calendarDates = generateCalendarDates();

  if (loading) return <Loading innerHTML={"De kalender wordt geladen"} />;

  return (
    <>
      <br id="kalender" />
      <Wave reverse={true} />
      <section className="style2 main special">
        <h4 className="text-h4 monoton-regular">Kalender</h4>
        <div className="calendar-wrapped">
          <div className="calendar">
            <header className="calendar-header">
              <button className="btn-purple calendar-title">
                {months[month].slice(0, 3)} {year}
              </button>
              <button
                className="btn-small btn-purple"
                onClick={() => handleNav("prev")}
              >
                {"<"}
              </button>
              <button
                className="btn-small btn-purple"
                onClick={() => handleNav("next")}
              >
                {">"}
              </button>
            </header>

            <section>
              <ul className="days">
                {["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"].map((d) => (
                  <li key={d} className="calendar-weekDay">
                    {d}
                  </li>
                ))}
              </ul>

              <ul className="dates">
                {calendarDates.map((d, idx) => (
                  <li
                    key={idx}
                    className={d.className || ""}
                    onClick={() => handleEventClick(d.event)}
                  >
                    <span className="day-number">{d.day}</span>
                    {d.event ? <small>{d.event.location}</small> : !d.inactive}
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {selectedEvent && (
            <aside id="event-sidebar" style={{ display: "block" }}>
              <button
                className="btn-purple btn-small btn-close"
                onClick={() => setSelectedEvent(null)}
              >
                X
              </button>

              <div id="event-content">
                <article className="event-card">
                  <header className="event-header">
                    <span
                      className={`event-type type-${selectedEvent.type.toLowerCase()}`}
                    >
                      {selectedEvent.type}
                    </span>
                    {selectedEvent.type.toLowerCase() !== "privaat" && (
                      <span className={`event-type type-order`}>
                        Bestel Online
                      </span>
                    )}
                  </header>

                  <ul className="event-meta">
                    <li>📅 {selectedEvent.displayDate}</li>
                    <li>
                      ⏰ {selectedEvent.startTime} – {selectedEvent.endTime}
                    </li>

                    {selectedEvent.type.toLowerCase() !== "privaat" &&
                      selectedEvent.address && (
                        <li id="event-map-link">
                          📍{" "}
                          <a
                          className="event-address"
                            href={
                              "https://www.google.com/maps/dir/?api=1&destination=" +
                              encodeURIComponent(selectedEvent.website)
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {selectedEvent.address}
                          </a>
                        </li>
                      )}
                  </ul>

                  <p className="event-description">
                    {selectedEvent.description}
                  </p>

                  {selectedEvent.type.toLowerCase() !== "privaat" &&
                    selectedEvent.website && (
                      <Map address={selectedEvent.website} />
                    )}
                </article>
              </div>
            </aside>
          )}
        </div>
      </section>
      <Wave />
    </>
  );
};

export default Calendar;
