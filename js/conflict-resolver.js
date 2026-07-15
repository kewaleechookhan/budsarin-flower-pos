import { logAudit } from './audit-log.js';
import { STORAGE_KEYS, readStorage, writeStorage } from './storage-registry.js';

export function loadSyncConflicts() {
  return readStorage(STORAGE_KEYS.syncConflicts, []);
}

export function createSyncConflict({ entityType, entityId, localPayload = {}, remotePayload = {}, reason = 'version_mismatch', sourceActionId = '' }) {
  const conflicts = loadSyncConflicts();
  const existing = conflicts.find(item => item.entityType === entityType && item.entityId === entityId && item.status === 'open');
  if (existing) return existing;
  const conflict = {
    id: crypto.randomUUID(),
    entityType,
    entityId,
    localPayload,
    remotePayload,
    reason,
    sourceActionId,
    status: 'open',
    resolution: '',
    createdAt: new Date().toISOString(),
    resolvedAt: '',
    updatedAt: new Date().toISOString()
  };
  conflicts.unshift(conflict);
  writeStorage(STORAGE_KEYS.syncConflicts, conflicts);
  logAudit({ action: 'conflict_created', entityType, entityId, status: 'warning', detail: reason });
  window.dispatchEvent(new CustomEvent('sync-conflict:update', { detail: getConflictSummary() }));
  return conflict;
}

export function resolveSyncConflict(conflictId, resolution = 'keep_local') {
  const conflicts = loadSyncConflicts();
  const index = conflicts.findIndex(item => item.id === conflictId);
  if (index < 0) return null;
  conflicts[index] = {
    ...conflicts[index],
    status: 'resolved',
    resolution,
    resolvedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  writeStorage(STORAGE_KEYS.syncConflicts, conflicts);
  logAudit({ action: 'conflict_resolved', entityType: conflicts[index].entityType, entityId: conflicts[index].entityId, detail: resolution });
  window.dispatchEvent(new CustomEvent('sync-conflict:update', { detail: getConflictSummary() }));
  return conflicts[index];
}

export function reopenSyncConflict(conflictId) {
  const conflicts = loadSyncConflicts();
  const index = conflicts.findIndex(item => item.id === conflictId);
  if (index < 0) return null;
  conflicts[index] = { ...conflicts[index], status: 'open', resolution: '', updatedAt: new Date().toISOString() };
  writeStorage(STORAGE_KEYS.syncConflicts, conflicts);
  return conflicts[index];
}

export function getConflictSummary() {
  const conflicts = loadSyncConflicts();
  return {
    total: conflicts.length,
    open: conflicts.filter(item => item.status === 'open').length,
    resolved: conflicts.filter(item => item.status === 'resolved').length
  };
}

export function seedDemoConflict() {
  return createSyncConflict({
    entityType: 'order',
    entityId: 'ORD-DEMO-CONFLICT',
    reason: 'offline_order_updated_after_remote_change',
    localPayload: { orderNo: 'ORD-DEMO-CONFLICT', totalAmount: 1500, updatedAt: new Date().toISOString() },
    remotePayload: { orderNo: 'ORD-DEMO-CONFLICT', totalAmount: 1800, updatedAt: new Date(Date.now() - 3600000).toISOString() }
  });
}
