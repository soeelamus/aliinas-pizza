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

  const { events, loading } = useEvents(); // Use global context
  const month = date.getMonth();
  const year = date.getFullYear();

  // Generate calendar dates
  const generateCalendarDates = () => {
    if (!events) return [];

    const start = (new Date(year, month, 1).getDay() + 6) % 7;
    const endDate = new Date(year, month + 1, 0).getDate();
    const end = (new Date(year, month, endDate).getDay() + 6) % 7;
    const endDatePrev = new Date(year, month, 0).getDate();

    const datesArr = [];

    // Previous month trailing days
    for (let i = start; i > 0; i--)
      datesArr.push({ day: endDatePrev - i + 1, inactive: true });

    // Current month days
    for (let i = 1; i <= endDate; i++) {
      const fullDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
      const event = events.find((ev) => ev.date === fullDate);
      let className =
        i === today.getDate() &&
        month === today.getMonth() &&
        year === today.getFullYear()
          ? "today"
          : "";
      if (event)
        className += className
          ? ` event type-${event.type.toLowerCase().replace(/\s+/g, "-")}`
          : `event type-${event.type.toLowerCase().replace(/\s+/g, "-")}`;
      datesArr.push({
        day: i,
        fullDate,
        event,
        className: className || "no-event",
      });
    }

    // Next month leading days
    for (let i = end; i < 6; i++)
      datesArr.push({ day: i - end + 1, inactive: true });

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
    <br id="kalender"/>
      <Wave reverse={true} />
      <section className="style2 main special">
        <h4 className="text-h4 monoton-regular">Kalender</h4>
        <div className="calendar-wrapped">
          <div className="calendar">
            <header className="calendar-header">
              <button className="btn-purple calendar-title">
                {months[month]} {year}
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
                    {d.event ? (
                      <>
                        <small>{d.event.title}</small>
                        <small>{d.event.location}</small>
                      </>
                    ) : (
                      !d.inactive
                    )}
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {selectedEvent && (
            <aside
              id="event-sidebar"
              style={{ display: selectedEvent ? "block" : "none" }}
            >
              <button
                className="btn-purple btn-small btn-close"
                onClick={() => setSelectedEvent(null)}
              >
                X
              </button>
              <div id="event-content">
                <article className="event-card">
                  <header className="event-header">
                    <h4 className="event-title">{selectedEvent.title}</h4>
                    <span
                      className={`event-type type-${selectedEvent.type.toLowerCase()}`}
                    >
                      {selectedEvent.type}
                    </span>
                  </header>
                  <ul className="event-meta">
                    <li>📅 {selectedEvent.displayDate}</li>
                    <li>
                      ⏰ {selectedEvent.startTime} – {selectedEvent.endTime}
                    </li>
                    {selectedEvent.type.toLowerCase() !== "privaat" &&
                      selectedEvent.address && (
                        <li id="event-map-link">
                          📍<span>{selectedEvent.address}</span>
                        </li>
                      )}
                    {selectedEvent.website && (
                      <li>
                        <a
                          href={selectedEvent.website}
                          target="_blank"
                          rel="noopener"
                        >
                          🔗 Website
                        </a>
                      </li>
                    )}
                  </ul>
                  <p className="event-description">
                    {selectedEvent.description}
                  </p>
                  {selectedEvent.type.toLowerCase() !== "privaat" &&
                    selectedEvent.address && (
                      <Map address={selectedEvent.address} />
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
