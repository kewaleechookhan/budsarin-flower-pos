import { mockCustomers, mockPurchaseHistory } from './customers-data.js';
import { getUpcomingImportantDates, loadImportantDates, saveImportantDates } from './important-dates.js?v=20260719b';
import { detectOverdueFollowUps, getTodayFollowUps, loadFollowUps, saveFollowUps } from './customer-followups.js?v=20260719b';
import { buildCustomerGroups, detectInactiveCustomers, detectVIPCustomers, segmentCustomer } from './customer-segments.js';
import { queueWhenOffline } from './offline-queue.js';
import { loadPosState } from './storage.js';
import { loadState, saveState } from './storage.js';

const CUSTOMER_KEY = 'budsarin_customers';
const HISTORY_KEY = 'budsarin_customer_purchase_history';
const ORDERS_KEY = 'budsarin_orders';

export const loadCustomers = () => loadArray(CUSTOMER_KEY, []);
export const saveCustomers = customers => localStorage.setItem(CUSTOMER_KEY, JSON.stringify(customers));
export const loadPurchaseHistory = () => loadArray(HISTORY_KEY, []);
export const savePurchaseHistory = history => localStorage.setItem(HISTORY_KEY, JSON.stringify(history));

export function addCustomer(data) {
  const customers = loadCustomers();
  const customer = normalizeCustomer(data, customers);
  customers.unshift(customer);
  saveCustomers(customers);
  queueWhenOffline({ actionType: 'create', entityType: 'customer', entityId: customer.id, endpoint: '/sync/offline-queue', payload: customer });
  syncCustomerDashboard();
  return customer;
}

export function editCustomer(id, data) {
  const customers = loadCustomers();
  const index = customers.findIndex(item => item.id === id);
  if (index < 0) throw new Error('ไม่พบลูกค้า');
  customers[index] = { ...customers[index], ...data, updatedAt: new Date().toISOString() };
  customers[index].customerSegment = segmentCustomer(customers[index]);
  saveCustomers(customers);
  syncCustomerDashboard();
  return customers[index];
}

export function deleteCustomer(id) {
  saveCustomers(loadCustomers().filter(item => item.id !== id));
  savePurchaseHistory(loadPurchaseHistory().filter(item => item.customerId !== id));
  saveImportantDates(loadImportantDates().filter(item => item.customerId !== id));
  saveFollowUps(loadFollowUps().filter(item => item.customerId !== id));
  syncCustomerDashboard();
}

export function searchCustomers(query = '', customers = loadCustomers()) {
  const text = query.trim().toLowerCase();
  if (!text) return customers;
  return customers.filter(item => `${item.customerName} ${item.phone} ${item.lineId} ${item.facebook} ${item.email}`.toLowerCase().includes(text));
}

export function filterCustomers(filters = {}, customers = loadCustomers()) {
  return customers.filter(item =>
    (!filters.type || filters.type === 'all' || item.customerType === filters.type) &&
    (!filters.segment || filters.segment === 'all' || item.customerSegment === filters.segment) &&
    (!filters.status || filters.status === 'all' || item.status === filters.status) &&
    (!filters.province || item.province === filters.province)
  );
}

export function syncCustomerFromPOS(sale) {
  if (!sale) return null;
  const customers = loadCustomers();
  const existing = customers.find(item => item.customerName === 'ลูกค้าหน้าร้าน' && item.customerType === 'walk_in');
  const customer = existing || addCustomer({ customerName: 'ลูกค้าหน้าร้าน', customerType: 'walk_in', phone: '', lineId: '', consentToContact: false });
  recordPurchase(customer.id, customer.customerName, {
    sourceType: 'pos_sale',
    sourceId: sale.id,
    date: sale.createdAt?.slice(0, 10) || new Date().toISOString().slice(0, 10),
    description: sale.saleNo || 'POS Sale',
    category: 'ขายหน้าร้าน',
    amount: sale.total || sale.paidAmount || 0
  });
  updateCustomerValue(customer.id);
  return customer;
}

export function syncCustomerFromOrders(order) {
  if (!order?.customerName) return null;
  const customers = loadCustomers();
  let customer = customers.find(item => item.phone && item.phone === order.customerPhone) || customers.find(item => item.customerName === order.customerName);
  if (!customer) customer = addCustomer({ customerName: order.customerName, phone: order.customerPhone, customerType: 'online', lineId: order.customerContact || '', address: order.customerAddress || '', preferredColorTheme: order.colorTheme || '', preferredFlowerStyle: order.flowerStyle || '' });
  recordPurchase(customer.id, customer.customerName, {
    sourceType: 'order',
    sourceId: order.id,
    date: order.createdAt?.slice(0, 10) || new Date().toISOString().slice(0, 10),
    description: order.title || order.orderNo,
    category: order.orderType || 'ออเดอร์',
    colorTheme: order.colorTheme || '',
    flowerStyle: order.flowerStyle || '',
    amount: Number(order.totalAmount) || 0
  });
  updateCustomerValue(customer.id);
  return customer;
}

export function syncCustomerFromEvents(event) {
  if (!event?.customerName) return null;
  return addCustomer({ customerName: event.customerName, customerType: 'event', note: event.note || '' });
}

export function syncAllCustomerSources() {
  try { loadPosState().sales.forEach(syncCustomerFromPOS); } catch {}
  try { JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]').forEach(syncCustomerFromOrders); } catch {}
  return getCustomerSnapshot();
}

export function getCustomerSnapshot() {
  const customers = loadCustomers().map(item => ({ ...item, customerSegment: segmentCustomer(item) }));
  const history = loadPurchaseHistory();
  const importantDates = loadImportantDates();
  const followUps = detectOverdueFollowUps();
  const upcomingDates = getUpcomingImportantDates(30);
  const vipCustomers = detectVIPCustomers(customers);
  const inactiveCustomers = detectInactiveCustomers(customers);
  const month = new Date().toISOString().slice(0, 7);
  return {
    customers,
    history,
    importantDates,
    followUps,
    groups: buildCustomerGroups(customers),
    totalCustomers: customers.length,
    newThisMonth: customers.filter(item => item.createdAt?.startsWith(month)).length,
    regularCustomers: customers.filter(item => item.customerSegment === 'regular').length,
    vipCustomers,
    inactiveCustomers,
    upcomingDates,
    todayFollowUps: getTodayFollowUps(),
    overdueFollowUps: followUps.filter(item => item.status === 'overdue'),
    averageSpend: customers.length ? customers.reduce((sum, item) => sum + (Number(item.totalSpent) || 0), 0) / customers.length : 0,
    totalCustomerValue: customers.reduce((sum, item) => sum + (Number(item.totalSpent) || 0), 0)
  };
}

export function calculateCustomerPurchaseSummary(customerId) {
  const history = loadPurchaseHistory().filter(item => item.customerId === customerId);
  const totalSpent = history.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const totalOrders = history.length;
  const sorted = history.slice().sort((a, b) => b.date.localeCompare(a.date));
  const favoriteCategory = topValue(history, 'category');
  const favoriteColorTheme = topValue(history, 'colorTheme');
  const favoriteFlowerStyle = topValue(history, 'flowerStyle');
  return {
    customerId,
    totalSpent,
    totalOrders,
    averageOrderValue: totalOrders ? totalSpent / totalOrders : 0,
    lastOrderDate: sorted[0]?.date || '',
    favoriteCategory,
    favoriteColorTheme,
    favoriteFlowerStyle,
    lifetimeValue: totalSpent,
    repeatPurchaseCount: Math.max(totalOrders - 1, 0)
  };
}

export function syncCustomerDashboard() {
  const snapshot = getCustomerSnapshot();
  const dashboard = loadState(null);
  if (!dashboard) return snapshot;
  const customerKpi = dashboard.kpis?.find(item => item.id === 'customers');
  if (customerKpi) customerKpi.value = snapshot.totalCustomers;
  dashboard.customerAlerts = [
    ...snapshot.upcomingDates.slice(0, 2).map(item => `วันสำคัญใกล้ถึง: ${item.customerName} (${item.title})`),
    ...snapshot.overdueFollowUps.slice(0, 2).map(item => `Follow-up เกินกำหนด: ${item.customerName}`),
    ...snapshot.inactiveCustomers.filter(item => item.customerSegment === 'vip').slice(0, 1).map(item => `VIP ไม่ได้ซื้อซ้ำนาน: ${item.customerName}`)
  ];
  saveState(dashboard);
  window.dispatchEvent(new CustomEvent('dashboard:update', { detail: dashboard }));
  return snapshot;
}

function recordPurchase(customerId, customerName, data) {
  const history = loadPurchaseHistory();
  if (history.some(item => item.sourceType === data.sourceType && item.sourceId === data.sourceId)) return null;
  const item = { id: crypto.randomUUID(), customerId, customerName, colorTheme: '', flowerStyle: '', ...data };
  history.unshift(item);
  savePurchaseHistory(history);
  return item;
}

function updateCustomerValue(customerId) {
  const customers = loadCustomers();
  const index = customers.findIndex(item => item.id === customerId);
  if (index < 0) return;
  const summary = calculateCustomerPurchaseSummary(customerId);
  customers[index] = { ...customers[index], ...summary, customerSegment: segmentCustomer({ ...customers[index], ...summary }), updatedAt: new Date().toISOString() };
  saveCustomers(customers);
  syncCustomerDashboard();
}

function normalizeCustomer(data, customers) {
  const now = new Date().toISOString();
  return {
    id: data.id || crypto.randomUUID(),
    customerCode: data.customerCode || `CUS-${String(customers.length + 1).padStart(3, '0')}`,
    customerName: data.customerName || 'ลูกค้าใหม่',
    phone: data.phone || '',
    lineId: data.lineId || '',
    lineUserId: data.lineUserId || '',
    lineDisplayName: data.lineDisplayName || data.customerName || '',
    lineConsentStatus: data.lineConsentStatus || (data.consentToContact === false ? 'denied' : 'unknown'),
    lineLastMessageAt: data.lineLastMessageAt || '',
    facebook: data.facebook || '',
    email: data.email || '',
    address: data.address || '',
    district: data.district || '',
    province: data.province || '',
    birthday: data.birthday || '',
    anniversaryDate: data.anniversaryDate || '',
    importantDates: [],
    customerType: data.customerType || 'walk_in',
    customerSegment: data.customerSegment || 'new',
    preferredFlowerStyle: data.preferredFlowerStyle || '',
    preferredColorTheme: data.preferredColorTheme || '',
    favoriteProducts: data.favoriteProducts || '',
    averageBudget: Number(data.averageBudget) || 0,
    totalSpent: Number(data.totalSpent) || 0,
    totalOrders: Number(data.totalOrders) || 0,
    lastOrderDate: data.lastOrderDate || '',
    lastContactDate: data.lastContactDate || '',
    consentToContact: data.consentToContact !== false,
    status: data.status || 'active',
    note: data.note || '',
    createdAt: data.createdAt || now,
    updatedAt: now
  };
}

function topValue(rows, key) {
  const counts = rows.reduce((result, item) => {
    if (item[key]) result[item[key]] = (result[item[key]] || 0) + 1;
    return result;
  }, {});
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || '';
}

function loadArray(key, fallback) {
  try {
    const saved = JSON.parse(localStorage.getItem(key));
    if (Array.isArray(saved)) return saved;
  } catch {}
  localStorage.setItem(key, JSON.stringify([]));
  return [];
}
