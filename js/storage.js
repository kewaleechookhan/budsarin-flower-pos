import { STORAGE_KEYS, readStorage, writeStorage } from './storage-registry.js';

export function loadState(fallback) {
  const saved = readStorage(STORAGE_KEYS.dashboardState, null) || readStorage(STORAGE_KEYS.dashboardLegacy, null);
  return saved ? { ...fallback, ...saved } : fallback;
}

export function saveState(state) {
  writeStorage(STORAGE_KEYS.dashboardState, state);
  writeStorage(STORAGE_KEYS.dashboardLegacy, state);
}

export function loadPosState() {
  const fallback = { sales: [], heldBills: [], cartDraft: null, dailySalesSummary: { total: 0, count: 0, grossProfit: 0 } };
  const legacy = readStorage(STORAGE_KEYS.posLegacy, {});
  const sales = readStorage(STORAGE_KEYS.sales, legacy.sales || []);
  const heldBills = readStorage(STORAGE_KEYS.heldBills, legacy.heldBills || []);
  const cartDraft = readStorage(STORAGE_KEYS.cartDraft, legacy.cartDraft || null);
  return { ...fallback, ...legacy, sales, heldBills, cartDraft };
}

export function savePosState(state) {
  writeStorage(STORAGE_KEYS.sales, state.sales || []);
  writeStorage(STORAGE_KEYS.heldBills, state.heldBills || []);
  writeStorage(STORAGE_KEYS.cartDraft, state.cartDraft || null);
  writeStorage(STORAGE_KEYS.posLegacy, state);
}
