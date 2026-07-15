import { mockOrders } from './orders-data.js';
import { mockEvents, mockInventoryItems, mockWasteItems } from './reports-data.js';
import { mockCustomers, mockFollowUps, mockImportantDates } from './customers-data.js';
import { mockPurchaseOrders } from './suppliers-data.js';
import { loadCalendarSettings, upsertCalendarEvents } from './calendar-service.js';
import { loadManualTasks, manualTaskToEvent } from './manual-tasks.js';

export function syncCalendarFromOrders() {
  const orders = loadArray('budsarin_orders', mockOrders);
  const events = [];
  orders.forEach(order => {
    const date = order.dueDate || order.createdAt?.slice(0, 10);
    if (!date) return;
    events.push(toEvent(order, 'order', order.id, order.pickupMethod === 'delivery' ? 'delivery' : 'pickup', order.title || order.orderNo, date, order.dueTime || '10:00', order.deliveryAddress || 'หน้าร้าน'));
    events.push(toEvent(order, 'order', order.id, 'preparation', `เตรียม ${order.title || order.orderNo}`, date, previousHour(order.dueTime || '10:00'), 'Studio'));
  });
  return events;
}

export function syncCalendarFromEvents() {
  return loadArray('budsarin_events', mockEvents).flatMap(event => {
    const date = event.setupDate || event.eventDate || event.date;
    if (!date) return [];
    return [
      toEvent(event, 'event_project', event.id, 'setup', `Setup ${event.eventName || event.name}`, date, event.setupTime || event.startTime || '09:00', event.location || event.place || ''),
      toEvent(event, 'event_project', event.id, 'teardown', `Teardown ${event.eventName || event.name}`, event.teardownDate || date, event.teardownTime || '18:00', event.location || event.place || '')
    ];
  });
}

export function syncCalendarFromCustomers() {
  const followups = loadArray('budsarin_customer_followups', mockFollowUps).map(item => toEvent(item, 'customer_followup', item.id, 'follow_up', item.title || 'Follow-up ลูกค้า', item.dueDate, item.dueTime || '10:00', 'CRM'));
  const dates = loadArray('budsarin_customer_important_dates', mockImportantDates).map(item => toEvent(item, 'important_date', item.id, item.dateType === 'birthday' ? 'birthday' : 'anniversary', item.title || `วันสำคัญ ${item.customerName}`, item.date, '', 'CRM'));
  return [...followups, ...dates];
}

export function syncCalendarFromFinance() {
  const income = loadArray('budsarin_income_transactions', []).filter(item => item.dueDate && item.paymentStatus !== 'paid');
  const expenses = loadArray('budsarin_expense_transactions', []).filter(item => item.dueDate && item.paymentStatus !== 'paid');
  return [...income, ...expenses].map(item => toEvent(item, 'finance_due', item.id, 'payment_due', item.description || 'ครบกำหนดชำระ', item.dueDate, item.time || '11:00', 'Finance'));
}

export function syncCalendarFromSuppliers() {
  return loadArray('budsarin_purchase_orders', mockPurchaseOrders).map(po => toEvent(po, 'supplier_po', po.id, 'purchase_order', `รับ PO ${po.poNo || po.supplierName}`, po.expectedReceiveDate || po.orderDate, '10:00', po.supplierName || 'Supplier'));
}

export function syncCalendarFromInventory() {
  const inventory = loadArray('budsarin_inventory_items', mockInventoryItems);
  return inventory.flatMap(item => {
    const rows = [];
    if (item.useByDate || item.expiryDate) rows.push(toEvent(item, 'inventory_alert', item.id, 'stock_use_soon', `รีบใช้ ${item.itemName || item.name}`, item.useByDate || item.expiryDate, '', 'Inventory'));
    if (Number(item.quantity || item.currentStock || 0) <= Number(item.reorderPoint || item.minStock || 0)) rows.push(toEvent(item, 'inventory_alert', item.id, 'stock_expiry', `สต็อกใกล้หมด ${item.itemName || item.name}`, new Date().toISOString().slice(0, 10), '', 'Inventory'));
    return rows;
  });
}

export function syncAllCalendarEvents() {
  const settings = loadCalendarSettings();
  const events = [
    ...(settings.autoSyncOrders ? syncCalendarFromOrders() : []),
    ...(settings.autoSyncEvents ? syncCalendarFromEvents() : []),
    ...(settings.autoSyncCustomers ? syncCalendarFromCustomers() : []),
    ...(settings.autoSyncFinance ? syncCalendarFromFinance() : []),
    ...(settings.autoSyncSuppliers ? syncCalendarFromSuppliers() : []),
    ...(settings.autoSyncInventory ? syncCalendarFromInventory() : []),
    ...loadManualTasks().map(manualTaskToEvent)
  ].filter(item => item.startDate);
  return upsertCalendarEvents(events);
}

function toEvent(source, sourceType, sourceId, eventType, title, date, time, location) {
  return {
    sourceType,
    sourceId,
    title,
    description: source.description || source.note || '',
    eventType,
    startDate: date,
    startTime: time || '',
    endDate: date,
    endTime: '',
    allDay: !time,
    location: location || '',
    customerId: source.customerId || '',
    customerName: source.customerName || source.supplierName || source.contactPerson || '',
    relatedAmount: Number(source.totalAmount || source.amount || source.value || source.balanceAmount || 0),
    status: source.status === 'done' || source.followUpStatus === 'done' ? 'done' : 'pending',
    priority: source.priority || (eventType === 'payment_due' ? 'high' : 'normal'),
    assignedTo: source.assignedTo || 'ทีมร้าน',
    reminderEnabled: true,
    reminderMinutesBefore: 60,
    colorKey: sourceType,
    note: ''
  };
}

function loadArray(key, fallback) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key));
    return Array.isArray(parsed) ? parsed : [...fallback];
  } catch {
    return [...fallback];
  }
}

function previousHour(time) {
  const [hour, minute] = String(time || '10:00').split(':').map(Number);
  return `${String(Math.max(hour - 2, 8)).padStart(2, '0')}:${String(minute || 0).padStart(2, '0')}`;
}
