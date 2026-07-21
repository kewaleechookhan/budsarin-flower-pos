import { apiConsumeRecipe, apiSaveRecipe } from './api-client.js';
import { readStorage, writeStorage } from './storage-registry.js';

const KEY = 'budsarin_inventory_recipes';

export function loadInventoryRecipes() {
  const saved = readStorage(KEY, null);
  if (Array.isArray(saved)) return saved;
  writeStorage(KEY, []);
  return [];
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
