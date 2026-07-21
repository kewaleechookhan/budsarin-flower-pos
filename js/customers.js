import { createFollowUp, getUpcomingFollowUps, markFollowUpDone } from './customer-followups.js?v=20260719b';
import { customerSegments, customerStatuses, customerTypes, dateTypes, followUpStatuses, followUpTypes } from './customers-data.js';
import { addCustomer, calculateCustomerPurchaseSummary, deleteCustomer, editCustomer, getCustomerSnapshot, loadCustomers, loadPurchaseHistory, searchCustomers, syncAllCustomerSources, syncCustomerDashboard } from './customers-service.js?v=20260719b';
import { addImportantDate, generateImportantDateReminder, getUpcomingImportantDates, markReminderDone } from './important-dates.js?v=20260719b';
import { renderMessageTemplate } from './message-templates.js';
import { renderIcon } from './icons.js?v=20260719b';
import { currency, number, showToast, thaiDate } from './utils.js';

const state = { tab: 'overview', query: '', selectedCustomerId: '', snapshot: null };
const tabs = [
  ['overview', 'ภาพรวมลูกค้า'],
  ['list', 'รายชื่อลูกค้า'],
  ['history', 'ประวัติการซื้อ']
];

export function initCustomers() {
  renderCustomersShell();
  syncAllCustomerSources();
  renderCustomers();
  bindCustomerEvents();
}

function renderCustomersShell() {
  document.getElementById('customersView').innerHTML = `
    <section class="customers-header panel">
      <div><p class="eyebrow">Phase 9 CRM</p><h3>ลูกค้า</h3><span>ข้อมูลลูกค้าและประวัติการซื้อ</span></div>
      <div class="customers-header-actions">
        <button class="primary-button" id="newCustomerBtn" type="button">${renderIcon('plus')}เพิ่มลูกค้า</button>
        <button class="soft-button" id="customerExportBtn" type="button">${renderIcon('download')}Export</button>
      </div>
    </section>
    <nav class="customer-tabs panel" role="tablist">${tabs.map(([id, label]) => `<button class="${id === state.tab ? 'active' : ''}" data-customer-tab="${id}" type="button">${label}</button>`).join('')}</nav>
    <section id="customersContent"></section>
  `;
  ensureCustomerModals();
}

function renderCustomers() {
  state.snapshot = getCustomerSnapshot();
  document.querySelectorAll('[data-customer-tab]').forEach(btn => btn.classList.toggle('active', btn.dataset.customerTab === state.tab));
  const views = { overview: renderOverview, list: renderList, dates: renderDates, history: renderHistory, followups: renderFollowups, segments: renderSegments, settings: renderSettings };
  document.getElementById('customersContent').innerHTML = views[state.tab]();
}

function renderOverview() {
  const s = state.snapshot;
  return `
    <section class="customer-kpis">
      ${kpi('ลูกค้าทั้งหมด', s.totalCustomers, 'users', false)}
      ${kpi('ลูกค้าใหม่เดือนนี้', s.newThisMonth, 'plus', false)}
      ${kpi('ลูกค้าประจำ', s.regularCustomers, 'rotate-ccw', false)}
      ${kpi('ลูกค้า VIP', s.vipCustomers.length, 'sparkles', false)}
      ${kpi('ไม่ได้ซื้อซ้ำนาน', s.inactiveCustomers.length, 'pause', false)}
      ${kpi('ยอดซื้อเฉลี่ยต่อคน', s.averageSpend, 'wallet')}
      ${kpi('มูลค่าลูกค้ารวม', s.totalCustomerValue, 'trending-up')}
    </section>
    <section class="customer-grid">
      <article class="panel"><div class="panel-heading"><div><p class="eyebrow">Segments</p><h3>Customer Segment Donut</h3></div></div>${segmentList(s.groups)}</article>
      <article class="panel"><div class="panel-heading"><div><p class="eyebrow">Top Spending</p><h3>Top Customer Spending</h3></div></div>${topCustomers(s.customers)}</article>
    </section>
  `;
}

function renderList() {
  const customers = searchCustomers(state.query, state.snapshot.customers);
  return `
    <section class="customer-toolbar panel"><label class="customer-search">${renderIcon('search')}<input id="customerSearch" type="search" value="${escapeHtml(state.query)}" placeholder="ค้นหาชื่อ เบอร์ LINE Facebook หรือ Email"></label><button class="primary-button" data-open-customer type="button">${renderIcon('plus')}เพิ่มลูกค้า</button></section>
    <section class="customer-card-grid">${customers.map(customerCard).join('') || '<div class="empty-state">ไม่พบลูกค้า</div>'}</section>
  `;
}

function customerCard(customer) {
  return `<article class="customer-card panel">
    <div class="customer-card-head"><div><p class="eyebrow">${customer.customerCode}</p><h3>${escapeHtml(customer.customerName)}</h3><span>${customerTypes[customer.customerType]}</span></div><span class="badge ${customerStatuses[customer.status].tone}">${customerStatuses[customer.status].label}</span></div>
    <div class="customer-meta">
      <div><span>โทร</span><strong>${escapeHtml(customer.phone || '-')}</strong></div>
      <div><span>LINE/Facebook</span><strong>${escapeHtml(customer.lineId || customer.facebook || '-')}</strong></div>
      <div><span>กลุ่ม</span><strong>${customerSegments[customer.customerSegment] || customer.customerSegment}</strong></div>
      <div><span>ยอดซื้อรวม</span><strong>${currency(customer.totalSpent)}</strong></div>
      <div><span>จำนวนออเดอร์</span><strong>${number(customer.totalOrders)}</strong></div>
      <div><span>ซื้อล่าสุด</span><strong>${customer.lastOrderDate ? thaiDate(customer.lastOrderDate) : '-'}</strong></div>
    </div>
    <div class="customer-actions"><button class="soft-button" data-detail-customer="${customer.id}" type="button">รายละเอียด</button><button class="soft-button" data-edit-customer="${customer.id}" type="button">${renderIcon('edit-3')}แก้ไข</button><button class="soft-button danger" data-delete-customer="${customer.id}" type="button">${renderIcon('trash-2')}ลบ</button><button class="primary-button" data-order-customer="${customer.id}" type="button">สร้างออเดอร์</button></div>
  </article>`;
}

function renderDates() {
  return `<section class="customer-grid one-col"><article class="panel"><div class="panel-heading"><div><p class="eyebrow">Important Dates</p><h3>วันสำคัญใน 30 วัน</h3></div><button class="primary-button" data-open-date type="button">${renderIcon('plus')}เพิ่มวันสำคัญ</button></div>${dateList(getUpcomingImportantDates(30), true)}</article></section>`;
}

function renderHistory() {
  return `<section class="customer-grid one-col"><article class="panel"><div class="panel-heading"><div><p class="eyebrow">Purchase History</p><h3>ประวัติการซื้อ</h3></div></div><div class="customer-table">${loadPurchaseHistory().slice(0, 80).map(item => `<div class="customer-table-row"><div><strong>${escapeHtml(item.customerName)}</strong><span>${thaiDate(item.date)} • ${escapeHtml(item.description)}</span></div><span>${item.sourceType}</span><span>${escapeHtml(item.category)}</span><b>${currency(item.amount)}</b></div>`).join('')}</div></article></section>`;
}

function renderFollowups() {
  const rows = getUpcomingFollowUps(30).concat(state.snapshot.overdueFollowUps);
  return `<section class="customer-grid one-col"><article class="panel"><div class="panel-heading"><div><p class="eyebrow">Follow-up</p><h3>รายการติดตามลูกค้า</h3></div><button class="primary-button" data-open-follow type="button">${renderIcon('plus')}เพิ่ม Follow-up</button></div>${followupList(rows, true)}</article></section>`;
}

function renderSegments() {
  return `<section class="customer-grid">${Object.entries(state.snapshot.groups).map(([segment, customers]) => `<article class="panel segment-card"><div class="panel-heading"><div><p class="eyebrow">${segment}</p><h3>${customerSegments[segment] || segment}</h3></div><span class="badge info">${customers.length} คน</span></div><div class="customer-metrics"><div><span>ยอดขายรวม</span><strong>${currency(customers.reduce((sum, c) => sum + Number(c.totalSpent || 0), 0))}</strong></div><div><span>เฉลี่ยต่อคน</span><strong>${currency(customers.reduce((sum, c) => sum + Number(c.totalSpent || 0), 0) / customers.length)}</strong></div></div><div class="mini-list">${customers.slice(0, 6).map(c => `<button class="list-row" data-follow-customer="${c.id}" type="button"><div><strong>${c.customerName}</strong><span>${currency(c.totalSpent)} • ${c.totalOrders} orders</span></div></button>`).join('')}</div><button class="soft-button js-segment-export" type="button">Export กลุ่ม</button></article>`).join('')}</section>`;
}

function renderSettings() {
  return `<section class="panel"><div class="panel-heading"><div><p class="eyebrow">CRM Settings</p><h3>ข้อความแนะนำ</h3></div></div><div class="message-template-grid">${['birthday_offer','anniversary_offer','after_sale','inactive_customer'].map(type => `<article><strong>${followUpTypes[type]}</strong><p>${escapeHtml(renderMessageTemplate(type, { customerName: 'ลูกค้า' }))}</p><button class="soft-button" data-copy-template="${type}" type="button">Copy Message</button></article>`).join('')}</div></section>`;
}

function bindCustomerEvents() {
  document.getElementById('customersView').addEventListener('click', event => {
    const tab = event.target.closest('[data-customer-tab]')?.dataset.customerTab;
    const detail = event.target.closest('[data-detail-customer]')?.dataset.detailCustomer;
    const edit = event.target.closest('[data-edit-customer]')?.dataset.editCustomer;
    const remove = event.target.closest('[data-delete-customer]')?.dataset.deleteCustomer;
    const followCustomer = event.target.closest('[data-follow-customer]')?.dataset.followCustomer;
    const doneFollow = event.target.closest('[data-done-follow]')?.dataset.doneFollow;
    const reminder = event.target.closest('[data-reminder-date]')?.dataset.reminderDate;
    const copy = event.target.closest('[data-copy-template]')?.dataset.copyTemplate;
    if (tab) { state.tab = tab; renderCustomers(); }
    if (event.target.closest('[data-open-customer]') || event.target.id === 'newCustomerBtn') openCustomerModal();
    if (event.target.closest('[data-open-follow]')) openFollowModal(followCustomer || state.selectedCustomerId);
    if (event.target.closest('[data-open-date]')) openDateModal();
    if (detail) openCustomerDetail(detail);
    if (edit) openCustomerModal(edit);
    if (remove) removeCustomer(remove);
    if (followCustomer) openFollowModal(followCustomer);
    const orderCustomer = event.target.closest('[data-order-customer]')?.dataset.orderCustomer;
    if (orderCustomer) createOrderFromCustomer(orderCustomer);
    if (doneFollow) { markFollowUpDone(doneFollow); showToast('ปิด Follow-up แล้ว'); renderCustomers(); }
    if (reminder) { markReminderDone(reminder); showToast('บันทึกว่าส่ง Reminder แล้ว'); renderCustomers(); }
    if (copy) copyMessage(copy);
    if (event.target.id === 'customerExportBtn' || event.target.closest('.js-segment-export')) exportCustomersCSV();
  });
  document.getElementById('customersView').addEventListener('input', event => {
    if (event.target.id === 'customerSearch') { state.query = event.target.value; renderCustomers(); }
  });
}

function ensureCustomerModals() {
  if (document.getElementById('customerModal')) return;
  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal-overlay" id="customerModal" hidden><section class="modal customer-modal"><button class="icon-button modal-close" data-close-customer-modal type="button">${renderIcon('x')}</button><p class="eyebrow">Customer</p><h3 id="customerModalTitle">เพิ่มลูกค้า</h3><form id="customerForm"><input name="id" type="hidden"><label>ชื่อลูกค้า<input name="customerName" required></label><label>โทร<input name="phone"></label><label>LINE<input name="lineId"></label><label>Facebook<input name="facebook"></label><label>Email<input name="email"></label><label>ประเภท<select name="customerType">${Object.entries(customerTypes).map(([id, label]) => `<option value="${id}">${label}</option>`).join('')}</select></label><label>จังหวัด<input name="province"></label><label>วันเกิด<input name="birthday" type="date"></label><label>วันครบรอบ<input name="anniversaryDate" type="date"></label><label>งบเฉลี่ย<input name="averageBudget" type="number" min="0"></label><label>สไตล์ที่ชอบ<input name="preferredFlowerStyle"></label><label>โทนสีที่ชอบ<input name="preferredColorTheme"></label><label class="span-2">หมายเหตุ<textarea name="note" rows="2"></textarea></label><p class="form-error" id="customerFormError"></p><button class="primary-button" type="submit">${renderIcon('save')}บันทึก</button></form></section></div>
    <div class="modal-overlay" id="followModal" hidden><section class="modal customer-modal"><button class="icon-button modal-close" data-close-customer-modal type="button">${renderIcon('x')}</button><p class="eyebrow">Follow-up</p><h3>เพิ่ม Follow-up</h3><form id="followForm"><label>ลูกค้า<select name="customerId"></select></label><label>ประเภท<select name="followUpType">${Object.entries(followUpTypes).map(([id, label]) => `<option value="${id}">${label}</option>`).join('')}</select></label><label>หัวข้อ<input name="title" required value="ติดตามลูกค้า"></label><label>วันครบกำหนด<input name="dueDate" type="date" required></label><label>Priority<select name="priority"><option value="normal">ปกติ</option><option value="high">สูง</option><option value="low">ต่ำ</option></select></label><label class="span-2">รายละเอียด<textarea name="description" rows="2"></textarea></label><button class="primary-button" type="submit">${renderIcon('save')}บันทึก</button></form></section></div>
    <div class="modal-overlay" id="dateModal" hidden><section class="modal customer-modal"><button class="icon-button modal-close" data-close-customer-modal type="button">${renderIcon('x')}</button><p class="eyebrow">Important Date</p><h3>เพิ่มวันสำคัญ</h3><form id="dateForm"><label>ลูกค้า<select name="customerId"></select></label><label>ประเภท<select name="dateType">${Object.entries(dateTypes).map(([id, label]) => `<option value="${id}">${label}</option>`).join('')}</select></label><label>วันที่<input name="date" type="date" required></label><label>หัวข้อ<input name="title" required value="วันสำคัญ"></label><label>เตือนล่วงหน้า<input name="reminderDaysBefore" type="number" min="0" value="7"></label><label class="span-2">รายละเอียด<textarea name="description" rows="2"></textarea></label><button class="primary-button" type="submit">${renderIcon('save')}บันทึก</button></form></section></div>
    <div class="modal-overlay" id="customerDetailModal" hidden><section class="modal customer-detail-modal"><button class="icon-button modal-close" data-close-customer-modal type="button">${renderIcon('x')}</button><div id="customerDetailBody"></div></section></div>
  `);
  document.body.addEventListener('click', event => {
    if (event.target.matches('#customerModal') || event.target.matches('#followModal') || event.target.matches('#dateModal') || event.target.matches('#customerDetailModal') || event.target.closest('[data-close-customer-modal]')) closeCustomerModals();
  });
  document.getElementById('customerForm').addEventListener('submit', submitCustomer);
  document.getElementById('followForm').addEventListener('submit', submitFollow);
  document.getElementById('dateForm').addEventListener('submit', submitDate);
}

function openCustomerModal(id = '') {
  const form = document.getElementById('customerForm');
  form.reset();
  form.elements.id.value = '';
  document.getElementById('customerModalTitle').textContent = 'เพิ่มลูกค้า';
  if (id) {
    const customer = loadCustomers().find(item => item.id === id);
    if (!customer) return showToast('ไม่พบข้อมูลลูกค้า');
    document.getElementById('customerModalTitle').textContent = 'แก้ไขลูกค้า';
    Object.entries(customer).forEach(([key, value]) => {
      if (form.elements[key]) form.elements[key].value = value ?? '';
    });
  }
  document.getElementById('customerModal').hidden = false;
}

function openFollowModal(customerId = '') {
  fillCustomerSelect('#followForm select[name="customerId"]', customerId);
  document.querySelector('#followForm input[name="dueDate"]').value = new Date().toISOString().slice(0, 10);
  document.getElementById('followModal').hidden = false;
}

function openDateModal() {
  fillCustomerSelect('#dateForm select[name="customerId"]');
  document.querySelector('#dateForm input[name="date"]').value = new Date().toISOString().slice(0, 10);
  document.getElementById('dateModal').hidden = false;
}

function openCustomerDetail(id) {
  const customer = loadCustomers().find(item => item.id === id);
  if (!customer) return;
  const summary = calculateCustomerPurchaseSummary(id);
  const history = loadPurchaseHistory().filter(item => item.customerId === id).slice(0, 8);
  document.getElementById('customerDetailBody').innerHTML = `<p class="eyebrow">${customer.customerCode}</p><h3>${customer.customerName}</h3><div class="customer-meta detail">${Object.entries({ โทร: customer.phone || '-', LINE: customer.lineId || '-', Email: customer.email || '-', ประเภท: customerTypes[customer.customerType], กลุ่ม: customerSegments[customer.customerSegment], วันเกิด: customer.birthday ? thaiDate(customer.birthday) : '-', วันครบรอบ: customer.anniversaryDate ? thaiDate(customer.anniversaryDate) : '-', สไตล์: customer.preferredFlowerStyle || '-', โทนสี: customer.preferredColorTheme || '-', ยอดรวม: currency(summary.totalSpent), ออเดอร์: summary.totalOrders, เฉลี่ย: currency(summary.averageOrderValue) }).map(([k, v]) => `<div><span>${k}</span><strong>${v}</strong></div>`).join('')}</div><h4>ประวัติการซื้อ</h4><div class="customer-table">${history.map(item => `<div class="customer-table-row"><div><strong>${item.description}</strong><span>${thaiDate(item.date)}</span></div><b>${currency(item.amount)}</b></div>`).join('') || '<div class="empty-state">ยังไม่มีประวัติ</div>'}</div><div class="customer-actions"><button class="soft-button" data-edit-customer="${customer.id}" type="button">${renderIcon('edit-3')}แก้ไข</button><button class="soft-button danger" data-delete-customer="${customer.id}" type="button">${renderIcon('trash-2')}ลบ</button><button class="soft-button" data-copy-template="after_sale" type="button">Copy Message</button></div>`;
  document.getElementById('customerDetailModal').hidden = false;
}

function submitCustomer(event) {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.currentTarget).entries());
  if (!data.customerName.trim()) return document.getElementById('customerFormError').textContent = 'กรุณากรอกชื่อลูกค้า';
  const id = data.id;
  delete data.id;
  if (id) editCustomer(id, data);
  else addCustomer(data);
  closeCustomerModals();
  showToast(id ? 'แก้ไขลูกค้าแล้ว' : 'บันทึกลูกค้าแล้ว');
  renderCustomers();
}

function removeCustomer(id) {
  const customer = loadCustomers().find(item => item.id === id);
  if (!customer) return showToast('ไม่พบข้อมูลลูกค้า');
  if (!confirm(`ลบลูกค้า "${customer.customerName}" พร้อมประวัติที่เกี่ยวข้องหรือไม่?`)) return;
  deleteCustomer(id);
  closeCustomerModals();
  showToast('ลบลูกค้าแล้ว');
  renderCustomers();
}

function submitFollow(event) {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.currentTarget).entries());
  const customer = loadCustomers().find(item => item.id === data.customerId);
  createFollowUp({ ...data, customerName: customer?.customerName || '' });
  closeCustomerModals();
  showToast('บันทึก Follow-up แล้ว');
  renderCustomers();
}

function submitDate(event) {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.currentTarget).entries());
  const customer = loadCustomers().find(item => item.id === data.customerId);
  addImportantDate({ ...data, customerName: customer?.customerName || '' });
  closeCustomerModals();
  showToast('บันทึกวันสำคัญแล้ว');
  renderCustomers();
}

function dateList(items, actions = false) {
  return `<div class="customer-table">${items.map(item => `<div class="customer-table-row"><div><strong>${item.customerName}</strong><span>${dateTypes[item.dateType]} • ${thaiDate(item.date)} • อีก ${item.daysUntil ?? ''} วัน</span><small>${generateImportantDateReminder(item)}</small></div>${actions ? `<button class="soft-button" data-reminder-date="${item.id}" type="button">Reminder Done</button>` : ''}<button class="soft-button" data-copy-template="${item.dateType === 'birthday' ? 'birthday_offer' : 'anniversary_offer'}" type="button">Copy Message</button></div>`).join('') || '<div class="empty-state">ยังไม่มีวันสำคัญใกล้ถึง</div>'}</div>`;
}

function followupList(items, actions = false) {
  return `<div class="customer-table">${items.map(item => `<div class="customer-table-row"><div><strong>${item.customerName}</strong><span>${followUpTypes[item.followUpType]} • ${thaiDate(item.dueDate)} • ${item.priority}</span><small>${item.title}</small></div><span class="badge ${followUpStatuses[item.status]?.tone || 'warning'}">${followUpStatuses[item.status]?.label || item.status}</span>${actions ? `<button class="soft-button" data-done-follow="${item.id}" type="button">Done</button>` : ''}<button class="soft-button" data-copy-template="${item.followUpType}" type="button">Copy Message</button></div>`).join('') || '<div class="empty-state">ไม่มี Follow-up</div>'}</div>`;
}

function fillCustomerSelect(selector, selected = '') {
  const select = document.querySelector(selector);
  select.innerHTML = loadCustomers().map(item => `<option value="${item.id}">${item.customerName}</option>`).join('');
  if (selected) select.value = selected;
}

function closeCustomerModals() {
  ['customerModal', 'followModal', 'dateModal', 'customerDetailModal'].forEach(id => document.getElementById(id).hidden = true);
  document.getElementById('customerFormError').textContent = '';
}

async function copyMessage(type) {
  const customerId = state.selectedCustomerId || loadCustomers()[0]?.id;
  const customer = loadCustomers().find(item => item.id === customerId) || loadCustomers()[0] || { customerName: 'ลูกค้า' };
  const message = renderMessageTemplate(type, customer);
  try {
    await navigator.clipboard.writeText(message);
    showToast('คัดลอกข้อความแล้ว');
  } catch {
    showToast(message);
  }
}

async function createOrderFromCustomer(id) {
  const customer = loadCustomers().find(item => item.id === id);
  if (!customer) return showToast('ไม่พบข้อมูลลูกค้า');
  window.dispatchEvent(new CustomEvent('route:open', { detail: 'orders' }));
  try {
    const orders = await import('./orders.js?v=20260717a');
    orders.openOrderFormFromCustomer?.(customer);
    closeCustomerModals();
    showToast('เปิดฟอร์มออร์เดอร์พร้อมข้อมูลลูกค้าแล้ว');
  } catch {
    showToast('เปิดหน้าออร์เดอร์แล้ว กรุณากรอกข้อมูลต่อ');
  }
}

function exportCustomersCSV() {
  const rows = loadCustomers().map(item => ({
    code: item.customerCode,
    name: item.customerName,
    phone: item.phone,
    line: item.lineId,
    facebook: item.facebook,
    email: item.email,
    type: customerTypes[item.customerType] || item.customerType,
    segment: customerSegments[item.customerSegment] || item.customerSegment,
    totalSpent: item.totalSpent,
    totalOrders: item.totalOrders,
    lastOrderDate: item.lastOrderDate || ''
  }));
  downloadCSV(`budsarin-customers-${new Date().toISOString().slice(0, 10)}.csv`, rows);
  showToast('ดาวน์โหลดไฟล์ลูกค้า CSV แล้ว');
}

function kpi(label, value, icon, money = true) {
  return `<article class="customer-kpi"><span>${renderIcon(icon)}</span><small>${label}</small><strong>${money && typeof value === 'number' ? currency(value) : value}</strong></article>`;
}

function segmentList(groups) {
  return `<div class="segment-list">${Object.entries(groups).map(([segment, customers]) => `<div><span>${customerSegments[segment] || segment}</span><strong>${customers.length} คน</strong><small>${currency(customers.reduce((sum, c) => sum + Number(c.totalSpent || 0), 0))}</small></div>`).join('')}</div>`;
}

function topCustomers(customers) {
  return `<div class="mini-list">${customers.slice().sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 8).map(c => `<button class="list-row" data-detail-customer="${c.id}" type="button"><div><strong>${c.customerName}</strong><span>${customerSegments[c.customerSegment]} • ${c.totalOrders} orders</span></div><b>${currency(c.totalSpent)}</b></button>`).join('')}</div>`;
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[char]);
}

function downloadCSV(filename, rows) {
  if (!rows.length) return showToast('ยังไม่มีข้อมูลสำหรับ Export');
  const headers = Object.keys(rows[0]);
  const csv = [headers.join(','), ...rows.map(row => headers.map(header => csvCell(row[header])).join(','))].join('\n');
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function csvCell(value = '') {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}
