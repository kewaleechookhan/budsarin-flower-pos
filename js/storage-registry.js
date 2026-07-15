export const STORAGE_KEYS = Object.freeze({
  dashboardState: 'budsarin_dashboard_state',
  dashboardLegacy: 'budsarinFlowerDashboardV1',
  posLegacy: 'budsarinFlowerPOSV2',
  sales: 'budsarin_sales',
  heldBills: 'budsarin_held_bills',
  cartDraft: 'budsarin_cart_draft',
  products: 'budsarin_products',
  orders: 'budsarin_orders',
  orderTimelines: 'budsarin_order_timelines',
  costTemplates: 'budsarin_cost_templates',
  costHistory: 'budsarin_cost_history',
  incomeTransactions: 'budsarin_income_transactions',
  expenseTransactions: 'budsarin_expense_transactions',
  financeSettings: 'budsarin_finance_settings',
  cashFlow: 'budsarin_cash_flow',
  accountsReceivable: 'budsarin_accounts_receivable',
  accountsPayable: 'budsarin_accounts_payable',
  events: 'budsarin_events',
  eventQuotations: 'budsarin_event_quotations',
  eventPayments: 'budsarin_event_payments',
  eventCosts: 'budsarin_event_costs',
  eventChecklists: 'budsarin_event_checklists',
  eventTimelines: 'budsarin_event_timelines',
  eventSettings: 'budsarin_event_settings',
  inventoryItems: 'budsarin_inventory_items',
  stockMovements: 'budsarin_stock_movements',
  wasteItems: 'budsarin_waste_items',
  inventorySettings: 'budsarin_inventory_settings',
  suppliers: 'budsarin_suppliers',
  purchaseOrders: 'budsarin_purchase_orders',
  priceHistory: 'budsarin_price_history',
  supplierPriceHistory: 'budsarin_supplier_price_history',
  supplierPayables: 'budsarin_supplier_payables',
  customers: 'budsarin_customers',
  customerImportantDates: 'budsarin_customer_important_dates',
  customerFollowups: 'budsarin_customer_followups',
  customerSegments: 'budsarin_customer_segments',
  customerPurchaseHistory: 'budsarin_customer_purchase_history',
  messageTemplates: 'budsarin_message_templates',
  reportPresets: 'budsarin_report_presets',
  reportCache: 'budsarin_report_cache',
  reportSettings: 'budsarin_report_settings',
  storeProfile: 'budsarin_store_profile',
  brandSettings: 'budsarin_brand_settings',
  users: 'budsarin_users',
  permissionSettings: 'budsarin_permission_settings',
  currentUser: 'budsarin_current_user',
  notificationSettings: 'budsarin_notification_settings',
  moduleSettings: 'budsarin_module_settings',
  systemSettings: 'budsarin_system_settings',
  calendarEvents: 'budsarin_calendar_events',
  manualTasks: 'budsarin_manual_tasks',
  reminders: 'budsarin_reminders',
  calendarSettings: 'budsarin_calendar_settings',
  backupHistory: 'budsarin_backup_history',
  seedStatus: 'budsarin_seed_status',
  productionReady: 'budsarin_production_ready',
  resetBackups: 'budsarin_reset_backups',
  offlineQueue: 'budsarin_offline_queue',
  offlineCache: 'budsarin_offline_cache',
  syncConflicts: 'budsarin_sync_conflicts',
  lastSuccessfulSync: 'budsarin_last_successful_sync',
  qrCodes: 'budsarin_qr_codes',
  paymentQrPlaceholders: 'budsarin_payment_qr_placeholders',
  backendSettings: 'budsarin_backend_settings',
  apiContracts: 'budsarin_api_contracts',
  auditLogs: 'budsarin_audit_logs',
  printerSettings: 'budsarin_printer_settings',
  lineSettings: 'budsarin_line_settings',
  lineMessageTemplates: 'budsarin_line_message_templates',
  notificationLogs: 'budsarin_notification_logs',
  deviceSessions: 'budsarin_device_sessions'
  ,backendSession: 'budsarin_backend_session'
  ,inventoryRecipes: 'budsarin_inventory_recipes'
});

export const ALL_STORAGE_KEYS = Object.freeze([...new Set(Object.values(STORAGE_KEYS))]);

export function readStorage(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    if (raw == null || raw === '') return fallback;
    return JSON.parse(raw);
  } catch (error) {
    console.warn(`[Budsarin Storage] parse failed for ${key}`, error);
    return fallback;
  }
}

export function writeStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
  return value;
}

export function removeStorage(key) {
  localStorage.removeItem(key);
}

export function hasStorage(key) {
  return localStorage.getItem(key) != null;
}

export function storageSnapshot(keys = ALL_STORAGE_KEYS) {
  return keys.reduce((snapshot, key) => {
    if (hasStorage(key)) snapshot[key] = readStorage(key);
    return snapshot;
  }, {});
}
