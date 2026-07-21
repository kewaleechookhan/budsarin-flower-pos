import { createStockMovement } from './stock-movements.js?v=20260719b';
import { STORAGE_KEYS, readStorage, writeStorage } from './storage-registry.js';

const KEY = STORAGE_KEYS.wasteItems;

export function loadWasteItems() {
  const saved = readStorage(KEY, null);
  if (Array.isArray(saved)) return saved;
  writeStorage(KEY, []);
  return [];
}

export const saveWasteItems = rows => writeStorage(KEY, rows);

export function createWasteRecord(data) {
  const rows = loadWasteItems();
  const item = normalizeWaste(data, rows);
  rows.unshift(item);
  saveWasteItems(rows);
  createStockMovement({
    itemId: item.itemId,
    itemName: item.itemName,
    movementType: 'waste',
    quantity: item.quantity,
    unit: item.unit,
    unitCost: item.unitCost,
    totalCost: item.totalWasteCost,
    referenceType: 'waste',
    referenceId: item.id,
    reason: item.reason,
    movementDate: item.wasteDate,
    note: item.note
  });
  return item;
}

function normalizeWaste(data, rows) {
  const quantity = Math.max(Number(data.quantity || 0), 0);
  const unitCost = Math.max(Number(data.unitCost || 0), 0);
  return {
    id: data.id || crypto.randomUUID(),
    wasteNo: data.wasteNo || `WS-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${String(rows.length + 1).padStart(3, '0')}`,
    itemId: data.itemId || '',
    itemName: data.itemName || '',
    category: data.category || '',
    quantity,
    unit: data.unit || '',
    unitCost,
    totalWasteCost: data.totalWasteCost ?? quantity * unitCost,
    reason: data.reason || 'other',
    qualityStatusBeforeWaste: data.qualityStatusBeforeWaste || 'good',
    wasteDate: data.wasteDate || new Date().toISOString().slice(0, 10),
    photoPlaceholder: data.photoPlaceholder || 'waste-photo-placeholder',
    note: data.note || '',
    createdAt: data.createdAt || new Date().toISOString()
  };
}
