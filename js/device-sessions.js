import { STORAGE_KEYS, readStorage, writeStorage } from './storage-registry.js';

export function getCurrentDeviceSession() {
  const sessions = loadDeviceSessions();
  const browser = navigator.userAgent.slice(0, 90);
  let current = sessions.find(item => item.browser === browser);
  if (!current) {
    current = {
      id: crypto.randomUUID(),
      storeId: 'budsarin-main-store',
      userId: 'user-owner',
      deviceName: navigator.platform || 'Browser Device',
      deviceType: detectDeviceType(),
      browser,
      lastSeenAt: new Date().toISOString(),
      syncStatus: navigator.onLine === false ? 'offline' : 'online',
      isTrusted: true,
      createdAt: new Date().toISOString()
    };
    sessions.unshift(current);
  } else {
    current.lastSeenAt = new Date().toISOString();
    current.syncStatus = navigator.onLine === false ? 'offline' : 'online';
  }
  writeStorage(STORAGE_KEYS.deviceSessions, sessions.slice(0, 12));
  return current;
}

export function loadDeviceSessions() {
  return readStorage(STORAGE_KEYS.deviceSessions, []);
}

export function removeDeviceSession(id) {
  const next = loadDeviceSessions().filter(item => item.id !== id);
  writeStorage(STORAGE_KEYS.deviceSessions, next);
  return next;
}

function detectDeviceType() {
  const ua = navigator.userAgent.toLowerCase();
  if (/ipad|tablet/.test(ua)) return 'tablet';
  if (/iphone|android.*mobile/.test(ua)) return 'mobile';
  return 'desktop';
}
