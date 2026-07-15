import { loadPriceHistory, compareSupplierPrices, detectPriceIncrease, findBestSupplierForItem } from './price-history.js';
import { loadPurchaseOrders } from './purchase-orders.js';
import { calculateSupplierBalance, detectOverduePayables, loadSupplierPayables, recordSupplierPayment } from './supplier-payables.js';
import { mockSuppliers, supplierTypes } from './suppliers-data.js';
import { loadState, saveState } from './storage.js';

const SUPPLIER_KEY = 'budsarin_suppliers';

export const loadSuppliers = () => loadArray(SUPPLIER_KEY, mockSuppliers);
export const saveSuppliers = suppliers => localStorage.setItem(SUPPLIER_KEY, JSON.stringify(suppliers));

export function addSupplier(data) {
  const suppliers = loadSuppliers();
  const supplier = normalizeSupplier(data, suppliers);
  suppliers.unshift(supplier);
  saveSuppliers(suppliers);
  syncSupplierDashboard();
  return supplier;
}

export function editSupplier(id, data) {
  const suppliers = loadSuppliers();
  const index = suppliers.findIndex(item => item.id === id);
  if (index < 0) throw new Error('ไม่พบ Supplier');
  suppliers[index] = { ...suppliers[index], ...data, updatedAt: new Date().toISOString() };
  saveSuppliers(suppliers);
  syncSupplierDashboard();
  return suppliers[index];
}

export function searchSuppliers(query = '', suppliers = loadSuppliers()) {
  const text = query.trim().toLowerCase();
  if (!text) return suppliers;
  return suppliers.filter(item => `${item.supplierName} ${item.phone} ${item.mainProducts} ${item.contactPerson}`.toLowerCase().includes(text));
}

export function filterSuppliers(filters = {}, suppliers = loadSuppliers()) {
  return suppliers.filter(item =>
    (!filters.type || filters.type === 'all' || item.supplierType === filters.type) &&
    (!filters.status || filters.status === 'all' || item.status === filters.status) &&
    (!filters.province || item.province === filters.province) &&
    (!filters.credit || filters.credit === 'all' || (filters.credit === 'yes' ? Number(item.creditLimit) > 0 : Number(item.creditLimit) <= 0)) &&
    (!filters.rating || Number(item.rating) >= Number(filters.rating))
  );
}

export function getSupplierSnapshot() {
  const suppliers = loadSuppliers();
  const purchaseOrders = loadPurchaseOrders();
  const priceHistory = loadPriceHistory();
  const payables = detectOverduePayables();
  const month = new Date().toISOString().slice(0, 7);
  const monthlyPOs = purchaseOrders.filter(po => po.orderDate?.startsWith(month));
  const supplierTotals = purchaseOrders.reduce((result, po) => {
    result[po.supplierName] = (result[po.supplierName] || 0) + (Number(po.totalAmount) || 0);
    return result;
  }, {});
  const mostPurchasedSupplier = Object.entries(supplierTotals).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';
  const priceIncrease = detectPriceIncrease()[0];
  return {
    suppliers,
    purchaseOrders,
    priceHistory,
    payables,
    totalSuppliers: suppliers.length,
    activeSuppliers: suppliers.filter(item => item.status !== 'inactive' && item.status !== 'blacklisted').length,
    preferredSuppliers: suppliers.filter(item => item.status === 'preferred').length,
    monthlyPOCount: monthlyPOs.length,
    monthlyPurchaseTotal: monthlyPOs.reduce((sum, po) => sum + (Number(po.totalAmount) || 0), 0),
    payableTotal: payables.reduce((sum, item) => sum + (Number(item.balanceAmount) || 0), 0),
    mostPurchasedSupplier,
    highestPriceIncrease: priceIncrease ? `${priceIncrease.itemName} +${priceIncrease.increase.toFixed(1)}%` : '-'
  };
}

export function comparePrices(itemName) {
  const suppliers = loadSuppliers();
  const comparisons = compareSupplierPrices(itemName).map(row => {
    const supplier = suppliers.find(item => item.id === row.supplierId) || {};
    const best = findBestSupplierForItem(itemName, suppliers);
    const priceScore = row.averagePrice > 0 ? 1000 / row.averagePrice : 0;
    const ratingScore = (Number(supplier.rating) || 3) * 10;
    const creditScore = Number(supplier.creditDays) || 0;
    const reliabilityScore = row.prices.length * 4;
    return { ...row, supplier, score: priceScore + ratingScore + creditScore + reliabilityScore, recommended: best?.supplierId === row.supplierId };
  });
  return comparisons.sort((a, b) => b.score - a.score);
}

export function syncSupplierDashboard() {
  const snapshot = getSupplierSnapshot();
  const dashboard = loadState(null);
  if (!dashboard) return snapshot;
  if (dashboard.finance) dashboard.finance.payable = snapshot.payableTotal;
  dashboard.supplierAlerts = [
    ...snapshot.purchaseOrders.filter(po => po.poStatus === 'ordered').slice(0, 2).map(po => `PO ยังไม่ได้รับสินค้า: ${po.poNo}`),
    ...snapshot.payables.filter(item => ['due_soon', 'overdue'].includes(item.status)).slice(0, 2).map(item => `เจ้าหนี้ใกล้ครบกำหนด: ${item.supplierName}`),
    ...detectPriceIncrease().slice(0, 2).map(item => `ราคาขึ้น: ${item.itemName} ${item.increase.toFixed(1)}%`)
  ];
  saveState(dashboard);
  window.dispatchEvent(new CustomEvent('dashboard:update', { detail: dashboard }));
  return snapshot;
}

export { calculateSupplierBalance, recordSupplierPayment, supplierTypes };

function normalizeSupplier(data, suppliers) {
  const now = new Date().toISOString();
  return {
    id: data.id || crypto.randomUUID(),
    supplierCode: data.supplierCode || `SUP-${String(suppliers.length + 1).padStart(3, '0')}`,
    supplierName: data.supplierName || 'Supplier ใหม่',
    supplierType: data.supplierType || 'general',
    contactPerson: data.contactPerson || '',
    phone: data.phone || '',
    lineId: data.lineId || '',
    facebook: data.facebook || '',
    email: data.email || '',
    address: data.address || '',
    province: data.province || '',
    taxId: data.taxId || '',
    paymentTerms: data.paymentTerms || 'เงินสด',
    creditLimit: Number(data.creditLimit) || 0,
    creditDays: Number(data.creditDays) || 0,
    bankName: data.bankName || '',
    bankAccountName: data.bankAccountName || '',
    bankAccountNo: data.bankAccountNo || '',
    preferredPaymentMethod: data.preferredPaymentMethod || 'transfer',
    mainProducts: data.mainProducts || '',
    rating: Number(data.rating) || 3,
    status: data.status || 'active',
    note: data.note || '',
    createdAt: data.createdAt || now,
    updatedAt: now
  };
}

function loadArray(key, fallback) {
  try {
    const saved = JSON.parse(localStorage.getItem(key));
    if (Array.isArray(saved)) return saved;
  } catch {}
  localStorage.setItem(key, JSON.stringify(fallback));
  return structuredClone(fallback);
}
