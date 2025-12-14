const header = document.querySelector("h3");
const dates = document.querySelector(".dates");
const navs = document.querySelectorAll("#prev, #next");

const sidebar = document.getElementById("event-sidebar");
const closeSidebarBtn = document.getElementById("close-sidebar");

const months = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

let date = new Date();
let month = date.getMonth();
let year = date.getFullYear();

const events = [
  { date: "2025-12-16", title: "Christmas Party", location: "New York", description: "Annual company Christmas party." },
  { date: "2025-12-25", title: "Xmas Day", location: "Worldwide", description: "Holiday event." },
];

function renderCalendar() {
  const start = new Date(year, month, 1).getDay();
  const endDate = new Date(year, month + 1, 0).getDate();
  const end = new Date(year, month, endDate).getDay();
  const endDatePrev = new Date(year, month, 0).getDate();

  let datesHtml = "";

  for (let i = start; i > 0; i--) {
    datesHtml += `<li class="inactive">${endDatePrev - i + 1}</li>`;
  }

  for (let i = 1; i <= endDate; i++) {
    const fullDate = `${year}-${String(month + 1).padStart(2,'0')}-${String(i).padStart(2,'0')}`;
    const event = events.find(ev => ev.date === fullDate);

    let className = "";
    if (i === date.getDate() && month === new Date().getMonth() && year === new Date().getFullYear()) {
      className = "today";
    }
    if (event) className += className ? " event" : "event";

    datesHtml += `<li class="${className}" 
                      data-date="${fullDate}" 
                      ${event ? `data-title="${event.title}" data-location="${event.location}" data-description="${event.description}"` : ""}>
                    ${i}${event ? `<br><small>${event.title}</small>` : ""}
                  </li>`;
  }

  for (let i = end; i < 6; i++) {
    datesHtml += `<li class="inactive">${i - end + 1}</li>`;
  }

  dates.innerHTML = datesHtml;
  header.textContent = `${months[month]} ${year}`;

  document.querySelectorAll(".dates li.event").forEach(li => {
    li.addEventListener("click", () => {
      document.getElementById("event-title").textContent = li.dataset.title;
      document.getElementById("event-date").textContent = li.dataset.date;
      document.getElementById("event-location").textContent = li.dataset.location;
      document.getElementById("event-description").textContent = li.dataset.description;
      sidebar.style.display = "block";
    });
  });
}

navs.forEach(nav => {
  nav.addEventListener("click", e => {
    const btnId = e.target.id;
    if (btnId === "prev" && month === 0) { year--; month = 11; }
    else if (btnId === "next" && month === 11) { year++; month = 0; }
    else { month = btnId === "next" ? month + 1 : month - 1; }
    date = new Date(year, month, new Date().getDate());
    year = date.getFullYear();
    month = date.getMonth();
    renderCalendar();
  });
});

closeSidebarBtn.addEventListener("click", () => {
  sidebar.style.display = "none";
});

renderCalendar();
