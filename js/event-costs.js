import { eventCostCategories, mockEventProjects } from './events-data.js';
import { readStorage, writeStorage, STORAGE_KEYS } from './storage-registry.js';

const KEY = STORAGE_KEYS.eventCosts;
const EXPENSE_KEY = STORAGE_KEYS.expenseTransactions;

export function loadEventCosts() {
  const saved = readStorage(KEY, null);
  if (Array.isArray(saved) && saved.length) return saved;
  const rows = mockEventProjects.flatMap(event => seedCostsForEvent(event));
  writeStorage(KEY, rows);
  return rows;
}

export const saveEventCosts = rows => writeStorage(KEY, rows);

export function addEventCost(data, syncExpense = false) {
  const rows = loadEventCosts();
  const item = normalizeCost(data);
  rows.unshift(item);
  saveEventCosts(rows);
  if (syncExpense) syncEventCostToFinance(item);
  return item;
}

export function deleteEventCost(id) {
  saveEventCosts(loadEventCosts().filter(item => item.id !== id));
}

export function syncEventCostToFinance(cost) {
  const expenses = readStorage(EXPENSE_KEY, []);
  if (expenses.some(item => item.sourceType === 'event_cost' && item.sourceId === cost.id)) return null;
  const item = {
    id: crypto.randomUUID(),
    transactionNo: `EV-EXP-${String(expenses.length + 1).padStart(4, '0')}`,
    date: new Date().toISOString().slice(0, 10),
    description: `${cost.category} • ${cost.itemName}`,
    category: cost.category,
    amount: Number(cost.totalCost || 0),
    paymentMethod: 'transfer',
    paymentStatus: 'paid',
    supplierName: cost.supplierName || '',
    sourceType: 'event_cost',
    sourceId: cost.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  expenses.unshift(item);
  writeStorage(EXPENSE_KEY, expenses);
  return item;
}

function normalizeCost(data) {
  const quantity = Number(data.quantity || 1);
  const unitCost = Number(data.unitCost || 0);
  return {
    id: data.id || crypto.randomUUID(),
    eventId: data.eventId,
    category: data.category || eventCostCategories[0],
    itemName: data.itemName || 'Event cost',
    description: data.description || '',
    quantity,
    unit: data.unit || 'ชุด',
    unitCost,
    totalCost: quantity * unitCost,
    supplierId: data.supplierId || '',
    supplierName: data.supplierName || '',
    isActual: Boolean(data.isActual),
    note: data.note || '',
    createdAt: data.createdAt || new Date().toISOString()
  };
}

function seedCostsForEvent(event) {
  return [
    ['ดอกไม้', 'ดอกไม้สดตามธีม', 1, Math.round(event.estimatedCost * .42)],
    ['โครงสร้าง / Backdrop', 'Backdrop และโครงสร้าง', 1, Math.round(event.estimatedCost * .23)],
    ['ค่าแรงทีมงาน', 'ทีมติดตั้งและรื้อถอน', 1, Math.round(event.estimatedCost * .2)],
    ['ค่ารถ / ค่าน้ำมัน', 'ขนส่งอุปกรณ์', 1, Math.round(event.estimatedCost * .08)],
    ['Waste / Loss', 'เผื่อสูญเสียดอกไม้', 1, Math.round(event.estimatedCost * .07)]
  ].map((row, index) => normalizeCost({ id: `${event.id}-cost-${index + 1}`, eventId: event.id, category: row[0], itemName: row[1], quantity: row[2], unitCost: row[3], isActual: false }));
}
