import { addExpense } from './finance-service.js';
import { mockSupplierPayables, supplierTypes } from './suppliers-data.js';

const PAYABLE_KEY = 'budsarin_supplier_payables';

export const loadSupplierPayables = () => loadArray(PAYABLE_KEY, mockSupplierPayables);
export const saveSupplierPayables = items => localStorage.setItem(PAYABLE_KEY, JSON.stringify(items));

export function createSupplierPayable(po) {
  if (Number(po.balanceAmount) <= 0) return null;
  const payables = loadSupplierPayables();
  if (payables.some(item => item.referenceType === 'purchase_order' && item.referenceId === po.id)) return null;
  const item = {
    id: crypto.randomUUID(),
    supplierId: po.supplierId,
    supplierName: po.supplierName,
    referenceType: 'purchase_order',
    referenceId: po.id,
    description: po.poNo,
    amount: po.totalAmount,
    paidAmount: po.paidAmount,
    balanceAmount: po.balanceAmount,
    dueDate: po.expectedReceiveDate,
    status: 'normal',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  payables.unshift(item);
  saveSupplierPayables(payables);
  return item;
}

export function recordSupplierPayment(payableId, amount, supplierType = 'general') {
  const payables = loadSupplierPayables();
  const payable = payables.find(item => item.id === payableId);
  if (!payable) return null;
  const paid = Math.min(Number(amount) || payable.balanceAmount, payable.balanceAmount);
  payable.paidAmount += paid;
  payable.balanceAmount = Math.max(payable.amount - payable.paidAmount, 0);
  payable.status = payable.balanceAmount <= 0 ? 'paid' : 'normal';
  payable.updatedAt = new Date().toISOString();
  saveSupplierPayables(payables);
  syncPayableToFinance(payable, paid, supplierType);
  return payable;
}

export function calculateSupplierBalance(supplierId) {
  return loadSupplierPayables().filter(item => item.supplierId === supplierId && item.status !== 'cancelled').reduce((sum, item) => sum + (Number(item.balanceAmount) || 0), 0);
}

export function detectOverduePayables(today = new Date()) {
  return loadSupplierPayables().map(item => {
    const agingDays = item.dueDate ? Math.floor((new Date(today.toISOString().slice(0, 10)) - new Date(item.dueDate)) / 86400000) : 0;
    const status = item.balanceAmount <= 0 ? 'paid' : agingDays > 0 ? 'overdue' : agingDays >= -3 ? 'due_soon' : item.status;
    return { ...item, agingDays, status };
  });
}

export function syncPayableToFinance(payable, paidAmount, supplierType = 'general') {
  if (!paidAmount) return null;
  const categoryMap = {
    fresh_flower_wholesale: 'ซื้อดอกไม้',
    packaging: 'ซื้อวัสดุห่อ',
    container: 'ซื้อวัสดุ/ภาชนะ',
    event_equipment: 'ค่าเช่า/ซื้ออุปกรณ์',
    printing: 'สิ่งพิมพ์/ป้าย',
    delivery: 'ค่าขนส่ง',
    general: 'รายจ่ายอื่น ๆ'
  };
  return addExpense({
    date: new Date().toISOString().slice(0, 10),
    time: new Date().toTimeString().slice(0, 5),
    category: categoryMap[supplierType] || categoryMap.general,
    supplierName: payable.supplierName,
    description: `ชำระ ${payable.description}`,
    amount: paidAmount,
    paymentMethod: 'transfer',
    paymentStatus: 'paid',
    sourceType: 'supplier_payment',
    sourceId: payable.id,
    evidenceImage: 'supplier-payment-placeholder'
  });
}

function loadArray(key, fallback) {
  try {
    const saved = JSON.parse(localStorage.getItem(key));
    if (Array.isArray(saved)) return saved;
  } catch {}
  localStorage.setItem(key, JSON.stringify(fallback));
  return structuredClone(fallback);
}
