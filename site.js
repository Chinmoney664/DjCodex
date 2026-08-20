const today = new Date();
today.setHours(0, 0, 0, 0);

const sortedEvents = [...codexEvents].sort((a, b) => {
  if (!a.date) return 1;
  if (!b.date) return -1;
  return new Date(`${a.date}T00:00:00`) - new Date(`${b.date}T00:00:00`);
});

const upcomingEvents = sortedEvents.filter((event) => {
  if (!event.date) return true;
  return new Date(`${event.date}T00:00:00`) >= today;
});

const pastEvents = sortedEvents.filter((event) => {
  if (!event.date) return false;
  return new Date(`${event.date}T00:00:00`) < today;
}).reverse();

const isAdminView = new URLSearchParams(window.location.search).get("admin") === "1";

function monthDay(dateString) {
  if (!dateString) return "";
  const eventDate = new Date(`${dateString}T00:00:00`);
  const month = eventDate.toLocaleString("en-US", { month: "short" });
  const day = String(eventDate.getDate()).padStart(2, "0");
  return `${month}<br>${day}`;
}

function eventMeta(event) {
  return [event.displayDate, event.location].filter(Boolean).join(" · ");
}

function isExternalLink(url) {
  return /^https?:\/\//i.test(url || "");
}

function setEventLinkAttributes(link, event) {
  if (isExternalLink(event.url)) {
    link.target = "_blank";
    link.rel = "noopener noreferrer";
  }
}

function eventMedia(event) {
  if (event.image) {
    return `<img src="${event.image}" alt="${event.imageAlt || ""}">`;
  }

  return `<span class="event-ticket-art" aria-hidden="true">Tickets</span>`;
}

function eventRow(event, options = {}) {
  const link = document.createElement("a");
  link.className = "event-row";
  link.href = event.url || "#";
  setEventLinkAttributes(link, event);
  if (options.past) {
    link.classList.add("is-past");
  }

  link.innerHTML = `
    <span class="event-date">${monthDay(event.date)}</span>
    <span class="event-copy">
      <b>${event.title || ""}</b>
      <small>${eventMeta(event)}</small>
    </span>
    <span class="event-media">${eventMedia(event)}</span>
  `;

  return link;
}

function renderNextEvent() {
  const nextCard = document.querySelector("[data-next-event]");
  if (!nextCard) return;

  const nextEvent = upcomingEvents[0];

  if (!nextEvent) {
    nextCard.innerHTML = `
      <span>Next event</span>
      <h2>New dates soon</h2>
      <p>Check back for upcoming Codex events.</p>
      <span class="card-link">View archive</span>
    `;
    return;
  }

  nextCard.href = nextEvent.url || "#";
  setEventLinkAttributes(nextCard, nextEvent);
  nextCard.setAttribute("aria-label", `Next event: ${nextEvent.title}`);
  nextCard.innerHTML = `
    ${nextEvent.image ? `<img src="${nextEvent.image}" alt="${nextEvent.imageAlt || ""}">` : ""}
    <span>Next event</span>
    <h2>${nextEvent.title || ""}</h2>
    <p>${eventMeta(nextEvent)}</p>
    <span class="card-link">Get tickets</span>
  `;
}

function renderUpcomingEvents() {
  const eventList = document.querySelector("[data-upcoming-events]");
  const emptyState = document.querySelector("[data-empty-upcoming]");
  if (!eventList) return;

  eventList.innerHTML = "";
  upcomingEvents.forEach((event) => {
    eventList.appendChild(eventRow(event));
  });

  if (emptyState) {
    emptyState.hidden = upcomingEvents.length > 0;
  }
}

function renderPastEvents() {
  const adminSection = document.querySelector("[data-admin-archive]");
  const pastList = document.querySelector("[data-past-events]");
  const pastCount = document.querySelector("[data-past-count]");

  if (!adminSection || !pastList) return;

  adminSection.hidden = !isAdminView;
  pastList.innerHTML = "";

  pastEvents.forEach((event) => {
    pastList.appendChild(eventRow(event, { past: true }));
  });

  if (pastCount) {
    pastCount.textContent = `${pastEvents.length} saved`;
  }
}

renderNextEvent();
renderUpcomingEvents();
renderPastEvents();
