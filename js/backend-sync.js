import { apiBootstrap, apiImportLocalStorage, apiSupabaseSync, getBackendSession, localStorageSnapshotForBackend } from './api-client.js';
import { STORAGE_KEYS, writeStorage } from './storage-registry.js';
import { getSyncStatus, processOfflineQueue } from './offline-queue.js';

const AUTO_SYNC_INTERVAL_MS = 2 * 60 * 1000;
let autoSyncTimer = null;
let syncInFlight = false;

const collectionToKey = {
  sales: STORAGE_KEYS.sales,
  orders: STORAGE_KEYS.orders,
  events: STORAGE_KEYS.events,
  event_quotations: STORAGE_KEYS.eventQuotations,
  event_payments: STORAGE_KEYS.eventPayments,
  event_costs: STORAGE_KEYS.eventCosts,
  inventory_items: STORAGE_KEYS.inventoryItems,
  inventory_recipes: STORAGE_KEYS.inventoryRecipes,
  stock_movements: STORAGE_KEYS.stockMovements,
  waste_items: STORAGE_KEYS.wasteItems,
  income_transactions: STORAGE_KEYS.incomeTransactions,
  expense_transactions: STORAGE_KEYS.expenseTransactions,
  customers: STORAGE_KEYS.customers,
  suppliers: STORAGE_KEYS.suppliers,
  purchase_orders: STORAGE_KEYS.purchaseOrders,
  calendar_events: STORAGE_KEYS.calendarEvents
};

export async function pullBackendToLocalStorage() {
  const db = await apiBootstrap();
  Object.entries(collectionToKey).forEach(([collection, key]) => {
    if (key && Array.isArray(db[collection])) writeStorage(key, db[collection]);
  });
  window.dispatchEvent(new CustomEvent('dashboard:update'));
  window.dispatchEvent(new CustomEvent('calendar:refresh'));
  window.dispatchEvent(new CustomEvent('inventory:update'));
  return db;
}

export async function pushLocalStorageToBackend() {
  return apiImportLocalStorage(localStorageSnapshotForBackend());
}

export async function syncOnlineNow({ includeSupabase = true } = {}) {
  if (syncInFlight || navigator.onLine === false || !getBackendSession()?.token) return { skipped: true };
  syncInFlight = true;
  try {
    await processOfflineQueue();
    await pushLocalStorageToBackend();
    const db = await pullBackendToLocalStorage();
    let supabase = null;
    if (includeSupabase) {
      try { supabase = await apiSupabaseSync(); } catch (error) { supabase = { ok: false, error: error.message }; }
    }
    return { ok: true, db, supabase, queue: getSyncStatus(), at: new Date().toISOString() };
  } finally {
    syncInFlight = false;
  }
}

export function startBackendSyncBridge() {
  window.addEventListener('backend:pull', () => pullBackendToLocalStorage().catch(console.warn));
  window.addEventListener('backend:push', () => pushLocalStorageToBackend().catch(console.warn));
  window.addEventListener('online', () => syncOnlineNow().catch(console.warn));
  window.addEventListener('offline-queue:update', () => {
    if (navigator.onLine !== false && getSyncStatus().pending) syncOnlineNow({ includeSupabase: false }).catch(console.warn);
  });
  if (!autoSyncTimer) autoSyncTimer = window.setInterval(() => syncOnlineNow().catch(console.warn), AUTO_SYNC_INTERVAL_MS);
  window.setTimeout(() => syncOnlineNow().catch(console.warn), 2500);
}
