const header = document.querySelector("button");
const dates = document.querySelector(".dates");
const navs = document.querySelectorAll("#prev, #next");
const sidebar = document.getElementById("event-sidebar");
const closeSidebarBtn = document.getElementById("close-sidebar");
const url =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQz8wlSQU4x1ndGYJJgJsAIFrW2VVuXOBm8d9u8vAK7N5lypKUlYj46LP6xqF-Xqqv2PCIpB6EzP5ws/pub?output=csv";

const months = [
  "Januari ",
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

let date = new Date();
let month = date.getMonth();
let year = date.getFullYear();
let events = [];

/* ---------------- CSV PARSER ---------------- */
function parseCSVRow(row) {
  const result = [];
  let current = "";
  let insideQuotes = false;

  for (const char of row) {
    if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === "," && !insideQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current);
  return result.map((col) => col.replace(/^"|"$/g, "").trim());
}

/* ---------------- LOAD EVENTS ---------------- */
async function loadEventsFromSheet() {
  const response = await fetch(url);
  const csvText = await response.text();
  const rows = csvText.split("\n").slice(1).filter(Boolean);

  events = rows.map((row) => {
    const cols = parseCSVRow(row);
    return {
      date: formatDateForMatch(cols[0]), // YYYY-MM-DD
      displayDate: formatDateForDisplay(cols[0]), // DD-MM-YYYY
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
}

/* ---------------- DATE FORMATTING ---------------- */
function formatDateForMatch(sheetDate) {
  const [day, month, year] = sheetDate.split("/");
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}
function formatDateForDisplay(sheetDate) {
  const [day, month, year] = sheetDate.split("/");
  return `${day.padStart(2, "0")}-${month.padStart(2, "0")}-${year}`;
}

/* ---------------- RENDER CALENDAR ---------------- */
function renderCalendar() {
  const start = (new Date(year, month, 1).getDay() + 6) % 7;
  const endDate = new Date(year, month + 1, 0).getDate();
  const end = (new Date(year, month, endDate).getDay() + 6) % 7;
  const endDatePrev = new Date(year, month, 0).getDate();

  let datesHtml = "";

  // Vorige maand
  for (let i = start; i > 0; i--) {
    datesHtml += `<li class="inactive">${endDatePrev - i + 1}</li>`;
  }

  // Huidige maand
  for (let i = 1; i <= endDate; i++) {
    const fullDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(
      i
    ).padStart(2, "0")}`;
    const event = events.find((ev) => ev.date === fullDate);

    let className =
      i === date.getDate() &&
      month === new Date().getMonth() &&
      year === new Date().getFullYear()
        ? "today"
        : "";

    if (event) {
      const typeClass = `type-${event.type.toLowerCase().replace(/\s+/g, "-")}`;
      className += className ? ` event ${typeClass}` : `event ${typeClass}`;
    }

    datesHtml += `
      <li class="${className || "no-event"}" data-date="${fullDate}">
        <span class="day-number">${i}</span>
        ${
          event
            ? `<small>${event.title}</small><small>${event.location}</small>`
            : `<button class="add-event-btn">Toevoegen</button>`
        }
      </li>
    `;
  }

  // Next month
  for (let i = end; i < 6; i++) {
    datesHtml += `<li class="inactive">${i - end + 1}</li>`;
  }

  dates.innerHTML = datesHtml;
  header.textContent = `${months[month]} ${year}`;

  attachEventListeners();
}

/* ---------------- ATTACH CLICK LISTENERS ---------------- */
function attachEventListeners() {
  document.querySelectorAll(".dates li.event").forEach((li) => {
    li.addEventListener("click", () => {
      const event = events.find((ev) => ev.date === li.dataset.date);
      if (!event) return;
      renderEventSidebar(event);
    });
  });
}

/* ---------------- RENDER EVENT SIDEBAR ---------------- */
function renderEventSidebar(event) {
  sidebar.style.display = "block";

  const showAddress = event.type.toLowerCase() !== "privaat"; // alleen tonen als niet 'privaat'

  document.getElementById("event-content").innerHTML = `
    <article class="event-card">
      <header class="event-header">
        <h4 class="event-title">${event.title}</h4>
        <span class="event-type type-${event.type.toLowerCase()}">${
    event.type
  }</span>
      </header>

      <ul class="event-meta">
        <li>📅  ${event.displayDate}</li>
        <li>⏰  ${event.startTime} – ${event.endTime}</li>
        ${
          showAddress
            ? `<li id="event-map-link">📍<span>Adres wordt geladen...</span></li>`
            : ""
        }
        ${event.website? `<li><a href="${event.website}" target="_blank">🔗 Website</a></li>` : ''}
      </ul>

      <p class="event-description">${event.description}</p>

      ${
        showAddress && event.address
          ? `<div id="event-map" class="event-map"></div>`
          : ""
      }
    </article>
  `;

  if (showAddress && event.address) initMap(event);
}

/* ---------------- INITIALIZE MAP ---------------- */
function initMap(event) {
  const mapDiv = document.getElementById("event-map");
  if (!mapDiv) return;

  mapDiv.innerHTML = ""; // reset
  const map = L.map("event-map").setView([0, 0], 13);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
  }).addTo(map);

  fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      event.address
    )}`
  )
    .then((res) => res.json())
    .then((data) => {
      if (!data || data.length === 0) return;

      const lat = parseFloat(data[0].lat);
      const lon = parseFloat(data[0].lon);

      // Sla coördinaten op in het event object
      event.lat = lat;
      event.lon = lon;

      map.setView([lat, lon], 15);

      // Marker met popup
      const popupContent = `
        <a href="https://www.google.com/maps/search/?api=1&query=${lat},${lon}" 
           target="_blank" rel="noopener">
          ${event.address}
        </a>
      `;

      const marker = L.marker([lat, lon])
        .addTo(map)
        .bindPopup(popupContent)
        .openPopup();

      marker.setPopupContent(
        '<a href="https://www.google.com/maps?q=' +
          lat +
          "," +
          lon +
          '" target="_blank">Navigeren</a>'
      );

      // ✅ Update de sidebar-link
      const mapLink = document.getElementById("event-map-link");
      if (mapLink) {
        mapLink.innerHTML = `
          📍 
          <a href="https://www.google.com/maps/search/?api=1&query=${lat},${lon}" 
             target="_blank" rel="noopener">
            ${event.address}
          </a>
        `;
      }
    });
}

/* ---------------- NAVIGATION ---------------- */
const today = new Date(); // huidige datum

navs.forEach((nav) => {
  nav.addEventListener("click", (e) => {
    const btnId = e.target.id;

    // Bereken de gewenste nieuwe maand en jaar
    let newMonth = month;
    let newYear = year;

    if (btnId === "prev") {
      if (month === 0) {
        newYear--;
        newMonth = 11;
      } else {
        newMonth = month - 1;
      }
    } else if (btnId === "next") {
      if (month === 11) {
        newYear++;
        newMonth = 0;
      } else {
        newMonth = month + 1;
      }
    }

    // Check: mag je terug naar een vorige maand?
    if (
      newYear < today.getFullYear() ||
      (newYear === today.getFullYear() && newMonth < today.getMonth())
    ) {
      // Niet toegestaan: terug naar een maand die al voorbij is
      return;
    }

    // Update datum en render kalender
    date = new Date(newYear, newMonth, new Date().getDate());
    month = date.getMonth();
    year = date.getFullYear();
    renderCalendar();
  });
});

/* ---------------- CLOSE SIDEBAR ---------------- */
closeSidebarBtn.addEventListener("click", () => {
  sidebar.style.display = "none";
});

/* ---------------- ADD EVENT ---------------- */
const popup = document.getElementById("event-popup");
const confirmBtn = document.getElementById("popup-confirm");
const cancelBtn = document.getElementById("popup-cancel");

let selectedDate = null;

dates.addEventListener("click", (e) => {
  const btn = e.target.closest(".no-event");
  if (!btn) return;

  e.stopPropagation();

  const li = btn.closest("li");
  selectedDate = li?.dataset.date || null;

  // ✅ vul het formulier automatisch
  if (selectedDate) {
    const datumInput = document.getElementById("datum");
    datumInput.value = selectedDate;
  }

  popup.style.display = "flex";
});

confirmBtn.addEventListener("click", () => {
  popup.style.display = "none";

  const target = document.getElementById("2");
  if (target) {
    target.scrollIntoView({ behavior: "smooth" });
  }
});

cancelBtn.addEventListener("click", () => {
  popup.style.display = "none";
});

// klik buiten popup = sluiten
popup.addEventListener("click", (e) => {
  if (e.target === popup) {
    popup.style.display = "none";
  }
});

/* ---------------- INIT ---------------- */
(async function init() {
  await loadEventsFromSheet();
  renderCalendar();
})();
