import { products as defaultProducts } from './products-data.js';

const PRODUCTS_KEY = 'budsarin_products';

export function loadProducts() {
  try {
    const saved = JSON.parse(localStorage.getItem(PRODUCTS_KEY));
    return Array.isArray(saved) ? saved : [...defaultProducts];
  } catch {
    return [...defaultProducts];
  }
}

export function saveProducts(products) {
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
  window.dispatchEvent(new CustomEvent('products:updated', { detail: products }));
  return products;
}

export function saveProduct(data) {
  const products = loadProducts();
  const id = data.id || `p-${Date.now()}`;
  const next = {
    id,
    name: String(data.name || '').trim(),
    category: data.category || 'สินค้า Custom',
    price: Number(data.price) || 0,
    cost: Number(data.cost) || 0,
    image: data.image || 'custom-product',
    imageDataUrl: data.imageDataUrl || '',
    status: data.status || 'พร้อมขาย',
    stockTracking: data.stockTracking === true || data.stockTracking === 'true' || data.stockTracking === 'on'
  };
  if (!next.name) throw new Error('กรุณากรอกชื่อสินค้า');
  if (next.price <= 0) throw new Error('ราคาขายต้องมากกว่า 0');
  const index = products.findIndex(item => item.id === id);
  if (index >= 0) products[index] = { ...products[index], ...next };
  else products.unshift(next);
  saveProducts(products);
  return next;
}

export function deleteProduct(id) {
  const products = loadProducts().filter(item => item.id !== id);
  saveProducts(products);
  return products;
}

export function findProduct(id) {
  return loadProducts().find(item => item.id === id);
}
