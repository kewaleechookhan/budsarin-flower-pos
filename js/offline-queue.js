import { STORAGE_KEYS, readStorage, writeStorage } from './storage-registry.js';
import { logAudit } from './audit-log.js';
import { apiSendOfflineQueue } from './api-client.js?v=20260719b';

const isOnline = () => navigator.onLine !== false;

export function loadOfflineQueue() {
  return readStorage(STORAGE_KEYS.offlineQueue, []);
}

export function saveOfflineQueue(queue) {
  return writeStorage(STORAGE_KEYS.offlineQueue, queue);
}

export function enqueueOfflineAction({ actionType, entityType, entityId, method = 'POST', endpoint = '', payload = {} }) {
  const queue = loadOfflineQueue();
  const idempotencyKey = `${entityType}:${entityId}:${actionType}`;
  const existing = queue.find(item => item.idempotencyKey === idempotencyKey && ['pending', 'failed'].includes(item.status));
  if (existing) return existing;
  const item = {
    id: crypto.randomUUID(),
    idempotencyKey,
    actionType,
    entityType,
    entityId,
    method,
    endpoint,
    payload: sanitizePayload(payload),
    createdAt: new Date().toISOString(),
    attempts: 0,
    lastAttemptAt: '',
    status: 'pending',
    errorMessage: ''
  };
  queue.unshift(item);
  saveOfflineQueue(queue);
  logAudit({ action: 'offline_enqueue', entityType, entityId, detail: actionType });
  window.dispatchEvent(new CustomEvent('offline-queue:update', { detail: getSyncStatus() }));
  return item;
}

export async function processOfflineQueue() {
  const queue = loadOfflineQueue();
  if (!isOnline()) return getSyncStatus();
  const pending = queue.filter(item => ['pending', 'failed'].includes(item.status));
  if (!pending.length) return getSyncStatus();
  const syncingAt = new Date().toISOString();
  saveOfflineQueue(queue.map(item => pending.some(row => row.id === item.id) ? { ...item, status: 'syncing', attempts: item.attempts + 1, lastAttemptAt: syncingAt, errorMessage: '' } : item));
  window.dispatchEvent(new CustomEvent('offline-queue:update', { detail: getSyncStatus() }));

  try {
    await apiSendOfflineQueue(pending);
  } catch (error) {
    const failed = loadOfflineQueue().map(item => pending.some(row => row.id === item.id) ? { ...item, status: 'failed', errorMessage: error.message || 'sync failed' } : item);
    saveOfflineQueue(failed);
    logAudit({ action: 'offline_queue_failed', entityType: 'offline_queue', status: 'failed', detail: error.message || 'sync failed' });
    window.dispatchEvent(new CustomEvent('offline-queue:update', { detail: getSyncStatus() }));
    return getSyncStatus();
  }

  let synced = 0;
  const syncedAt = new Date().toISOString();
  const next = loadOfflineQueue().map(item => {
    if (!pending.some(row => row.id === item.id)) return item;
    synced += 1;
    return { ...item, status: 'synced', syncedAt, errorMessage: '' };
  });
  saveOfflineQueue(next);
  if (synced) writeStorage(STORAGE_KEYS.lastSuccessfulSync, new Date().toISOString());
  if (synced) logAudit({ action: 'offline_queue_processed', entityType: 'offline_queue', status: 'success', detail: `${synced} action(s) marked synced` });
  window.dispatchEvent(new CustomEvent('offline-queue:update', { detail: getSyncStatus() }));
  return getSyncStatus();
}

export function retryFailedSync() {
  const next = loadOfflineQueue().map(item => item.status === 'failed' ? { ...item, status: 'pending', errorMessage: '' } : item);
  saveOfflineQueue(next);
  return processOfflineQueue();
}

export function clearSyncedActions() {
  const next = loadOfflineQueue().filter(item => item.status !== 'synced');
  saveOfflineQueue(next);
  window.dispatchEvent(new CustomEvent('offline-queue:update', { detail: getSyncStatus() }));
  return next.length;
}

export function resolveSyncConflict(id, resolution = 'keep_local') {
  const queue = loadOfflineQueue();
  const index = queue.findIndex(item => item.id === id);
  if (index < 0) return null;
  queue[index] = { ...queue[index], status: resolution === 'discard' ? 'cancelled' : 'pending', resolution };
  saveOfflineQueue(queue);
  return queue[index];
}

export function getSyncStatus() {
  const queue = loadOfflineQueue();
  const count = status => queue.filter(item => item.status === status).length;
  return {
    online: isOnline(),
    total: queue.length,
    pending: count('pending'),
    syncing: count('syncing'),
    synced: count('synced'),
    failed: count('failed'),
    conflict: count('conflict'),
    lastSuccessfulSync: readStorage(STORAGE_KEYS.lastSuccessfulSync, '')
  };
}

export function queueWhenOffline(action) {
  if (isOnline()) return null;
  return enqueueOfflineAction(action);
}

function sanitizePayload(payload) {
  const clone = JSON.parse(JSON.stringify(payload || {}));
  delete clone.pinCode;
  delete clone.lineChannelAccessToken;
  return clone;
}
