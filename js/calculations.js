import { safeDivide, safeNumber } from './utils.js';

const n = safeNumber;

export function calculateTotalCost(cost = {}) {
  return ['flowerCost', 'leafCost', 'wrappingCost', 'ribbonCost', 'cardCost', 'containerCost', 'laborCost', 'deliveryCost', 'wasteCost', 'otherCost']
    .reduce((sum, key) => sum + n(cost[key]), 0);
}

export function calculateGrossProfit(sellingPrice, totalCost) {
  return n(sellingPrice) - n(totalCost);
}

export function calculateGrossMargin(sellingPrice, totalCost) {
  const price = n(sellingPrice);
  if (price <= 0) return 0;
  return safeDivide(calculateGrossProfit(price, totalCost), price) * 100;
}

export function calculateMarkup(sellingPrice, totalCost) {
  const cost = n(totalCost);
  if (cost <= 0) return 0;
  return safeDivide(calculateGrossProfit(sellingPrice, cost), cost) * 100;
}

export function calculateBreakEvenSales(fixedCosts, grossMarginRate) {
  const margin = n(grossMarginRate);
  if (margin <= 0) return 0;
  return safeDivide(fixedCosts, margin);
}

export function calculatePaybackPeriod(initialInvestment, averageMonthlyNetProfit) {
  const profit = n(averageMonthlyNetProfit);
  if (profit <= 0) return 0;
  return safeDivide(initialInvestment, profit);
}

export function calculateCartSubtotal(items = []) {
  return items.reduce((sum, item) => sum + n(item.price) * n(item.quantity), 0);
}

export function calculateCartCost(items = []) {
  return items.reduce((sum, item) => sum + n(item.cost) * n(item.quantity), 0);
}

export function calculateDiscountAmount(subtotal, discountType = 'baht', discountValue = 0) {
  const base = Math.max(n(subtotal), 0);
  const value = Math.max(n(discountValue), 0);
  if (discountType === 'percent') return Math.min(base, base * Math.min(value, 100) / 100);
  return Math.min(base, value);
}

export function calculateSaleTotals({ items = [], discountType = 'baht', discountValue = 0, deliveryFee = 0 } = {}) {
  const subtotal = calculateCartSubtotal(items);
  const discountAmount = calculateDiscountAmount(subtotal, discountType, discountValue);
  const total = Math.max(subtotal - discountAmount + Math.max(n(deliveryFee), 0), 0);
  const grossCost = calculateCartCost(items);
  const grossProfit = total - grossCost;
  const grossMargin = total > 0 ? safeDivide(grossProfit, total) * 100 : 0;
  return { subtotal, discountAmount, deliveryFee: Math.max(n(deliveryFee), 0), total, grossCost, grossProfit, grossMargin };
}

export function getBreakEvenProgress(currentSales, targetSales, daysRemaining = 1) {
  const current = n(currentSales);
  const target = n(targetSales);
  const remaining = Math.max(target - current, 0);
  const safeDays = Math.max(n(daysRemaining), 1);
  return {
    percent: target > 0 ? Math.min(Math.round(safeDivide(current, target) * 100), 100) : 0,
    remaining,
    requiredDailySales: Math.ceil(remaining / safeDays)
  };
}
