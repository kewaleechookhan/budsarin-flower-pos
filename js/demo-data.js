import { defaultCalendarSettings, mockCalendarEvents, mockReminders } from './calendar-data.js';
import { defaultApiContracts, defaultBackendSettings } from './api-contracts.js';
import { defaultCostItems } from './cost-data.js';
import { mockCustomers, mockFollowUps, mockImportantDates, mockPurchaseHistory } from './customers-data.js';
import { mockExpenseTransactions, mockIncomeTransactions } from './finance-data.js';
import { defaultInventorySettings, mockInventoryItems as phase7InventoryItems, mockStockMovements as phase7StockMovements, mockWasteItems as phase7WasteItems } from './inventory-data.js';
import { defaultLineSettings, defaultLineTemplates } from './line-integration.js';
import { mockData } from './mock-data.js';
import { mockOrders } from './orders-data.js';
import { defaultPrinterSettings } from './receipt-printer.js';
import { mockEvents } from './reports-data.js';
import { defaultBrandSettings, defaultModuleSettings, defaultNotificationSettings, defaultPermissionSettings, defaultStoreProfile, defaultSystemFinanceSettings, defaultUsers } from './settings-data.js';
import { mockPriceHistory, mockPurchaseOrders, mockSupplierPayables, mockSuppliers } from './suppliers-data.js';
import { ALL_STORAGE_KEYS, STORAGE_KEYS, hasStorage, readStorage, storageSnapshot, writeStorage } from './storage-registry.js';

const nowIso = () => new Date().toISOString();
const PRODUCTION_EMPTY_VERSION = 6;

export function buildDemoSeed() {
  const sales = buildSales();
  return {
    [STORAGE_KEYS.dashboardState]: mockData,
    [STORAGE_KEYS.dashboardLegacy]: mockData,
    [STORAGE_KEYS.posLegacy]: {
      sales,
      heldBills: [],
      cartDraft: null,
      dailySalesSummary: summarizeSales(sales)
    },
    [STORAGE_KEYS.sales]: sales,
    [STORAGE_KEYS.heldBills]: [],
    [STORAGE_KEYS.cartDraft]: null,
    [STORAGE_KEYS.orders]: mockOrders,
    [STORAGE_KEYS.orderTimelines]: {},
    [STORAGE_KEYS.costTemplates]: buildCostTemplates(),
    [STORAGE_KEYS.costHistory]: [],
    [STORAGE_KEYS.incomeTransactions]: mockIncomeTransactions,
    [STORAGE_KEYS.expenseTransactions]: mockExpenseTransactions,
    [STORAGE_KEYS.financeSettings]: defaultSystemFinanceSettings,
    [STORAGE_KEYS.events]: mockEvents,
    [STORAGE_KEYS.eventQuotations]: [],
    [STORAGE_KEYS.eventPayments]: [],
    [STORAGE_KEYS.eventCosts]: [],
    [STORAGE_KEYS.eventChecklists]: [],
    [STORAGE_KEYS.eventTimelines]: [],
    [STORAGE_KEYS.inventoryItems]: phase7InventoryItems,
    [STORAGE_KEYS.stockMovements]: phase7StockMovements,
    [STORAGE_KEYS.wasteItems]: phase7WasteItems,
    [STORAGE_KEYS.inventorySettings]: defaultInventorySettings,
    [STORAGE_KEYS.suppliers]: mockSuppliers,
    [STORAGE_KEYS.purchaseOrders]: mockPurchaseOrders,
    [STORAGE_KEYS.priceHistory]: mockPriceHistory,
    [STORAGE_KEYS.supplierPriceHistory]: mockPriceHistory,
    [STORAGE_KEYS.supplierPayables]: mockSupplierPayables,
    [STORAGE_KEYS.customers]: buildCustomersWithLineFields(),
    [STORAGE_KEYS.customerImportantDates]: mockImportantDates,
    [STORAGE_KEYS.customerFollowups]: mockFollowUps,
    [STORAGE_KEYS.customerSegments]: [],
    [STORAGE_KEYS.customerPurchaseHistory]: mockPurchaseHistory,
    [STORAGE_KEYS.reportPresets]: [],
    [STORAGE_KEYS.reportSettings]: {},
    [STORAGE_KEYS.storeProfile]: defaultStoreProfile,
    [STORAGE_KEYS.brandSettings]: defaultBrandSettings,
    [STORAGE_KEYS.users]: defaultUsers,
    [STORAGE_KEYS.permissionSettings]: defaultPermissionSettings,
    [STORAGE_KEYS.notificationSettings]: defaultNotificationSettings,
    [STORAGE_KEYS.moduleSettings]: defaultModuleSettings,
    [STORAGE_KEYS.calendarEvents]: mockCalendarEvents,
    [STORAGE_KEYS.manualTasks]: buildManualTasks(),
    [STORAGE_KEYS.reminders]: mockReminders,
    [STORAGE_KEYS.calendarSettings]: defaultCalendarSettings,
    [STORAGE_KEYS.offlineQueue]: [],
    [STORAGE_KEYS.offlineCache]: { cachedAt: nowIso(), mode: 'localStorage-fallback' },
    [STORAGE_KEYS.syncConflicts]: [],
    [STORAGE_KEYS.backendSettings]: defaultBackendSettings,
    [STORAGE_KEYS.apiContracts]: defaultApiContracts,
    [STORAGE_KEYS.auditLogs]: [],
    [STORAGE_KEYS.lastSuccessfulSync]: '',
    [STORAGE_KEYS.qrCodes]: buildQrCodes(),
    [STORAGE_KEYS.paymentQrPlaceholders]: buildPaymentPlaceholders(),
    [STORAGE_KEYS.printerSettings]: defaultPrinterSettings,
    [STORAGE_KEYS.lineSettings]: defaultLineSettings,
    [STORAGE_KEYS.lineMessageTemplates]: defaultLineTemplates,
    [STORAGE_KEYS.notificationLogs]: [],
    [STORAGE_KEYS.deviceSessions]: [],
    [STORAGE_KEYS.productionReady]: { enabled: true, version: PRODUCTION_EMPTY_VERSION, initializedAt: nowIso(), mode: 'production-empty' }
  };
}

export function buildProductionSeed() {
  const zeroDashboard = buildProductionDashboardState();
  const zeroFinanceSettings = {
    ...defaultSystemFinanceSettings,
    openingBalance: 0,
    initialInvestment: 0,
    fixedMonthlyCosts: 0,
    targetGrossMargin: 0,
    averageMonthlyNetProfit: 0,
    targetMonthlySales: 0,
    targetNetProfit: 0,
    minimumCashBalance: 0
  };

  return {
    [STORAGE_KEYS.dashboardState]: zeroDashboard,
    [STORAGE_KEYS.dashboardLegacy]: zeroDashboard,
    [STORAGE_KEYS.posLegacy]: { sales: [], heldBills: [], cartDraft: null, dailySalesSummary: { total: 0, count: 0, grossProfit: 0 } },
    [STORAGE_KEYS.sales]: [],
    [STORAGE_KEYS.heldBills]: [],
    [STORAGE_KEYS.cartDraft]: null,
    [STORAGE_KEYS.products]: [],
    [STORAGE_KEYS.orders]: [],
    [STORAGE_KEYS.orderTimelines]: {},
    [STORAGE_KEYS.costTemplates]: [],
    [STORAGE_KEYS.costHistory]: [],
    [STORAGE_KEYS.incomeTransactions]: [],
    [STORAGE_KEYS.expenseTransactions]: [],
    [STORAGE_KEYS.financeSettings]: zeroFinanceSettings,
    [STORAGE_KEYS.cashFlow]: [],
    [STORAGE_KEYS.accountsReceivable]: [],
    [STORAGE_KEYS.accountsPayable]: [],
    [STORAGE_KEYS.events]: [],
    [STORAGE_KEYS.eventQuotations]: [],
    [STORAGE_KEYS.eventPayments]: [],
    [STORAGE_KEYS.eventCosts]: [],
    [STORAGE_KEYS.eventChecklists]: [],
    [STORAGE_KEYS.eventTimelines]: [],
    [STORAGE_KEYS.eventSettings]: {},
    [STORAGE_KEYS.inventoryItems]: [],
    [STORAGE_KEYS.inventoryRecipes]: [],
    [STORAGE_KEYS.stockMovements]: [],
    [STORAGE_KEYS.wasteItems]: [],
    [STORAGE_KEYS.inventorySettings]: defaultInventorySettings,
    [STORAGE_KEYS.suppliers]: [],
    [STORAGE_KEYS.purchaseOrders]: [],
    [STORAGE_KEYS.priceHistory]: [],
    [STORAGE_KEYS.supplierPriceHistory]: [],
    [STORAGE_KEYS.supplierPayables]: [],
    [STORAGE_KEYS.customers]: [],
    [STORAGE_KEYS.customerImportantDates]: [],
    [STORAGE_KEYS.customerFollowups]: [],
    [STORAGE_KEYS.customerSegments]: [],
    [STORAGE_KEYS.customerPurchaseHistory]: [],
    [STORAGE_KEYS.messageTemplates]: [],
    [STORAGE_KEYS.reportPresets]: [],
    [STORAGE_KEYS.reportCache]: {},
    [STORAGE_KEYS.reportSettings]: {},
    [STORAGE_KEYS.storeProfile]: defaultStoreProfile,
    [STORAGE_KEYS.brandSettings]: defaultBrandSettings,
    [STORAGE_KEYS.users]: defaultUsers,
    [STORAGE_KEYS.permissionSettings]: defaultPermissionSettings,
    [STORAGE_KEYS.currentUser]: null,
    [STORAGE_KEYS.notificationSettings]: defaultNotificationSettings,
    [STORAGE_KEYS.moduleSettings]: defaultModuleSettings,
    [STORAGE_KEYS.systemSettings]: {},
    [STORAGE_KEYS.calendarEvents]: [],
    [STORAGE_KEYS.manualTasks]: [],
    [STORAGE_KEYS.reminders]: [],
    [STORAGE_KEYS.calendarSettings]: defaultCalendarSettings,
    [STORAGE_KEYS.offlineQueue]: [],
    [STORAGE_KEYS.offlineCache]: { cachedAt: nowIso(), mode: 'production-local' },
    [STORAGE_KEYS.syncConflicts]: [],
    [STORAGE_KEYS.backendSettings]: defaultBackendSettings,
    [STORAGE_KEYS.apiContracts]: defaultApiContracts,
    [STORAGE_KEYS.auditLogs]: [],
    [STORAGE_KEYS.lastSuccessfulSync]: '',
    [STORAGE_KEYS.qrCodes]: [],
    [STORAGE_KEYS.paymentQrPlaceholders]: [],
    [STORAGE_KEYS.printerSettings]: defaultPrinterSettings,
    [STORAGE_KEYS.lineSettings]: defaultLineSettings,
    [STORAGE_KEYS.lineMessageTemplates]: defaultLineTemplates,
    [STORAGE_KEYS.notificationLogs]: [],
    [STORAGE_KEYS.deviceSessions]: []
  };
}

export function buildProductionDashboardState() {
  return {
    kpis: [
      { id: 'sales', label: 'ยอดขายวันนี้', value: 0, type: 'money', compare: 'พร้อมเริ่มขาย', trend: 'flat', icon: 'receipt' },
      { id: 'orders', label: 'ออร์เดอร์วันนี้', value: 0, suffix: 'งาน', compare: 'ยังไม่มีออร์เดอร์', trend: 'flat', icon: 'package-check' },
      { id: 'profit', label: 'กำไรประมาณการ', value: 0, type: 'money', compare: 'Margin 0%', trend: 'flat', icon: 'trending-up' },
      { id: 'deliveries', label: 'งานที่ต้องส่งวันนี้', value: 0, suffix: 'งาน', compare: 'ยังไม่มีงานส่ง', trend: 'flat', icon: 'truck' },
      { id: 'receivable', label: 'ยอดค้างชำระ', value: 0, type: 'money', compare: '0 ออร์เดอร์', trend: 'flat', icon: 'credit-card' },
      { id: 'waste', label: 'Waste Cost เดือนนี้', value: 0, type: 'money', compare: 'เริ่มต้นใช้งานจริง', trend: 'flat', icon: 'leaf' }
    ],
    breakEven: { currentSales: 0, targetSales: 0, fixedCosts: 0, grossMarginRate: 0 },
    salesChart: { week: [0, 0, 0, 0, 0, 0, 0], month: [0, 0, 0, 0, 0] },
    schedule: [],
    orderStatus: [['pending', 0], ['deposit', 0], ['preparing', 0], ['ready', 0], ['delivering', 0], ['completed', 0], ['cancelled', 0]],
    stockAlerts: [],
    events: [],
    finance: { revenue: 0, expenses: 0, grossProfit: 0, netProfit: 0, receivable: 0, payable: 0, cashBalance: 0 },
    notifications: [],
    userAdds: []
  };
}

export function checkSeedStatus() {
  const seed = buildDemoSeed();
  const seededKeys = Object.keys(seed);
  const presentKeys = seededKeys.filter(hasStorage);
  const status = readStorage(STORAGE_KEYS.seedStatus, null);
  return {
    seeded: presentKeys.length === seededKeys.length,
    present: presentKeys.length,
    total: seededKeys.length,
    lastSeededAt: status?.lastSeededAt || '',
    lastResetAt: status?.lastResetAt || ''
  };
}

export function backupBeforeReset(reason = 'manual') {
  const backups = readStorage(STORAGE_KEYS.resetBackups, []);
  const backup = {
    id: crypto.randomUUID(),
    createdAt: nowIso(),
    reason,
    data: storageSnapshot(ALL_STORAGE_KEYS.filter(key => key !== STORAGE_KEYS.resetBackups))
  };
  backups.unshift({ ...backup, dataSize: Object.keys(backup.data).length });
  writeStorage(STORAGE_KEYS.resetBackups, backups.slice(0, 5));
  return backup;
}

export function seedDemoData({ overwrite = false } = {}) {
  const seed = buildDemoSeed();
  const skipped = [];
  Object.entries(seed).forEach(([key, value]) => {
    if (!overwrite && hasStorage(key)) {
      skipped.push(key);
      return;
    }
    writeStorage(key, value);
  });
  writeStorage(STORAGE_KEYS.seedStatus, { lastSeededAt: nowIso(), skipped, mode: overwrite ? 'overwrite' : 'fill-missing' });
  window.dispatchEvent(new CustomEvent('dashboard:update', { detail: readStorage(STORAGE_KEYS.dashboardState, mockData) }));
  window.dispatchEvent(new CustomEvent('calendar:refresh'));
  return { seeded: Object.keys(seed).length - skipped.length, skipped: skipped.length };
}

export function resetDemoData() {
  backupBeforeReset('reset-demo-data');
  clearAllData({ keepBackups: true });
  const result = seedDemoData({ overwrite: true });
  writeStorage(STORAGE_KEYS.seedStatus, { lastResetAt: nowIso(), mode: 'reset-demo' });
  return result;
}

export function resetToProductionData() {
  backupBeforeReset('reset-to-production-empty');
  clearAllData({ keepBackups: true });
  const seed = buildProductionSeed();
  Object.entries(seed).forEach(([key, value]) => writeStorage(key, value));
  writeStorage(STORAGE_KEYS.seedStatus, { lastResetAt: nowIso(), mode: 'production-empty', total: Object.keys(seed).length });
  writeStorage(STORAGE_KEYS.productionReady, { enabled: true, version: PRODUCTION_EMPTY_VERSION, initializedAt: nowIso(), mode: 'production-empty' });
  window.dispatchEvent(new CustomEvent('dashboard:update', { detail: seed[STORAGE_KEYS.dashboardState] }));
  window.dispatchEvent(new CustomEvent('calendar:refresh'));
  window.dispatchEvent(new CustomEvent('products:updated', { detail: [] }));
  return { reset: Object.keys(seed).length };
}

export function ensureProductionReady() {
  const ready = readStorage(STORAGE_KEYS.productionReady, null);
  if (ready?.enabled && ready.version === PRODUCTION_EMPTY_VERSION) {
    sanitizeLegacySamples();
    return { initialized: false };
  }
  const result = resetToProductionData();
  sanitizeLegacySamples();
  return { initialized: true, ...result };
}

function sanitizeLegacySamples() {
  const demoId = /^(mock-\d+|event-[1-6]|event-mock-\d+|quotation-\d+|inv-mock-\d+|inventory-\d+|move-mock-\d+|waste-mock-\d+|inc-mock-\d+|exp-mock-\d+|sale-demo-\d+|template-demo-|p-0\d+|cal-mock-\d+|reminder-mock-\d+|po-mock-\d+|payable-mock-\d+|price-mock-\d+|payment-demo-\d+|CUS-\d+)/;
  const demoEventNames = new Set(['Wedding Garden Setup', 'Grand Opening Floral', 'Hotel Lobby Refresh', 'Engagement Dinner', 'Wedding Garden Floral Setup', 'Grand Opening Rose Cafe', 'Corporate Meeting Floral Stage', 'Graduation Floral Booth', 'Memorial Ceremony White Floral']);
  [
    STORAGE_KEYS.sales,
    STORAGE_KEYS.products,
    STORAGE_KEYS.orders,
    STORAGE_KEYS.events,
    STORAGE_KEYS.eventQuotations,
    STORAGE_KEYS.eventCosts,
    STORAGE_KEYS.eventPayments,
    STORAGE_KEYS.eventChecklists,
    STORAGE_KEYS.eventTimelines,
    STORAGE_KEYS.inventoryItems,
    STORAGE_KEYS.stockMovements,
    STORAGE_KEYS.wasteItems,
    STORAGE_KEYS.incomeTransactions,
    STORAGE_KEYS.expenseTransactions,
    STORAGE_KEYS.calendarEvents,
    STORAGE_KEYS.manualTasks,
    STORAGE_KEYS.reminders,
    STORAGE_KEYS.costTemplates,
    STORAGE_KEYS.purchaseOrders,
    STORAGE_KEYS.priceHistory,
    STORAGE_KEYS.supplierPriceHistory,
    STORAGE_KEYS.supplierPayables,
    STORAGE_KEYS.customers,
    STORAGE_KEYS.customerImportantDates,
    STORAGE_KEYS.customerFollowups,
    STORAGE_KEYS.customerPurchaseHistory,
    STORAGE_KEYS.qrCodes,
    STORAGE_KEYS.paymentQrPlaceholders
  ].forEach(key => {
    const rows = readStorage(key, null);
    if (!Array.isArray(rows)) return;
    const next = rows.filter(item => {
      const id = String(item?.id || '');
      const eventId = String(item?.eventId || item?.sourceId || '');
      const name = String(item?.projectName || item?.eventName || item?.name || item?.templateName || '');
      return !demoId.test(id) && !demoId.test(eventId) && !demoEventNames.has(name);
    });
    if (next.length !== rows.length) writeStorage(key, next);
  });
}

export function clearAllData({ keepBackups = true } = {}) {
  const preserved = keepBackups ? readStorage(STORAGE_KEYS.resetBackups, []) : [];
  ALL_STORAGE_KEYS.forEach(key => localStorage.removeItem(key));
  if (keepBackups && preserved.length) writeStorage(STORAGE_KEYS.resetBackups, preserved);
  return true;
}

export function restoreFromBackup(id = null) {
  const backups = readStorage(STORAGE_KEYS.resetBackups, []);
  const backup = id ? backups.find(item => item.id === id) : backups[0];
  if (!backup?.data) return null;
  Object.entries(backup.data).forEach(([key, value]) => writeStorage(key, value));
  return backup;
}

function buildSales() {
  return mockIncomeTransactions.slice(0, 6).map((item, index) => ({
    id: `sale-demo-${index + 1}`,
    saleNo: `BF-DEMO-${String(index + 1).padStart(4, '0')}`,
    createdAt: `${item.date}T10:${String(index * 7).padStart(2, '0')}:00.000Z`,
    items: [{ id: `demo-item-${index + 1}`, name: item.description, price: item.amount, cost: Math.round(item.amount * 0.48), quantity: 1 }],
    subtotal: item.amount,
    discountType: 'baht',
    discountValue: 0,
    discountAmount: 0,
    deliveryFee: 0,
    total: item.amount,
    paymentMethod: item.paymentMethod,
    paidAmount: item.amount,
    balance: 0,
    grossCost: Math.round(item.amount * 0.48),
    grossProfit: Math.round(item.amount * 0.52),
    grossMargin: 52,
    status: 'paid'
  }));
}

function buildCostTemplates() {
  return [{
    id: 'template-demo-bouquet',
    templateName: 'ช่อกุหลาบชมพู Premium',
    jobType: 'bouquet',
    sellingPrice: 1500,
    items: defaultCostItems,
    createdAt: nowIso(),
    updatedAt: nowIso()
  }];
}

function buildManualTasks() {
  return mockCalendarEvents.filter(item => item.sourceType === 'manual_task').map(item => ({
    id: item.sourceId,
    title: item.title,
    description: item.description,
    startDate: item.startDate,
    startTime: item.startTime,
    location: item.location,
    priority: item.priority,
    assignedTo: item.assignedTo,
    reminderEnabled: item.reminderEnabled,
    note: item.note || '',
    status: item.status,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt
  }));
}

function buildCustomersWithLineFields() {
  return mockCustomers.map((customer, index) => ({
    ...customer,
    lineUserId: index < 4 ? `UbudsarinDemo${String(index + 1).padStart(3, '0')}` : '',
    lineDisplayName: customer.customerName,
    lineConsentStatus: index < 8 ? 'granted' : 'unknown',
    lineLastMessageAt: index < 3 ? nowIso() : ''
  }));
}

function buildQrCodes() {
  return [
    { entityType: 'order', entityId: 'ORD-DEMO-001', payload: 'BF-ORDER-ORD-DEMO-001', label: 'Demo order lookup' },
    { entityType: 'receipt', entityId: 'BF-DEMO-0001', payload: 'BF-RECEIPT-BF-DEMO-0001', label: 'Demo receipt lookup' },
    { entityType: 'customer', entityId: 'CUS-001', payload: 'BF-CUSTOMER-CUS-001', label: 'Demo customer profile' }
  ].map(item => ({ id: crypto.randomUUID(), ...item, createdAt: nowIso() }));
}

function buildPaymentPlaceholders() {
  return [{
    id: 'payment-demo-1',
    refNo: 'PAY-DEMO-001',
    amount: 1500,
    customerName: 'คุณมายด์',
    sourceType: 'order',
    sourceId: 'ORD-DEMO-001',
    expiresAt: new Date(Date.now() + 30 * 60000).toISOString(),
    status: 'pending',
    createdAt: nowIso(),
    updatedAt: nowIso()
  }];
}

function summarizeSales(sales) {
  return sales.reduce((summary, sale) => ({
    total: summary.total + Number(sale.total || 0),
    count: summary.count + 1,
    grossProfit: summary.grossProfit + Number(sale.grossProfit || 0)
  }), { total: 0, count: 0, grossProfit: 0 });
}
