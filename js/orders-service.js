import { calculateOrderFinancials, getPaymentStatus } from './order-calculations.js';
import { syncCustomerFromOrders } from './customers-service.js';
import { syncIncomeFromOrders } from './finance-service.js';
import { queueWhenOffline } from './offline-queue.js';
import { orderStatuses } from './orders-data.js';
import { loadState, saveState } from './storage.js';

const ORDERS_KEY = 'budsarin_orders';
const TIMELINE_KEY = 'budsarin_order_timelines';

export function loadOrders() {
  try {
    const saved = JSON.parse(localStorage.getItem(ORDERS_KEY));
    if (Array.isArray(saved)) return saved;
  } catch {}
  saveOrders([]);
  return [];
}

export function saveOrders(orders) {
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  window.dispatchEvent(new CustomEvent('orders:updated', { detail: orders }));
}

export function loadTimelines() {
  try {
    return JSON.parse(localStorage.getItem(TIMELINE_KEY)) || {};
  } catch {
    return {};
  }
}

export function saveTimelines(timelines) {
  localStorage.setItem(TIMELINE_KEY, JSON.stringify(timelines));
}

export function saveOrder(data, mode = 'order') {
  const orders = loadOrders();
  const now = new Date().toISOString();
  const financials = calculateOrderFinancials(data);
  const order = {
    ...data,
    ...financials,
    id: data.id || crypto.randomUUID(),
    orderNo: data.orderNo || nextOrderNo(orders),
    customerId: data.customerId || `C-${Date.now()}`,
    paymentStatus: getPaymentStatus(data),
    orderStatus: mode === 'draft' ? 'draft' : (data.orderStatus || 'pending_payment'),
    createdAt: data.createdAt || now,
    updatedAt: now
  };
  const index = orders.findIndex(item => item.id === order.id);
  if (index >= 0) orders[index] = order;
  else orders.unshift(order);
  saveOrders(orders);
  appendTimeline(order.id, mode === 'draft' ? 'บันทึกแบบร่าง' : 'บันทึกออร์เดอร์', order.orderStatus);
  syncCustomerFromOrders(order);
  syncIncomeFromOrders(order);
  queueWhenOffline({ actionType: index >= 0 ? 'update' : 'create', entityType: 'order', entityId: order.id, endpoint: '/sync/offline-queue', payload: order });
  syncDashboardFromOrders(orders);
  window.dispatchEvent(new CustomEvent('orders:refresh', { detail: order }));
  window.dispatchEvent(new CustomEvent('calendar:refresh'));
  return order;
}

export function updateOrderStatus(orderId, nextStatus) {
  const orders = loadOrders();
  const order = orders.find(item => item.id === orderId);
  if (!order) return null;
  order.orderStatus = nextStatus;
  if (nextStatus === 'cancelled') order.paymentStatus = 'cancelled';
  order.updatedAt = new Date().toISOString();
  saveOrders(orders);
  appendTimeline(orderId, `เปลี่ยนสถานะเป็น ${orderStatuses[nextStatus]?.label || nextStatus}`, nextStatus);
  syncDashboardFromOrders(orders);
  window.dispatchEvent(new CustomEvent('orders:refresh', { detail: order }));
  window.dispatchEvent(new CustomEvent('calendar:refresh'));
  return order;
}

export function cancelOrder(orderId) {
  return updateOrderStatus(orderId, 'cancelled');
}

export function appendTimeline(orderId, label, status) {
  const timelines = loadTimelines();
  timelines[orderId] = timelines[orderId] || [];
  timelines[orderId].unshift({ at: new Date().toISOString(), label, status });
  saveTimelines(timelines);
}

export function getTimeline(orderId) {
  return loadTimelines()[orderId] || [];
}

export function syncDashboardFromOrders(orders = loadOrders()) {
  const dashboard = loadState(null);
  if (!dashboard) return;
  const today = new Date().toISOString().slice(0, 10);
  const active = orders.filter(order => order.orderStatus !== 'cancelled');
  const todayOrders = active.filter(order => order.dueDate === today);
  const pendingBalance = active.reduce((sum, order) => sum + (Number(order.balanceAmount) || 0), 0);
  const grossProfit = active.reduce((sum, order) => sum + (Number(order.grossProfit) || 0), 0);
  const ordersKpi = dashboard.kpis?.find(item => item.id === 'orders');
  const deliveriesKpi = dashboard.kpis?.find(item => item.id === 'deliveries');
  const receivableKpi = dashboard.kpis?.find(item => item.id === 'receivable');
  const profitKpi = dashboard.kpis?.find(item => item.id === 'profit');
  if (ordersKpi) ordersKpi.value = todayOrders.length;
  if (deliveriesKpi) deliveriesKpi.value = todayOrders.filter(order => ['ready', 'delivering', 'waiting_prepare', 'preparing'].includes(order.orderStatus)).length;
  if (receivableKpi) receivableKpi.value = pendingBalance;
  if (profitKpi) profitKpi.value = grossProfit;
  dashboard.schedule = todayOrders.slice(0, 4).map((order, index) => ({
    id: 1000 + index,
    time: order.dueTime,
    type: order.title,
    customer: order.customerName,
    status: mapOrderStatusToDashboard(order.orderStatus),
    note: order.pickupMethod === 'delivery' ? order.deliveryAddress : 'ลูกค้ารับเอง'
  }));
  dashboard.orderStatus = [
    ['pending', active.filter(o => ['pending_payment', 'deposit_paid'].includes(o.orderStatus)).length],
    ['preparing', active.filter(o => ['waiting_prepare', 'preparing'].includes(o.orderStatus)).length],
    ['ready', active.filter(o => ['ready', 'delivering'].includes(o.orderStatus)).length],
    ['completed', active.filter(o => o.orderStatus === 'completed').length]
  ];
  dashboard.lowProfitOrders = active
    .filter(order => Number(order.grossMargin) < 25)
    .slice(0, 4)
    .map(order => ({ orderNo: order.orderNo, title: order.title, customerName: order.customerName, grossMargin: order.grossMargin, grossProfit: order.grossProfit }));
  if (dashboard.finance) {
    dashboard.finance.receivable = pendingBalance;
    dashboard.finance.grossProfit = grossProfit;
  }
  saveState(dashboard);
  window.dispatchEvent(new CustomEvent('dashboard:update', { detail: dashboard }));
}

function nextOrderNo(orders) {
  const date = new Date().toISOString().slice(0, 10).replaceAll('-', '');
  return `ORD-${date}-${String(orders.length + 1).padStart(3, '0')}`;
}

function mapOrderStatusToDashboard(status) {
  if (status === 'preparing' || status === 'waiting_prepare') return 'preparing';
  if (status === 'ready') return 'ready';
  if (status === 'delivering') return 'delivering';
  if (status === 'completed') return 'completed';
  return 'pending';
}
