import { calculateSaleTotals } from './calculations.js';
import { syncCustomerFromPOS } from './customers-service.js';
import { syncIncomeFromPOS } from './finance-service.js';
import { queueWhenOffline } from './offline-queue.js';
import { loadPosState, loadState, savePosState, saveState } from './storage.js';

const todayKey = () => new Date().toISOString().slice(0, 10);

export function createSale({ items, discountType, discountValue, deliveryFee, documentType = 'receipt', paymentMethod, paidAmount, depositDueDate, customerName = '', customerTaxId = '', customerAddress = '' }) {
  const totals = calculateSaleTotals({ items, discountType, discountValue, deliveryFee });
  const salesState = loadPosState();
  const prefix = documentType === 'quotation' ? 'QT' : documentType === 'delivery_note' ? 'DN' : 'RC';
  const saleNo = `BF-${prefix}-${todayKey().replaceAll('-', '')}-${String(salesState.sales.length + 1).padStart(4, '0')}`;
  const paid = Number(paidAmount) || 0;
  const sale = {
    id: crypto.randomUUID(),
    saleNo,
    createdAt: new Date().toISOString(),
    items: items.map(item => ({ ...item })),
    subtotal: totals.subtotal,
    discountType,
    discountValue: Number(discountValue) || 0,
    discountAmount: totals.discountAmount,
    deliveryFee: totals.deliveryFee,
    total: totals.total,
    documentType,
    paymentMethod,
    paidAmount: paid,
    balance: Math.max(totals.total - paid, 0),
    grossCost: totals.grossCost,
    grossProfit: totals.grossProfit,
    grossMargin: totals.grossMargin,
    depositDueDate: depositDueDate || '',
    customerName,
    customerTaxId,
    customerAddress,
    status: documentType === 'quotation' ? 'quotation' : documentType === 'delivery_note' ? 'delivered' : paid >= totals.total ? 'paid' : 'partial'
  };
  salesState.sales.push(sale);
  salesState.cartDraft = null;
  salesState.dailySalesSummary = summarizeToday(salesState.sales);
  savePosState(salesState);
  if (documentType === 'receipt' && paid > 0) syncIncomeFromPOS(sale);
  syncCustomerFromPOS(sale);
  queueWhenOffline({ actionType: 'create', entityType: 'sale', entityId: sale.id, endpoint: '/sync/offline-queue', payload: sale });
  if (documentType === 'receipt') updateDashboardData(sale);
  return sale;
}

export function holdBill(cartState) {
  const salesState = loadPosState();
  if (!cartState.items.length) return null;
  const held = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), ...cartState };
  salesState.heldBills.unshift(held);
  salesState.cartDraft = null;
  savePosState(salesState);
  return held;
}

export function restoreHeldBill(id) {
  const salesState = loadPosState();
  const bill = salesState.heldBills.find(item => item.id === id);
  salesState.heldBills = salesState.heldBills.filter(item => item.id !== id);
  savePosState(salesState);
  return bill || null;
}

export function saveCartDraft(cartState) {
  const salesState = loadPosState();
  salesState.cartDraft = cartState;
  savePosState(salesState);
}

export function summarizeToday(sales) {
  return sales.filter(sale => sale.createdAt.slice(0, 10) === todayKey()).reduce((summary, sale) => ({
    total: summary.total + sale.total,
    count: summary.count + 1,
    grossProfit: summary.grossProfit + sale.grossProfit
  }), { total: 0, count: 0, grossProfit: 0 });
}

export function updateDashboardData(sale) {
  const dashboard = loadState(null);
  if (!dashboard) return;
  const salesKpi = dashboard.kpis?.find(item => item.id === 'sales');
  const ordersKpi = dashboard.kpis?.find(item => item.id === 'orders');
  const profitKpi = dashboard.kpis?.find(item => item.id === 'profit');
  if (salesKpi) salesKpi.value += sale.total;
  if (ordersKpi) ordersKpi.value += 1;
  if (profitKpi) profitKpi.value += sale.grossProfit;
  if (dashboard.finance) {
    dashboard.finance.revenue += sale.total;
    dashboard.finance.grossProfit += sale.grossProfit;
    dashboard.finance.netProfit += sale.grossProfit;
    dashboard.finance.cashBalance += sale.paidAmount;
    dashboard.finance.receivable += sale.balance;
  }
  if (dashboard.breakEven) dashboard.breakEven.currentSales += sale.total;
  if (dashboard.salesChart?.week) dashboard.salesChart.week[dashboard.salesChart.week.length - 1] += sale.total;
  if (dashboard.salesChart?.month) dashboard.salesChart.month[dashboard.salesChart.month.length - 1] += sale.total;
  saveState(dashboard);
  window.dispatchEvent(new CustomEvent('dashboard:update', { detail: dashboard }));
}
