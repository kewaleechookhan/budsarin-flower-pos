import { MENU_ITEMS, QUICK_ADD_ITEMS, STATUS } from './constants.js';
import { renderIcon, hydrateIcons } from './icons.js';
import { currency, daysLeftThisMonth, number, showToast, thaiDate } from './utils.js';
import { getBreakEvenProgress } from './calculations.js';
import { loadState, saveState } from './storage.js';
import { loadStoreProfile } from './settings-service.js';
import { getDashboardSchedule } from './calendar-service.js';

export function initDashboard(state) {
  const ui = { state, route: 'dashboard', chartPeriod: 'week', scheduleFilter: 'all' };
  renderShell(ui);
  applyStoreProfileToShell();
  renderDashboard(ui);
  bindInteractions(ui);
  window.addEventListener('settings:store-updated', applyStoreProfileToShell);
  window.addEventListener('dashboard:update', event => {
    ui.state = event.detail || loadState(ui.state);
    renderDashboard(ui);
  });
  hydrateIcons();
}

function renderShell(ui) {
  document.getElementById('dateText').textContent = thaiDate();
  document.getElementById('mainNav').innerHTML = MENU_ITEMS.map(([id, th, en, icon]) => navButton(id, th, en, icon)).join('');
  document.getElementById('mobileNav').innerHTML = MENU_ITEMS.map(([id, th, , icon]) => `<button data-route="${id}" type="button">${renderIcon(icon)}<span>${th}</span></button>`).join('');
  document.getElementById('quickAddMenu').innerHTML = QUICK_ADD_ITEMS.map(([id, label]) => `<button type="button" role="menuitem" data-action="${id}">${label}</button>`).join('');
  const select = document.querySelector('#quickForm select[name="type"]');
  select.innerHTML = QUICK_ADD_ITEMS.map(([id, label]) => `<option value="${id}">${label}</option>`).join('');
  document.getElementById('scheduleFilter').innerHTML = '<option value="all">ทุกสถานะ</option>' + Object.entries(STATUS).map(([id, s]) => `<option value="${id}">${s.label}</option>`).join('');
}

function navButton(id, th, en, icon) {
  return `<button class="nav-item ${id === 'dashboard' ? 'active' : ''}" data-route="${id}" type="button">${renderIcon(icon)}<span><strong>${th}</strong><small>${en}</small></span></button>`;
}

function renderDashboard(ui) {
  renderKpis(ui.state.kpis);
  renderBreakEven(ui.state.breakEven);
  renderChart(ui);
  renderSchedule(ui, getDashboardSchedule(ui.state.schedule));
  renderOrderStatus(ui.state.orderStatus);
  renderStock(ui.state.stockAlerts);
  renderEvents(ui.state.events);
  renderFinance(ui.state.finance);
  renderLowProfit(ui.state.lowProfitOrders || []);
}

function renderKpis(kpis) {
  document.getElementById('kpiGrid').innerHTML = kpis.map(item => {
    const value = item.type === 'money' ? currency(item.value) : `${number(item.value)} ${item.suffix || ''}`.trim();
    return `<button class="kpi-card" type="button" data-route="${kpiRoute(item.id)}" data-kpi="${item.id}">
      <span class="kpi-icon">${renderIcon(item.icon)}</span>
      <span class="kpi-label">${item.label}</span>
      <strong>${value}</strong>
      <small class="trend ${item.trend}">${item.compare}</small>
    </button>`;
  }).join('');
}

function renderBreakEven(data) {
  const percentEl = document.getElementById('breakEvenPercent');
  const ringEl = document.getElementById('breakEvenRing');
  const metricsEl = document.getElementById('breakEvenMetrics');
  if (!percentEl || !ringEl || !metricsEl) return;
  const progress = getBreakEvenProgress(data.currentSales, data.targetSales, daysLeftThisMonth());
  percentEl.textContent = `${progress.percent}%`;
  ringEl.style.setProperty('--angle', `${progress.percent * 3.6}deg`);
  metricsEl.innerHTML = [
    ['ยอดขายปัจจุบัน', currency(data.currentSales)],
    ['ยอดขายเป้าหมาย', currency(data.targetSales)],
    ['ยอดขายที่ยังขาด', currency(progress.remaining)],
    ['วันที่เหลือในเดือน', `${daysLeftThisMonth()} วัน`],
    ['ต้องทำเพิ่มเฉลี่ยต่อวัน', currency(progress.requiredDailySales)]
  ].map(([label, value]) => `<div><span>${label}</span><strong>${value}</strong></div>`).join('');
}

function renderChart(ui) {
  const values = ui.state.salesChart[ui.chartPeriod];
  const max = Math.max(...values, 1);
  document.getElementById('salesChart').innerHTML = values.map((value, index) => `
    <button class="bar-item" type="button" title="${currency(value)}">
      <span style="height:${Math.max((value / max) * 100, 12)}%"></span>
      <small>${ui.chartPeriod === 'week' ? ['จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส', 'อา'][index] : `W${index + 1}`}</small>
    </button>`).join('');
}

function renderSchedule(ui, sourceRows = ui.state.schedule) {
  const rows = sourceRows.filter(item => ui.scheduleFilter === 'all' || item.status === ui.scheduleFilter);
  document.getElementById('scheduleList').innerHTML = rows.map(item => `
    <div class="timeline-item">
      <time>${item.time}</time>
      <div><strong>${item.type}</strong><span>${item.customer} • ${item.note}</span></div>
      <span class="badge ${STATUS[item.status].tone}">${STATUS[item.status].label}</span>
      <button class="icon-button js-status" data-id="${item.id}" type="button" aria-label="เปลี่ยนสถานะ" title="เปลี่ยนสถานะ">${renderIcon('settings')}</button>
      <button class="soft-button" data-route="calendar" type="button">รายละเอียด</button>
    </div>`).join('') || '<p class="empty">ไม่พบงานตามตัวกรองนี้</p>';
}

function renderOrderStatus(items) {
  document.getElementById('orderStatus').innerHTML = items.map(([id, count]) => `<button class="status-card" data-route="orders" type="button"><span class="badge ${STATUS[id].tone}">${STATUS[id].label}</span><strong>${count}</strong><small>ออร์เดอร์</small></button>`).join('');
}

function renderStock(items) {
  document.getElementById('stockList').innerHTML = items.map(item => `<button class="list-row" data-route="inventory" type="button"><div><strong>${item.name}</strong><span>${item.detail}</span></div><b class="${item.level}">${item.qty}</b></button>`).join('');
}

function renderEvents(items) {
  document.getElementById('eventList').innerHTML = items.map(item => {
    const remain = item.value - item.deposit;
    return `<button class="event-card" data-route="events" type="button"><div><strong>${item.name}</strong><span>${item.customer} • ${thaiDate(item.date)}</span><small>${item.place}</small></div><div><b>${currency(item.value)}</b><small>คงเหลือ ${currency(remain)}</small><div class="bar"><span style="width:${item.progress}%"></span></div><em>${item.status}</em></div></button>`;
  }).join('');
}

function renderFinance(data) {
  const rows = [
    ['รายรับเดือนนี้', data.revenue], ['รายจ่ายเดือนนี้', data.expenses], ['กำไรขั้นต้น', data.grossProfit],
    ['กำไรสุทธิประมาณการ', data.netProfit], ['ลูกหนี้', data.receivable], ['เจ้าหนี้', data.payable], ['Cash Balance', data.cashBalance]
  ];
  document.getElementById('financeList').innerHTML = rows.map(([label, value]) => `<div class="finance-row"><span>${label}</span><strong>${currency(value)}</strong></div>`).join('');
}

function renderLowProfit(items) {
  const el = document.getElementById('lowProfitList');
  if (!el) return;
  el.innerHTML = items.length ? items.slice(0, 4).map(item => `
    <button class="list-row" data-route="cost" type="button">
      <div><strong>${item.orderNo || item.title}</strong><span>${item.title || item.customerName || 'Cost review'}</span></div>
      <b class="${Number(item.grossMargin) < 25 ? 'danger' : 'warning'}">${number(Number(item.grossMargin || 0).toFixed(1))}%</b>
    </button>
  `).join('') : '<div class="empty-state">ยังไม่มีออร์เดอร์กำไรต่ำ</div>';
}

function bindInteractions(ui) {
  document.getElementById('sidebarToggle').addEventListener('click', () => document.getElementById('appShell').classList.toggle('collapsed'));
  document.querySelectorAll('#mainNav [data-route], #mobileNav [data-route]').forEach(btn => btn.addEventListener('click', () => setRoute(ui, btn.dataset.route)));
  window.addEventListener('route:open', event => setRoute(ui, event.detail));
  document.querySelector('.js-back-dashboard').addEventListener('click', () => setRoute(ui, 'dashboard'));
  document.getElementById('quickAddBtn').addEventListener('click', toggleQuickAdd);
  document.getElementById('quickAddMenu').addEventListener('click', event => {
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (action) openModal(action);
  });
  document.getElementById('notificationBtn').addEventListener('click', () => toggleNotifications(ui));
  document.querySelectorAll('.segmented button').forEach(btn => btn.addEventListener('click', () => {
    ui.chartPeriod = btn.dataset.period;
    document.querySelectorAll('.segmented button').forEach(b => b.classList.toggle('active', b === btn));
    renderChart(ui);
  }));
  document.getElementById('scheduleFilter').addEventListener('change', event => {
    ui.scheduleFilter = event.target.value;
    renderSchedule(ui, getDashboardSchedule(ui.state.schedule));
  });
  document.getElementById('scheduleList').addEventListener('click', event => {
    const id = Number(event.target.closest('.js-status')?.dataset.id);
    if (!id) return;
    cycleStatus(ui, id);
  });
  document.body.addEventListener('click', event => {
    const route = event.target.closest('.main [data-route], #notificationPanel [data-route]')?.dataset.route;
    if (route) return setRoute(ui, route);
  });
  document.getElementById('globalSearch').addEventListener('input', event => search(ui, event.target.value));
  bindModal(ui);
  document.addEventListener('click', closeFloating);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      closeModal();
      closeFloating();
    }
  });
}

function setRoute(ui, route) {
  ui.route = route;
  document.querySelectorAll('[data-route]').forEach(btn => btn.classList.toggle('active', btn.dataset.route === route));
  document.getElementById('dashboardView').hidden = route !== 'dashboard';
  document.getElementById('posView').hidden = route !== 'pos';
  document.getElementById('ordersView').hidden = route !== 'orders';
  document.getElementById('eventsView').hidden = route !== 'events';
  document.getElementById('productsView').hidden = route !== 'products';
  document.getElementById('costView').hidden = route !== 'cost';
  document.getElementById('inventoryView').hidden = route !== 'inventory';
  document.getElementById('financeView').hidden = route !== 'finance';
  document.getElementById('suppliersView').hidden = route !== 'suppliers';
  document.getElementById('customersView').hidden = route !== 'customers';
  document.getElementById('reportsView').hidden = route !== 'reports';
  document.getElementById('settingsView').hidden = route !== 'settings';
  document.getElementById('calendarView').hidden = route !== 'calendar';
  document.getElementById('placeholderPage').hidden = route === 'dashboard' || route === 'pos' || route === 'orders' || route === 'events' || route === 'products' || route === 'cost' || route === 'inventory' || route === 'finance' || route === 'suppliers' || route === 'customers' || route === 'reports' || route === 'settings' || route === 'calendar';
  if (route === 'pos') {
    showToast('เปิดหน้าขายหน้าร้าน POS');
  } else if (route === 'orders') {
    showToast('เปิดหน้าออร์เดอร์ลูกค้า');
  } else if (route === 'events') {
    showToast('เปิดหน้างานจัดสถานที่');
  } else if (route === 'products') {
    showToast('เปิดหน้าสินค้าและบริการ');
  } else if (route === 'cost') {
    showToast('เปิดหน้าคำนวณต้นทุน');
  } else if (route === 'inventory') {
    showToast('เปิดหน้าสต็อกดอกไม้');
  } else if (route === 'finance') {
    showToast('เปิดหน้ารายรับรายจ่าย');
  } else if (route === 'suppliers') {
    showToast('เปิดหน้าซัพพลายเออร์');
  } else if (route === 'customers') {
    showToast('เปิดหน้า CRM ลูกค้า');
  } else if (route === 'reports') {
    showToast('เปิดหน้ารายงานผู้บริหาร');
  } else if (route === 'settings') {
    showToast('เปิดหน้าตั้งค่าร้าน');
  } else if (route === 'calendar') {
    showToast('เปิดหน้าปฏิทินงานรวม');
  } else if (route !== 'dashboard') {
    const item = MENU_ITEMS.find(row => row[0] === route);
    document.getElementById('placeholderTitle').textContent = item[1];
    document.getElementById('placeholderSubtitle').textContent = item[2];
    showToast(`${item[1]} พร้อมพัฒนาต่อใน Phase ถัดไป`);
  }
}

function applyStoreProfileToShell() {
  const profile = loadStoreProfile();
  const brandTitle = document.querySelector('.brand-copy h1');
  const brandSub = document.querySelector('.brand-copy p');
  const brandMark = document.querySelector('.brand-mark');
  const profileName = document.querySelector('.profile strong');
  const profileMark = document.querySelector('.profile span');
  if (brandTitle) brandTitle.textContent = profile.storeNameEn || 'Budsarin Flower';
  if (brandSub) brandSub.textContent = profile.businessName || 'POS & Studio Manager';
  if (brandMark) {
    brandMark.innerHTML = profile.logoDataUrl
      ? `<img src="${profile.logoDataUrl}" alt="${profile.storeNameTh || 'Store logo'}">`
      : '<svg viewBox="0 0 64 64" role="img"><path d="M32 9c5 10 15 9 18 18-8 0-10 8-18 8s-10-8-18-8c3-9 13-8 18-18Z"/><path d="M32 35c6 0 11 5 11 11S38 57 32 57 21 52 21 46s5-11 11-11Z"/></svg>';
  }
  if (profileName) profileName.textContent = profile.ownerName || profile.storeNameTh;
  if (profileMark) profileMark.innerHTML = profile.logoDataUrl ? `<img src="${profile.logoDataUrl}" alt="">` : (profile.logoPlaceholder || profile.storeNameTh || 'บ').slice(0, 1);
}

function cycleStatus(ui, id) {
  const keys = Object.keys(STATUS);
  const item = ui.state.schedule.find(row => row.id === id);
  item.status = keys[(keys.indexOf(item.status) + 1) % keys.length];
  saveState(ui.state);
  renderSchedule(ui, getDashboardSchedule(ui.state.schedule));
  showToast(`อัปเดตสถานะเป็น ${STATUS[item.status].label}`);
}

function search(ui, query) {
  const text = query.trim().toLowerCase();
  document.querySelectorAll('.timeline-item, .event-card, .list-row').forEach(row => {
    row.hidden = text && !row.textContent.toLowerCase().includes(text);
  });
}

function toggleQuickAdd(event) {
  event.stopPropagation();
  const menu = document.getElementById('quickAddMenu');
  const btn = document.getElementById('quickAddBtn');
  menu.classList.toggle('open');
  btn.setAttribute('aria-expanded', menu.classList.contains('open'));
}

function toggleNotifications(ui) {
  const panel = document.getElementById('notificationPanel');
  panel.hidden = !panel.hidden;
  panel.innerHTML = `<h3>แจ้งเตือน</h3>${ui.state.notifications.map(note => `<button class="list-row" data-route="${notificationRoute(note)}" type="button"><div><strong>${note}</strong><span>วันนี้</span></div></button>`).join('')}`;
}

function kpiRoute(id) {
  const map = { sales: 'pos', orders: 'orders', profit: 'reports', deliveries: 'calendar', receivable: 'finance', waste: 'inventory' };
  return map[id] || 'reports';
}

function notificationRoute(note = '') {
  if (note.includes('สต็อก') || note.includes('ยิปโซ')) return 'inventory';
  if (note.includes('Wedding') || note.includes('Event')) return 'events';
  if (note.includes('ออร์เดอร์')) return 'orders';
  return 'calendar';
}

function closeFloating(event) {
  if (event?.target.closest('.dropdown-root') || event?.target.closest('#notificationPanel') || event?.target.closest('#notificationBtn')) return;
  document.getElementById('quickAddMenu').classList.remove('open');
  document.getElementById('quickAddBtn').setAttribute('aria-expanded', 'false');
  document.getElementById('notificationPanel').hidden = true;
}

function openModal(action) {
  document.querySelector('#quickForm select[name="type"]').value = action;
  document.getElementById('modalOverlay').hidden = false;
  document.querySelector('#quickForm input[name="customer"]').focus();
  closeFloating();
}

function closeModal() {
  document.getElementById('modalOverlay').hidden = true;
  document.getElementById('formError').textContent = '';
}

function bindModal(ui) {
  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.getElementById('modalOverlay').addEventListener('click', event => {
    if (event.target.id === 'modalOverlay') closeModal();
  });
  document.getElementById('quickForm').addEventListener('submit', event => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.checkValidity()) {
      document.getElementById('formError').textContent = 'กรุณากรอกประเภทงาน ชื่อลูกค้า มูลค่า และวันที่ส่งมอบให้ครบถ้วน';
      return;
    }
    const data = Object.fromEntries(new FormData(form).entries());
    ui.state.userAdds.push({ ...data, id: Date.now() });
    saveState(ui.state);
    form.reset();
    closeModal();
    showToast('บันทึกรายการใหม่เรียบร้อยแล้ว');
  });
}
