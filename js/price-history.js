import { mockPriceHistory } from './suppliers-data.js';

const PRICE_KEY = 'budsarin_supplier_price_history';

export const loadPriceHistory = () => loadArray(PRICE_KEY, mockPriceHistory);
export const savePriceHistory = items => localStorage.setItem(PRICE_KEY, JSON.stringify(items));

export function recordPriceHistory(po) {
  const history = loadPriceHistory();
  po.items.forEach(item => {
    history.unshift({
      id: crypto.randomUUID(),
      supplierId: po.supplierId,
      supplierName: po.supplierName,
      inventoryItemId: item.inventoryItemId,
      itemName: item.itemName,
      category: item.category,
      unit: item.unit,
      unitCost: Number(item.unitCost) || 0,
      purchaseDate: po.receivedDate || po.orderDate,
      poId: po.id,
      note: item.note || '',
      createdAt: new Date().toISOString()
    });
  });
  savePriceHistory(history.slice(0, 200));
}

export function getPriceTrend(itemId) {
  return loadPriceHistory().filter(item => item.inventoryItemId === itemId || item.itemName === itemId).sort((a, b) => a.purchaseDate.localeCompare(b.purchaseDate));
}

export function compareSupplierPrices(itemName) {
  const rows = loadPriceHistory().filter(item => item.itemName.toLowerCase().includes(itemName.toLowerCase()));
  const grouped = rows.reduce((result, item) => {
    result[item.supplierId] = result[item.supplierId] || { supplierId: item.supplierId, supplierName: item.supplierName, prices: [], latestDate: item.purchaseDate };
    result[item.supplierId].prices.push(Number(item.unitCost) || 0);
    if (item.purchaseDate > result[item.supplierId].latestDate) result[item.supplierId].latestDate = item.purchaseDate;
    return result;
  }, {});
  return Object.values(grouped).map(item => ({
    ...item,
    latestPrice: item.prices[item.prices.length - 1] || 0,
    averagePrice: item.prices.reduce((sum, price) => sum + price, 0) / item.prices.length,
    minPrice: Math.min(...item.prices),
    maxPrice: Math.max(...item.prices)
  })).sort((a, b) => a.averagePrice - b.averagePrice);
}

export function detectPriceIncrease(threshold = 15) {
  const history = loadPriceHistory();
  const names = [...new Set(history.map(item => item.itemName))];
  return names.map(name => {
    const trend = getPriceTrend(name);
    if (trend.length < 2) return null;
    const previous = trend[trend.length - 2].unitCost;
    const latest = trend[trend.length - 1].unitCost;
    const increase = previous > 0 ? ((latest - previous) / previous) * 100 : 0;
    return increase >= threshold ? { itemName: name, previous, latest, increase, supplierName: trend[trend.length - 1].supplierName } : null;
  }).filter(Boolean);
}

export function findBestSupplierForItem(itemName, suppliers = []) {
  const comparisons = compareSupplierPrices(itemName);
  return comparisons.map(row => {
    const supplier = suppliers.find(item => item.id === row.supplierId) || {};
    const priceScore = row.averagePrice > 0 ? 1000 / row.averagePrice : 0;
    const ratingScore = (Number(supplier.rating) || 3) * 10;
    const creditScore = Number(supplier.creditDays) || 0;
    const reliabilityScore = row.prices.length * 4;
    return { ...row, supplier, score: priceScore + ratingScore + creditScore + reliabilityScore };
  }).sort((a, b) => b.score - a.score)[0] || null;
}

function loadArray(key, fallback) {
  try {
    const saved = JSON.parse(localStorage.getItem(key));
    if (Array.isArray(saved)) return saved;
  } catch {}
  localStorage.setItem(key, JSON.stringify(fallback));
  return structuredClone(fallback);
}
