import { loadState, saveState } from './storage.js';
import { calculateGrossMargin, calculateGrossProfit, calculateTotalCost } from './cost-calculations.js';

const TEMPLATE_KEY = 'budsarin_cost_templates';
const HISTORY_KEY = 'budsarin_cost_history';
const ORDERS_KEY = 'budsarin_orders';

export const loadCostTemplates = () => JSON.parse(localStorage.getItem(TEMPLATE_KEY) || '[]');
export const saveCostTemplates = templates => localStorage.setItem(TEMPLATE_KEY, JSON.stringify(templates));
export const loadCostHistory = () => JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
export const saveCostHistory = history => localStorage.setItem(HISTORY_KEY, JSON.stringify(history));

export function saveTemplate(calculation) {
  if (!calculation.templateName?.trim()) throw new Error('กรุณากรอกชื่อสูตรก่อนบันทึก Template');
  const templates = loadCostTemplates();
  const item = { ...calculation, id: calculation.id || crypto.randomUUID(), updatedAt: new Date().toISOString() };
  const index = templates.findIndex(t => t.id === item.id);
  if (index >= 0) templates[index] = item;
  else templates.unshift(item);
  saveCostTemplates(templates);
  return item;
}

export function deleteTemplate(id) {
  saveCostTemplates(loadCostTemplates().filter(item => item.id !== id));
}

export function saveHistory(calculation, totals) {
  const history = loadCostHistory();
  const record = {
    id: crypto.randomUUID(),
    calculationNo: `COST-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${String(history.length + 1).padStart(3, '0')}`,
    jobType: calculation.jobType,
    templateName: calculation.templateName,
    sellingPrice: Number(calculation.sellingPrice) || 0,
    totalCost: totals.totalCost,
    grossProfit: calculateGrossProfit(calculation.sellingPrice, totals.totalCost),
    grossMargin: calculateGrossMargin(calculation.sellingPrice, totals.totalCost),
    suggestedPrice: calculation.suggestedPrice || 0,
    createdAt: new Date().toISOString()
  };
  history.unshift(record);
  saveCostHistory(history.slice(0, 30));
  syncDashboardLowProfit();
  return record;
}

export function applyCostToOrder(orderId, calculation, totals) {
  const orders = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
  const order = orders.find(item => item.id === orderId);
  if (!order) throw new Error('ไม่พบออร์เดอร์ที่ต้องการผูกต้นทุน');
  order.estimatedCost = totals.totalCost;
  order.grossProfit = calculateGrossProfit(order.totalAmount, totals.totalCost);
  order.grossMargin = calculateGrossMargin(order.totalAmount, totals.totalCost);
  order.updatedAt = new Date().toISOString();
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  saveHistory({ ...calculation, templateName: calculation.templateName || order.title }, totals);
  syncDashboardLowProfit();
  window.dispatchEvent(new CustomEvent('orders:refresh'));
  return order;
}

export function syncDashboardLowProfit() {
  const dashboard = loadState(null);
  if (!dashboard) return;
  const orders = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
  dashboard.lowProfitOrders = orders
    .filter(order => Number(order.grossMargin) < 25 && order.orderStatus !== 'cancelled')
    .slice(0, 3)
    .map(order => ({ orderNo: order.orderNo, title: order.title, customerName: order.customerName, grossMargin: order.grossMargin, grossProfit: order.grossProfit }));
  const profitKpi = dashboard.kpis?.find(item => item.id === 'profit');
  if (profitKpi && orders.length) profitKpi.value = orders.reduce((sum, order) => sum + (Number(order.grossProfit) || 0), 0);
  saveState(dashboard);
  window.dispatchEvent(new CustomEvent('dashboard:update', { detail: dashboard }));
}
