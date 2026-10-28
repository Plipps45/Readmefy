// Interface icons, drawn on a 24px grid with one 1.75 stroke so they read as one family
const P = {
  undo: "M9 14 4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11",
  redo: "m15 14 5-5-5-5M20 9H9.5a5.5 5.5 0 0 0 0 11H13",
  globe: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM3.5 9h17M3.5 15h17M12 3c-2.4 2.5-3.6 5.5-3.6 9s1.2 6.5 3.6 9M12 3c2.4 2.5 3.6 5.5 3.6 9s-1.2 6.5-3.6 9",
  link: "M10 13.5a4.5 4.5 0 0 0 6.4.4l3-3a4.5 4.5 0 0 0-6.4-6.4l-1.2 1.2M14 10.5a4.5 4.5 0 0 0-6.4-.4l-3 3a4.5 4.5 0 0 0 6.4 6.4l1.2-1.2",
  sun: "M12 7.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9ZM12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4",
  moon: "M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z",
  desktop: "M3 5h18v11H3zM8.5 20h7M12 16v4",
  mobile: "M7 2.5h10v19H7zM11 18.5h2",
  replay: "M3.5 12a8.5 8.5 0 1 0 2.6-6.1M3.5 4v4.5H8",
  close: "M6 6l12 12M18 6 6 18",
  grip: "M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01",
  eye: "M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12ZM12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z",
  eyeOff: "M3 3l18 18M10.6 5.6A9 9 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a16 16 0 0 1-2.9 3.6M6.4 6.9A16 16 0 0 0 2.5 12s3.5 6.5 9.5 6.5a9 9 0 0 0 4.2-1M9.9 9.9a3 3 0 0 0 4.2 4.2",
  copy: "M9 9h11v11H9zM5 15H4V4h11v1",
  trash: "M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3",
  back: "M19 12H5M11 6l-6 6 6 6",
  up: "M12 19V5M6 11l6-6 6 6",
  down: "M12 5v14M6 13l6 6 6-6",
  plus: "M12 5v14M5 12h14",
  code: "m8 7-5 5 5 5M16 7l5 5-5 5",
  files: "M6 2.5h8l4 4v15H6zM14 2.5v4h4",
  eyeDrop: "M12 3.5a4.2 4.2 0 0 0-4.2 4.2c0 3.2 4.2 7.3 4.2 7.3s4.2-4.1 4.2-7.3A4.2 4.2 0 0 0 12 3.5ZM5 20.5h14",
};

export function ui(name, size = 18) {
  return `<svg class="ui-i" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${P[name]}"/></svg>`;
}

// Fills every [data-ui] element in static markup
export function hydrateIcons(root = document) {
  for (const el of root.querySelectorAll("[data-ui]")) el.insertAdjacentHTML("afterbegin", ui(el.dataset.ui, Number(el.dataset.size) || 18));
}
