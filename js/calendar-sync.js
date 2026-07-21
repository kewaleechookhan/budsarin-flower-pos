import { loadCalendarSettings, saveCalendarEvents } from './calendar-service.js';
import { loadManualTasks, manualTaskToEvent } from './manual-tasks.js';

export function syncCalendarFromOrders() {
  const orders = loadArray('budsarin_orders', []);
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
  return loadArray('budsarin_events', []).flatMap(event => {
    const date = event.setupDate || event.eventDate || event.date;
    if (!date) return [];
    const name = event.projectName || event.eventName || event.name || 'งานจัดสถานที่';
    const location = event.venueName || event.location || event.place || '';
    const rows = [
      toEvent(event, 'event_project', event.id, 'setup', `Setup ${name}`, date, event.setupTime || event.startTime || '09:00', location),
      toEvent(event, 'event_project', event.id, 'event_day', name, event.eventDate || date, event.eventStartTime || event.startTime || '09:00', location),
      toEvent(event, 'event_project', event.id, 'teardown', `Teardown ${name}`, event.teardownDate || date, event.teardownTime || '18:00', location)
    ];
    return rows.filter((row, index, all) => all.findIndex(item => item.eventType === row.eventType && item.startDate === row.startDate) === index);
  });
}

export function syncCalendarFromCustomers() {
  const followups = loadArray('budsarin_customer_followups', []).map(item => toEvent(item, 'customer_followup', item.id, 'follow_up', item.title || 'Follow-up ลูกค้า', item.dueDate, item.dueTime || '10:00', 'CRM'));
  const dates = loadArray('budsarin_customer_important_dates', []).map(item => toEvent(item, 'important_date', item.id, item.dateType === 'birthday' ? 'birthday' : 'anniversary', item.title || `วันสำคัญ ${item.customerName}`, item.date, '', 'CRM'));
  return [...followups, ...dates];
}

export function syncCalendarFromFinance() {
  const income = loadArray('budsarin_income_transactions', []).filter(item => item.dueDate && item.paymentStatus !== 'paid');
  const expenses = loadArray('budsarin_expense_transactions', []).filter(item => item.dueDate && item.paymentStatus !== 'paid');
  return [...income, ...expenses].map(item => toEvent(item, 'finance_due', item.id, 'payment_due', item.description || 'ครบกำหนดชำระ', item.dueDate, item.time || '11:00', 'Finance'));
}

export function syncCalendarFromSuppliers() {
  return loadArray('budsarin_purchase_orders', []).map(po => toEvent(po, 'supplier_po', po.id, 'purchase_order', `รับ PO ${po.poNo || po.supplierName}`, po.expectedReceiveDate || po.orderDate, '10:00', po.supplierName || 'Supplier'));
}

export function syncCalendarFromInventory() {
  const inventory = loadArray('budsarin_inventory_items', []);
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
  return saveCalendarEvents(events.map((item, index) => ({
    id: item.id || `${item.sourceType}-${item.sourceId}-${item.eventType}-${item.startDate}`,
    calendarNo: `CAL-${String(index + 1).padStart(4, '0')}`,
    createdAt: item.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...item
  })));
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
