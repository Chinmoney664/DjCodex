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
const isLocalPreview = ["localhost", "127.0.0.1"].includes(window.location.hostname);

const icons = {
  instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.6" fill="currentColor"/>',
  tiktok: '<path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5"/><path d="M14 3c.4 2.6 2.2 4.4 5 4.6"/>',
  youtube: '<rect x="2.5" y="5.5" width="19" height="13" rx="4"/><path d="m10 9.5 5 2.5-5 2.5z" fill="currentColor"/>',
  music: '<path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="3" y="14" width="4" height="6" rx="1.5"/><rect x="17" y="14" width="4" height="6" rx="1.5"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  mail: '<rect x="3" y="5.5" width="18" height="13" rx="2.5"/><path d="m4 7 8 6 8-6"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>'
};

function iconSvg(name) {
  return `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${icons[name] || icons.link}</svg>`;
}

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

function hasTickets(event) {
  return /^https?:\/\//i.test(event.url || "");
}

function openInNewTab(link) {
  link.target = "_blank";
  link.rel = "noopener noreferrer";
}

function showRow(event, options = {}) {
  const tickets = hasTickets(event) && !options.past;
  const row = document.createElement("div");
  row.className = "show-row";
  if (options.past) row.classList.add("is-past");

  const thumb = event.image
    ? `<img class="show-thumb" src="${event.image}" alt="${event.imageAlt || ""}">`
    : `<span class="show-thumb show-date">${monthDay(event.date)}</span>`;
  const title = tickets
    ? `<a class="show-link" href="${event.url}" target="_blank" rel="noopener noreferrer">${event.title || ""}</a>`
    : `<span>${event.title || ""}</span>`;
  const promo = event.promoCode && !options.past
    ? `<button type="button" class="promo-chip" data-copy="${event.promoCode}" aria-label="Copy promo code ${event.promoCode}"><span class="promo-label" data-copy-label>Code</span> <strong>${event.promoCode}</strong></button>`
    : "";

  row.innerHTML = `
    ${thumb}
    <span class="show-copy">
      <b>${title}</b>
      <small>${eventMeta(event)}</small>
    </span>
    <span class="show-side">
      <span class="show-action">${tickets ? "Tickets" : options.past ? "" : "Private"}</span>
      ${promo}
    </span>
  `;

  return row;
}

function renderUpcomingEvents() {
  const list = document.querySelector("[data-upcoming-events]");
  const emptyState = document.querySelector("[data-empty-upcoming]");
  if (!list) return;

  list.innerHTML = "";
  upcomingEvents.forEach((event) => list.appendChild(showRow(event)));
  if (emptyState) emptyState.hidden = upcomingEvents.length > 0;
}

function visibleLinks() {
  return codexLinks.filter((link) => link.url || isLocalPreview);
}

const iconOnly = ["instagram", "tiktok", "youtube", "mail"];

function renderLinks() {
  const list = document.querySelector("[data-links]");
  const iconRow = document.querySelector("[data-social-links]");

  visibleLinks().forEach((item) => {
    if (iconRow && iconOnly.includes(item.icon)) {
      const icon = document.createElement("a");
      icon.className = "social-icon";
      if (!item.url) icon.classList.add("is-placeholder");
      icon.href = item.url || "#";
      icon.setAttribute("aria-label", item.label);
      if (/^https?:\/\//i.test(item.url)) openInNewTab(icon);
      icon.innerHTML = iconSvg(item.icon);
      iconRow.appendChild(icon);
      return;
    }

    const button = document.createElement("a");
    button.className = "link-button";
    button.href = item.url || "#";
    if (!item.url) button.classList.add("is-placeholder");
    if (/^https?:\/\//i.test(item.url)) openInNewTab(button);
    button.innerHTML = `
      ${iconSvg(item.icon)}
      <span>${item.label}</span>
      ${item.url ? "" : '<em>link needed</em>'}
    `;
    list?.appendChild(button);

  });
}

function renderPastEvents() {
  const section = document.querySelector("[data-admin-archive]");
  const list = document.querySelector("[data-past-events]");
  const count = document.querySelector("[data-past-count]");
  if (!section || !list) return;

  section.hidden = !isAdminView;
  list.innerHTML = "";
  pastEvents.forEach((event) => list.appendChild(showRow(event, { past: true })));
  if (count) count.textContent = `(${pastEvents.length})`;
}

document.addEventListener("click", async (clickEvent) => {
  const button = clickEvent.target.closest("[data-copy]");
  if (!button) return;

  const label = button.querySelector("[data-copy-label]");
  try {
    await navigator.clipboard.writeText(button.dataset.copy);
    if (label) label.textContent = "Copied";
  } catch {
    if (label) label.textContent = "";
  }
  setTimeout(() => {
    if (label) label.textContent = "Code";
  }, 1800);
});

renderUpcomingEvents();
renderLinks();
renderPastEvents();
