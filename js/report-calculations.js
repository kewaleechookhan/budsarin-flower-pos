const sum = (items, selector) => items.reduce((total, item) => total + (Number(selector(item)) || 0), 0);
const pct = (part, total) => total ? (part / total) * 100 : 0;
const avg = values => values.length ? values.reduce((a, b) => a + (Number(b) || 0), 0) / values.length : 0;

export function generateSalesReport(data) {
  const salesRows = normalizeSales(data);
  const revenue = calculateTotalSales(salesRows);
  const orderRevenue = sum(data.orders, item => item.totalAmount);
  const eventRevenue = sum(data.events, item => item.totalAmount || item.value);
  const allRevenue = revenue + orderRevenue + eventRevenue;
  return {
    totalSales: allRevenue,
    posBills: salesRows.length,
    orderCount: data.orders.length,
    eventCount: data.events.length,
    averageOrderValue: calculateAverageOrderValue([...salesRows, ...data.orders, ...data.events]),
    byChannel: groupSalesByChannel({ salesRows, orders: data.orders, events: data.events }),
    byCategory: groupSalesByProductCategory(salesRows, data.orders),
    byPaymentMethod: groupSalesByPaymentMethod([...salesRows, ...data.orders]),
    topProducts: getTopSellingProducts(salesRows),
    dailyTrend: getDailySalesTrend([...salesRows, ...data.orders, ...data.events])
  };
}

export function calculateTotalSales(sales = []) {
  return sum(sales, item => item.total || item.totalAmount || item.amount || item.value);
}

export function calculateAverageOrderValue(items = []) {
  return items.length ? calculateTotalSales(items) / items.length : 0;
}

export function groupSalesByChannel({ salesRows = [], orders = [], events = [] }) {
  return [
    { label: 'POS', value: calculateTotalSales(salesRows) },
    { label: 'Orders', value: calculateTotalSales(orders) },
    { label: 'Events', value: calculateTotalSales(events) }
  ];
}

export function groupSalesByProductCategory(sales = [], orders = []) {
  const rows = [];
  sales.forEach(sale => (sale.items || []).forEach(item => rows.push({ label: item.category || 'สินค้า', value: Number(item.lineTotal || item.total || item.price || 0) * (Number(item.qty || item.quantity || 1) || 1) })));
  orders.forEach(order => rows.push({ label: order.orderType || 'orders', value: Number(order.totalAmount) || 0 }));
  return groupRows(rows);
}

export function groupSalesByPaymentMethod(items = []) {
  return groupRows(items.map(item => ({ label: item.paymentMethod || 'other', value: Number(item.total || item.totalAmount || item.amount || item.paidAmount || 0) })));
}

export function getTopSellingProducts(sales = []) {
  const map = new Map();
  sales.forEach(sale => (sale.items || []).forEach(item => {
    const key = item.name || item.productName || 'สินค้า';
    const current = map.get(key) || { label: key, qty: 0, value: 0 };
    current.qty += Number(item.qty || item.quantity || 1);
    current.value += Number(item.lineTotal || item.total || item.price || 0) * (Number(item.qty || item.quantity || 1) || 1);
    map.set(key, current);
  }));
  return [...map.values()].sort((a, b) => b.value - a.value).slice(0, 8);
}

export function getDailySalesTrend(items = []) {
  return groupRows(items.map(item => ({ label: String(item.createdAt || item.date || item.dueDate || item.eventDate || '').slice(0, 10) || 'ไม่ระบุวัน', value: Number(item.total || item.totalAmount || item.amount || item.value || 0) }))).slice(-14);
}

export function generateProfitReport(data) {
  const salesRows = normalizeSales(data);
  const revenue = calculateTotalSales([...salesRows, ...data.orders, ...data.events]);
  const cost = sum(salesRows, item => item.grossCost) + sum(data.orders, item => item.estimatedCost) + sum(data.events, item => item.estimatedCost || item.cost);
  const grossProfit = calculateGrossProfit(revenue, cost);
  return {
    revenue,
    cost,
    grossProfit,
    grossMargin: calculateGrossMargin(grossProfit, revenue),
    netProfit: calculateNetProfit(grossProfit, data.expenses),
    markup: cost ? (grossProfit / cost) * 100 : 0,
    byServiceType: groupProfitByServiceType(salesRows, data.orders, data.events),
    highProfitItems: findHighProfitItems(salesRows, data.orders, data.events),
    lowMarginItems: findLowMarginItems(salesRows, data.orders, data.events),
    profitTrend: calculateProfitTrend([...salesRows, ...data.orders, ...data.events])
  };
}

export function calculateGrossProfit(revenue, cost) {
  return (Number(revenue) || 0) - (Number(cost) || 0);
}

export function calculateGrossMargin(grossProfit, revenue) {
  return pct(Number(grossProfit) || 0, Number(revenue) || 0);
}

export function calculateNetProfit(grossProfit, expenses = []) {
  return (Number(grossProfit) || 0) - sum(expenses, item => item.amount);
}

export function groupProfitByServiceType(sales = [], orders = [], events = []) {
  const rows = [
    { label: 'POS', value: sum(sales, item => item.grossProfit || ((item.total || 0) - (item.grossCost || 0))) },
    ...orders.map(item => ({ label: item.orderType || 'orders', value: Number(item.grossProfit || ((item.totalAmount || 0) - (item.estimatedCost || 0))) })),
    ...events.map(item => ({ label: item.eventType || 'events', value: Number(item.grossProfit || ((item.totalAmount || item.value || 0) - (item.estimatedCost || item.cost || 0))) }))
  ];
  return groupRows(rows);
}

export function findHighProfitItems(sales = [], orders = [], events = []) {
  return normalizeProfitItems(sales, orders, events).sort((a, b) => b.grossProfit - a.grossProfit).slice(0, 8);
}

export function findLowMarginItems(sales = [], orders = [], events = []) {
  return normalizeProfitItems(sales, orders, events).filter(item => item.grossMargin < 30).sort((a, b) => a.grossMargin - b.grossMargin).slice(0, 8);
}

export function calculateProfitTrend(items = []) {
  return groupRows(items.map(item => ({ label: String(item.createdAt || item.date || item.dueDate || item.eventDate || '').slice(0, 10) || 'ไม่ระบุวัน', value: Number(item.grossProfit || ((item.total || item.totalAmount || item.value || 0) - (item.grossCost || item.estimatedCost || item.cost || 0))) }))).slice(-14);
}

export function generateFinanceReport(data) {
  const summary = calculateIncomeExpenseSummary(data.income, data.expenses);
  return {
    ...summary,
    ...calculateCashFlowSummary(data.income, data.expenses, data.financeSettings),
    receivables: calculateReceivableSummary(data.orders, data.income),
    payables: calculatePayableSummary(data.expenses, data.purchaseOrders),
    expensesByCategory: groupExpensesByCategory(data.expenses),
    incomeByChannel: groupIncomeByChannel(data.income),
    overdueItems: detectOverdueFinanceItems(data.orders, data.expenses, data.purchaseOrders)
  };
}

export function calculateIncomeExpenseSummary(income = [], expenses = []) {
  const totalIncome = sum(income, item => item.amount);
  const totalExpense = sum(expenses, item => item.amount);
  return { totalIncome, totalExpense, netCashFlow: totalIncome - totalExpense };
}

export function calculateCashFlowSummary(income = [], expenses = [], settings = {}) {
  const openingBalance = Number(settings.openingBalance) || 0;
  const netCashFlow = sum(income, item => item.amount) - sum(expenses, item => item.amount);
  const closingBalance = openingBalance + netCashFlow;
  return { openingBalance, closingBalance, cashBalanceProjection: closingBalance + (netCashFlow * 0.25) };
}

export function calculateReceivableSummary(orders = []) {
  const rows = orders.filter(item => Number(item.balanceAmount || ((item.totalAmount || 0) - (item.paidAmount || item.depositAmount || 0))) > 0);
  return { count: rows.length, amount: sum(rows, item => item.balanceAmount || ((item.totalAmount || 0) - (item.paidAmount || item.depositAmount || 0))), rows };
}

export function calculatePayableSummary(expenses = [], purchaseOrders = []) {
  const expenseRows = expenses.filter(item => ['pending', 'partial', 'unpaid'].includes(item.paymentStatus));
  const poRows = purchaseOrders.filter(item => Number(item.balanceAmount || ((item.totalAmount || 0) - (item.paidAmount || 0))) > 0);
  return { count: expenseRows.length + poRows.length, amount: sum(expenseRows, item => item.amount) + sum(poRows, item => item.balanceAmount || ((item.totalAmount || 0) - (item.paidAmount || 0))), rows: [...expenseRows, ...poRows] };
}

export function groupExpensesByCategory(expenses = []) {
  return groupRows(expenses.map(item => ({ label: item.category || 'อื่น ๆ', value: Number(item.amount) || 0 })));
}

export function groupIncomeByChannel(income = []) {
  return groupRows(income.map(item => ({ label: item.category || item.sourceType || 'อื่น ๆ', value: Number(item.amount) || 0 })));
}

export function detectOverdueFinanceItems(orders = [], expenses = [], purchaseOrders = []) {
  const today = new Date().toISOString().slice(0, 10);
  return [...orders, ...expenses, ...purchaseOrders].filter(item => {
    const dueDate = item.paymentDueDate || item.dueDate || item.expectedReceiveDate;
    const balance = Number(item.balanceAmount || ((item.totalAmount || item.amount || 0) - (item.paidAmount || item.depositAmount || 0))) || 0;
    return dueDate && dueDate < today && balance > 0;
  });
}

export function generateInventoryReport(data) {
  const inventoryValue = calculateInventoryValue(data.inventory);
  const wasteCost = calculateWasteCost(data.waste);
  return {
    inventoryValue,
    lowStockItems: detectReorderItems(data.inventory),
    expiringItems: data.inventory.filter(item => item.expiryDate && item.expiryDate <= nextDate(5)),
    stockMovement: calculateStockMovementSummary(data.stockMovements),
    wasteCost,
    wasteRate: calculateWasteRate(wasteCost, inventoryValue),
    wasteByReason: groupWasteByReason(data.waste),
    topWasteItems: findTopWasteItems(data.waste),
    reorderItems: detectReorderItems(data.inventory)
  };
}

export function calculateInventoryValue(items = []) {
  return sum(items, item => (item.quantity || item.currentStock || 0) * (item.averagePurchasePrice || item.unitCost || item.lastPurchasePrice || 0));
}

export function calculateWasteCost(waste = []) {
  return sum(waste, item => item.amount || ((item.quantity || 0) * (item.unitCost || 0)));
}

export function calculateWasteRate(wasteCost, inventoryValue) {
  return pct(wasteCost, inventoryValue + wasteCost);
}

export function groupWasteByReason(waste = []) {
  return groupRows(waste.map(item => ({ label: item.reason || 'ไม่ระบุ', value: Number(item.amount || ((item.quantity || 0) * (item.unitCost || 0))) })));
}

export function findTopWasteItems(waste = []) {
  return groupRows(waste.map(item => ({ label: item.itemName || item.name || 'สินค้า', value: Number(item.amount || ((item.quantity || 0) * (item.unitCost || 0))) }))).slice(0, 8);
}

export function detectReorderItems(items = []) {
  return items.filter(item => Number(item.quantity || item.currentStock || 0) <= Number(item.reorderPoint || item.minStock || 0));
}

export function calculateStockMovementSummary(movements = []) {
  return {
    stockIn: sum(movements.filter(item => String(item.movementType || item.type).includes('in')), item => (item.quantity || 0) * (item.unitCost || 0)),
    stockOut: sum(movements.filter(item => String(item.movementType || item.type).includes('out')), item => (item.quantity || 0) * (item.unitCost || 0)),
    turnover: movements.length ? Math.min(8, movements.length / 2) : 0
  };
}

export function generateEventsReport(data) {
  const revenue = calculateEventRevenue(data.events);
  const costs = calculateEventCosts(data.events);
  const profit = calculateEventProfit(data.events);
  return {
    eventCount: data.events.length,
    revenue,
    deposits: sum(data.events, item => item.depositAmount || item.deposit),
    balance: sum(data.events, item => (item.totalAmount || item.value || 0) - (item.depositAmount || item.deposit || 0)),
    costs,
    profit,
    grossMargin: calculateGrossMargin(profit, revenue),
    byStatus: groupEventsByStatus(data.events),
    byType: groupEventsByType(data.events),
    highProfitEvents: findHighProfitEvents(data.events),
    lowMarginEvents: findLowMarginEvents(data.events),
    upcomingEvents: detectUpcomingEvents(data.events)
  };
}

export const calculateEventRevenue = events => sum(events, item => item.totalAmount || item.value);
export const calculateEventCosts = events => sum(events, item => item.estimatedCost || item.cost);
export const calculateEventProfit = events => sum(events, item => item.grossProfit || ((item.totalAmount || item.value || 0) - (item.estimatedCost || item.cost || 0)));
export const groupEventsByStatus = events => groupRows(events.map(item => ({ label: item.status || 'ไม่ระบุ', value: 1 })));
export const groupEventsByType = events => groupRows(events.map(item => ({ label: item.eventType || item.type || 'events', value: Number(item.totalAmount || item.value || 0) })));
export const findHighProfitEvents = events => normalizeEventProfit(events).sort((a, b) => b.grossProfit - a.grossProfit).slice(0, 5);
export const findLowMarginEvents = events => normalizeEventProfit(events).sort((a, b) => a.grossMargin - b.grossMargin).slice(0, 5);
export const detectUpcomingEvents = events => events.filter(item => (item.eventDate || item.date) >= new Date().toISOString().slice(0, 10)).sort((a, b) => String(a.eventDate || a.date).localeCompare(String(b.eventDate || b.date))).slice(0, 6);

export function generateCustomerReport(data) {
  const customers = data.customers || [];
  return {
    totalCustomers: customers.length,
    newCustomers: customers.filter(item => String(item.createdAt || '').slice(0, 7) === new Date().toISOString().slice(0, 7)).length,
    regularCustomers: customers.filter(item => Number(item.totalOrders || 0) >= 2).length,
    vipCustomers: customers.filter(item => item.customerSegment === 'vip' || Number(item.totalSpent || 0) >= 10000),
    inactiveCustomers: detectInactiveCustomers(customers),
    customerLifetimeValue: calculateCustomerLifetimeValue(customers),
    averageCustomerSpend: calculateAverageCustomerSpend(customers),
    repeatPurchaseRate: calculateRepeatPurchaseRate(customers),
    topCustomers: findTopCustomers(customers),
    upcomingDates: detectUpcomingImportantDates(data.importantDates),
    overdueFollowUps: detectOverdueFollowUps(data.followUps)
  };
}

export const calculateCustomerLifetimeValue = customers => sum(customers, item => item.totalSpent);
export const calculateAverageCustomerSpend = customers => customers.length ? calculateCustomerLifetimeValue(customers) / customers.length : 0;
export const calculateRepeatPurchaseRate = customers => pct(customers.filter(item => Number(item.totalOrders || 0) >= 2).length, customers.length);
export const findTopCustomers = customers => [...customers].sort((a, b) => Number(b.totalSpent || 0) - Number(a.totalSpent || 0)).slice(0, 8);
export const detectInactiveCustomers = customers => customers.filter(item => item.customerSegment === 'inactive' || (item.lastPurchaseDate && item.lastPurchaseDate < nextDate(-60)));
export const detectUpcomingImportantDates = dates => dates.filter(item => (item.date || '').slice(5) >= new Date().toISOString().slice(5)).slice(0, 8);
export const detectOverdueFollowUps = followUps => followUps.filter(item => item.status !== 'done' && item.dueDate && item.dueDate < new Date().toISOString().slice(0, 10));

export function generateSupplierReport(data) {
  return {
    supplierCount: data.suppliers.length,
    totalPurchases: calculateSupplierPurchases(data.purchaseOrders),
    payables: calculateSupplierPayables(data.purchaseOrders),
    mostUsedSuppliers: findMostUsedSuppliers(data.purchaseOrders),
    priceIncreases: detectPriceIncreases(data.priceHistory),
    bestSuppliers: compareSupplierPerformance(data.suppliers, data.purchaseOrders),
    pendingPOs: detectPendingPOs(data.purchaseOrders),
    purchaseBySupplier: groupRows(data.purchaseOrders.map(item => ({ label: item.supplierName || 'Supplier', value: Number(item.totalAmount) || 0 }))),
    priceTrend: groupRows(data.priceHistory.map(item => ({ label: item.itemName || item.productName || 'สินค้า', value: Number(item.unitCost || item.price || 0) })))
  };
}

export const calculateSupplierPurchases = purchaseOrders => sum(purchaseOrders, item => item.totalAmount);
export const calculateSupplierPayables = purchaseOrders => ({ amount: sum(purchaseOrders, item => item.balanceAmount || ((item.totalAmount || 0) - (item.paidAmount || 0))), count: purchaseOrders.filter(item => Number(item.balanceAmount || 0) > 0 || ['unpaid', 'partial'].includes(item.paymentStatus)).length });
export const findMostUsedSuppliers = purchaseOrders => groupRows(purchaseOrders.map(item => ({ label: item.supplierName || 'Supplier', value: 1 }))).slice(0, 5);
export const detectPriceIncreases = priceHistory => priceHistory.filter(item => Number(item.changePercent || item.priceChangePercent || 0) > 5).slice(0, 8);
export const detectPendingPOs = purchaseOrders => purchaseOrders.filter(item => !['received', 'cancelled'].includes(item.poStatus)).slice(0, 8);
export function compareSupplierPerformance(suppliers = [], purchaseOrders = []) {
  return suppliers.map(supplier => ({ label: supplier.supplierName, value: sum(purchaseOrders.filter(po => po.supplierId === supplier.id), po => po.totalAmount), rating: Number(supplier.rating || 0) })).sort((a, b) => (b.rating * 1000 + b.value) - (a.rating * 1000 + a.value)).slice(0, 6);
}

export function generateBreakEvenReport(data) {
  const settings = data.financeSettings || {};
  const fixedMonthlyCosts = Number(settings.fixedMonthlyCosts ?? 0) || 0;
  const grossMarginRate = (Number(settings.targetGrossMargin ?? 0) || 0) / 100;
  const currentMonthlySales = calculateTotalSales([...normalizeSales(data), ...data.orders, ...data.events]);
  const breakEvenSales = grossMarginRate ? fixedMonthlyCosts / grossMarginRate : 0;
  const remainingToBreakEven = Math.max(breakEvenSales - currentMonthlySales, 0);
  const remainingDays = Math.max(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() - new Date().getDate(), 1);
  const initialInvestment = Number(settings.initialInvestment) || 350000;
  const averageMonthlyNetProfit = Number(settings.averageMonthlyNetProfit) || 35000;
  const accumulatedNetProfit = generateProfitReport(data).netProfit;
  return {
    fixedMonthlyCosts,
    grossMarginRate,
    breakEvenSales,
    currentMonthlySales,
    remainingToBreakEven,
    progress: pct(currentMonthlySales, breakEvenSales),
    requiredDailySales: remainingToBreakEven / remainingDays,
    initialInvestment,
    accumulatedNetProfit,
    paybackPeriod: averageMonthlyNetProfit ? initialInvestment / averageMonthlyNetProfit : 0,
    investmentRecovery: pct(accumulatedNetProfit, initialInvestment)
  };
}

export function normalizeSales(data) {
  if (Array.isArray(data.sales)) return data.sales;
  return data.sales?.sales || [];
}

function normalizeProfitItems(sales, orders, events) {
  return [
    ...sales.map(item => ({ label: item.saleNo || 'POS', grossProfit: Number(item.grossProfit || ((item.total || 0) - (item.grossCost || 0))), grossMargin: Number(item.grossMargin || calculateGrossMargin(item.grossProfit || ((item.total || 0) - (item.grossCost || 0)), item.total || 0)) })),
    ...orders.map(item => ({ label: item.orderNo || item.title || 'Order', grossProfit: Number(item.grossProfit || ((item.totalAmount || 0) - (item.estimatedCost || 0))), grossMargin: Number(item.grossMargin || calculateGrossMargin(item.grossProfit || ((item.totalAmount || 0) - (item.estimatedCost || 0)), item.totalAmount || 0)) })),
    ...events.map(item => ({ label: item.eventNo || item.eventName || item.name || 'Event', grossProfit: Number(item.grossProfit || ((item.totalAmount || item.value || 0) - (item.estimatedCost || item.cost || 0))), grossMargin: Number(item.grossMargin || calculateGrossMargin(item.grossProfit || ((item.totalAmount || item.value || 0) - (item.estimatedCost || item.cost || 0)), item.totalAmount || item.value || 0)) }))
  ];
}

function normalizeEventProfit(events) {
  return events.map(item => {
    const revenue = Number(item.totalAmount || item.value || 0);
    const cost = Number(item.estimatedCost || item.cost || 0);
    const grossProfit = Number(item.grossProfit || (revenue - cost));
    return { label: item.eventName || item.name || item.eventNo || 'Event', grossProfit, grossMargin: Number(item.grossMargin || calculateGrossMargin(grossProfit, revenue)) };
  });
}

function groupRows(rows) {
  const map = new Map();
  rows.forEach(row => {
    const label = row.label || 'ไม่ระบุ';
    map.set(label, (map.get(label) || 0) + (Number(row.value) || 0));
  });
  return [...map.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
}

function nextDate(offset) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
}
