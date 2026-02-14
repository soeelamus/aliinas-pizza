import React, { createContext, useContext, useState, useEffect, useMemo } from "react";

const EventsContext = createContext();

const url =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQz8wlSQU4x1ndGYJJgJsAIFrW2VVuXOBm8d9u8vAK7N5lypKUlYj46LP6xqF-Xqqv2PCIpB6EzP5ws/pub?output=csv";

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

const formatDateForMatch = (sheetDate) => {
  const [d, m, y] = sheetDate.split("/");
  return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
};

const formatDateForDisplay = (sheetDate) => {
  const [d, m, y] = sheetDate.split("/");
  return `${d.padStart(2, "0")}-${m.padStart(2, "0")}-${y}`;
};

const pad2 = (n) => String(n).padStart(2, "0");

const toLocalYMD = (d) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

// Build a local Date from "YYYY-MM-DD" and "HH:mm"
const parseEventDateTimeLocal = (ymd, hm) => {
  const [y, mo, da] = ymd.split("-").map(Number);
  const [hh = "0", mm = "0"] = (hm || "0:0").split(":");
  return new Date(y, mo - 1, da, Number(hh), Number(mm), 0, 0);
};

export const EventsProvider = ({ children }) => {
  const [events, setEvents] = useState([]);
  const [openToday, setOpenToday] = useState(false);
  const [forcedIsOpen, setForcedIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // tick so "openToday" updates when endTime-30min passes
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  
  const isOpen = forcedIsOpen || openToday;

  // Fetch once
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch(url);
        const text = await res.text();
        const rows = text.split("\n").slice(1).filter(Boolean);

        const parsedEvents = rows.map((row) => {
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

        setEvents(parsedEvents);
      } catch (err) {
        console.error("Error fetching events:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // Recompute "openToday" whenever events or time changes
  useEffect(() => {
    const THIRTY_MIN = 30 * 60 * 1000;
    const today = toLocalYMD(now);

    const todaysEvent = events.find(
      (e) => (e.type || "").toLowerCase() !== "privaat" && e.date === today
    );

    if (!todaysEvent) {
      setOpenToday(false);
      return;
    }

    const end = parseEventDateTimeLocal(todaysEvent.date, todaysEvent.endTime);

    // if now >= end - 30min => closed
    const stillOpen = now.getTime() < end.getTime() - THIRTY_MIN;
    setOpenToday(stillOpen);
  }, [events, now]);

  return (
    <EventsContext.Provider value={{ events, isOpen, loading, setForcedIsOpen }}>
      {children}
    </EventsContext.Provider>
  );
};

export const useEvents = () => useContext(EventsContext);