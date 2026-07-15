import { backupKeys } from './backup-restore.js';

export function runDataHealthCheck() {
  const checks = [
    ...detectMissingKeys(),
    ...detectBrokenJSON(),
    ...detectMissingReferences(),
    ...detectDuplicateTransactions(),
    ...detectNegativeInventory(),
    ...detectInvalidPayments(),
    ...detectDuplicateCustomers(),
    ...detectSupplierIssues(),
    ...detectCostTemplateIssues()
  ];
  return {
    checkedAt: new Date().toISOString(),
    total: checks.length,
    critical: checks.filter(item => item.status === 'critical').length,
    warning: checks.filter(item => item.status === 'warning').length,
    passed: checks.filter(item => item.status === 'passed').length,
    checks
  };
}

export function detectDuplicateTransactions() {
  const income = loadArray('budsarin_income_transactions');
  const expenses = loadArray('budsarin_expense_transactions');
  const rows = [...income, ...expenses];
  const seen = new Set();
  const duplicates = rows.filter(item => {
    const key = `${item.sourceType || 'manual'}:${item.sourceId || item.transactionNo || item.description}:${item.amount}`;
    if (seen.has(key)) return true;
    seen.add(key);
    return false;
  });
  return [result('Finance transactions ซ้ำ', duplicates.length ? 'warning' : 'passed', duplicates.length ? `พบ ${duplicates.length} รายการซ้ำ` : 'ไม่พบรายการซ้ำ')];
}

export function detectMissingReferences() {
  const orders = loadArray('budsarin_orders');
  const missingCustomer = orders.filter(item => !item.customerId);
  const payments = [...loadArray('budsarin_income_transactions'), ...loadArray('budsarin_expense_transactions')].filter(item => item.sourceType && item.sourceType !== 'manual' && !item.sourceId);
  return [
    result('Orders ที่ไม่มี customerId', missingCustomer.length ? 'warning' : 'passed', missingCustomer.length ? `${missingCustomer.length} orders ไม่มี customerId` : 'ข้อมูลอ้างอิงลูกค้าครบ'),
    result('Payments ที่ไม่มี sourceId', payments.length ? 'warning' : 'passed', payments.length ? `${payments.length} payments ไม่มี sourceId` : 'Payment source ครบ')
  ];
}

export function detectNegativeInventory() {
  const rows = loadArray('budsarin_inventory_items').filter(item => Number(item.quantity || item.currentStock || 0) < 0);
  return [result('Inventory quantity ติดลบ', rows.length ? 'critical' : 'passed', rows.length ? `พบ ${rows.length} รายการติดลบ` : 'ไม่พบ stock ติดลบ')];
}

export function detectInvalidPayments() {
  const events = loadArray('budsarin_events');
  const invalid = events.filter(item => Number(item.paidAmount || item.depositAmount || 0) > Number(item.totalAmount || item.value || 0));
  return [result('Events ที่ยอดชำระเกินยอดสุทธิ', invalid.length ? 'critical' : 'passed', invalid.length ? `พบ ${invalid.length} events ผิดปกติ` : 'ยอดชำระ Events ปกติ')];
}

export function detectDuplicateCustomers() {
  const customers = loadArray('budsarin_customers');
  const phones = new Map();
  customers.forEach(item => {
    if (!item.phone) return;
    phones.set(item.phone, (phones.get(item.phone) || 0) + 1);
  });
  const duplicates = [...phones.values()].filter(count => count > 1).length;
  return [result('Customers ที่เบอร์โทรซ้ำ', duplicates ? 'warning' : 'passed', duplicates ? `พบเบอร์ซ้ำ ${duplicates} เบอร์` : 'ไม่พบเบอร์โทรซ้ำ')];
}

export function repairMinorIssues() {
  const orders = loadArray('budsarin_orders');
  let repaired = 0;
  orders.forEach(order => {
    if (!order.customerId && order.customerName) {
      order.customerId = `repair-${slug(order.customerName)}`;
      repaired += 1;
    }
  });
  if (repaired) localStorage.setItem('budsarin_orders', JSON.stringify(orders));
  return { repaired, repairedAt: new Date().toISOString() };
}

export function exportHealthReport(report = runDataHealthCheck()) {
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `budsarin-data-health-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
  return report;
}

function detectMissingKeys() {
  const required = ['budsarin_store_profile', 'budsarin_brand_settings', 'budsarin_finance_settings', 'budsarin_users', 'budsarin_module_settings'];
  const missing = required.filter(key => !localStorage.getItem(key));
  return [result('LocalStorage keys ที่หาย', missing.length ? 'warning' : 'passed', missing.length ? `ขาด ${missing.join(', ')}` : 'Required keys ครบ')];
}

function detectBrokenJSON() {
  const broken = backupKeys.filter(key => {
    const value = localStorage.getItem(key);
    if (value == null) return false;
    try { JSON.parse(value); return false; } catch { return true; }
  });
  return [result('ข้อมูล JSON parse ไม่ได้', broken.length ? 'critical' : 'passed', broken.length ? `อ่านไม่ได้: ${broken.join(', ')}` : 'JSON ทุก key อ่านได้')];
}

function detectSupplierIssues() {
  const rows = loadArray('budsarin_suppliers').filter(item => !item.phone);
  return [result('Suppliers ที่ไม่มีเบอร์โทร', rows.length ? 'warning' : 'passed', rows.length ? `พบ ${rows.length} suppliers ไม่มีเบอร์` : 'Supplier contact ครบ')];
}

function detectCostTemplateIssues() {
  const rows = loadArray('budsarin_cost_templates').filter(item => !(Number(item.totalCost) > 0));
  return [result('Cost templates ที่ไม่มี totalCost', rows.length ? 'warning' : 'passed', rows.length ? `พบ ${rows.length} templates ไม่มี totalCost` : 'Cost templates ปกติ')];
}

function result(title, status, detail) {
  return { title, status, detail };
}

function loadArray(key) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function slug(value) {
  return String(value).trim().toLowerCase().replace(/\s+/g, '-').slice(0, 32);
}
