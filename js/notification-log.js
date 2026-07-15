import { STORAGE_KEYS, readStorage, writeStorage } from './storage-registry.js';

export function loadNotificationLogs() {
  return readStorage(STORAGE_KEYS.notificationLogs, []);
}

export function logNotification({ customerId = '', channel = 'line', templateKey = '', message = '', status = 'draft', errorMessage = '', sourceType = '', sourceId = '' }) {
  const logs = loadNotificationLogs();
  const item = { id: crypto.randomUUID(), customerId, channel, templateKey, message, status, sentAt: status === 'sent' ? new Date().toISOString() : '', errorMessage, sourceType, sourceId, createdAt: new Date().toISOString() };
  logs.unshift(item);
  writeStorage(STORAGE_KEYS.notificationLogs, logs.slice(0, 200));
  return item;
}

export function filterNotificationLogs(filters = {}) {
  return loadNotificationLogs().filter(item =>
    (!filters.customerId || item.customerId === filters.customerId) &&
    (!filters.channel || filters.channel === 'all' || item.channel === filters.channel) &&
    (!filters.status || filters.status === 'all' || item.status === filters.status)
  );
}
