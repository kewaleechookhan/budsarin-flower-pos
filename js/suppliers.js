import { createPurchaseOrder, loadPurchaseOrders, receivePOItems, recordSupplierPayment as recordPOPayment } from './purchase-orders.js';
import { getPriceTrend } from './price-history.js';
import { detectOverduePayables, recordSupplierPayment } from './supplier-payables.js';
import { addSupplier, comparePrices, editSupplier, filterSuppliers, getSupplierSnapshot, loadSuppliers, searchSuppliers, supplierTypes, syncSupplierDashboard } from './suppliers-service.js';
import { poStatuses, supplierPaymentStatuses, supplierStatuses } from './suppliers-data.js';
import { renderIcon } from './icons.js';
import { currency, number, showToast, thaiDate } from './utils.js';

const state = { tab: 'overview', query: '', selectedSupplierId: '', compareItem: 'กุหลาบชมพู', snapshot: null };
const tabs = [
  ['overview', 'ภาพรวม Supplier'],
  ['list', 'รายชื่อ Supplier'],
  ['po', 'Purchase Orders'],
  ['prices', 'ประวัติราคา'],
  ['credit', 'เครดิต/เจ้าหนี้'],
  ['compare', 'เปรียบเทียบราคา'],
  ['settings', 'ตั้งค่า Supplier']
];

export function initSuppliers() {
  renderSuppliersShell();
  syncSupplierDashboard();
  renderSuppliers();
  bindSupplierEvents();
}

function renderSuppliersShell() {
  document.getElementById('suppliersView').innerHTML = `
    <section class="suppliers-header panel">
      <div><p class="eyebrow">Phase 8 Suppliers</p><h3>ซัพพลายเออร์</h3><span>จัดการ Supplier, Purchase Orders, เครดิตการค้า และประวัติราคาซื้อ</span></div>
      <div class="suppliers-header-actions">
        <button class="primary-button" id="newSupplierBtn" type="button">${renderIcon('plus')}เพิ่ม Supplier</button>
        <button class="primary-button" id="newPOBtn" type="button">${renderIcon('plus')}สร้าง PO</button>
        <button class="soft-button" id="supplierExportBtn" type="button">${renderIcon('download')}Export</button>
      </div>
    </section>
    <nav class="supplier-tabs panel" role="tablist">${tabs.map(([id, label]) => `<button class="${id === state.tab ? 'active' : ''}" data-supplier-tab="${id}" type="button">${label}</button>`).join('')}</nav>
    <section id="suppliersContent"></section>
  `;
  ensureSupplierModals();
}

function renderSuppliers() {
  state.snapshot = getSupplierSnapshot();
  document.querySelectorAll('[data-supplier-tab]').forEach(btn => btn.classList.toggle('active', btn.dataset.supplierTab === state.tab));
  const views = { overview: renderOverview, list: renderList, po: renderPO, prices: renderPrices, credit: renderCredit, compare: renderCompare, settings: renderSettings };
  document.getElementById('suppliersContent').innerHTML = views[state.tab]();
}

function renderOverview() {
  const s = state.snapshot;
  const purchaseBySupplier = groupBy(s.purchaseOrders, 'supplierName', 'totalAmount');
  const purchaseByCategory = s.purchaseOrders.flatMap(po => po.items).reduce((result, item) => {
    result[item.category] = (result[item.category] || 0) + (Number(item.totalCost) || 0);
    return result;
  }, {});
  return `
    <section class="supplier-kpis">
      ${kpi('Supplier ทั้งหมด', s.totalSuppliers, 'truck', false)}
      ${kpi('ใช้งานอยู่', s.activeSuppliers, 'users', false)}
      ${kpi('Supplier แนะนำ', s.preferredSuppliers, 'sparkles', false)}
      ${kpi('PO เดือนนี้', s.monthlyPOCount, 'package', false)}
      ${kpi('ยอดซื้อเดือนนี้', s.monthlyPurchaseTotal, 'wallet')}
      ${kpi('เจ้าหนี้ค้างจ่าย', s.payableTotal, 'receipt')}
      ${kpi('ซื้อบ่อยที่สุด', s.mostPurchasedSupplier, 'trending-up', false)}
      ${kpi('ราคาขึ้นสูงสุด', s.highestPriceIncrease, 'bar-chart-3', false)}
    </section>
    <section class="supplier-grid">
      <article class="panel"><div class="panel-heading"><div><p class="eyebrow">Purchase by Supplier</p><h3>ยอดซื้อตาม Supplier</h3></div></div>${legendList(purchaseBySupplier)}</article>
      <article class="panel"><div class="panel-heading"><div><p class="eyebrow">Purchase by Category</p><h3>ยอดซื้อตามหมวด</h3></div></div>${legendList(purchaseByCategory)}</article>
      <article class="panel"><div class="panel-heading"><div><p class="eyebrow">Price Trend</p><h3>แนวโน้มราคากุหลาบชมพู</h3></div></div>${priceTrend('กุหลาบชมพู')}</article>
      <article class="panel"><div class="panel-heading"><div><p class="eyebrow">Payable Aging</p><h3>เจ้าหนี้ตามอายุหนี้</h3></div></div>${payableAging()}</article>
    </section>
  `;
}

function renderList() {
  const suppliers = searchSuppliers(state.query, filterSuppliers({}, state.snapshot.suppliers));
  return `
    <section class="supplier-toolbar panel">
      <label class="supplier-search">${renderIcon('search')}<input id="supplierSearch" type="search" value="${escapeHtml(state.query)}" placeholder="ค้นหาชื่อ เบอร์โทร สินค้าหลัก หรือผู้ติดต่อ"></label>
      <button class="primary-button" data-open-supplier type="button">${renderIcon('plus')}เพิ่ม Supplier</button>
    </section>
    <section class="supplier-card-grid">${suppliers.map(supplierCard).join('')}</section>
  `;
}

function supplierCard(supplier) {
  return `<article class="supplier-card panel">
    <div class="supplier-card-head"><div><p class="eyebrow">${supplier.supplierCode}</p><h3>${escapeHtml(supplier.supplierName)}</h3><span>${supplierTypes[supplier.supplierType]}</span></div><span class="badge ${supplierStatuses[supplier.status].tone}">${supplierStatuses[supplier.status].label}</span></div>
    <div class="supplier-meta">
      <div><span>ผู้ติดต่อ</span><strong>${escapeHtml(supplier.contactPerson)}</strong></div>
      <div><span>โทร</span><strong>${escapeHtml(supplier.phone)}</strong></div>
      <div><span>LINE</span><strong>${escapeHtml(supplier.lineId)}</strong></div>
      <div><span>เครดิต</span><strong>${currency(supplier.creditLimit)} / ${supplier.creditDays} วัน</strong></div>
      <div><span>Rating</span><strong>${number(Number(supplier.rating).toFixed(1))}</strong></div>
      <div><span>สินค้าหลัก</span><strong>${escapeHtml(supplier.mainProducts)}</strong></div>
    </div>
    <div class="supplier-actions">
      <button class="soft-button" data-detail-supplier="${supplier.id}" type="button">รายละเอียด</button>
      <button class="primary-button" data-po-supplier="${supplier.id}" type="button">สร้าง PO</button>
      <button class="soft-button" data-price-supplier="${supplier.id}" type="button">ประวัติราคา</button>
    </div>
  </article>`;
}

function renderPO() {
  return `<section class="supplier-grid one-col"><article class="panel"><div class="panel-heading"><div><p class="eyebrow">Purchase Orders</p><h3>รายการสั่งซื้อ</h3></div><button class="primary-button" data-open-po type="button">${renderIcon('plus')}สร้าง PO</button></div><div class="supplier-table">${state.snapshot.purchaseOrders.map(poRow).join('')}</div></article></section>`;
}

function poRow(po) {
  return `<div class="supplier-table-row">
    <div><strong>${po.poNo}</strong><span>${po.supplierName} • ${thaiDate(po.orderDate)}</span></div>
    <span class="badge ${poStatuses[po.poStatus]?.tone || 'info'}">${poStatuses[po.poStatus]?.label || po.poStatus}</span>
    <span class="badge ${supplierPaymentStatuses[po.paymentStatus]?.tone || 'warning'}">${supplierPaymentStatuses[po.paymentStatus]?.label || po.paymentStatus}</span>
    <b>${currency(po.totalAmount)}</b>
    <button class="soft-button" data-receive-po="${po.id}" type="button">รับสินค้า</button>
    <button class="soft-button" data-pay-po="${po.id}" type="button">ชำระเงิน</button>
  </div>`;
}

function renderPrices() {
  return `<section class="supplier-grid one-col"><article class="panel"><div class="panel-heading"><div><p class="eyebrow">Price History</p><h3>ประวัติราคาซื้อ</h3></div></div><div class="supplier-table">${state.snapshot.priceHistory.slice(0, 60).map(item => `<div class="supplier-table-row"><div><strong>${item.itemName}</strong><span>${item.supplierName} • ${thaiDate(item.purchaseDate)}</span></div><span>${item.category}</span><b>${currency(item.unitCost)} / ${item.unit}</b><span>${item.poId}</span></div>`).join('')}</div></article></section>`;
}

function renderCredit() {
  return `<section class="supplier-grid one-col"><article class="panel"><div class="panel-heading"><div><p class="eyebrow">Supplier Payables</p><h3>เครดิต/เจ้าหนี้</h3></div></div><div class="supplier-table">${detectOverduePayables().map(payable => `<div class="supplier-table-row"><div><strong>${payable.supplierName}</strong><span>${payable.description} • ครบกำหนด ${thaiDate(payable.dueDate)}</span></div><span class="badge ${payable.status === 'overdue' ? 'danger' : payable.status === 'due_soon' ? 'warning' : 'success'}">${statusLabel(payable.status)}</span><b>${currency(payable.balanceAmount)}</b><button class="soft-button" data-pay-payable="${payable.id}" type="button">บันทึกชำระ</button></div>`).join('')}</div></article></section>`;
}

function renderCompare() {
  const rows = comparePrices(state.compareItem);
  return `<section class="panel supplier-compare"><div class="panel-heading"><div><p class="eyebrow">Price Comparison</p><h3>เปรียบเทียบราคา</h3></div></div>
    <div class="supplier-toolbar"><label class="supplier-search">${renderIcon('search')}<input id="compareItemInput" value="${escapeHtml(state.compareItem)}" placeholder="เช่น กุหลาบชมพู"></label><button class="primary-button" id="compareBtn" type="button">เปรียบเทียบ</button></div>
    <div class="supplier-table">${rows.map(row => `<div class="supplier-table-row ${row.recommended ? 'recommended-row' : ''}"><div><strong>${row.supplierName}</strong><span>${row.recommended ? 'Supplier ที่คุ้มที่สุด • ' : ''}คะแนน ${number(row.score.toFixed(1))}</span></div><b>${currency(row.latestPrice)}</b><span>เฉลี่ย ${currency(row.averagePrice)}</span><span>ล่าสุด ${thaiDate(row.latestDate)}</span><span>เครดิต ${row.supplier.creditDays || 0} วัน</span><span>Rating ${row.supplier.rating || '-'}</span><button class="primary-button" data-po-supplier="${row.supplierId}" type="button">สร้าง PO</button></div>`).join('') || '<div class="empty-state">ไม่พบประวัติราคาสินค้านี้</div>'}</div>
  </section>`;
}

function renderSettings() {
  return `<section class="panel"><div class="panel-heading"><div><p class="eyebrow">Settings</p><h3>ตั้งค่า Supplier</h3></div></div><div class="supplier-settings">${Object.entries(supplierTypes).map(([id, label]) => `<div><strong>${label}</strong><span>${id}</span></div>`).join('')}</div></section>`;
}

function bindSupplierEvents() {
  document.getElementById('suppliersView').addEventListener('click', event => {
    const tab = event.target.closest('[data-supplier-tab]')?.dataset.supplierTab;
    const detail = event.target.closest('[data-detail-supplier]')?.dataset.detailSupplier;
    const poSupplier = event.target.closest('[data-po-supplier]')?.dataset.poSupplier;
    const receive = event.target.closest('[data-receive-po]')?.dataset.receivePo;
    const payPo = event.target.closest('[data-pay-po]')?.dataset.payPo;
    const payPayable = event.target.closest('[data-pay-payable]')?.dataset.payPayable;
    if (tab) { state.tab = tab; renderSuppliers(); }
    if (event.target.closest('[data-open-supplier]') || event.target.id === 'newSupplierBtn') openSupplierModal();
    if (event.target.closest('[data-open-po]') || event.target.id === 'newPOBtn') openPOModal(poSupplier || state.selectedSupplierId);
    if (detail) openSupplierDetail(detail);
    if (poSupplier) openPOModal(poSupplier);
    if (event.target.closest('[data-price-supplier]')) { state.tab = 'prices'; renderSuppliers(); }
    if (receive) receivePO(receive);
    if (payPo) payPO(payPo);
    if (payPayable) paySupplierPayable(payPayable);
    if (event.target.id === 'supplierExportBtn') showToast('Export Supplier จะเพิ่มใน Phase ถัดไป');
    if (event.target.id === 'compareBtn') { state.compareItem = document.getElementById('compareItemInput').value || state.compareItem; renderSuppliers(); }
  });
  document.getElementById('suppliersView').addEventListener('input', event => {
    if (event.target.id === 'supplierSearch') { state.query = event.target.value; renderSuppliers(); }
  });
}

function ensureSupplierModals() {
  if (document.getElementById('supplierModal')) return;
  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal-overlay" id="supplierModal" hidden><section class="modal supplier-modal"><button class="icon-button modal-close" data-close-supplier-modal type="button">${renderIcon('x')}</button><p class="eyebrow">Supplier</p><h3 id="supplierModalTitle">เพิ่ม Supplier</h3><form id="supplierForm"><label>ชื่อ Supplier<input name="supplierName" required></label><label>ประเภท<select name="supplierType">${Object.entries(supplierTypes).map(([id, label]) => `<option value="${id}">${label}</option>`).join('')}</select></label><label>ผู้ติดต่อ<input name="contactPerson"></label><label>โทร<input name="phone"></label><label>LINE<input name="lineId"></label><label>จังหวัด<input name="province"></label><label>Credit Limit<input name="creditLimit" type="number" min="0"></label><label>Credit Days<input name="creditDays" type="number" min="0"></label><label>Rating<input name="rating" type="number" min="1" max="5" step=".1" value="4"></label><label>สถานะ<select name="status">${Object.entries(supplierStatuses).map(([id, s]) => `<option value="${id}">${s.label}</option>`).join('')}</select></label><label class="span-2">สินค้าหลัก<input name="mainProducts"></label><label class="span-2">หมายเหตุ<textarea name="note" rows="2"></textarea></label><p class="form-error" id="supplierFormError"></p><button class="primary-button" type="submit">${renderIcon('save')}บันทึก</button></form></section></div>
    <div class="modal-overlay" id="poModal" hidden><section class="modal supplier-modal"><button class="icon-button modal-close" data-close-supplier-modal type="button">${renderIcon('x')}</button><p class="eyebrow">Purchase Order</p><h3>สร้าง Purchase Order</h3><form id="poForm"><label>Supplier<select name="supplierId"></select></label><label>วันที่รับสินค้า<input name="expectedReceiveDate" type="date"></label><label>สินค้า<input name="itemName" value="กุหลาบชมพู"></label><label>หมวด<input name="category" value="ดอกไม้สด"></label><label>จำนวน<input name="quantity" type="number" min="1" value="100"></label><label>หน่วย<input name="unit" value="ดอก"></label><label>ราคาต่อหน่วย<input name="unitCost" type="number" min="0" value="18"></label><label>ค่าขนส่ง<input name="shippingFee" type="number" min="0" value="0"></label><label>ชำระแล้ว<input name="paidAmount" type="number" min="0" value="0"></label><label class="span-2">หมายเหตุ<textarea name="note" rows="2"></textarea></label><button class="primary-button" type="submit">${renderIcon('save')}สร้าง PO</button></form></section></div>
    <div class="modal-overlay" id="supplierDetailModal" hidden><section class="modal supplier-detail-modal"><button class="icon-button modal-close" data-close-supplier-modal type="button">${renderIcon('x')}</button><div id="supplierDetailBody"></div></section></div>
  `);
  document.body.addEventListener('click', event => {
    if (event.target.matches('#supplierModal') || event.target.matches('#poModal') || event.target.matches('#supplierDetailModal') || event.target.closest('[data-close-supplier-modal]')) closeSupplierModals();
  });
  document.getElementById('supplierForm').addEventListener('submit', submitSupplier);
  document.getElementById('poForm').addEventListener('submit', submitPO);
}

function openSupplierModal() {
  document.getElementById('supplierForm').reset();
  document.getElementById('supplierModal').hidden = false;
}

function openPOModal(supplierId = '') {
  const suppliers = loadSuppliers();
  document.querySelector('#poForm select[name="supplierId"]').innerHTML = suppliers.map(item => `<option value="${item.id}">${item.supplierName}</option>`).join('');
  if (supplierId) document.querySelector('#poForm select[name="supplierId"]').value = supplierId;
  document.querySelector('#poForm input[name="expectedReceiveDate"]').value = new Date().toISOString().slice(0, 10);
  document.getElementById('poModal').hidden = false;
}

function openSupplierDetail(id) {
  const supplier = loadSuppliers().find(item => item.id === id);
  if (!supplier) return;
  const pos = loadPurchaseOrders().filter(po => po.supplierId === id);
  document.getElementById('supplierDetailBody').innerHTML = `<p class="eyebrow">${supplier.supplierCode}</p><h3>${supplier.supplierName}</h3><div class="supplier-meta detail">${Object.entries({ ประเภท: supplierTypes[supplier.supplierType], ผู้ติดต่อ: supplier.contactPerson, โทร: supplier.phone, LINE: supplier.lineId, เครดิต: `${currency(supplier.creditLimit)} / ${supplier.creditDays} วัน`, บัญชี: `${supplier.bankName} ${supplier.bankAccountNo}`, สินค้าหลัก: supplier.mainProducts, เจ้าหนี้: currency(calculateSupplierBalance(supplier.id)) }).map(([k, v]) => `<div><span>${k}</span><strong>${v}</strong></div>`).join('')}</div><h4>Purchase Orders</h4><div class="supplier-table">${pos.map(poRow).join('') || '<div class="empty-state">ยังไม่มี PO</div>'}</div><div class="supplier-actions"><button class="primary-button" data-po-supplier="${supplier.id}" type="button">สร้าง PO</button><button class="soft-button" data-close-supplier-modal type="button">ปิด</button></div>`;
  document.getElementById('supplierDetailModal').hidden = false;
}

function submitSupplier(event) {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.currentTarget).entries());
  if (!data.supplierName.trim()) return document.getElementById('supplierFormError').textContent = 'กรุณากรอกชื่อ Supplier';
  addSupplier(data);
  closeSupplierModals();
  showToast('บันทึก Supplier แล้ว');
  renderSuppliers();
}

function submitPO(event) {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.currentTarget).entries());
  const supplier = loadSuppliers().find(item => item.id === data.supplierId);
  const qty = Number(data.quantity) || 0;
  const cost = Number(data.unitCost) || 0;
  createPurchaseOrder({
    supplierId: supplier.id,
    supplierName: supplier.supplierName,
    expectedReceiveDate: data.expectedReceiveDate,
    shippingFee: Number(data.shippingFee) || 0,
    paidAmount: Number(data.paidAmount) || 0,
    paymentMethod: supplier.preferredPaymentMethod,
    items: [{ id: crypto.randomUUID(), inventoryItemId: `inv-${Date.now()}`, itemName: data.itemName, category: data.category, quantity: qty, unit: data.unit, unitCost: cost, totalCost: qty * cost, receivedQuantity: 0, qualityStatus: 'ดี', expiryDate: '', useByDate: '', note: '' }],
    note: data.note
  });
  closeSupplierModals();
  showToast('สร้าง Purchase Order แล้ว');
  state.tab = 'po';
  syncSupplierDashboard();
  renderSuppliers();
}

function receivePO(id) {
  receivePOItems(id);
  showToast('รับสินค้าเข้า Inventory และบันทึก Price History แล้ว');
  syncSupplierDashboard();
  renderSuppliers();
}

function payPO(id) {
  recordPOPayment(id, 999999);
  showToast('บันทึกชำระเงิน PO แล้ว');
  syncSupplierDashboard();
  renderSuppliers();
}

function paySupplierPayable(id) {
  recordSupplierPayment(id, 999999);
  showToast('บันทึกชำระเจ้าหนี้แล้ว');
  syncSupplierDashboard();
  renderSuppliers();
}

function closeSupplierModals() {
  ['supplierModal', 'poModal', 'supplierDetailModal'].forEach(id => document.getElementById(id).hidden = true);
  document.getElementById('supplierFormError').textContent = '';
}

function kpi(label, value, icon, money = true) {
  return `<article class="supplier-kpi"><span>${renderIcon(icon)}</span><small>${label}</small><strong>${money && typeof value === 'number' ? currency(value) : value}</strong></article>`;
}

function legendList(data) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const max = Math.max(...entries.map(([, v]) => v), 1);
  return `<div class="supplier-bars">${entries.slice(0, 8).map(([label, value]) => `<div><span>${label}</span><b style="width:${(value / max) * 100}%"></b><strong>${currency(value)}</strong></div>`).join('')}</div>`;
}

function priceTrend(itemName) {
  const rows = getPriceTrend(itemName).slice(-8);
  const max = Math.max(...rows.map(row => row.unitCost), 1);
  return `<div class="price-trend">${rows.map(row => `<div><span style="height:${Math.max((row.unitCost / max) * 100, 8)}%"></span><small>${currency(row.unitCost)}</small></div>`).join('') || '<div class="empty-state">ยังไม่มีข้อมูล</div>'}</div>`;
}

function payableAging() {
  const rows = detectOverduePayables();
  const data = { ปกติ: rows.filter(r => r.status === 'normal').length, ใกล้ครบกำหนด: rows.filter(r => r.status === 'due_soon').length, เกินกำหนด: rows.filter(r => r.status === 'overdue').length, จ่ายแล้ว: rows.filter(r => r.status === 'paid').length };
  return legendList(data);
}

function groupBy(items, key, amountKey) {
  return items.reduce((result, item) => {
    const label = item[key] || 'ไม่ระบุ';
    result[label] = (result[label] || 0) + (Number(item[amountKey]) || 0);
    return result;
  }, {});
}

function statusLabel(status) {
  return { normal: 'ปกติ', due_soon: 'ใกล้ครบกำหนด', overdue: 'เกินกำหนด', paid: 'จ่ายแล้ว', cancelled: 'ยกเลิก' }[status] || status;
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[char]);
}
