import { calculateOrderFinancials } from './order-calculations.js';
import { openCostCalculator } from './cost-calculator.js?v=20260719a';
import { processOrderStockDeduction } from './inventory-service.js';
import { orderStatuses, orderTypes, paymentStatuses } from './orders-data.js';
import { cancelOrder, getTimeline, loadOrders, saveOrder, syncDashboardFromOrders, updateOrderStatus } from './orders-service.js?v=20260719a';
import { renderWorkOrder } from './work-order.js';
import { renderIcon } from './icons.js';
import { currency, showToast, thaiDate } from './utils.js';

const state = { orders: [], query: '', status: 'all', payment: 'all', type: 'all', date: '', selectedId: null, editingId: null };
const statusKeys = Object.keys(orderStatuses);

export function initOrders() {
  state.orders = loadOrders();
  renderOrdersShell();
  renderOrders();
  bindOrdersEvents();
  syncDashboardFromOrders(state.orders);
  window.addEventListener('orders:refresh', () => {
    state.orders = loadOrders();
    renderOrders();
  });
}

function renderOrdersShell() {
  document.getElementById('ordersView').innerHTML = `
    <section class="orders-header panel">
      <div><p class="eyebrow">Phase 3 Orders</p><h3>ออร์เดอร์ลูกค้า</h3><span>จัดการคำสั่งซื้อ ช่อดอกไม้ และงานสั่งทำ</span></div>
      <button class="primary-button" id="newOrderBtn" type="button">${renderIcon('plus')}รับออร์เดอร์ใหม่</button>
    </section>
    <section class="orders-filter panel">
      <label class="orders-search">${renderIcon('search')}<input id="orderSearch" type="search" placeholder="ค้นหาเลขออร์เดอร์ ลูกค้า เบอร์โทร หรือชื่องาน" aria-label="ค้นหาออร์เดอร์"></label>
      <label>สถานะงาน<select id="orderStatusFilter"></select></label>
      <label>วันที่รับ/ส่ง<input id="orderDateFilter" type="date"></label>
      <label>ประเภท<select id="orderTypeFilter"></select></label>
      <label>สถานะเงิน<select id="paymentStatusFilter"></select></label>
    </section>
    <section class="orders-layout">
      <div class="orders-list panel" id="ordersList"></div>
      <aside class="order-detail-panel panel" id="orderDetailPanel"></aside>
    </section>
  `;
  fillFilters();
  ensureOrderModals();
}

function fillFilters() {
  document.getElementById('orderStatusFilter').innerHTML = optionAll('ทุกสถานะงาน') + Object.entries(orderStatuses).map(([id, item]) => `<option value="${id}">${item.label}</option>`).join('');
  document.getElementById('paymentStatusFilter').innerHTML = optionAll('ทุกสถานะเงิน') + Object.entries(paymentStatuses).map(([id, item]) => `<option value="${id}">${item.label}</option>`).join('');
  document.getElementById('orderTypeFilter').innerHTML = optionAll('ทุกประเภท') + Object.entries(orderTypes).map(([id, label]) => `<option value="${id}">${label}</option>`).join('');
}

function optionAll(label) {
  return `<option value="all">${label}</option>`;
}

function renderOrders() {
  const filtered = getFilteredOrders();
  const selected = filtered.find(order => order.id === state.selectedId) || filtered[0] || null;
  state.selectedId = selected?.id || null;
  document.getElementById('ordersList').innerHTML = filtered.length ? filtered.map(orderCard).join('') : '<div class="empty-state">ไม่พบออร์เดอร์ตามตัวกรองนี้</div>';
  renderDetail(selected);
}

function getFilteredOrders() {
  const q = state.query.trim().toLowerCase();
  return state.orders.filter(order => {
    const text = `${order.orderNo} ${order.customerName} ${order.customerPhone} ${order.title}`.toLowerCase();
    return (!q || text.includes(q)) &&
      (state.status === 'all' || order.orderStatus === state.status) &&
      (state.payment === 'all' || order.paymentStatus === state.payment) &&
      (state.type === 'all' || order.orderType === state.type) &&
      (!state.date || order.dueDate === state.date);
  });
}

function orderCard(order) {
  const status = orderStatuses[order.orderStatus] || { label: order.orderStatus || 'ไม่ระบุ', tone: 'info' };
  const payment = paymentStatuses[order.paymentStatus] || { label: order.paymentStatus || 'ไม่ระบุ', tone: 'info' };
  return `
    <article class="order-card ${order.id === state.selectedId ? 'active' : ''}" data-order-id="${order.id}">
      <button class="order-card-main" data-select-order="${order.id}" type="button">
        <div><strong>${order.orderNo}</strong><span>${order.customerName} • ${order.customerPhone}</span></div>
        <div><b>${orderTypes[order.orderType]}</b><span>${thaiDate(order.dueDate)} ${order.dueTime}</span></div>
        <div><strong>${currency(order.totalAmount)}</strong><span>มัดจำ ${currency(order.depositAmount)} | คงเหลือ ${currency(order.balanceAmount)}</span></div>
        <div class="order-badges"><span class="badge ${status.tone}">${status.label}</span><span class="badge ${payment.tone}">${payment.label}</span></div>
      </button>
      <div class="order-card-actions">
        <button class="soft-button" data-edit-order="${order.id}" type="button">${renderIcon('settings')}แก้ไข</button>
        <button class="soft-button" data-next-status="${order.id}" type="button">${renderIcon('trending-up')}เปลี่ยนสถานะ</button>
      </div>
    </article>
  `;
}

function renderDetail(order) {
  const panel = document.getElementById('orderDetailPanel');
  if (!order) {
    panel.innerHTML = '<div class="empty-state">เลือกออร์เดอร์เพื่อดูรายละเอียด</div>';
    return;
  }
  const timeline = getTimeline(order.id);
  panel.innerHTML = `
    <div class="detail-head">
      <div><p class="eyebrow">Order Detail</p><h3>${order.orderNo}</h3><span>${order.title}</span></div>
      <span class="badge ${statusMeta(order.orderStatus, orderStatuses).tone}">${statusMeta(order.orderStatus, orderStatuses).label}</span>
    </div>
    <div class="reference-box">${renderIcon('flower')}<span>Reference: ${order.referenceImage || 'placeholder'}</span></div>
    <div class="detail-grid-mini">
      ${detail('ลูกค้า', `${order.customerName} / ${order.customerPhone}`)}
      ${detail('ประเภท', orderTypes[order.orderType])}
      ${detail('วันเวลา', `${thaiDate(order.dueDate)} ${order.dueTime}`)}
      ${detail('สถานที่', order.pickupMethod === 'delivery' ? order.deliveryAddress : 'ลูกค้ารับเอง')}
      ${detail('โทนสี', order.colorTheme || '-')}
      ${detail('สไตล์', order.flowerStyle || '-')}
      ${detail('ยอดรวม', currency(order.totalAmount))}
      ${detail('มัดจำ/คงเหลือ', `${currency(order.depositAmount)} / ${currency(order.balanceAmount)}`)}
      ${detail('กำไรประมาณการ', `${currency(order.grossProfit)} (${Number(order.grossMargin || 0).toFixed(1)}%)`)}
    </div>
    <section class="detail-note"><h4>รายละเอียด</h4><p>${order.description || '-'}</p><h4>ข้อความบนการ์ด</h4><p>${order.cardMessage || '-'}</p><h4>หมายเหตุภายใน</h4><p>${order.internalNote || '-'}</p></section>
    <div class="detail-actions">
      <button class="primary-button" data-edit-order="${order.id}" type="button">${renderIcon('settings')}แก้ไข</button>
      <button class="soft-button" data-cost-order="${order.id}" type="button">${renderIcon('calculator')}คำนวณต้นทุน</button>
      <button class="soft-button" data-work-order="${order.id}" type="button">${renderIcon('printer')}พิมพ์ใบงาน</button>
      <button class="danger-button" data-cancel-order="${order.id}" type="button">${renderIcon('trash')}ยกเลิก</button>
    </div>
    <div class="order-timeline"><p class="eyebrow">Timeline</p>${timeline.map(item => `<div><span>${new Date(item.at).toLocaleString('th-TH')}</span><strong>${item.label}</strong></div>`).join('') || '<span>ยังไม่มีประวัติ</span>'}</div>
  `;
}

function detail(label, value) {
  return `<div><span>${label}</span><strong>${value}</strong></div>`;
}

function bindOrdersEvents() {
  document.getElementById('ordersView').addEventListener('click', event => {
    const selectId = event.target.closest('[data-select-order]')?.dataset.selectOrder;
    const editId = event.target.closest('[data-edit-order]')?.dataset.editOrder;
    const nextId = event.target.closest('[data-next-status]')?.dataset.nextStatus;
    const cancelId = event.target.closest('[data-cancel-order]')?.dataset.cancelOrder;
    const workId = event.target.closest('[data-work-order]')?.dataset.workOrder;
    const costId = event.target.closest('[data-cost-order]')?.dataset.costOrder;
    if (event.target.closest('#newOrderBtn')) openOrderForm();
    if (selectId) selectOrder(selectId);
    if (editId) openOrderForm(editId);
    if (nextId) changeStatus(nextId);
    if (cancelId) cancelSelectedOrder(cancelId);
    if (workId) openWorkOrder(workId);
    if (costId) openCostForOrder(costId);
  });
  document.getElementById('newOrderBtn').addEventListener('click', () => openOrderForm());
  document.getElementById('orderSearch').addEventListener('input', event => { state.query = event.target.value; renderOrders(); });
  document.getElementById('orderStatusFilter').addEventListener('change', event => { state.status = event.target.value; renderOrders(); });
  document.getElementById('paymentStatusFilter').addEventListener('change', event => { state.payment = event.target.value; renderOrders(); });
  document.getElementById('orderTypeFilter').addEventListener('change', event => { state.type = event.target.value; renderOrders(); });
  document.getElementById('orderDateFilter').addEventListener('input', event => { state.date = event.target.value; renderOrders(); });
}

function selectOrder(id) {
  state.selectedId = id;
  renderOrders();
}

function changeStatus(id) {
  const order = state.orders.find(item => item.id === id);
  if (!order) return;
  const index = statusKeys.indexOf(order.orderStatus);
  const next = statusKeys[(index + 1) % statusKeys.length];
  const updated = updateOrderStatus(id, next);
  processOrderStockDeduction(updated);
  state.orders = loadOrders();
  state.selectedId = id;
  renderOrders();
  showToast(`เปลี่ยนสถานะเป็น ${orderStatuses[next].label}`);
}

function cancelSelectedOrder(id) {
  if (!confirm('ต้องการยกเลิกออร์เดอร์นี้หรือไม่?')) return;
  cancelOrder(id);
  state.orders = loadOrders();
  state.selectedId = id;
  renderOrders();
  showToast('ยกเลิกออร์เดอร์แล้ว');
}

function openOrderForm(id = null) {
  state.editingId = id;
  const order = state.orders.find(item => item.id === id) || {};
  const modal = document.getElementById('orderModal');
  document.getElementById('orderModalTitle').textContent = id ? 'แก้ไขออร์เดอร์' : 'รับออร์เดอร์ใหม่';
  fillOrderForm(order);
  modal.hidden = false;
  document.querySelector('#orderForm input[name="customerName"]').focus();
}

export function openOrderFormFromCustomer(customer = {}) {
  openOrderForm();
  const form = document.getElementById('orderForm');
  form.elements.customerName.value = customer.customerName || '';
  form.elements.customerPhone.value = customer.phone || '';
  form.elements.customerContact.value = customer.lineId || customer.facebook || customer.email || '';
  form.elements.customerAddress.value = customer.address || '';
  form.elements.colorTheme.value = customer.preferredColorTheme || '';
  form.elements.flowerStyle.value = customer.preferredFlowerStyle || '';
  form.elements.budget.value = customer.averageBudget || '';
  form.elements.isNewCustomer.checked = false;
  updateOrderSummary();
}

function fillOrderForm(order) {
  const form = document.getElementById('orderForm');
  form.reset();
  form.elements.orderType.innerHTML = Object.entries(orderTypes).map(([id, label]) => `<option value="${id}">${label}</option>`).join('');
  form.elements.pickupMethod.innerHTML = '<option value="pickup">รับเอง</option><option value="delivery">จัดส่ง</option>';
  form.elements.paymentMethod.innerHTML = '<option value="cash">เงินสด</option><option value="transfer">โอนเงิน</option><option value="qr">QR Payment</option><option value="card">บัตร</option>';
  Object.entries(order).forEach(([key, value]) => {
    if (form.elements[key] != null) form.elements[key].value = value;
  });
  if (!order.dueDate) form.elements.dueDate.value = new Date().toISOString().slice(0, 10);
  if (!order.dueTime) form.elements.dueTime.value = '10:00';
  if (!order.title) form.elements.title.value = '';
  if (!order.pickupMethod) form.elements.pickupMethod.value = 'pickup';
  updateOrderSummary();
}

function submitOrder(mode) {
  const form = document.getElementById('orderForm');
  const error = document.getElementById('orderFormError');
  try {
    error.textContent = '';
    const data = Object.fromEntries(new FormData(form).entries());
    const validation = validateOrder(data, mode);
    if (validation) {
      error.textContent = validation;
      showToast(validation);
      return null;
    }
    const existing = state.orders.find(item => item.id === state.editingId);
    const order = saveOrder({ ...existing, ...data, id: state.editingId, isNewCustomer: form.elements.isNewCustomer.checked, totalAmount: Number(data.totalAmount), estimatedCost: Number(data.estimatedCost), depositAmount: Number(data.depositAmount), paidAmount: Number(data.paidAmount), deliveryFee: Number(data.deliveryFee) }, mode);
    state.orders = loadOrders();
    state.selectedId = order.id;
    state.editingId = order.id;
    closeOrderModals();
    renderOrders();
    showToast(mode === 'draft' ? 'บันทึกแบบร่างแล้ว' : 'บันทึกออร์เดอร์แล้ว');
    return order;
  } catch (err) {
    error.textContent = err.message || 'บันทึกออร์เดอร์ไม่สำเร็จ';
    showToast(error.textContent);
    return null;
  }
}

function validateOrder(data, mode) {
  if (mode !== 'draft') {
    if (!data.customerName?.trim()) return 'กรุณากรอกชื่อลูกค้า';
    if (!data.customerPhone?.trim()) return 'กรุณากรอกเบอร์โทร';
    if (!data.orderType) return 'กรุณาเลือกประเภทออร์เดอร์';
    if (!data.title?.trim()) return 'กรุณากรอกชื่อ/รายละเอียดงาน';
    if (!data.dueDate) return 'กรุณาเลือกวันที่รับ/ส่ง';
  }
  const total = Number(data.totalAmount) || 0;
  const deposit = Number(data.depositAmount) || 0;
  const paid = Number(data.paidAmount) || 0;
  if (total < 0) return 'ราคาขายต้องมากกว่าหรือเท่ากับ 0';
  if (deposit > total) return 'ยอดมัดจำต้องไม่เกินยอดรวม';
  if (paid > total) return 'ยอดชำระแล้วต้องไม่เกินยอดรวม';
  if (data.pickupMethod === 'delivery' && !data.deliveryAddress?.trim()) return 'กรุณากรอกสถานที่จัดส่ง';
  return '';
}

function updateOrderSummary() {
  const form = document.getElementById('orderForm');
  const values = Object.fromEntries(new FormData(form).entries());
  const totals = calculateOrderFinancials(values);
  document.getElementById('orderSummary').innerHTML = `
    <div><span>ยอดรวม</span><strong>${currency(totals.totalAmount)}</strong></div>
    <div><span>มัดจำ</span><strong>${currency(totals.depositAmount)}</strong></div>
    <div><span>คงเหลือ</span><strong>${currency(totals.balanceAmount)}</strong></div>
    <div><span>กำไรประมาณการ</span><strong>${currency(totals.grossProfit)} (${totals.grossMargin.toFixed(1)}%)</strong></div>
  `;
}

function openWorkOrder(id) {
  const order = state.orders.find(item => item.id === id);
  if (!order) return;
  document.getElementById('workOrderPreview').innerHTML = renderWorkOrder(order);
  document.getElementById('workOrderModal').hidden = false;
}

function printWorkOrder() {
  const html = document.getElementById('workOrderPreview')?.innerHTML || '';
  if (!html.trim()) return showToast('ไม่พบใบงานสำหรับพิมพ์');
  const win = window.open('', '_blank', 'width=900,height=1200');
  if (!win) return showToast('กรุณาอนุญาต popup เพื่อพิมพ์ใบงาน');
  win.document.write(`<!doctype html><html lang="th"><head><meta charset="utf-8"><title>Budsarin Work Order</title><link rel="stylesheet" href="css/styles.css?v=20260719a"><link rel="stylesheet" href="css/orders.css?v=20260719a"><style>body{margin:0;background:#fff;padding:16px}.work-paper{max-width:190mm;margin:auto;background:#fff;border:0;border-radius:0}@page{size:A4;margin:12mm}</style></head><body>${html}<script>window.addEventListener('load',()=>setTimeout(()=>window.print(),250));<\/script></body></html>`);
  win.document.close();
}

function openCostForOrder(id) {
  const order = state.orders.find(item => item.id === id);
  if (!order) return;
  const jobTypeMap = { gift: 'gift_set', delivery: 'custom', other: 'custom' };
  openCostCalculator({
    jobType: jobTypeMap[order.orderType] || order.orderType || 'custom',
    templateName: order.title || order.orderNo,
    sellingPrice: Number(order.totalAmount) || 0,
    targetMargin: Number(order.grossMargin) > 0 ? Math.max(Number(order.grossMargin.toFixed(0)), 35) : 45,
    applyOrderId: id
  });
}

function closeOrderModals() {
  document.getElementById('orderModal').hidden = true;
  document.getElementById('workOrderModal').hidden = true;
  document.getElementById('orderFormError').textContent = '';
}

function ensureOrderModals() {
  if (document.getElementById('orderModal')) return;
  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal-overlay order-overlay" id="orderModal" hidden>
      <section class="modal order-modal" role="dialog" aria-modal="true" aria-labelledby="orderModalTitle">
        <button class="icon-button modal-close" data-close-order-modal aria-label="ปิด" type="button">${renderIcon('x')}</button>
        <p class="eyebrow">Order Form</p><h3 id="orderModalTitle">รับออร์เดอร์ใหม่</h3>
        <form id="orderForm" novalidate>
          <section><h4>ข้อมูลลูกค้า</h4><div class="order-form-grid">
            <label>ชื่อลูกค้า<input name="customerName" required></label>
            <label>เบอร์โทร<input name="customerPhone" required></label>
            <label>LINE/Facebook<input name="customerContact"></label>
            <label>ที่อยู่<input name="customerAddress"></label>
            <label class="check-label"><input name="isNewCustomer" type="checkbox"> ลูกค้าใหม่</label>
          </div></section>
          <section><h4>รายละเอียดออร์เดอร์</h4><div class="order-form-grid">
            <label>ประเภทออร์เดอร์<select name="orderType" required></select></label>
            <label>ชื่อ/รายละเอียดงาน<input name="title" required></label>
            <label>งบประมาณลูกค้า<input name="budget" type="number" min="0"></label>
            <label>ราคาขาย<input name="totalAmount" type="number" min="0" required></label>
            <label>ต้นทุนประมาณการ<input name="estimatedCost" type="number" min="0"></label>
            <label>โทนสี<input name="colorTheme"></label>
            <label>สไตล์ดอกไม้<input name="flowerStyle"></label>
            <label>ข้อความบนการ์ด<input name="cardMessage"></label>
            <label>Reference placeholder<input name="referenceImage" placeholder="reference-placeholder"></label>
            <label class="span-2">หมายเหตุภายใน<textarea name="internalNote" rows="2"></textarea></label>
            <label class="span-2">คำอธิบายงาน<textarea name="description" rows="2"></textarea></label>
          </div></section>
          <section><h4>วันเวลาและการจัดส่ง</h4><div class="order-form-grid">
            <label>วันที่รับ/ส่ง<input name="dueDate" type="date" required></label>
            <label>เวลา<input name="dueTime" type="time" required></label>
            <label>วิธีรับสินค้า<select name="pickupMethod"></select></label>
            <label>ค่าจัดส่ง<input name="deliveryFee" type="number" min="0" value="0"></label>
            <label class="span-2">สถานที่จัดส่ง<input name="deliveryAddress"></label>
            <label>ผู้รับปลายทาง<input name="recipientName"></label>
            <label>เบอร์ผู้รับ<input name="recipientPhone"></label>
          </div></section>
          <section><h4>การชำระเงิน</h4><div class="order-form-grid">
            <label>ยอดมัดจำ<input name="depositAmount" type="number" min="0" value="0"></label>
            <label>ยอดชำระแล้ว<input name="paidAmount" type="number" min="0" value="0"></label>
            <label>วิธีชำระเงิน<select name="paymentMethod"></select></label>
            <label>วันครบกำหนดชำระ<input name="paymentDueDate" type="date"></label>
          </div><div class="order-summary" id="orderSummary"></div></section>
          <p class="form-error" id="orderFormError" role="alert"></p>
          <div class="order-form-actions"><button class="soft-button" id="saveDraftBtn" type="button">${renderIcon('save')}บันทึกแบบร่าง</button><button class="primary-button" id="saveOrderBtn" type="button">${renderIcon('save')}บันทึกออร์เดอร์</button><button class="soft-button" id="savePrintOrderBtn" type="button">${renderIcon('printer')}บันทึกและพิมพ์ใบงาน</button></div>
        </form>
      </section>
    </div>
    <div class="modal-overlay work-order-overlay" id="workOrderModal" hidden>
      <section class="modal work-order-modal" role="dialog" aria-modal="true">
        <button class="icon-button modal-close" data-close-order-modal aria-label="ปิด" type="button">${renderIcon('x')}</button>
        <div id="workOrderPreview"></div>
        <div class="receipt-actions"><button class="soft-button" id="printWorkOrderBtn" type="button">${renderIcon('printer')}พิมพ์ใบงาน</button><button class="primary-button" id="workPreparingBtn" type="button">เปลี่ยนเป็นกำลังจัด</button></div>
      </section>
    </div>
  `);
  document.getElementById('orderForm').addEventListener('input', updateOrderSummary);
  document.getElementById('saveDraftBtn').addEventListener('click', () => submitOrder('draft'));
  document.getElementById('saveOrderBtn').addEventListener('click', () => submitOrder('order'));
  document.getElementById('savePrintOrderBtn').addEventListener('click', () => {
    const order = submitOrder('order');
    if (order) openWorkOrder(order.id);
  });
  document.getElementById('printWorkOrderBtn').addEventListener('click', printWorkOrder);
  document.getElementById('workPreparingBtn').addEventListener('click', () => { if (state.selectedId) { const updated = updateOrderStatus(state.selectedId, 'preparing'); processOrderStockDeduction(updated); state.orders = loadOrders(); renderOrders(); showToast('เปลี่ยนเป็นกำลังจัดแล้ว'); } });
  document.body.addEventListener('click', event => {
    if (event.target.matches('.order-overlay') || event.target.matches('.work-order-overlay') || event.target.closest('[data-close-order-modal]')) closeOrderModals();
  });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeOrderModals(); });
}

function statusMeta(id, map) {
  return map[id] || { label: id || 'ไม่ระบุ', tone: 'info' };
}
