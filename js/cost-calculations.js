const n = value => Number.isFinite(Number(value)) ? Number(value) : 0;

export const calculateLineCost = (quantity, unitCost) => Math.max(n(quantity), 0) * Math.max(n(unitCost), 0);

export function calculateCategorySubtotal(items = [], category) {
  return items.filter(item => item.category === category).reduce((sum, item) => sum + calculateLineCost(item.quantity, item.unitCost), 0);
}

export function calculateTotalMaterialCost(items = []) {
  return items.reduce((sum, item) => sum + calculateLineCost(item.quantity, item.unitCost), 0);
}

export const calculateLaborCost = laborInput => Math.max(n(laborInput), 0);

export function calculateWasteCost(baseCost, wasteRate = 0, fixedWasteCost = 0) {
  return Math.max(n(baseCost), 0) * Math.min(Math.max(n(wasteRate), 0), 100) / 100 + Math.max(n(fixedWasteCost), 0);
}

export function calculateOverheadCost(baseCost, overheadRate = 0, fixedOverheadCost = 0) {
  return Math.max(n(baseCost), 0) * Math.min(Math.max(n(overheadRate), 0), 100) / 100 + Math.max(n(fixedOverheadCost), 0);
}

export function calculateTotalCost({ items = [], laborCost = 0, deliveryCost = 0, wasteRate = 0, fixedWasteCost = 0, overheadRate = 0, fixedOverheadCost = 0 } = {}) {
  const materialCost = calculateTotalMaterialCost(items);
  const base = materialCost + calculateLaborCost(laborCost) + Math.max(n(deliveryCost), 0);
  const wasteCost = calculateWasteCost(base, wasteRate, fixedWasteCost);
  const overheadCost = calculateOverheadCost(base + wasteCost, overheadRate, fixedOverheadCost);
  return { materialCost, laborCost: calculateLaborCost(laborCost), deliveryCost: Math.max(n(deliveryCost), 0), wasteCost, overheadCost, totalCost: base + wasteCost + overheadCost };
}

export const calculateGrossProfit = (sellingPrice, totalCost) => n(sellingPrice) - n(totalCost);

export function calculateGrossMargin(sellingPrice, totalCost) {
  const price = n(sellingPrice);
  return price > 0 ? calculateGrossProfit(price, totalCost) / price * 100 : 0;
}

export function calculateMarkup(sellingPrice, totalCost) {
  const cost = n(totalCost);
  return cost > 0 ? calculateGrossProfit(sellingPrice, cost) / cost * 100 : 0;
}

export function calculateSuggestedPriceByMargin(totalCost, targetMargin) {
  const margin = Math.min(Math.max(n(targetMargin), 0), 95) / 100;
  return margin >= 1 ? 0 : n(totalCost) / (1 - margin);
}

export function calculateSuggestedPriceByMarkup(totalCost, targetMarkup) {
  return n(totalCost) * (1 + Math.max(n(targetMarkup), 0) / 100);
}

export function calculateMinimumPrice(totalCost, minimumMargin) {
  return calculateSuggestedPriceByMargin(totalCost, minimumMargin);
}

export function evaluateProfitStatus(grossMargin, targetMargin) {
  const margin = n(grossMargin);
  const target = n(targetMargin);
  if (margin < 0) return { level: 'danger', label: 'ขาดทุน', message: 'ราคาขายต่ำกว่าต้นทุน ควรปรับราคาทันที' };
  if (margin < target * 0.75) return { level: 'danger', label: 'กำไรต่ำ', message: 'Margin ต่ำกว่าเป้าหมายมาก ควรตรวจสอบต้นทุน' };
  if (margin < target) return { level: 'warning', label: 'ใกล้เป้า', message: 'ยังต่ำกว่าเป้าหมายเล็กน้อย' };
  return { level: 'success', label: 'ดี', message: 'กำไรอยู่ในระดับที่เหมาะสม' };
}
