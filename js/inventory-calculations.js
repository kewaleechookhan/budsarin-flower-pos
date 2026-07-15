const asNumber = value => Math.max(Number(value) || 0, 0);
const today = () => new Date().toISOString().slice(0, 10);
const daysBetween = date => {
  if (!date) return Infinity;
  const start = new Date(today());
  const end = new Date(date);
  if (Number.isNaN(end.getTime())) return Infinity;
  return Math.ceil((end - start) / 86400000);
};

export const calculateItemValue = item => asNumber(item.quantityOnHand) * asNumber(item.averageCost || item.costPerUnit);
export const calculateStockValue = items => items.reduce((sum, item) => sum + calculateItemValue(item), 0);
export const calculateAverageCost = (oldQty, oldAvgCost, inQty, inUnitCost) => {
  const qty = asNumber(oldQty) + asNumber(inQty);
  if (!qty) return asNumber(inUnitCost || oldAvgCost);
  return ((asNumber(oldQty) * asNumber(oldAvgCost)) + (asNumber(inQty) * asNumber(inUnitCost))) / qty;
};
export const calculateStockTurnover = (mockSalesCost, averageInventoryValue) => averageInventoryValue ? asNumber(mockSalesCost) / asNumber(averageInventoryValue) : 0;
export const calculateWasteCost = wasteItems => wasteItems.reduce((sum, item) => sum + asNumber(item.totalWasteCost || item.amount), 0);
export const calculateWasteRate = (wasteCost, totalStockInCost) => totalStockInCost ? (asNumber(wasteCost) / asNumber(totalStockInCost)) * 100 : 0;
export const calculateLowStockStatus = (quantityOnHand, minimumStock) => asNumber(quantityOnHand) <= asNumber(minimumStock);
export const calculateReorderQuantity = (maximumStock, quantityOnHand) => Math.max(asNumber(maximumStock) - asNumber(quantityOnHand), 0);
export const calculateDaysToExpiry = expiryDate => daysBetween(expiryDate);
export const calculateDaysToUseBy = useByDate => daysBetween(useByDate);

export function determineQualityStatus(item, settings = {}) {
  const useSoonDays = asNumber(settings.useSoonWarningDays ?? 2);
  if (!item.isPerishable && !item.expiryDate) return item.qualityStatus || 'good';
  const expiryDays = calculateDaysToExpiry(item.expiryDate);
  const useByDays = calculateDaysToUseBy(item.useByDate);
  const signal = Math.min(expiryDays, useByDays);
  if (signal < 0) return item.qualityStatus === 'disposed' ? 'disposed' : 'damaged';
  if (signal <= useSoonDays) return 'use_soon';
  if (signal <= 3) return 'good';
  return item.qualityStatus || 'fresh';
}

export const detectUseSoonItems = (items, settings = {}) => items.filter(item => determineQualityStatus(item, settings) === 'use_soon');
export const detectExpiredItems = items => items.filter(item => item.isPerishable && calculateDaysToExpiry(item.expiryDate) < 0);
export const detectLowStockItems = items => items.filter(item => calculateLowStockStatus(item.quantityOnHand, item.minimumStock));

export function calculateInventoryAging(items) {
  return items.reduce((groups, item) => {
    const days = Math.max(-calculateDaysToUseBy(item.useByDate), 0);
    const key = days === 0 ? 'fresh' : days <= 3 ? 'aging_1_3' : days <= 7 ? 'aging_4_7' : 'aging_over_7';
    groups[key] = (groups[key] || 0) + calculateItemValue(item);
    return groups;
  }, { fresh: 0, aging_1_3: 0, aging_4_7: 0, aging_over_7: 0 });
}
