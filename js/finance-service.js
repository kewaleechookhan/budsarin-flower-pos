import { defaultFinanceSettings, mockExpenseTransactions, mockIncomeTransactions } from './finance-data.js';
import { calculateBreakEven, calculateCashIn, calculateCashOut, calculateClosingBalance, calculatePayables, calculateReceivables, calculateTotalExpense, calculateTotalIncome, filterByCurrentMonth, filterByToday } from './finance-calculations.js';
import { queueWhenOffline } from './offline-queue.js';
import { loadPosState, loadState, saveState } from './storage.js';

const INCOME_KEY = 'budsarin_income_transactions';
const EXPENSE_KEY = 'budsarin_expense_transactions';
const SETTINGS_KEY = 'budsarin_finance_settings';
const CASH_FLOW_KEY = 'budsarin_cash_flow';
const AR_KEY = 'budsarin_accounts_receivable';
const AP_KEY = 'budsarin_accounts_payable';
const ORDERS_KEY = 'budsarin_orders';

export const loadIncome = () => loadArray(INCOME_KEY, []);
export const loadExpenses = () => loadArray(EXPENSE_KEY, []);
export const saveIncome = income => {
  localStorage.setItem(INCOME_KEY, JSON.stringify(income));
  window.dispatchEvent(new CustomEvent('finance:updated', { detail: { type: 'income', rows: income } }));
};
export const saveExpenses = expenses => {
  localStorage.setItem(EXPENSE_KEY, JSON.stringify(expenses));
  window.dispatchEvent(new CustomEvent('finance:updated', { detail: { type: 'expense', rows: expenses } }));
};

export function loadFinanceSettings() {
  try {
    return { ...defaultFinanceSettings, ...(JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {}) };
  } catch {
    return { ...defaultFinanceSettings };
  }
}

export function saveFinanceSettings(settings) {
  const next = { ...loadFinanceSettings(), ...settings };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  syncFinanceDashboard();
  return next;
}

export function addIncome(data) {
  const income = loadIncome();
  const item = normalizeIncome(data, income);
  validateTransaction(item);
  income.unshift(item);
  saveIncome(income);
  queueWhenOffline({ actionType: 'create', entityType: 'income', entityId: item.id, endpoint: '/sync/offline-queue', payload: item });
  syncFinanceDashboard();
  return item;
}

export function editIncome(id, data) {
  const income = loadIncome();
  const index = income.findIndex(item => item.id === id);
  if (index < 0) throw new Error('ไม่พบรายการรายรับ');
  const item = { ...income[index], ...data, updatedAt: new Date().toISOString() };
  validateTransaction(item);
  income[index] = item;
  saveIncome(income);
  syncFinanceDashboard();
  return item;
}

export function deleteIncome(id, confirmed = false) {
  const income = loadIncome();
  const item = income.find(row => row.id === id);
  if (!item) return;
  if (item.sourceType !== 'manual' && !confirmed) throw new Error('ต้อง confirm ก่อนลบรายการที่ sync จากระบบอื่น');
  saveIncome(income.filter(row => row.id !== id));
  syncFinanceDashboard();
}

export function addExpense(data) {
  const expenses = loadExpenses();
  const item = normalizeExpense(data, expenses);
  validateTransaction(item);
  expenses.unshift(item);
  saveExpenses(expenses);
  queueWhenOffline({ actionType: 'create', entityType: 'expense', entityId: item.id, endpoint: '/sync/offline-queue', payload: item });
  syncFinanceDashboard();
  return item;
}

export function editExpense(id, data) {
  const expenses = loadExpenses();
  const index = expenses.findIndex(item => item.id === id);
  if (index < 0) throw new Error('ไม่พบรายการรายจ่าย');
  const item = { ...expenses[index], ...data, updatedAt: new Date().toISOString() };
  validateTransaction(item);
  expenses[index] = item;
  saveExpenses(expenses);
  syncFinanceDashboard();
  return item;
}

export function deleteExpense(id, confirmed = false) {
  const expenses = loadExpenses();
  const item = expenses.find(row => row.id === id);
  if (!item) return;
  if (item.sourceType && item.sourceType !== 'manual' && !confirmed) throw new Error('ต้อง confirm ก่อนลบรายการที่ sync จากระบบอื่น');
  saveExpenses(expenses.filter(row => row.id !== id));
  syncFinanceDashboard();
}

export function filterIncome(filters = {}, income = loadIncome()) {
  return filterTransactions(income, filters);
}

export function searchIncome(query, income = loadIncome()) {
  return searchTransactions(income, query);
}

export function filterExpense(filters = {}, expenses = loadExpenses()) {
  return filterTransactions(expenses, filters);
}

export function searchExpense(query, expenses = loadExpenses()) {
  return searchTransactions(expenses, query);
}

export function syncIncomeFromPOS(sale) {
  const settings = loadFinanceSettings();
  if (!settings.syncPOS || !sale) return null;
  const income = loadIncome();
  if (income.some(item => item.sourceType === 'pos_sale' && item.sourceId === sale.id)) return null;
  const item = normalizeIncome({
    date: sale.createdAt?.slice(0, 10),
    time: sale.createdAt?.slice(11, 16),
    category: 'ขายหน้าร้าน',
    sourceType: 'pos_sale',
    sourceId: sale.id,
    customerName: 'ลูกค้าหน้าร้าน',
    description: `POS ${sale.saleNo}`,
    amount: sale.paidAmount || sale.total,
    paymentMethod: sale.paymentMethod,
    paymentStatus: sale.status === 'paid' ? 'paid' : 'partial',
    dueDate: sale.depositDueDate || '',
    evidenceImage: 'pos-payment-placeholder'
  }, income);
  income.unshift(item);
  saveIncome(income);
  syncFinanceDashboard();
  return item;
}

export function syncIncomeFromOrders(order) {
  const settings = loadFinanceSettings();
  if (!settings.syncOrders || !order) return null;
  const paid = Number(order.paidAmount || order.depositAmount) || 0;
  if (paid <= 0) return null;
  const income = loadIncome();
  if (income.some(item => item.sourceType === 'order' && item.sourceId === order.id)) return null;
  const item = normalizeIncome({
    date: order.createdAt?.slice(0, 10) || new Date().toISOString().slice(0, 10),
    time: order.createdAt?.slice(11, 16) || new Date().toTimeString().slice(0, 5),
    category: paid < Number(order.totalAmount || 0) ? 'ค่ามัดจำ' : 'ออเดอร์ลูกค้า',
    sourceType: 'order',
    sourceId: order.id,
    customerId: order.customerId,
    customerName: order.customerName,
    description: order.title || order.orderNo,
    amount: paid,
    paymentMethod: order.paymentMethod || 'transfer',
    paymentStatus: paid >= Number(order.totalAmount || 0) ? 'paid' : 'partial',
    dueDate: order.paymentDueDate || order.dueDate,
    evidenceImage: 'order-payment-placeholder'
  }, income);
  income.unshift(item);
  saveIncome(income);
  syncFinanceDashboard();
  return item;
}

export function syncAllFinanceSources() {
  const pos = loadPosState();
  pos.sales.forEach(syncIncomeFromPOS);
  loadOrders().forEach(syncIncomeFromOrders);
  return getFinanceSnapshot();
}

export function getFinanceSnapshot() {
  const income = loadIncome();
  const expenses = loadExpenses();
  const settings = loadFinanceSettings();
  const orders = loadOrders();
  const currentMonthIncome = filterByCurrentMonth(income);
  const currentMonthExpenses = filterByCurrentMonth(expenses);
  const todayIncome = filterByToday(income);
  const todayExpenses = filterByToday(expenses);
  const monthlyRevenue = calculateTotalIncome(currentMonthIncome);
  const monthlyExpenses = calculateTotalExpense(currentMonthExpenses);
  const receivables = calculateReceivables(income, orders);
  const payables = calculatePayables(expenses);
  const cashBalance = calculateClosingBalance(settings.openingBalance, income, expenses);
  const breakEven = calculateBreakEven(settings, monthlyRevenue, monthlyRevenue - monthlyExpenses);
  const snapshot = {
    income,
    expenses,
    settings,
    orders,
    todayIncome: calculateTotalIncome(todayIncome),
    todayExpense: calculateTotalExpense(todayExpenses),
    todayNetProfit: calculateTotalIncome(todayIncome) - calculateTotalExpense(todayExpenses),
    monthlyRevenue,
    monthlyExpenses,
    monthlyNetProfit: monthlyRevenue - monthlyExpenses,
    cashIn: calculateCashIn(income),
    cashOut: calculateCashOut(expenses),
    cashBalance,
    receivables,
    payables,
    receivableTotal: receivables.reduce((sum, item) => sum + Number(item.balanceAmount || 0), 0),
    payableTotal: payables.reduce((sum, item) => sum + Number(item.balanceAmount || 0), 0),
    breakEven
  };
  localStorage.setItem(CASH_FLOW_KEY, JSON.stringify({ cashIn: snapshot.cashIn, cashOut: snapshot.cashOut, cashBalance }));
  localStorage.setItem(AR_KEY, JSON.stringify(receivables));
  localStorage.setItem(AP_KEY, JSON.stringify(payables));
  return snapshot;
}

export function syncFinanceDashboard() {
  const snapshot = getFinanceSnapshot();
  const dashboard = loadState(null);
  if (!dashboard) return snapshot;
  if (dashboard.finance) {
    dashboard.finance.revenue = snapshot.monthlyRevenue;
    dashboard.finance.expenses = snapshot.monthlyExpenses;
    dashboard.finance.grossProfit = snapshot.monthlyNetProfit;
    dashboard.finance.netProfit = snapshot.monthlyNetProfit;
    dashboard.finance.receivable = snapshot.receivableTotal;
    dashboard.finance.payable = snapshot.payableTotal;
    dashboard.finance.cashBalance = snapshot.cashBalance;
  }
  if (dashboard.breakEven) {
    dashboard.breakEven.currentSales = snapshot.monthlyRevenue;
    dashboard.breakEven.targetSales = snapshot.breakEven.breakEvenSales || dashboard.breakEven.targetSales;
  }
  const financeKpi = dashboard.kpis?.find(item => item.id === 'finance');
  if (financeKpi) financeKpi.value = snapshot.cashBalance;
  dashboard.financeAlerts = buildFinanceAlerts(snapshot);
  saveState(dashboard);
  window.dispatchEvent(new CustomEvent('dashboard:update', { detail: dashboard }));
  return snapshot;
}

export function recordReceivablePayment(id, amount) {
  const order = loadOrders().find(item => item.id === id);
  if (order) return syncIncomeFromOrders({ ...order, paidAmount: Math.min(Number(amount) || 0, Number(order.balanceAmount) || 0) });
  const income = loadIncome();
  const item = income.find(row => row.id === id);
  if (!item) return null;
  item.paymentStatus = 'paid';
  item.updatedAt = new Date().toISOString();
  saveIncome(income);
  syncFinanceDashboard();
  return item;
}

export function recordPayablePayment(id, amount) {
  const expenses = loadExpenses();
  const item = expenses.find(row => row.id === id);
  if (!item) return null;
  item.paymentStatus = Number(amount || item.amount) >= Number(item.amount) ? 'paid' : 'partial';
  item.updatedAt = new Date().toISOString();
  saveExpenses(expenses);
  syncFinanceDashboard();
  return item;
}

function normalizeIncome(data, current = []) {
  const now = new Date();
  return {
    id: data.id || crypto.randomUUID(),
    transactionNo: data.transactionNo || `INC-${String(current.length + 1).padStart(4, '0')}`,
    date: data.date || now.toISOString().slice(0, 10),
    time: data.time || now.toTimeString().slice(0, 5),
    category: data.category || 'รายรับอื่น ๆ',
    sourceType: data.sourceType || 'manual',
    sourceId: data.sourceId || '',
    customerId: data.customerId || '',
    customerName: data.customerName || '',
    description: data.description || '',
    amount: Number(data.amount) || 0,
    paymentMethod: data.paymentMethod || 'cash',
    paymentStatus: data.paymentStatus || 'paid',
    dueDate: data.dueDate || '',
    evidenceImage: data.evidenceImage || 'payment-placeholder',
    note: data.note || '',
    createdAt: data.createdAt || now.toISOString(),
    updatedAt: now.toISOString()
  };
}

function normalizeExpense(data, current = []) {
  const now = new Date();
  return {
    id: data.id || crypto.randomUUID(),
    transactionNo: data.transactionNo || `EXP-${String(current.length + 1).padStart(4, '0')}`,
    date: data.date || now.toISOString().slice(0, 10),
    time: data.time || now.toTimeString().slice(0, 5),
    category: data.category || 'รายจ่ายอื่น ๆ',
    supplierId: data.supplierId || '',
    supplierName: data.supplierName || '',
    description: data.description || '',
    amount: Number(data.amount) || 0,
    paymentMethod: data.paymentMethod || 'cash',
    paymentStatus: data.paymentStatus || 'paid',
    dueDate: data.dueDate || '',
    evidenceImage: data.evidenceImage || 'receipt-placeholder',
    note: data.note || '',
    sourceType: data.sourceType || 'manual',
    createdAt: data.createdAt || now.toISOString(),
    updatedAt: now.toISOString()
  };
}

function validateTransaction(item) {
  if (Number(item.amount) <= 0) throw new Error('จำนวนเงินต้องมากกว่า 0');
  if (!item.date) throw new Error('กรุณาระบุวันที่');
  if (!item.category) throw new Error('กรุณาเลือกหมวดหมู่');
  if (!item.paymentMethod) throw new Error('กรุณาเลือกวิธีชำระเงิน');
  if (item.paymentStatus === 'pending' && !item.dueDate) throw new Error('รายการรอชำระต้องระบุวันครบกำหนด');
}

function filterTransactions(items, filters) {
  return items.filter(item => (!filters.type || item.type === filters.type) &&
    (!filters.category || filters.category === 'all' || item.category === filters.category) &&
    (!filters.status || filters.status === 'all' || item.paymentStatus === filters.status) &&
    (!filters.method || filters.method === 'all' || item.paymentMethod === filters.method) &&
    (!filters.date || item.date === filters.date));
}

function searchTransactions(items, query = '') {
  const text = query.trim().toLowerCase();
  if (!text) return items;
  return items.filter(item => `${item.transactionNo} ${item.description} ${item.customerName || ''} ${item.supplierName || ''}`.toLowerCase().includes(text));
}

function loadArray(key, fallback) {
  try {
    const saved = JSON.parse(localStorage.getItem(key));
    if (Array.isArray(saved)) return saved;
  } catch {}
  localStorage.setItem(key, JSON.stringify([]));
  return [];
}

function loadOrders() {
  try {
    return JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
  } catch {
    return [];
  }
}

function buildFinanceAlerts(snapshot) {
  const alerts = [];
  if (snapshot.cashBalance < snapshot.settings.minimumCashBalance) alerts.push('Cash Balance ต่ำกว่าเกณฑ์ขั้นต่ำ');
  if (snapshot.breakEven.progress < 100) alerts.push('เดือนนี้ยังไม่ถึงจุดคุ้มทุน');
  if (snapshot.receivables.some(item => item.status === 'overdue')) alerts.push('มียอดค้างชำระเกินกำหนด');
  if (snapshot.payables.some(item => item.status === 'due_soon' || item.status === 'overdue')) alerts.push('มีเจ้าหนี้ใกล้ครบกำหนด');
  return alerts;
}
