import { defaultFinanceSettings } from './finance-data.js';
import { defaultReportSettings } from './reports-data.js';
import { applyReportFilters, resolveDateRange } from './report-filters.js';
import { generateBreakEvenReport, generateCustomerReport, generateEventsReport, generateFinanceReport, generateInventoryReport, generateProfitReport, generateSalesReport, generateSupplierReport } from './report-calculations.js';
import { generateExecutiveSummary } from './executive-summary.js';
import { loadState, saveState } from './storage.js';

const KEYS = {
  sales: 'budsarin_sales',
  posLegacy: 'budsarinFlowerPOSV2',
  orders: 'budsarin_orders',
  events: 'budsarin_events',
  income: 'budsarin_income_transactions',
  expenses: 'budsarin_expense_transactions',
  costTemplates: 'budsarin_cost_templates',
  costHistory: 'budsarin_cost_history',
  inventory: 'budsarin_inventory_items',
  stockMovements: 'budsarin_stock_movements',
  waste: 'budsarin_waste_items',
  suppliers: 'budsarin_suppliers',
  purchaseOrders: 'budsarin_purchase_orders',
  priceHistory: 'budsarin_price_history',
  priceHistoryLegacy: 'budsarin_supplier_price_history',
  customers: 'budsarin_customers',
  importantDates: 'budsarin_customer_important_dates',
  followUps: 'budsarin_customer_followups',
  financeSettings: 'budsarin_finance_settings',
  inventorySettings: 'budsarin_inventory_settings',
  eventQuotations: 'budsarin_event_quotations',
  cache: 'budsarin_report_cache',
  settings: 'budsarin_report_settings'
};

export function loadReportSourceData(filters = {}) {
  const sales = loadSales();
  const data = {
    sales,
    orders: applyReportFilters(loadArray(KEYS.orders, []), filters, { dateField: 'createdAt' }),
    events: applyReportFilters(loadArray(KEYS.events, []), filters, { dateField: 'eventDate' }),
    income: applyReportFilters(loadArray(KEYS.income, []), filters),
    expenses: applyReportFilters(loadArray(KEYS.expenses, []), filters),
    costTemplates: loadArray(KEYS.costTemplates, []),
    costHistory: loadArray(KEYS.costHistory, []),
    inventory: loadArray(KEYS.inventory, []),
    stockMovements: applyReportFilters(loadArray(KEYS.stockMovements, []), filters),
    waste: applyReportFilters(loadArray(KEYS.waste, []), filters),
    suppliers: loadArray(KEYS.suppliers, []),
    purchaseOrders: applyReportFilters(loadArray(KEYS.purchaseOrders, []), filters, { dateField: 'orderDate' }),
    priceHistory: loadArray(KEYS.priceHistory, loadArray(KEYS.priceHistoryLegacy, [])),
    customers: loadArray(KEYS.customers, []),
    importantDates: loadArray(KEYS.importantDates, []),
    followUps: loadArray(KEYS.followUps, []),
    financeSettings: loadObject(KEYS.financeSettings, defaultFinanceSettings),
    inventorySettings: loadObject(KEYS.inventorySettings, {}),
    eventQuotations: loadArray(KEYS.eventQuotations, []),
    meta: buildSourceMeta()
  };
  data.sales = applyReportFilters(data.sales, filters, { dateField: 'createdAt' });
  return data;
}

export function generateAllReports(filters = {}) {
  const normalizedFilters = { ...filters, ...resolveDateRange(filters) };
  const data = loadReportSourceData(normalizedFilters);
  const reports = {
    filters: normalizedFilters,
    sourceMeta: data.meta,
    sales: generateSalesReport(data),
    profit: generateProfitReport(data),
    finance: generateFinanceReport(data),
    inventory: generateInventoryReport(data),
    events: generateEventsReport(data),
    customers: generateCustomerReport(data),
    suppliers: generateSupplierReport(data),
    breakeven: generateBreakEvenReport(data)
  };
  reports.executiveSummary = generateExecutiveSummary(reports);
  saveReportCache(reports);
  syncReportsDashboard(reports);
  return reports;
}

export function syncReportsDashboard(reports) {
  const dashboard = loadState(buildEmptyDashboardState());
  if (!dashboard) return;
  dashboard.finance = {
    ...(dashboard.finance || {}),
    revenue: reports.sales.totalSales,
    expenses: reports.finance.totalExpense,
    grossProfit: reports.profit.grossProfit,
    netProfit: reports.profit.netProfit,
    receivable: reports.finance.receivables.amount,
    payable: reports.finance.payables.amount,
    cashBalance: reports.finance.closingBalance
  };
  if (dashboard.breakEven) {
    dashboard.breakEven.currentSales = reports.breakeven.currentMonthlySales;
    dashboard.breakEven.targetSales = reports.breakeven.breakEvenSales;
    dashboard.breakEven.fixedCosts = reports.breakeven.fixedMonthlyCosts;
    dashboard.breakEven.grossMarginRate = reports.breakeven.grossMarginRate;
  }
  dashboard.reportSnapshot = {
    updatedAt: new Date().toISOString(),
    monthlyRevenue: reports.sales.totalSales,
    monthlyExpense: reports.finance.totalExpense,
    netProfit: reports.profit.netProfit,
    grossMargin: reports.profit.grossMargin,
    breakEvenProgress: reports.breakeven.progress,
    wasteCost: reports.inventory.wasteCost,
    upcomingEvents: reports.events.upcomingEvents.length,
    crmAlerts: reports.customers.overdueFollowUps.length,
    supplierAlerts: reports.suppliers.pendingPOs.length
  };
  saveState(dashboard);
  window.dispatchEvent(new CustomEvent('dashboard:update', { detail: dashboard }));
}

export function loadReportSettings() {
  return loadObject(KEYS.settings, defaultReportSettings);
}

export function saveReportSettings(settings) {
  const next = { ...loadReportSettings(), ...settings };
  localStorage.setItem(KEYS.settings, JSON.stringify(next));
  return next;
}

export function saveReportCache(reports) {
  if (!loadReportSettings().cacheReports) return;
  localStorage.setItem(KEYS.cache, JSON.stringify({ updatedAt: new Date().toISOString(), reports }));
}

export function loadReportCache() {
  return loadObject(KEYS.cache, null);
}

function loadSales() {
  const direct = loadArray(KEYS.sales, null);
  if (direct) return direct;
  try {
    const legacy = JSON.parse(localStorage.getItem(KEYS.posLegacy));
    return Array.isArray(legacy?.sales) ? legacy.sales : [];
  } catch {
    return [];
  }
}

function loadArray(key, fallback) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key));
    if (Array.isArray(parsed)) return parsed;
  } catch {}
  return fallback === null ? null : [...fallback];
}

function loadObject(key, fallback) {
  try {
    return { ...(fallback || {}), ...(JSON.parse(localStorage.getItem(key)) || {}) };
  } catch {
    return fallback;
  }
}

function buildEmptyDashboardState() {
  return {
    kpis: [],
    breakEven: { currentSales: 0, targetSales: 0, fixedCosts: 0, grossMarginRate: 0 },
    salesChart: { week: [0, 0, 0, 0, 0, 0, 0], month: [0, 0, 0, 0, 0] },
    schedule: [],
    orderStatus: [],
    stockAlerts: [],
    events: [],
    finance: { revenue: 0, expenses: 0, grossProfit: 0, netProfit: 0, receivable: 0, payable: 0, cashBalance: 0 },
    notifications: [],
    userAdds: []
  };
}

function buildSourceMeta() {
  return Object.entries(KEYS).reduce((meta, [name, key]) => {
    if (['cache', 'settings', 'posLegacy', 'priceHistoryLegacy'].includes(name)) return meta;
    meta[name] = !!localStorage.getItem(key);
    return meta;
  }, {});
}
