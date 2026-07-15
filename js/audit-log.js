import { STORAGE_KEYS, readStorage, writeStorage } from './storage-registry.js';

export function loadAuditLogs() {
  return readStorage(STORAGE_KEYS.auditLogs, []);
}

export function logAudit({ action = 'unknown', entityType = '', entityId = '', status = 'success', detail = '', userId = 'user-owner', metadata = {} } = {}) {
  const logs = loadAuditLogs();
  const item = {
    id: crypto.randomUUID(),
    action,
    entityType,
    entityId,
    status,
    detail: sanitize(detail),
    userId,
    metadata: sanitizeMetadata(metadata),
    createdAt: new Date().toISOString()
  };
  logs.unshift(item);
  writeStorage(STORAGE_KEYS.auditLogs, logs.slice(0, 300));
  return item;
}

export function filterAuditLogs(filters = {}) {
  return loadAuditLogs().filter(item =>
    (!filters.action || item.action === filters.action) &&
    (!filters.entityType || item.entityType === filters.entityType) &&
    (!filters.status || filters.status === 'all' || item.status === filters.status)
  );
}

function sanitize(value) {
  return String(value || '').replace(/token|secret|password|pin/ig, '[redacted]');
}

function sanitizeMetadata(metadata = {}) {
  const clone = JSON.parse(JSON.stringify(metadata || {}));
  ['token', 'secret', 'password', 'pinCode', 'lineChannelAccessToken'].forEach(key => delete clone[key]);
  return clone;
}
