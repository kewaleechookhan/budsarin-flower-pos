import { loadBackendSettings } from './api-contracts.js';
import { STORAGE_KEYS, readStorage, writeStorage } from './storage-registry.js';

const SESSION_KEY = 'budsarin_backend_session';

export function getApiBaseUrl() {
  const settings = loadBackendSettings();
  return settings.apiBaseUrl || `${location.origin}/api`;
}

export function getBackendSession() {
  return readStorage(SESSION_KEY, null);
}

export function saveBackendSession(session) {
  return writeStorage(SESSION_KEY, session);
}

export function clearBackendSession() {
  localStorage.removeItem(SESSION_KEY);
}

export async function apiRequest(path, { method = 'GET', body = null, auth = true } = {}) {
  const session = getBackendSession();
  const headers = { 'Content-Type': 'application/json' };
  if (auth && session?.token) headers.Authorization = `Bearer ${session.token}`;
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    method,
    headers,
    body: body == null ? null : JSON.stringify(body)
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) throw new Error(data?.error || `API error ${response.status}`);
  return data;
}

export const apiLoginWithPin = payload => apiRequest('/auth/pin-login', { method: 'POST', body: payload, auth: false });
export const apiHealth = () => apiRequest('/health', { auth: false });
export const apiBootstrap = () => apiRequest('/bootstrap');
export const apiList = collection => apiRequest(`/collections/${collection}`);
export const apiUpsert = (collection, item) => apiRequest(`/collections/${collection}`, { method: 'POST', body: item });
export const apiRemove = (collection, id) => apiRequest(`/collections/${collection}/${id}`, { method: 'DELETE' });
export const apiCreateBackup = () => apiRequest('/backups', { method: 'POST' });
export const apiListBackups = () => apiRequest('/backups');
export const apiRestoreBackup = name => apiRequest('/backups/restore', { method: 'POST', body: { name } });
export const apiImportLocalStorage = snapshot => apiRequest('/admin/import-localstorage', { method: 'POST', body: snapshot });
export const apiSendOfflineQueue = actions => apiRequest('/sync/offline-queue', { method: 'POST', body: { actions } });
export const apiSupabaseStatus = () => apiRequest('/supabase/status');
export const apiSupabasePush = () => apiRequest('/supabase/push', { method: 'POST' });
export const apiSupabasePull = () => apiRequest('/supabase/pull', { method: 'POST' });
export const apiSupabaseSync = () => apiRequest('/supabase/sync', { method: 'POST' });
export const apiConsumeRecipe = payload => apiRequest('/inventory/consume-recipe', { method: 'POST', body: payload });
export const apiSaveRecipe = payload => apiRequest('/inventory/recipes', { method: 'POST', body: payload });
export const apiCreatePaymentQR = payload => apiRequest('/qr/payments', { method: 'POST', body: payload });
export const apiSendLine = payload => apiRequest('/line/send', { method: 'POST', body: payload });
export const apiPrinterJob = payload => apiRequest('/printer/jobs', { method: 'POST', body: payload });

export function localStorageSnapshotForBackend() {
  const keys = [
    STORAGE_KEYS.sales,
    STORAGE_KEYS.orders,
    STORAGE_KEYS.events,
    STORAGE_KEYS.eventQuotations,
    STORAGE_KEYS.eventPayments,
    STORAGE_KEYS.eventCosts,
    STORAGE_KEYS.inventoryItems,
    STORAGE_KEYS.stockMovements,
    STORAGE_KEYS.wasteItems,
    STORAGE_KEYS.incomeTransactions,
    STORAGE_KEYS.expenseTransactions,
    STORAGE_KEYS.customers,
    STORAGE_KEYS.suppliers,
    STORAGE_KEYS.purchaseOrders,
    STORAGE_KEYS.calendarEvents
  ].filter(Boolean);
  return keys.reduce((snapshot, key) => {
    snapshot[key] = readStorage(key, []);
    return snapshot;
  }, {});
}
