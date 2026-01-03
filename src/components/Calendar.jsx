import React, { useState, useEffect } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const months = [
  "Januari","Februari","Maart","April","Mei","Juni","Juli",
  "Augustus","September","Oktober","November","December"
];

const url =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQz8wlSQU4x1ndGYJJgJsAIFrW2VVuXOBm8d9u8vAK7N5lypKUlYj46LP6xqF-Xqqv2PCIpB6EzP5ws/pub?output=csv";

const Calendar = () => {
  const today = new Date();
  const [date, setDate] = useState(today);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [popupOpen, setPopupOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);

  const month = date.getMonth();
  const year = date.getFullYear();

  // CSV parser
  const parseCSVRow = (row) => {
    let result = [];
    let current = "";
    let insideQuotes = false;
    for (const char of row) {
      if (char === '"') insideQuotes = !insideQuotes;
      else if (char === "," && !insideQuotes) {
        result.push(current);
        current = "";
      } else current += char;
    }
    result.push(current);
    return result.map((c) => c.replace(/^"|"$/g, "").trim());
  };

  // Load events
  const loadEvents = async () => {
    const res = await fetch(url);
    const text = await res.text();
    const rows = text.split("\n").slice(1).filter(Boolean);
    const loaded = rows.map((row) => {
      const cols = parseCSVRow(row);
      return {
        date: formatDateForMatch(cols[0]),
        displayDate: formatDateForDisplay(cols[0]),
        title: cols[1],
        location: cols[2],
        startTime: cols[3],
        endTime: cols[4],
        description: cols[5],
        website: cols[6],
        address: cols[7],
        type: cols[8],
      };
    });
    setEvents(loaded);
  };

  const formatDateForMatch = (sheetDate) => {
    const [d, m, y] = sheetDate.split("/");
    return `${y}-${m.padStart(2,"0")}-${d.padStart(2,"0")}`;
  };
  const formatDateForDisplay = (sheetDate) => {
    const [d, m, y] = sheetDate.split("/");
    return `${d.padStart(2,"0")}-${m.padStart(2,"0")}-${y}`;
  };

  // Generate calendar
  const generateCalendarDates = () => {
    const start = (new Date(year, month, 1).getDay() + 6) % 7;
    const endDate = new Date(year, month+1,0).getDate();
    const end = (new Date(year, month,endDate).getDay()+6)%7;
    const endDatePrev = new Date(year, month,0).getDate();

    let datesArr = [];

    for(let i=start;i>0;i--) datesArr.push({day:endDatePrev-i+1,inactive:true});

    for(let i=1;i<=endDate;i++){
      const fullDate = `${year}-${String(month+1).padStart(2,"0")}-${String(i).padStart(2,"0")}`;
      const event = events.find(ev=>ev.date===fullDate);
      let className = i===today.getDate()&&month===today.getMonth()&&year===today.getFullYear()?"today":"";
      if(event) className += className?` event type-${event.type.toLowerCase().replace(/\s+/g,"-")}`:`event type-${event.type.toLowerCase().replace(/\s+/g,"-")}`;
      datesArr.push({day:i,fullDate,event,className:className||"no-event"});
    }

    for(let i=end;i<6;i++) datesArr.push({day:i-end+1,inactive:true});
    return datesArr;
  };

  const handleNav = (dir) => {
    let newMonth = month, newYear = year;
    if(dir==="prev"){ if(month===0){ newYear--; newMonth=11 }else newMonth-- }
    if(dir==="next"){ if(month===11){ newYear++; newMonth=0 }else newMonth++ }
    if(newYear<today.getFullYear()||(newYear===today.getFullYear()&&newMonth<today.getMonth())) return;
    setDate(new Date(newYear,newMonth,1));
  };

  const handleEventClick = (event) => {
    if(!event) return;
    setSelectedEvent(event);
  };

  useEffect(()=>{
    if(!selectedEvent||!selectedEvent.address) return;
    const mapDiv = document.getElementById("event-map");
    if(!mapDiv) return;
    mapDiv.innerHTML="";
    const map = L.map("event-map").setView([0,0],13);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{attribution:"&copy; OpenStreetMap contributors"}).addTo(map);
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(selectedEvent.address)}`)
      .then(res=>res.json())
      .then(data=>{
        if(!data||data.length===0) return;
        const lat=parseFloat(data[0].lat), lon=parseFloat(data[0].lon);
        map.setView([lat,lon],15);
        L.marker([lat,lon]).addTo(map).bindPopup(`<a href="https://www.google.com/maps/search/?api=1&query=${lat},${lon}" target="_blank">Navigeren</a>`).openPopup();
      });
  },[selectedEvent]);

  useEffect(()=>{ loadEvents() },[]);

  const calendarDates = generateCalendarDates();

  return (
    <section className="style2 main special">
      <h4 className="text-h4 monoton-regular">Kalender</h4>
      <div className="calendar-wrapped">
        <div className="calendar">
          <header className="calendar-header">
            <button className="btn-purple calendar-title">{months[month]} {year}</button>
            <button className="btn-purple" onClick={()=>handleNav("prev")}>{"<"}</button>
            <button className="btn-purple" onClick={()=>handleNav("next")}>{">"}</button>
          </header>
          <section>
            <ul className="days">{["Ma","Di","Wo","Do","Vr","Za","Zo"].map(d=><li key={d} className="calendar-weekDay">{d}</li>)}</ul>
            <ul className="dates">
              {calendarDates.map((d,idx)=>(
                <li key={idx} className={d.className||""} onClick={()=>handleEventClick(d.event)}>
                  <span className="day-number">{d.day}</span>
                  {d.event ? <><small>{d.event.title}</small><small>{d.event.location}</small></> :
                    !d.inactive && <button onClick={e=>{ e.stopPropagation(); setSelectedDate(d.fullDate); setPopupOpen(true)}} className="add-event-btn">Toevoegen</button>}
                </li>
              ))}
            </ul>
          </section>
        </div>

        {selectedEvent && (
          <aside id="event-sidebar" style={{ display: selectedEvent ? "none" : "block" }}>
            <button className="btn-close" onClick={()=>setSelectedEvent(null)}>X</button>
            <div id="event-content">
              <article className="event-card">
                <header className="event-header">
                  <h4 className="event-title">{selectedEvent.title}</h4>
                  <span className={`event-type type-${selectedEvent.type.toLowerCase()}`}>{selectedEvent.type}</span>
                </header>
                <ul className="event-meta">
                  <li>📅 {selectedEvent.displayDate}</li>
                  <li>⏰ {selectedEvent.startTime} – {selectedEvent.endTime}</li>
                  {selectedEvent.type.toLowerCase()!=="privaat" && selectedEvent.address && <li id="event-map-link">📍<span>{selectedEvent.address}</span></li>}
                  {selectedEvent.website && <li><a href={selectedEvent.website} target="_blank" rel="noopener">🔗 Website</a></li>}
                </ul>
                <p className="event-description">{selectedEvent.description}</p>
                {selectedEvent.type.toLowerCase()!=="privaat" && selectedEvent.address && <div id="event-map" className="event-map"></div>}
              </article>
            </div>
          </aside>
        )}
      </div>
    </section>
  );
};

export default Calendar;
