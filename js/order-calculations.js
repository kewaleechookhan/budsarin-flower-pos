const n = value => Number.isFinite(Number(value)) ? Number(value) : 0;

export function calculateOrderFinancials(order = {}) {
  const totalAmount = Math.max(n(order.totalAmount), 0);
  const estimatedCost = Math.max(n(order.estimatedCost), 0);
  const depositAmount = Math.min(Math.max(n(order.depositAmount), 0), totalAmount);
  const paidAmount = Math.min(Math.max(n(order.paidAmount), 0), totalAmount);
  const paidOrDeposit = Math.max(depositAmount, paidAmount);
  const balanceAmount = Math.max(totalAmount - paidOrDeposit, 0);
  const grossProfit = totalAmount - estimatedCost;
  const grossMargin = totalAmount > 0 ? grossProfit / totalAmount * 100 : 0;
  return { totalAmount, estimatedCost, depositAmount, paidAmount, balanceAmount, grossProfit, grossMargin };
}

export function getPaymentStatus(order = {}) {
  const { totalAmount, depositAmount, paidAmount, balanceAmount } = calculateOrderFinancials(order);
  if (order.orderStatus === 'cancelled') return 'cancelled';
  if (paidAmount >= totalAmount && totalAmount > 0) return 'paid';
  if (paidAmount > 0 && balanceAmount > 0) return 'partial';
  if (depositAmount > 0) return 'deposit';
  return 'unpaid';
}
