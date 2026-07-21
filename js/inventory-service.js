import { addExpense } from './finance-service.js';
import { calculateAverageCost, calculateItemValue, calculateStockTurnover, calculateStockValue, calculateWasteCost, calculateWasteRate, detectLowStockItems, detectUseSoonItems, determineQualityStatus } from './inventory-calculations.js';
import { defaultInventorySettings, mockInventoryItems } from './inventory-data.js';
import { createStockMovement, getStockInCost, loadStockMovements } from './stock-movements.js?v=20260719b';
import { loadState, saveState } from './storage.js';
import { STORAGE_KEYS, readStorage, writeStorage } from './storage-registry.js';
import { createWasteRecord, loadWasteItems } from './waste-management.js?v=20260719b';

const ITEM_KEY = STORAGE_KEYS.inventoryItems;
const SETTINGS_KEY = STORAGE_KEYS.inventorySettings;

export function loadInventoryItems() {
  const saved = readStorage(ITEM_KEY, null);
  const rows = Array.isArray(saved) ? saved : [];
  if (!Array.isArray(saved)) writeStorage(ITEM_KEY, rows);
  return rows.map(item => ({ ...item, qualityStatus: determineQualityStatus(item, loadInventorySettings()) }));
}

export function saveInventoryItems(items) {
  writeStorage(ITEM_KEY, items);
  syncInventoryDashboard(items);
  window.dispatchEvent(new CustomEvent('inventory:update', { detail: items }));
  return items;
}

export function loadInventorySettings() {
  return { ...defaultInventorySettings, ...readStorage(SETTINGS_KEY, {}) };
}

export const saveInventorySettings = settings => writeStorage(SETTINGS_KEY, { ...loadInventorySettings(), ...normalizeSettings(settings) });

export function saveInventoryItem(data) {
  const rows = loadInventoryItems();
  const item = normalizeInventoryItem(data, rows);
  const index = rows.findIndex(row => row.id === item.id);
  if (index >= 0) rows[index] = item;
  else rows.unshift(item);
  saveInventoryItems(rows);
  return item;
}

export function deleteInventoryItem(id) {
  const rows = loadInventoryItems();
  const next = rows.filter(row => row.id !== id);
  if (next.length === rows.length) throw new Error('ไม่พบรายการสต็อก');
  saveInventoryItems(next);
  return next;
}

export function receiveStock(data, syncExpense = false) {
  const rows = loadInventoryItems();
  const item = data.itemId ? rows.find(row => row.id === data.itemId) : null;
  const target = item || normalizeInventoryItem(data, rows);
  const inQty = Math.max(Number(data.quantity || 0), 0);
  const unitCost = Math.max(Number(data.unitCost || data.costPerUnit || target.costPerUnit || 0), 0);
  if (inQty <= 0) throw new Error('จำนวนรับเข้าต้องมากกว่า 0');
  target.averageCost = calculateAverageCost(target.quantityOnHand, target.averageCost || target.costPerUnit, inQty, unitCost);
  target.costPerUnit = unitCost;
  target.quantityOnHand = Number(target.quantityOnHand || 0) + inQty;
  target.receivedDate = data.receivedDate || new Date().toISOString().slice(0, 10);
  target.expiryDate = data.expiryDate || target.expiryDate || '';
  target.useByDate = data.useByDate || target.useByDate || '';
  target.storageLocation = data.storageLocation || target.storageLocation || '';
  target.supplierId = data.supplierId || target.supplierId || '';
  target.supplierName = data.supplierName || target.supplierName || '';
  target.updatedAt = new Date().toISOString();
  const nextRows = item ? rows.map(row => row.id === target.id ? target : row) : [target, ...rows];
  saveInventoryItems(nextRows);
  const movement = createStockMovement({ ...data, itemId: target.id, itemName: target.itemName, movementType: 'stock_in', quantity: inQty, unit: target.unit, unitCost, supplierId: target.supplierId, supplierName: target.supplierName, referenceType: data.referenceType || 'supplier_purchase', reason: data.reason || 'รับเข้าสินค้า' });
  if (syncExpense || loadInventorySettings().autoFinanceExpenseStockIn) syncStockInExpense(target, movement);
  return target;
}

export function deductStock(data) {
  const rows = loadInventoryItems();
  const item = rows.find(row => row.id === data.itemId);
  if (!item) throw new Error('ไม่พบรายการสต็อก');
  const quantity = Math.max(Number(data.quantity || 0), 0);
  if (quantity <= 0) throw new Error('จำนวนตัดออกต้องมากกว่า 0');
  const settings = loadInventorySettings();
  if (!settings.allowNegativeStock && quantity > Number(item.quantityOnHand || 0)) throw new Error('จำนวนตัดออกมากกว่าคงเหลือ');
  item.quantityOnHand = Number(item.quantityOnHand || 0) - quantity;
  item.updatedAt = new Date().toISOString();
  saveInventoryItems(rows);
  return createStockMovement({ ...data, itemName: item.itemName, movementType: data.movementType || 'stock_out', unit: item.unit, unitCost: item.averageCost || item.costPerUnit, totalCost: quantity * Number(item.averageCost || item.costPerUnit || 0), referenceType: data.referenceType || 'manual', reason: data.reason || 'ตัดสต็อก' });
}

export function adjustStock(data) {
  const rows = loadInventoryItems();
  const item = rows.find(row => row.id === data.itemId);
  if (!item) throw new Error('ไม่พบรายการสต็อก');
  const nextQuantity = Math.max(Number(data.quantityOnHand || 0), 0);
  const diff = nextQuantity - Number(item.quantityOnHand || 0);
  item.quantityOnHand = nextQuantity;
  item.updatedAt = new Date().toISOString();
  saveInventoryItems(rows);
  return createStockMovement({ itemId: item.id, itemName: item.itemName, movementType: 'adjustment', quantity: Math.abs(diff), unit: item.unit, unitCost: item.averageCost || item.costPerUnit, referenceType: 'adjustment', reason: data.reason || 'ปรับยอดสต็อก', note: data.note || '' });
}

export function recordWaste(data) {
  const rows = loadInventoryItems();
  const item = rows.find(row => row.id === data.itemId);
  if (!item) throw new Error('ไม่พบรายการสต็อก');
  const quantity = Math.max(Number(data.quantity || 0), 0);
  if (quantity <= 0) throw new Error('จำนวนของเสียต้องมากกว่า 0');
  const settings = loadInventorySettings();
  if (!settings.allowNegativeStock && quantity > Number(item.quantityOnHand || 0)) throw new Error('จำนวนของเสียมากกว่าคงเหลือ');
  item.quantityOnHand = Number(item.quantityOnHand || 0) - quantity;
  item.qualityStatus = data.markDisposed ? 'disposed' : determineQualityStatus(item, settings);
  item.updatedAt = new Date().toISOString();
  saveInventoryItems(rows);
  const waste = createWasteRecord({ ...data, itemName: item.itemName, category: item.category, unit: item.unit, unitCost: item.averageCost || item.costPerUnit, qualityStatusBeforeWaste: item.qualityStatus });
  syncInventoryDashboard(rows);
  return waste;
}

export function getInventoryKpis(items = loadInventoryItems(), waste = loadWasteItems(), movements = loadStockMovements()) {
  const stockValue = calculateStockValue(items);
  const stockInCost = getStockInCost(movements);
  const wasteCost = calculateWasteCost(waste);
  const supplierCounts = movements.filter(item => item.movementType === 'stock_in').reduce((map, item) => {
    const key = item.supplierName || 'ไม่ระบุ';
    map[key] = (map[key] || 0) + 1;
    return map;
  }, {});
  const usageCounts = movements.filter(item => ['stock_out', 'waste'].includes(item.movementType)).reduce((map, item) => {
    map[item.itemName] = (map[item.itemName] || 0) + Number(item.quantity || 0);
    return map;
  }, {});
  return {
    totalItems: items.length,
    stockValue,
    lowStock: detectLowStockItems(items).length,
    useSoon: detectUseSoonItems(items, loadInventorySettings()).length,
    wasteCost,
    topUsedItem: topKey(usageCounts),
    topSupplier: topKey(supplierCounts),
    turnover: calculateStockTurnover(stockInCost * 0.68, stockValue || 1),
    wasteRate: calculateWasteRate(wasteCost, stockInCost)
  };
}

export function getInventoryAlerts(items = loadInventoryItems()) {
  return {
    lowStock: detectLowStockItems(items),
    useSoon: detectUseSoonItems(items, loadInventorySettings())
  };
}

export function processPOSStockDeduction(sale) {
  if (!loadInventorySettings().autoDeductPOS || !sale?.items?.length) return [];
  return sale.items.flatMap(item => autoDeductByName(item.name, item.quantity, 'pos_sale', sale.id, 'ตัดสต็อกจาก POS'));
}

export function processOrderStockDeduction(order) {
  if (!loadInventorySettings().autoDeductOrders || !['preparing', 'completed'].includes(order?.orderStatus)) return [];
  return autoDeductByName(order.title || order.orderType, 1, 'order', order.id, 'ตัดสต็อกจาก Orders');
}

export function autoDeductByName(name, quantity, referenceType, referenceId, reason) {
  const rows = loadInventoryItems();
  const item = rows.find(row => name?.includes(row.itemName) || row.itemName.includes(name || ''));
  if (!item || !item.stockTracking) return [];
  try {
    deductStock({ itemId: item.id, quantity, referenceType, referenceId, reason });
    return [item.id];
  } catch {
    return [];
  }
}

export function syncInventoryDashboard(items = loadInventoryItems()) {
  const dashboard = loadState(null);
  if (!dashboard) return;
  const kpis = getInventoryKpis(items);
  const alerts = getInventoryAlerts(items);
  dashboard.stockAlerts = [...alerts.lowStock.slice(0, 3), ...alerts.useSoon.slice(0, 3)].slice(0, 5).map(item => ({
    name: item.itemName,
    detail: `${item.quantityOnHand} ${item.unit} • ${item.storageLocation}`,
    qty: item.quantityOnHand,
    level: Number(item.quantityOnHand) <= Number(item.minimumStock) ? 'danger' : 'warning'
  }));
  dashboard.inventory = { stockValue: kpis.stockValue, wasteCost: kpis.wasteCost, lowStock: kpis.lowStock, useSoon: kpis.useSoon };
  saveState(dashboard);
  window.dispatchEvent(new CustomEvent('dashboard:update', { detail: dashboard }));
}

function syncStockInExpense(item, movement) {
  return addExpense({
    date: movement.movementDate,
    description: `รับเข้าสต็อก ${item.itemName}`,
    category: 'ซื้อวัตถุดิบ',
    amount: movement.totalCost,
    paymentMethod: 'transfer',
    paymentStatus: 'paid',
    supplierName: item.supplierName,
    sourceType: 'stock_in',
    sourceId: movement.id
  });
}

function normalizeInventoryItem(data, rows) {
  const category = data.category || 'fresh_flower';
  return {
    id: data.id || crypto.randomUUID(),
    itemCode: data.itemCode || `INV-${String(rows.length + 1).padStart(4, '0')}`,
    itemName: data.itemName || 'รายการใหม่',
    category,
    subCategory: data.subCategory || '',
    unit: data.unit || 'ก้าน',
    quantityOnHand: Math.max(Number(data.quantityOnHand || 0), 0),
    minimumStock: Number(data.minimumStock || loadInventorySettings().defaultMinimumStockByCategory?.[category] || 0),
    maximumStock: Number(data.maximumStock || 0),
    costPerUnit: Number(data.costPerUnit || 0),
    averageCost: Number(data.averageCost || data.costPerUnit || 0),
    supplierId: data.supplierId || '',
    supplierName: data.supplierName || '',
    receivedDate: data.receivedDate || '',
    expiryDate: data.expiryDate || '',
    useByDate: data.useByDate || '',
    qualityStatus: data.qualityStatus || 'good',
    storageLocation: data.storageLocation || '',
    stockTracking: data.stockTracking !== 'false',
    isPerishable: data.isPerishable === true || data.isPerishable === 'true',
    note: data.note || '',
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

function normalizeSettings(settings) {
  return {
    ...settings,
    allowNegativeStock: settings.allowNegativeStock === 'true' || settings.allowNegativeStock === 'on' || settings.allowNegativeStock === true,
    autoDeductPOS: settings.autoDeductPOS === 'true' || settings.autoDeductPOS === 'on' || settings.autoDeductPOS === true,
    autoDeductOrders: settings.autoDeductOrders === 'true' || settings.autoDeductOrders === 'on' || settings.autoDeductOrders === true,
    autoFinanceExpenseStockIn: settings.autoFinanceExpenseStockIn === 'true' || settings.autoFinanceExpenseStockIn === 'on' || settings.autoFinanceExpenseStockIn === true,
    useSoonWarningDays: Number(settings.useSoonWarningDays || 1),
    expiryWarningDays: Number(settings.expiryWarningDays || 3),
    targetWasteRate: Number(settings.targetWasteRate || 8)
  };
}

function topKey(map) {
  return Object.entries(map).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';
}
