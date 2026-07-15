import { apiConsumeRecipe, apiSaveRecipe } from './api-client.js';
import { products } from './products-data.js';
import { readStorage, writeStorage } from './storage-registry.js';

const KEY = 'budsarin_inventory_recipes';

export function loadInventoryRecipes() {
  const saved = readStorage(KEY, null);
  if (Array.isArray(saved) && saved.length) return saved;
  const seed = products.filter(item => item.stockTracking).slice(0, 8).map((product, index) => ({
    id: `recipe-${product.id}`,
    productId: product.id,
    productName: product.name,
    version: 1,
    allowNegativeStock: false,
    items: defaultRecipeLines(index),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }));
  writeStorage(KEY, seed);
  return seed;
}

export function saveInventoryRecipe(recipe) {
  const rows = loadInventoryRecipes();
  const item = { id: recipe.id || crypto.randomUUID(), ...recipe, updatedAt: new Date().toISOString() };
  const index = rows.findIndex(row => row.id === item.id);
  if (index >= 0) rows[index] = item;
  else rows.unshift(item);
  writeStorage(KEY, rows);
  apiSaveRecipe(item).catch(() => {});
  return item;
}

export async function consumeRecipeForSaleItem(item, sale) {
  const recipe = loadInventoryRecipes().find(row => row.productId === item.id);
  if (!recipe) return null;
  try {
    return await apiConsumeRecipe({ productId: item.id, recipeId: recipe.id, quantity: item.quantity || 1, referenceType: 'pos_sale', referenceId: sale.id, reason: 'POS checkout BOM' });
  } catch {
    return null;
  }
}

function defaultRecipeLines(index) {
  const rose = index % 2 ? 'inventory-2' : 'inventory-1';
  return [
    { itemId: rose, itemName: index % 2 ? 'กุหลาบแดง' : 'กุหลาบชมพู', quantity: 6, unit: 'ก้าน' },
    { itemId: 'inventory-8', itemName: 'ยิปโซ', quantity: 0.25, unit: 'กำ' },
    { itemId: 'inventory-12', itemName: 'กระดาษห่อพรีเมียม', quantity: 2, unit: 'แผ่น' },
    { itemId: 'inventory-14', itemName: 'ริบบิ้นซาติน', quantity: 0.1, unit: 'ม้วน' }
  ];
}
