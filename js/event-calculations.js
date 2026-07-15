import { safeDivide, safeNumber } from './utils.js';

export const calculateQuotationSubtotal = (items = []) => items.reduce((sum, item) => sum + safeNumber(item.totalPrice || safeNumber(item.quantity) * safeNumber(item.unitPrice)), 0);
export const calculateQuotationCost = (items = []) => items.reduce((sum, item) => sum + safeNumber(item.totalCost || safeNumber(item.quantity) * safeNumber(item.unitCost)), 0);

export function calculateQuotationDiscount(subtotal, type = 'baht', value = 0) {
  const base = Math.max(safeNumber(subtotal), 0);
  const amount = Math.max(safeNumber(value), 0);
  return type === 'percent' ? Math.min(base, base * Math.min(amount, 100) / 100) : Math.min(base, amount);
}

export const calculateQuotationTax = (base, taxRate = 0) => Math.max(safeNumber(base), 0) * Math.max(safeNumber(taxRate), 0) / 100;
export const calculateQuotationServiceCharge = (base, rate = 0) => Math.max(safeNumber(base), 0) * Math.max(safeNumber(rate), 0) / 100;

export function calculateQuotationTotal({ items = [], discountType = 'baht', discountValue = 0, taxRate = 0, serviceChargeRate = 0 } = {}) {
  const subtotal = calculateQuotationSubtotal(items);
  const discountAmount = calculateQuotationDiscount(subtotal, discountType, discountValue);
  const afterDiscount = Math.max(subtotal - discountAmount, 0);
  const serviceChargeAmount = calculateQuotationServiceCharge(afterDiscount, serviceChargeRate);
  const taxAmount = calculateQuotationTax(afterDiscount + serviceChargeAmount, taxRate);
  const totalAmount = afterDiscount + serviceChargeAmount + taxAmount;
  const totalCost = calculateQuotationCost(items);
  const grossProfit = totalAmount - totalCost;
  const grossMargin = safeDivide(grossProfit, totalAmount) * 100;
  return { subtotal, discountAmount, serviceChargeAmount, taxAmount, totalAmount, totalCost, grossProfit, grossMargin };
}

export const calculateEstimatedEventCost = costs => costs.filter(item => !item.isActual).reduce((sum, item) => sum + safeNumber(item.totalCost), 0);
export const calculateActualEventCost = costs => costs.filter(item => item.isActual).reduce((sum, item) => sum + safeNumber(item.totalCost), 0);
export const calculateEventGrossProfit = (finalAmount, totalCost) => safeNumber(finalAmount) - safeNumber(totalCost);
export const calculateEventGrossMargin = (finalAmount, totalCost) => safeDivide(calculateEventGrossProfit(finalAmount, totalCost), finalAmount) * 100;
export const calculateEventPaidAmount = payments => payments.reduce((sum, item) => sum + safeNumber(item.paidAmount), 0);
export const calculateEventBalance = (finalAmount, payments) => Math.max(safeNumber(finalAmount) - calculateEventPaidAmount(payments), 0);
export const detectLowMarginEvent = (event, threshold = 30) => safeNumber(event.grossMargin) < threshold;
