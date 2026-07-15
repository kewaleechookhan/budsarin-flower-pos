import { defaultNotificationSettings } from './settings-data.js';

const KEY = 'budsarin_notification_settings';

export function loadNotificationSettings() {
  try {
    return withoutRemovedRules({ ...defaultNotificationSettings, ...(JSON.parse(localStorage.getItem(KEY)) || {}) });
  } catch {
    return { ...defaultNotificationSettings };
  }
}

export function saveNotificationSettings(settings) {
  const next = { ...loadNotificationSettings(), ...settings };
  localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent('settings:notifications-updated', { detail: next }));
  return next;
}

export function updateNotificationSetting(id, patch) {
  const settings = loadNotificationSettings();
  if (!settings[id]) return settings;
  settings[id] = { ...settings[id], ...patch };
  return saveNotificationSettings(settings);
}

export function getDashboardNotificationRules() {
  return Object.entries(loadNotificationSettings())
    .filter(([, item]) => item.enabled && item.showOnDashboard)
    .map(([id, item]) => ({ id, ...item }));
}

function withoutRemovedRules(settings) {
  const next = { ...settings };
  delete next.birthday;
  return next;
}
