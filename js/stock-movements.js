import { mockStockMovements } from './inventory-data.js';
import { STORAGE_KEYS, readStorage, writeStorage } from './storage-registry.js';

const KEY = STORAGE_KEYS.stockMovements;

export function loadStockMovements() {
  const saved = readStorage(KEY, null);
  if (Array.isArray(saved)) return saved;
  const seed = structuredClone(mockStockMovements);
  writeStorage(KEY, seed);
  return seed;
}

export const saveStockMovements = movements => writeStorage(KEY, movements);

export function createStockMovement(data) {
  const movements = loadStockMovements();
  const item = normalizeMovement(data, movements);
  movements.unshift(item);
  saveStockMovements(movements);
  return item;
}

export function getMovementsByItem(itemId) {
  return loadStockMovements().filter(item => item.itemId === itemId);
}

export function getStockInCost(movements = loadStockMovements()) {
  return movements.filter(item => item.movementType === 'stock_in').reduce((sum, item) => sum + Number(item.totalCost || 0), 0);
}

function normalizeMovement(data, movements) {
  const quantity = Math.max(Number(data.quantity || 0), 0);
  const unitCost = Math.max(Number(data.unitCost || 0), 0);
  return {
    id: data.id || crypto.randomUUID(),
    movementNo: data.movementNo || `SM-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${String(movements.length + 1).padStart(3, '0')}`,
    itemId: data.itemId || '',
    itemName: data.itemName || '',
    movementType: data.movementType || 'adjustment',
    quantity,
    unit: data.unit || '',
    unitCost,
    totalCost: data.totalCost ?? quantity * unitCost,
    referenceType: data.referenceType || 'manual',
    referenceId: data.referenceId || '',
    supplierId: data.supplierId || '',
    supplierName: data.supplierName || '',
    reason: data.reason || '',
    movementDate: data.movementDate || new Date().toISOString().slice(0, 10),
    createdBy: data.createdBy || 'Owner',
    note: data.note || '',
    createdAt: data.createdAt || new Date().toISOString()
  };
}
