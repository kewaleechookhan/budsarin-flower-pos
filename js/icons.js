const icons = {
  'layout-dashboard': '<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>',
  'shopping-bag': '<path d="M6 7h12l-1 14H7L6 7Z"/><path d="M9 7a3 3 0 0 1 6 0"/>',
  package: '<path d="m3 7 9-4 9 4-9 4-9-4Z"/><path d="M3 7v10l9 4 9-4V7"/><path d="M12 11v10"/>',
  sparkles: '<path d="m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3Z"/><path d="M5 3v4M3 5h4M19 17v4M17 19h4"/>',
  'calendar-days': '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M8 2v4M16 2v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>',
  flower: '<path d="M12 12c-2-4-6-3-6 0s4 4 6 0Z"/><path d="M12 12c2-4 6-3 6 0s-4 4-6 0Z"/><path d="M12 12c-4 2-3 6 0 6s4-4 0-6Z"/><path d="M12 12c-4-2-3-6 0-6s4 4 0 6Z"/>',
  boxes: '<path d="M3 9h8v8H3zM13 7h8v10h-8zM7 17h10v5H7z"/>',
  wallet: '<path d="M3 6h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H3V6Z"/><path d="M18 12h3v4h-3a2 2 0 0 1 0-4Z"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  truck: '<path d="M3 6h12v11H3z"/><path d="M15 10h4l2 3v4h-6z"/><circle cx="7" cy="19" r="2"/><circle cx="17" cy="19" r="2"/>',
  'bar-chart-3': '<path d="M3 20h18M7 16V8M12 16V4M17 16v-6"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1-2 3.4-.2-.1a1.7 1.7 0 0 0-1.8.3 1.7 1.7 0 0 0-.8 1.5H9a1.7 1.7 0 0 0-.8-1.5 1.7 1.7 0 0 0-1.8-.3l-.2.1-2-3.4.1-.1A1.7 1.7 0 0 0 4.6 15 1.7 1.7 0 0 0 3 14v-4a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1 2-3.4.2.1a1.7 1.7 0 0 0 1.8-.3A1.7 1.7 0 0 0 9 2h6a1.7 1.7 0 0 0 .8 1.5 1.7 1.7 0 0 0 1.8.3l.2-.1 2 3.4-.1.1a1.7 1.7 0 0 0-.3 1.8 1.7 1.7 0 0 0 1.6 1v4a1.7 1.7 0 0 0-1.6 1Z"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z"/><path d="M10 21h4"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  save: '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"/><path d="M17 21v-8H7v8M7 3v5h8"/>',
  'edit-3': '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4 11.5-11.5Z"/>',
  trash: '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 15H6L5 6"/><path d="M10 11v6M14 11v6"/>',
  'trash-2': '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 15H6L5 6"/><path d="M10 11v6M14 11v6"/>',
  minus: '<path d="M5 12h14"/>',
  printer: '<path d="M6 9V3h12v6"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v8H6z"/>',
  download: '<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/>',
  calculator: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  'rotate-ccw': '<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 3v6h6"/>',
  'panel-left': '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16"/>',
  receipt: '<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2Z"/><path d="M8 7h8M8 11h8M8 15h5"/>',
  'package-check': '<path d="m3 7 9-4 9 4-9 4-9-4Z"/><path d="M3 7v10l9 4 9-4V7"/><path d="m9 15 2 2 4-4"/>',
  'trending-up': '<path d="m3 17 6-6 4 4 7-7"/><path d="M14 8h6v6"/>',
  'credit-card': '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h.01M11 15h2"/>',
  leaf: '<path d="M11 20A7 7 0 0 1 4 13C4 6 13 3 20 4c1 7-2 16-9 16Z"/><path d="M4 20c4-6 8-9 16-16"/>'
};

export function renderIcon(name) {
  return `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${icons[name] || icons.sparkles}</svg>`;
}

export function hydrateIcons(root = document) {
  root.querySelectorAll('[data-icon]').forEach(el => {
    el.innerHTML = renderIcon(el.dataset.icon) + el.innerHTML;
  });
}
