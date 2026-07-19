import { openCostCalculator } from './cost-calculator.js?v=20260719a';
import { addToCart } from './pos.js';
import { productCategories } from './products-data.js';
import { deleteProduct, findProduct, loadProducts, saveProduct } from './products-service.js?v=20260719a';
import { renderIcon } from './icons.js';
import { currency, showToast } from './utils.js';

const state = { query: '', category: 'ทั้งหมด' };

export function initProducts() {
  renderProductsShell();
  renderProducts();
  bindProductEvents();
}

function renderProductsShell() {
  document.getElementById('productsView').innerHTML = `
    <section class="products-header panel">
      <div><p class="eyebrow">Product Catalog</p><h3>สินค้าและบริการ</h3><span>ค้นหา เลือกขาย และส่งต่อไปคำนวณต้นทุนได้ทันที</span></div>
      <div class="products-actions">
        <button class="primary-button" data-new-product type="button">${renderIcon('plus')}เพิ่มสินค้า</button>
        <button class="primary-button" data-route-shortcut="pos" type="button">${renderIcon('shopping-bag')}ไปหน้า POS</button>
        <button class="soft-button" data-route-shortcut="cost" type="button">${renderIcon('calculator')}คำนวณต้นทุน</button>
      </div>
    </section>
    <section class="products-toolbar panel">
      <label>${renderIcon('search')}<input id="productCatalogSearch" type="search" placeholder="ค้นหาสินค้า ราคา หรือหมวด"></label>
      <div class="products-tabs" id="productCatalogTabs"></div>
    </section>
    <section class="products-grid" id="productCatalogGrid"></section>
    <div class="modal-overlay" id="productEditorModal" hidden>
      <section class="modal product-editor-modal" role="dialog" aria-modal="true" aria-labelledby="productEditorTitle">
        <button class="icon-button modal-close" data-close-product-editor type="button" aria-label="ปิด">×</button>
        <p class="eyebrow">Product Editor</p>
        <h3 id="productEditorTitle">เพิ่มสินค้า</h3>
        <form id="productEditorForm" class="product-editor-form">
          <input type="hidden" name="id">
          <input type="hidden" name="imageDataUrl">
          <label>ชื่อสินค้า<input name="name" required></label>
          <label>หมวด<select name="category">${productCategories.filter(item => item !== 'ทั้งหมด').map(category => `<option value="${category}">${category}</option>`).join('')}</select></label>
          <label>ราคาขาย<input name="price" type="number" min="1" required></label>
          <label>ต้นทุน<input name="cost" type="number" min="0"></label>
          <label>สถานะ<select name="status"><option>พร้อมขาย</option><option>ใกล้หมด</option><option>หยุดขาย</option><option>สั่งทำ</option></select></label>
          <label class="full product-image-upload">รูปภาพสินค้าตัวอย่าง<input name="productImageFile" type="file" accept="image/*"><span>รูปนี้จะแสดงที่หน้าขายหน้าร้านและสินค้า</span><div class="product-image-preview" id="productImagePreview"></div></label>
          <label class="product-check"><input name="stockTracking" type="checkbox" checked><span>ตัดสต็อก</span></label>
          <div class="products-actions full"><button class="primary-button" type="submit">${renderIcon('save')}บันทึกสินค้า</button><button class="soft-button" data-close-product-editor type="button">ยกเลิก</button></div>
        </form>
      </section>
    </div>
  `;
  document.getElementById('productCatalogTabs').innerHTML = productCategories.map(category => `<button class="${category === state.category ? 'active' : ''}" data-product-category="${category}" type="button">${category}</button>`).join('');
}

function renderProducts() {
  document.querySelectorAll('[data-product-category]').forEach(btn => btn.classList.toggle('active', btn.dataset.productCategory === state.category));
  const query = state.query.trim().toLowerCase();
  const rows = loadProducts().filter(product => {
    const text = `${product.name} ${product.category} ${product.status}`.toLowerCase();
    return (state.category === 'ทั้งหมด' || product.category === state.category) && (!query || text.includes(query));
  });
  document.getElementById('productCatalogGrid').innerHTML = rows.map(productCard).join('') || '<div class="empty-state">ไม่พบสินค้า</div>';
}

function productCard(product) {
  return `<article class="product-catalog-card panel">
    <div class="product-art">${productImage(product)}</div>
    <div><p class="eyebrow">${product.category}</p><h3>${product.name}</h3><span>${product.status} • ${product.stockTracking ? 'ตัดสต็อก' : 'ไม่ตัดสต็อก'}</span></div>
    <div class="product-price"><strong>${currency(product.price)}</strong><small>ต้นทุน ${currency(product.cost)}</small></div>
    <div class="products-actions">
      <button class="primary-button" data-sell-product="${product.id}" type="button">${renderIcon('shopping-cart')}ขาย</button>
      <button class="soft-button" data-cost-product="${product.id}" type="button">${renderIcon('calculator')}ต้นทุน</button>
      <button class="soft-button" data-edit-product="${product.id}" type="button">${renderIcon('settings')}แก้ไข</button>
      <button class="danger-button" data-delete-product="${product.id}" type="button">${renderIcon('trash')}ลบ</button>
    </div>
  </article>`;
}

function bindProductEvents() {
  document.getElementById('productsView').addEventListener('input', event => {
    if (event.target.id === 'productCatalogSearch') {
      state.query = event.target.value;
      renderProducts();
    }
  });
  document.getElementById('productEditorForm').addEventListener('change', event => {
    if (event.target.name === 'productImageFile') readProductImage(event.target.files?.[0]);
  });
  document.getElementById('productsView').addEventListener('click', event => {
    const category = event.target.closest('[data-product-category]')?.dataset.productCategory;
    const sell = event.target.closest('[data-sell-product]')?.dataset.sellProduct;
    const cost = event.target.closest('[data-cost-product]')?.dataset.costProduct;
    const edit = event.target.closest('[data-edit-product]')?.dataset.editProduct;
    const remove = event.target.closest('[data-delete-product]')?.dataset.deleteProduct;
    const route = event.target.closest('[data-route-shortcut]')?.dataset.routeShortcut;
    if (category) {
      state.category = category;
      renderProducts();
    }
    if (sell) {
      addToCart(sell);
      window.dispatchEvent(new CustomEvent('route:open', { detail: 'pos' }));
      showToast('เพิ่มสินค้าไปที่ตะกร้า POS แล้ว');
    }
    if (cost) {
      const product = findProduct(cost);
      openCostCalculator({
        jobType: 'custom',
        templateName: product?.name || 'สินค้า',
        sellingPrice: product?.price || 0,
        items: [{ id: crypto.randomUUID(), category: 'ดอกไม้หลัก', itemName: product?.name || 'สินค้า', quantity: 1, unit: 'ชิ้น', unitCost: product?.cost || 0, supplier: '' }]
      });
    }
    if (event.target.closest('[data-new-product]')) openProductEditor();
    if (edit) openProductEditor(findProduct(edit));
    if (remove) {
      if (!confirm('ต้องการลบสินค้านี้หรือไม่?')) return;
      deleteProduct(remove);
      showToast('ลบสินค้าแล้ว');
      renderProducts();
    }
    if (event.target.closest('[data-close-product-editor]')) closeProductEditor();
    if (route) window.dispatchEvent(new CustomEvent('route:open', { detail: route }));
  });
  document.getElementById('productEditorForm').addEventListener('submit', event => {
    event.preventDefault();
    try {
      saveProduct(Object.fromEntries(new FormData(event.target).entries()));
      showToast('บันทึกสินค้าแล้ว');
      closeProductEditor();
      renderProducts();
    } catch (error) {
      showToast(error.message);
    }
  });
  window.addEventListener('products:updated', renderProducts);
}

function openProductEditor(product = {}) {
  const modal = document.getElementById('productEditorModal');
  const form = document.getElementById('productEditorForm');
  document.getElementById('productEditorTitle').textContent = product.id ? 'แก้ไขสินค้า' : 'เพิ่มสินค้า';
  form.elements.id.value = product.id || '';
  form.elements.name.value = product.name || '';
  form.elements.category.value = product.category || 'ช่อดอกไม้';
  form.elements.price.value = product.price || '';
  form.elements.cost.value = product.cost || '';
  form.elements.status.value = product.status || 'พร้อมขาย';
  form.elements.imageDataUrl.value = getProductImageSrc(product);
  form.elements.stockTracking.checked = product.stockTracking !== false;
  renderProductImagePreview(getProductImageSrc(product));
  modal.hidden = false;
  form.elements.name.focus();
}

function closeProductEditor() {
  document.getElementById('productEditorModal').hidden = true;
  document.getElementById('productEditorForm').reset();
  renderProductImagePreview('');
}

function readProductImage(file) {
  if (!file) return;
  if (!file.type.startsWith('image/')) return showToast('กรุณาเลือกไฟล์รูปภาพ');
  if (file.size > 1200 * 1024) return showToast('รูปภาพควรมีขนาดไม่เกิน 1.2MB เพื่อให้ iPad โหลดเร็ว');
  const reader = new FileReader();
  reader.onload = () => {
    const value = String(reader.result || '');
    const form = document.getElementById('productEditorForm');
    form.elements.imageDataUrl.value = value;
    renderProductImagePreview(value);
  };
  reader.readAsDataURL(file);
}

function renderProductImagePreview(src) {
  const preview = document.getElementById('productImagePreview');
  if (!preview) return;
  preview.innerHTML = src ? `<img src="${src}" alt="ตัวอย่างสินค้า">` : `<span>${renderIcon('image')}ยังไม่ได้เลือกรูป</span>`;
}

function productImage(product) {
  const src = getProductImageSrc(product);
  return src ? `<img src="${src}" alt="${escapeHtml(product.name || 'สินค้า')}">` : renderIcon('flower');
}

function getProductImageSrc(product = {}) {
  const image = product.imageDataUrl || product.image || '';
  return String(image).startsWith('data:image/') ? image : '';
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[char]);
}
