const toAmount = value => Math.max(Number(value) || 0, 0);
const isPaid = item => item.paymentStatus === 'paid' || item.paymentStatus === 'partial';

export function calculateTotalIncome(income = [], predicate = () => true) {
  return income.filter(predicate).reduce((sum, item) => sum + toAmount(item.amount), 0);
}

export function calculateTotalExpense(expenses = [], predicate = () => true) {
  return expenses.filter(predicate).reduce((sum, item) => sum + toAmount(item.amount), 0);
}

export function groupIncomeByCategory(income = []) {
  return groupBy(income, 'category');
}

export function groupIncomeByPaymentMethod(income = []) {
  return groupBy(income, 'paymentMethod');
}

export function groupExpenseByCategory(expenses = []) {
  return groupBy(expenses, 'category');
}

export function calculateFixedExpenses(expenses = []) {
  const fixed = ['ค่าเช่าร้าน', 'ค่าน้ำ', 'ค่าไฟ', 'ค่าอินเทอร์เน็ต', 'ค่าแรงพนักงาน'];
  return calculateTotalExpense(expenses, item => fixed.includes(item.category));
}

export function calculateVariableExpenses(expenses = []) {
  const fixed = ['ค่าเช่าร้าน', 'ค่าน้ำ', 'ค่าไฟ', 'ค่าอินเทอร์เน็ต', 'ค่าแรงพนักงาน'];
  return calculateTotalExpense(expenses, item => !fixed.includes(item.category));
}

export function detectHighExpense(expenses = [], threshold = 10000) {
  const average = expenses.length ? calculateTotalExpense(expenses) / expenses.length : 0;
  return expenses.filter(item => toAmount(item.amount) >= Math.max(threshold, average * 1.8));
}

export function calculateCashIn(income = []) {
  return calculateTotalIncome(income, isPaid);
}

export function calculateCashOut(expenses = []) {
  return calculateTotalExpense(expenses, isPaid);
}

export function calculateNetCashFlow(income = [], expenses = []) {
  return calculateCashIn(income) - calculateCashOut(expenses);
}

export function calculateClosingBalance(openingBalance = 0, income = [], expenses = []) {
  return toAmount(openingBalance) + calculateNetCashFlow(income, expenses);
}

export function calculateProjectedCashBalance(currentCashBalance = 0, receivables = [], payables = []) {
  const expectedReceivables = receivables.reduce((sum, item) => sum + toAmount(item.balanceAmount ?? item.amount), 0);
  const expectedPayables = payables.reduce((sum, item) => sum + toAmount(item.balanceAmount ?? item.amount), 0);
  return toAmount(currentCashBalance) + expectedReceivables - expectedPayables;
}

export function calculateReceivables(income = [], orders = []) {
  const fromIncome = income
    .filter(item => ['pending', 'partial'].includes(item.paymentStatus))
    .map(item => ({
      id: item.id,
      sourceType: item.sourceType || 'income',
      name: item.customerName || 'ลูกค้า',
      description: item.description,
      totalAmount: toAmount(item.amount),
      paidAmount: item.paymentStatus === 'partial' ? toAmount(item.amount) * 0.5 : 0,
      balanceAmount: item.paymentStatus === 'partial' ? toAmount(item.amount) * 0.5 : toAmount(item.amount),
      dueDate: item.dueDate || item.date,
      status: 'normal'
    }));
  const fromOrders = orders
    .filter(order => order.orderStatus !== 'cancelled' && toAmount(order.balanceAmount) > 0)
    .map(order => ({
      id: order.id,
      sourceType: 'order',
      name: order.customerName,
      description: order.title || order.orderNo,
      totalAmount: toAmount(order.totalAmount),
      paidAmount: toAmount(order.paidAmount || order.depositAmount),
      balanceAmount: toAmount(order.balanceAmount),
      dueDate: order.paymentDueDate || order.dueDate,
      status: 'normal'
    }));
  return detectOverdueItems([...fromIncome, ...fromOrders]);
}

export function calculatePayables(expenses = []) {
  return detectOverdueItems(expenses
    .filter(item => ['pending', 'partial'].includes(item.paymentStatus))
    .map(item => ({
      id: item.id,
      sourceType: 'expense',
      name: item.supplierName || 'Supplier',
      description: item.description,
      totalAmount: toAmount(item.amount),
      paidAmount: item.paymentStatus === 'partial' ? toAmount(item.amount) * 0.5 : 0,
      balanceAmount: item.paymentStatus === 'partial' ? toAmount(item.amount) * 0.5 : toAmount(item.amount),
      dueDate: item.dueDate || item.date,
      status: 'normal'
    })));
}

export function detectOverdueItems(items = [], today = new Date()) {
  return items.map(item => {
    const agingDays = calculateAgingDays(item.dueDate, today);
    const status = item.balanceAmount <= 0 ? 'paid' : agingDays > 0 ? 'overdue' : agingDays >= -3 ? 'due_soon' : 'normal';
    return { ...item, agingDays, status };
  });
}

export function calculateAgingDays(dueDate, today = new Date()) {
  if (!dueDate) return 0;
  const due = new Date(`${dueDate}T00:00:00`);
  const current = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.floor((current - due) / 86400000);
}

export function calculateBreakEven(settings = {}, monthlySales = 0, accumulatedNetProfit = 0, today = new Date()) {
  const fixedMonthlyCosts = toAmount(settings.fixedMonthlyCosts);
  const grossMarginRate = Math.max(toAmount(settings.targetGrossMargin) / 100, 0);
  const breakEvenSales = grossMarginRate > 0 ? fixedMonthlyCosts / grossMarginRate : 0;
  const remainingToBreakEven = Math.max(breakEvenSales - toAmount(monthlySales), 0);
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const remainingDays = Math.max(daysInMonth - today.getDate() + 1, 1);
  const progress = breakEvenSales > 0 ? Math.min((toAmount(monthlySales) / breakEvenSales) * 100, 999) : 0;
  const averageMonthlyNetProfit = toAmount(settings.averageMonthlyNetProfit);
  const initialInvestment = toAmount(settings.initialInvestment);
  const paybackPeriod = averageMonthlyNetProfit > 0 ? initialInvestment / averageMonthlyNetProfit : 0;
  const recovery = initialInvestment > 0 ? (toAmount(accumulatedNetProfit) / initialInvestment) * 100 : 0;
  return {
    breakEvenSales,
    currentMonthlySales: toAmount(monthlySales),
    remainingToBreakEven,
    remainingDays,
    requiredDailySales: remainingToBreakEven / remainingDays,
    progress,
    paybackPeriod,
    investmentRecovery: Math.max(recovery, 0)
  };
}

export function filterByCurrentMonth(items = [], dateKey = 'date', today = new Date()) {
  const month = today.toISOString().slice(0, 7);
  return items.filter(item => String(item[dateKey] || '').startsWith(month));
}

export function filterByToday(items = [], dateKey = 'date', today = new Date()) {
  const date = today.toISOString().slice(0, 10);
  return items.filter(item => item[dateKey] === date);
}

function groupBy(items, key) {
  return items.reduce((result, item) => {
    const label = item[key] || 'ไม่ระบุ';
    result[label] = (result[label] || 0) + toAmount(item.amount);
    return result;
  }, {});
}
