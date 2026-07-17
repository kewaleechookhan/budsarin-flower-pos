import { calculateSaleTotals } from './calculations.js';
import { openCostCalculator } from './cost-calculator.js';
import { renderIcon } from './icons.js';
import { processPOSStockDeduction } from './inventory-service.js';
import { consumeRecipeForSaleItem } from './inventory-recipes.js';
import { productCategories } from './products-data.js';
import { findProduct, loadProducts } from './products-service.js';
import { downloadReceiptText, generateReceipt as renderReceiptHtml } from './receipt.js';
import { printReceiptBrowser } from './receipt-printer.js';
import { createSale, holdBill as holdBillService, restoreHeldBill as restoreHeldBillService, saveCartDraft } from './sales-service.js';
import { loadPosState } from './storage.js';
import { currency, showToast } from './utils.js';

const paymentMethods = [
  ['cash', 'เงินสด'],
  ['transfer', 'โอนเงิน'],
  ['qr', 'QR Payment'],
  ['card', 'บัตร'],
  ['split', 'แบ่งชำระ'],
  ['deposit', 'มัดจำ']
];

const documentTypes = [
  ['quotation', 'ใบเสนอราคา'],
  ['delivery_note', 'ใบส่งของ'],
  ['receipt', 'ใบเสร็จรับเงิน']
];

const state = {
  query: '',
  category: 'ทั้งหมด',
  items: [],
  discountType: 'baht',
  discountValue: 0,
  deliveryFee: 0,
  paymentMethod: 'cash',
  documentType: 'receipt',
  paidAmount: 0,
  depositDueDate: '',
  customerName: '',
  customerTaxId: '',
  customerAddress: '',
  lastSale: null
};

export function initPos() {
  const saved = loadPosState();
  if (saved.cartDraft) Object.assign(state, saved.cartDraft);
  renderPosShell();
  renderProducts();
  renderCart();
  bindPosEvents();
}

function renderPosShell() {
  document.getElementById('posView').innerHTML = `
    <div class="pos-layout">
      <section class="pos-products panel">
        <div class="pos-head">
          <div><p class="eyebrow">Phase 2 POS</p><h3>ขายหน้าร้าน</h3></div>
          <button class="primary-button" id="customProductBtn" type="button">${renderIcon('plus')}สินค้า Custom</button>
        </div>
        <div class="pos-search">
          ${renderIcon('search')}
          <input id="productSearch" type="search" placeholder="ค้นหาสินค้า เช่น กุหลาบ แจกัน การ์ด" aria-label="ค้นหาสินค้า">
        </div>
        <div class="category-tabs" id="categoryTabs" role="tablist" aria-label="หมวดสินค้า"></div>
        <div class="product-grid" id="productGrid" aria-live="polite"></div>
      </section>
      <aside class="cart-panel panel" aria-label="ตะกร้าสินค้า">
        <div class="pos-head">
          <div><p class="eyebrow">Cart</p><h3>ตะกร้าขาย</h3></div>
          <span class="badge pink" id="cartCount">0 รายการ</span>
        </div>
        <div class="cart-items" id="cartItems"></div>
        <div class="cart-controls">
          <label>ส่วนลด
            <div class="inline-fields">
              <select id="discountType" aria-label="ประเภทส่วนลด">
                <option value="baht">บาท</option>
                <option value="percent">เปอร์เซ็นต์</option>
              </select>
              <input id="discountValue" type="number" min="0" value="0" aria-label="มูลค่าส่วนลด">
            </div>
          </label>
          <label>ค่าจัดส่ง<input id="deliveryFee" type="number" min="0" value="0" aria-label="ค่าจัดส่ง"></label>
          <label>ประเภทเอกสาร<select id="documentType" aria-label="ประเภทเอกสาร"></select></label>
          <label>วิธีชำระเงิน<select id="paymentMethod" aria-label="วิธีชำระเงิน"></select></label>
          <details class="pos-tax-fields">
            <summary>ข้อมูลลูกค้าออกเอกสาร</summary>
            <label>ชื่อบริษัท/ลูกค้า<input id="posCustomerName" type="text" aria-label="ชื่อบริษัทหรือลูกค้า"></label>
            <label>เลขผู้เสียภาษี<input id="posCustomerTaxId" type="text" inputmode="numeric" aria-label="เลขผู้เสียภาษีลูกค้า"></label>
            <label>ที่อยู่สำหรับเอกสาร<textarea id="posCustomerAddress" rows="2" aria-label="ที่อยู่สำหรับเอกสาร"></textarea></label>
          </details>
          <div class="deposit-fields" id="depositFields" hidden>
            <label>ยอดรับชำระ<input id="paidAmount" type="number" min="0" aria-label="ยอดรับชำระ"></label>
            <label>วันนัดชำระส่วนที่เหลือ<input id="depositDueDate" type="date" aria-label="วันนัดชำระส่วนที่เหลือ"></label>
          </div>
        </div>
        <div class="cart-summary" id="cartSummary"></div>
        <div class="cart-actions">
          <button class="primary-button checkout-button" id="checkoutBtn" type="button">${renderIcon('receipt')}ออกเอกสาร / รับชำระเงิน</button>
          <button class="soft-button" id="posQRPaymentBtn" data-open-payment-qr type="button">${renderIcon('credit-card')}QR รับชำระ</button>
          <button class="soft-button" id="holdBillBtn" type="button">${renderIcon('pause')}พักบิล</button>
          <button class="danger-button" id="clearCartBtn" type="button">${renderIcon('trash')}ล้างตะกร้า</button>
        </div>
        <div class="held-bills" id="heldBills"></div>
      </aside>
    </div>
  `;
  document.getElementById('paymentMethod').innerHTML = paymentMethods.map(([id, label]) => `<option value="${id}">${label}</option>`).join('');
  document.getElementById('documentType').innerHTML = documentTypes.map(([id, label]) => `<option value="${id}">${label}</option>`).join('');
  renderCategoryTabs();
  ensurePosModals();
}

function renderCategoryTabs() {
  document.getElementById('categoryTabs').innerHTML = productCategories.map(category => `
    <button class="${category === state.category ? 'active' : ''}" role="tab" aria-selected="${category === state.category}" data-category="${category}" type="button">${category}</button>
  `).join('');
}

function renderProducts() {
  const query = state.query.trim().toLowerCase();
  const visible = loadProducts().filter(product => {
    const matchesCategory = state.category === 'ทั้งหมด' || product.category === state.category;
    const matchesQuery = !query || `${product.name} ${product.category}`.toLowerCase().includes(query);
    return matchesCategory && matchesQuery;
  });
  document.getElementById('productGrid').innerHTML = visible.map(product => `
    <button class="product-card" data-product-id="${product.id}" type="button">
      <span class="product-image" aria-hidden="true">${product.imageDataUrl ? `<img src="${product.imageDataUrl}" alt="">` : renderIcon('flower')}</span>
      <span class="badge gold">${product.category}</span>
      <strong>${product.name}</strong>
      <span class="product-meta"><b>${currency(product.price)}</b><small>${product.status}</small></span>
    </button>
  `).join('') || '<div class="empty-state">ไม่พบสินค้าตามคำค้นหา</div>';
}

function renderCart() {
  document.getElementById('cartCount').textContent = `${state.items.length} รายการ`;
  document.getElementById('cartItems').innerHTML = state.items.length ? state.items.map(item => `
    <div class="cart-row">
      <div><strong>${item.name}</strong><span>${currency(item.price)} / หน่วย</span></div>
      <div class="qty-controls">
        <button class="icon-button" data-decrease="${item.cartItemId}" aria-label="ลดจำนวน" type="button">${renderIcon('minus')}</button>
        <b>${item.quantity}</b>
        <button class="icon-button" data-increase="${item.cartItemId}" aria-label="เพิ่มจำนวน" type="button">${renderIcon('plus')}</button>
      </div>
      <b>${currency(item.price * item.quantity)}</b>
      <button class="icon-button remove-button" data-remove="${item.cartItemId}" aria-label="ลบสินค้า" type="button">${renderIcon('trash')}</button>
    </div>
  `).join('') : '<div class="empty-state">ยังไม่มีสินค้าในตะกร้า</div>';

  const totals = getTotals();
  const qrBtn = document.getElementById('posQRPaymentBtn');
  if (qrBtn) {
    qrBtn.dataset.paymentAmount = totals.total;
    qrBtn.dataset.paymentCustomer = 'ลูกค้าหน้าร้าน';
    qrBtn.dataset.paymentSourceType = 'pos';
  }
  const paidDisplay = state.documentType === 'receipt' ? getPaidAmount(totals.total) : 0;
  const balance = Math.max(totals.total - paidDisplay, 0);
  document.getElementById('cartSummary').innerHTML = `
    <div><span>Subtotal</span><strong>${currency(totals.subtotal)}</strong></div>
    <div><span>Discount</span><strong>${currency(totals.discountAmount)}</strong></div>
    <div><span>Delivery Fee</span><strong>${currency(totals.deliveryFee)}</strong></div>
    <div class="total-line"><span>Total</span><strong>${currency(totals.total)}</strong></div>
    <div><span>${documentLabel(state.documentType)}</span><strong>${state.documentType === 'receipt' ? 'บันทึกการขาย' : 'ออกเอกสาร'}</strong></div>
    ${state.documentType === 'receipt' ? `<div><span>ยอดรับชำระ</span><strong>${currency(paidDisplay)}</strong></div><div><span>คงเหลือ</span><strong>${currency(balance)}</strong></div>` : '<div><span>การชำระเงิน</span><strong>ไม่บันทึกรายรับ</strong></div>'}
  `;
  renderHeldBills();
  saveCartDraft(getCartState());
}

function renderHeldBills() {
  const held = loadPosState().heldBills;
  document.getElementById('heldBills').innerHTML = held.length ? `
    <p class="eyebrow">บิลพักไว้</p>
    ${held.map(bill => `<button class="soft-button" data-restore="${bill.id}" type="button">${renderIcon('rotate-ccw')}คืนบิล ${bill.items.length} รายการ</button>`).join('')}
  ` : '';
}

function bindPosEvents() {
  document.getElementById('posView').addEventListener('click', event => {
    const productId = event.target.closest('[data-product-id]')?.dataset.productId;
    const category = event.target.closest('[data-category]')?.dataset.category;
    const removeId = event.target.closest('[data-remove]')?.dataset.remove;
    const increaseId = event.target.closest('[data-increase]')?.dataset.increase;
    const decreaseId = event.target.closest('[data-decrease]')?.dataset.decrease;
    const restoreId = event.target.closest('[data-restore]')?.dataset.restore;
    if (productId) addToCart(productId);
    if (category) setCategory(category);
    if (removeId) removeFromCart(removeId);
    if (increaseId) increaseQuantity(increaseId);
    if (decreaseId) decreaseQuantity(decreaseId);
    if (restoreId) restoreHeldBill(restoreId);
  });
  document.getElementById('productSearch').addEventListener('input', event => {
    state.query = event.target.value;
    renderProducts();
  });
  document.getElementById('discountType').addEventListener('change', event => applyDiscount(event.target.value, state.discountValue));
  document.getElementById('discountValue').addEventListener('input', event => applyDiscount(state.discountType, event.target.value));
  document.getElementById('deliveryFee').addEventListener('input', event => setDeliveryFee(event.target.value));
  document.getElementById('documentType').addEventListener('change', event => selectDocumentType(event.target.value));
  document.getElementById('paymentMethod').addEventListener('change', event => selectPaymentMethod(event.target.value));
  document.getElementById('posCustomerName').addEventListener('input', event => { state.customerName = event.target.value; saveCartDraft(getCartState()); });
  document.getElementById('posCustomerTaxId').addEventListener('input', event => { state.customerTaxId = event.target.value; saveCartDraft(getCartState()); });
  document.getElementById('posCustomerAddress').addEventListener('input', event => { state.customerAddress = event.target.value; saveCartDraft(getCartState()); });
  document.getElementById('paidAmount').addEventListener('input', event => {
    state.paidAmount = Number(event.target.value) || 0;
    renderCart();
  });
  document.getElementById('depositDueDate').addEventListener('input', event => state.depositDueDate = event.target.value);
  document.getElementById('checkoutBtn').addEventListener('click', checkout);
  document.getElementById('holdBillBtn').addEventListener('click', holdBill);
  document.getElementById('clearCartBtn').addEventListener('click', clearCart);
  document.getElementById('customProductBtn').addEventListener('click', openCustomModal);
  window.addEventListener('products:updated', renderProducts);
}

export function addToCart(productId) {
  const product = findProduct(productId);
  if (!product) return;
  const existing = state.items.find(item => item.id === productId && !item.custom);
  if (existing) existing.quantity += 1;
  else state.items.push({ ...product, quantity: 1, cartItemId: crypto.randomUUID() });
  showToast(`เพิ่ม ${product.name} เข้าตะกร้าแล้ว`);
  renderCart();
}

export function removeFromCart(cartItemId) {
  state.items = state.items.filter(item => item.cartItemId !== cartItemId);
  showToast('ลบสินค้าออกจากตะกร้าแล้ว');
  renderCart();
}

export function increaseQuantity(cartItemId) {
  const item = state.items.find(row => row.cartItemId === cartItemId);
  if (item) item.quantity += 1;
  renderCart();
}

export function decreaseQuantity(cartItemId) {
  const item = state.items.find(row => row.cartItemId === cartItemId);
  if (!item) return;
  item.quantity -= 1;
  if (item.quantity <= 0) removeFromCart(cartItemId);
  else renderCart();
}

export function clearCart() {
  if (!state.items.length) return showToast('ตะกร้าว่างอยู่แล้ว');
  if (!confirm('ต้องการล้างตะกร้านี้หรือไม่?')) return;
  resetCart();
  showToast('ล้างตะกร้าเรียบร้อยแล้ว');
}

export function holdBill() {
  const held = holdBillService(getCartState());
  if (!held) return showToast('ไม่มีสินค้าให้พักบิล');
  resetCart(true);
  showToast('พักบิลเรียบร้อยแล้ว');
}

export function restoreHeldBill(id) {
  const bill = restoreHeldBillService(id);
  if (!bill) return;
  Object.assign(state, bill);
  renderInputs();
  renderCart();
  showToast('คืนบิลที่พักไว้แล้ว');
}

export function applyDiscount(type, value) {
  const subtotal = calculateSubtotal();
  const nextValue = Math.max(Number(value) || 0, 0);
  if (type === 'percent' && nextValue > 100) {
    state.discountValue = 100;
    showToast('ส่วนลดเปอร์เซ็นต์ต้องไม่เกิน 100%');
  } else if (type === 'baht' && nextValue > subtotal) {
    state.discountValue = subtotal;
    showToast('ส่วนลดต้องไม่เกินยอดขาย');
  } else {
    state.discountValue = nextValue;
  }
  state.discountType = type;
  renderInputs();
  renderCart();
}

export function setDeliveryFee(amount) {
  state.deliveryFee = Math.max(Number(amount) || 0, 0);
  renderCart();
}

export function calculateSubtotal() {
  return getTotals().subtotal;
}

export function calculateDiscount() {
  return getTotals().discountAmount;
}

export function calculateTotal() {
  return getTotals().total;
}

export function selectPaymentMethod(method) {
  state.paymentMethod = method;
  document.getElementById('depositFields').hidden = !['deposit', 'split'].includes(method);
  const total = calculateTotal();
  state.paidAmount = ['deposit', 'split'].includes(method) ? Math.min(state.paidAmount || Math.ceil(total * .5), total) : total;
  renderInputs();
  renderCart();
}

export function selectDocumentType(type) {
  state.documentType = type;
  if (type !== 'receipt') {
    state.paidAmount = 0;
    state.paymentMethod = 'transfer';
  }
  renderInputs();
  renderCart();
}

export function checkout() {
  if (!state.items.length) return showToast('กรุณาเลือกสินค้าเข้าตะกร้าก่อน');
  const total = calculateTotal();
  const paidAmount = state.documentType === 'receipt' ? getPaidAmount(total) : 0;
  if (state.documentType === 'receipt' && paidAmount <= 0) return showToast('กรุณาระบุยอดรับชำระ');
  const sale = createSale({ ...getCartState(), paidAmount });
  if (state.documentType !== 'quotation') {
    processPOSStockDeduction(sale);
    sale.items.filter(item => item.stockTracking).forEach(item => consumeRecipeForSaleItem(item, sale));
  }
  state.lastSale = sale;
  generateReceiptModal(sale);
  resetCart(true);
  showToast('บันทึกการขายเรียบร้อยแล้ว');
}

export function generateReceipt() {
  if (state.lastSale) generateReceiptModal(state.lastSale);
}

export function saveSaleToLocalStorage() {
  saveCartDraft(getCartState());
}

export function updateDashboardData() {
  window.dispatchEvent(new CustomEvent('dashboard:update'));
}

function setCategory(category) {
  state.category = category;
  renderCategoryTabs();
  renderProducts();
}

function getTotals() {
  return calculateSaleTotals(state);
}

function getPaidAmount(total) {
  if (['deposit', 'split'].includes(state.paymentMethod)) return Number(state.paidAmount) || 0;
  return total;
}

function getCartState() {
  return {
    items: state.items,
    discountType: state.discountType,
    discountValue: state.discountValue,
    deliveryFee: state.deliveryFee,
    documentType: state.documentType,
    paymentMethod: state.paymentMethod,
    paidAmount: state.paidAmount,
    depositDueDate: state.depositDueDate,
    customerName: state.customerName,
    customerTaxId: state.customerTaxId,
    customerAddress: state.customerAddress
  };
}

function renderInputs() {
  document.getElementById('discountType').value = state.discountType;
  document.getElementById('discountValue').value = state.discountValue;
  document.getElementById('deliveryFee').value = state.deliveryFee;
  document.getElementById('documentType').value = state.documentType;
  document.getElementById('paymentMethod').value = state.paymentMethod;
  document.getElementById('paidAmount').value = state.paidAmount || '';
  document.getElementById('depositDueDate').value = state.depositDueDate || '';
  document.getElementById('posCustomerName').value = state.customerName || '';
  document.getElementById('posCustomerTaxId').value = state.customerTaxId || '';
  document.getElementById('posCustomerAddress').value = state.customerAddress || '';
  document.getElementById('depositFields').hidden = !['deposit', 'split'].includes(state.paymentMethod);
}

function resetCart(render = true) {
  state.items = [];
  state.discountType = 'baht';
  state.discountValue = 0;
  state.deliveryFee = 0;
  state.documentType = 'receipt';
  state.paymentMethod = 'cash';
  state.paidAmount = 0;
  state.depositDueDate = '';
  state.customerName = '';
  state.customerTaxId = '';
  state.customerAddress = '';
  renderInputs();
  if (render) renderCart();
  saveCartDraft(getCartState());
}

function documentLabel(type) {
  return documentTypes.find(([id]) => id === type)?.[1] || 'ใบเสร็จรับเงิน';
}

function ensurePosModals() {
  if (document.getElementById('customModal')) return;
  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal-overlay" id="customModal" hidden>
      <section class="modal" role="dialog" aria-modal="true" aria-labelledby="customModalTitle">
        <button class="icon-button modal-close" data-close-pos-modal aria-label="ปิด" type="button">${renderIcon('x')}</button>
        <p class="eyebrow">Custom Product</p>
        <h3 id="customModalTitle">สินค้า Custom</h3>
        <form id="customProductForm" novalidate>
          <label>ชื่อสินค้า<input name="name" required placeholder="เช่น ช่อดอกไม้ตามงบ"></label>
          <label>ราคาขาย<input name="price" required min="1" type="number"></label>
          <label>ต้นทุนประมาณการ<input name="cost" required min="0" type="number"></label>
          <label>จำนวน<input name="quantity" required min="1" type="number" value="1"></label>
          <label>หมายเหตุ<textarea name="note" rows="3"></textarea></label>
          <p class="form-error" id="customError" role="alert"></p>
          <div class="custom-modal-actions">
            <button class="soft-button" id="customCostBtn" type="button">${renderIcon('calculator')}คำนวณต้นทุนก่อนขาย</button>
            <button class="primary-button" type="submit">${renderIcon('plus')}เพิ่มเข้าตะกร้า</button>
          </div>
        </form>
      </section>
    </div>
    <div class="modal-overlay receipt-overlay" id="receiptModal" hidden>
      <section class="modal receipt-modal" role="dialog" aria-modal="true" aria-labelledby="receiptTitle">
        <button class="icon-button modal-close" data-close-pos-modal aria-label="ปิด" type="button">${renderIcon('x')}</button>
        <p class="eyebrow">Receipt Preview</p>
        <h3 id="receiptTitle">ตัวอย่างเอกสาร</h3>
        <div id="receiptPreview"></div>
        <div class="receipt-actions">
          <button class="soft-button" id="printReceiptBtn" type="button">${renderIcon('printer')}พิมพ์ใบเสร็จ</button>
          <button class="soft-button" id="downloadReceiptBtn" type="button">${renderIcon('download')}ดาวน์โหลด/บันทึก</button>
          <button class="primary-button" data-close-pos-modal type="button">ขายต่อ</button>
        </div>
      </section>
    </div>
  `);
  document.body.addEventListener('click', event => {
    if (event.target.matches('.modal-overlay')) closePosModals();
    if (event.target.closest('[data-close-pos-modal]')) closePosModals();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closePosModals();
  });
  document.getElementById('customProductForm').addEventListener('submit', submitCustomProduct);
  document.getElementById('customCostBtn').addEventListener('click', openCustomCostCalculator);
  document.getElementById('printReceiptBtn').addEventListener('click', () => {
    if (state.lastSale) printReceiptBrowser(state.lastSale);
    else window.print();
  });
  document.getElementById('downloadReceiptBtn').addEventListener('click', () => {
    if (state.lastSale) downloadReceiptText(state.lastSale);
  });
}

function openCustomModal() {
  document.getElementById('customModal').hidden = false;
  document.querySelector('#customProductForm input[name="name"]').focus();
}

function closePosModals() {
  document.getElementById('customModal').hidden = true;
  document.getElementById('receiptModal').hidden = true;
}

function submitCustomProduct(event) {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.checkValidity()) {
    document.getElementById('customError').textContent = 'กรุณากรอกชื่อ ราคา ต้นทุน และจำนวนให้ครบถ้วน';
    return;
  }
  const data = Object.fromEntries(new FormData(form).entries());
  const item = {
    id: `custom-${Date.now()}`,
    cartItemId: crypto.randomUUID(),
    name: data.name,
    category: 'สินค้า Custom',
    price: Number(data.price),
    cost: Number(data.cost),
    quantity: Number(data.quantity),
    note: data.note,
    status: 'Custom',
    stockTracking: false,
    custom: true
  };
  state.items.push(item);
  form.reset();
  document.getElementById('customError').textContent = '';
  closePosModals();
  renderCart();
  showToast('เพิ่มสินค้า Custom เข้าตะกร้าแล้ว');
}

function openCustomCostCalculator() {
  const form = document.getElementById('customProductForm');
  openCostCalculator({
    jobType: 'custom',
    templateName: form.elements.name.value || 'สินค้า Custom',
    sellingPrice: Number(form.elements.price.value) || 0
  });
  closePosModals();
}

function generateReceiptModal(sale) {
  document.getElementById('receiptPreview').innerHTML = renderReceiptHtml(sale);
  document.getElementById('receiptModal').hidden = false;
}
