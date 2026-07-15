import { addExpense } from './finance-service.js';
import { recordPriceHistory } from './price-history.js';
import { createSupplierPayable } from './supplier-payables.js';
import { mockPurchaseOrders } from './suppliers-data.js';

const PO_KEY = 'budsarin_purchase_orders';
const INVENTORY_KEY = 'budsarin_inventory_items';
const MOVEMENT_KEY = 'budsarin_stock_movements';

export const loadPurchaseOrders = () => loadArray(PO_KEY, mockPurchaseOrders);
export const savePurchaseOrders = items => localStorage.setItem(PO_KEY, JSON.stringify(items));

export function calculatePOSubtotal(items = []) {
  return items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitCost) || 0), 0);
}

export function calculatePOTotal(po) {
  const subtotal = calculatePOSubtotal(po.items || []);
  return {
    subtotal,
    totalAmount: Math.max(subtotal - (Number(po.discountAmount) || 0) + (Number(po.shippingFee) || 0) + (Number(po.taxAmount) || 0), 0)
  };
}

export function createPurchaseOrder(data) {
  const orders = loadPurchaseOrders();
  const totals = calculatePOTotal(data);
  const totalAmount = totals.totalAmount;
  const paidAmount = Number(data.paidAmount) || 0;
  const po = {
    id: crypto.randomUUID(),
    poNo: `PO-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${String(orders.length + 1).padStart(3, '0')}`,
    orderDate: new Date().toISOString().slice(0, 10),
    expectedReceiveDate: data.expectedReceiveDate || new Date().toISOString().slice(0, 10),
    receivedDate: '',
    items: data.items || [],
    discountAmount: Number(data.discountAmount) || 0,
    shippingFee: Number(data.shippingFee) || 0,
    taxAmount: Number(data.taxAmount) || 0,
    subtotal: totals.subtotal,
    totalAmount,
    paidAmount,
    balanceAmount: Math.max(totalAmount - paidAmount, 0),
    paymentMethod: data.paymentMethod || 'transfer',
    paymentStatus: paidAmount >= totalAmount ? 'paid' : paidAmount > 0 ? 'partial' : 'unpaid',
    poStatus: data.poStatus || 'ordered',
    note: data.note || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...data
  };
  orders.unshift(po);
  savePurchaseOrders(orders);
  createExpenseFromPO(po);
  return po;
}

export function editPurchaseOrder(id, data) {
  const orders = loadPurchaseOrders();
  const index = orders.findIndex(item => item.id === id);
  if (index < 0) throw new Error('ไม่พบ PO');
  const next = { ...orders[index], ...data, updatedAt: new Date().toISOString() };
  const totals = calculatePOTotal(next);
  next.subtotal = totals.subtotal;
  next.totalAmount = totals.totalAmount;
  next.balanceAmount = Math.max(next.totalAmount - (Number(next.paidAmount) || 0), 0);
  orders[index] = next;
  savePurchaseOrders(orders);
  return next;
}

export function deletePurchaseOrder(id) {
  savePurchaseOrders(loadPurchaseOrders().filter(item => item.id !== id));
}

export function addPOItem(po, item) {
  po.items = [...(po.items || []), { id: crypto.randomUUID(), receivedQuantity: 0, qualityStatus: 'ดี', ...item }];
  return calculatePOTotal(po);
}

export function removePOItem(po, itemId) {
  po.items = (po.items || []).filter(item => item.id !== itemId);
  return calculatePOTotal(po);
}

export function updatePOStatus(id, status) {
  return editPurchaseOrder(id, { poStatus: status });
}

export function receivePOItems(id) {
  const po = loadPurchaseOrders().find(item => item.id === id);
  if (!po) throw new Error('ไม่พบ PO');
  po.items = po.items.map(item => ({ ...item, receivedQuantity: Number(item.quantity) || 0, qualityStatus: item.qualityStatus || 'ดี' }));
  po.poStatus = 'received';
  po.receivedDate = new Date().toISOString().slice(0, 10);
  po.updatedAt = new Date().toISOString();
  editPurchaseOrder(id, po);
  createStockInFromPO(po);
  recordPriceHistory(po);
  createExpenseFromPO(po);
  return po;
}

export function createStockInFromPO(po) {
  const inventory = loadArray(INVENTORY_KEY, []);
  const movements = loadArray(MOVEMENT_KEY, []);
  po.items.forEach(item => {
    const qty = Number(item.receivedQuantity || item.quantity) || 0;
    const existing = inventory.find(row => row.id === item.inventoryItemId || row.itemName === item.itemName);
    if (existing) {
      const oldQty = Number(existing.quantity) || 0;
      const oldCost = Number(existing.averagePurchasePrice || existing.lastPurchasePrice || item.unitCost) || 0;
      existing.quantity = oldQty + qty;
      existing.lastPurchasePrice = Number(item.unitCost) || 0;
      existing.averagePurchasePrice = (oldQty + qty) > 0 ? ((oldQty * oldCost) + (qty * (Number(item.unitCost) || 0))) / (oldQty + qty) : Number(item.unitCost) || 0;
      existing.lastPurchaseDate = po.receivedDate;
      existing.preferredSupplierId = po.supplierId;
    } else {
      inventory.push({
        id: item.inventoryItemId || crypto.randomUUID(),
        itemName: item.itemName,
        category: item.category,
        quantity: qty,
        unit: item.unit,
        supplierId: po.supplierId,
        preferredSupplierId: po.supplierId,
        lastPurchasePrice: Number(item.unitCost) || 0,
        averagePurchasePrice: Number(item.unitCost) || 0,
        lastPurchaseDate: po.receivedDate,
        expiryDate: item.expiryDate || '',
        useByDate: item.useByDate || ''
      });
    }
    movements.unshift({ id: crypto.randomUUID(), type: 'stock_in', sourceType: 'purchase_order', sourceId: po.id, itemName: item.itemName, quantity: qty, unit: item.unit, unitCost: Number(item.unitCost) || 0, createdAt: new Date().toISOString() });
  });
  localStorage.setItem(INVENTORY_KEY, JSON.stringify(inventory));
  localStorage.setItem(MOVEMENT_KEY, JSON.stringify(movements.slice(0, 300)));
}

export function createExpenseFromPO(po) {
  if (po.paymentStatus === 'unpaid') return createSupplierPayable(po);
  const paid = Number(po.paidAmount) || 0;
  if (paid > 0) {
    addExpense({
      date: po.orderDate,
      time: new Date().toTimeString().slice(0, 5),
      category: 'ซื้อดอกไม้',
      supplierName: po.supplierName,
      description: `PO ${po.poNo}`,
      amount: paid,
      paymentMethod: po.paymentMethod,
      paymentStatus: 'paid',
      sourceType: 'purchase_order',
      sourceId: po.id,
      evidenceImage: 'po-payment-placeholder'
    });
  }
  if (Number(po.balanceAmount) > 0) return createSupplierPayable(po);
  return null;
}

export function recordSupplierPayment(poId, amount) {
  const po = loadPurchaseOrders().find(item => item.id === poId);
  if (!po) return null;
  po.paidAmount = Math.min((Number(po.paidAmount) || 0) + (Number(amount) || 0), po.totalAmount);
  po.balanceAmount = Math.max(po.totalAmount - po.paidAmount, 0);
  po.paymentStatus = po.balanceAmount <= 0 ? 'paid' : 'partial';
  editPurchaseOrder(po.id, po);
  createExpenseFromPO({ ...po, paidAmount: Number(amount) || 0, balanceAmount: po.balanceAmount });
  return po;
}

function loadArray(key, fallback) {
  try {
    const saved = JSON.parse(localStorage.getItem(key));
    if (Array.isArray(saved)) return saved;
  } catch {}
  localStorage.setItem(key, JSON.stringify(fallback));
  return structuredClone(fallback);
}
