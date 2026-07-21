import { calendarStatuses, calendarTabs, eventTypes, priorities, sourceTypes } from './calendar-data.js';
import { filterCalendarEvents, getCalendarAlerts, getCalendarKpis, getMonthMatrix, getQuickFilteredEvents, getTodayEvents, getWeekEvents, loadCalendarEvents, loadCalendarSettings, rescheduleCalendarEvent, saveCalendarSettings, todayKey, updateCalendarEventStatus } from './calendar-service.js?v=20260719b';
import { syncAllCalendarEvents } from './calendar-sync.js?v=20260719b';
import { createManualTask, deleteManualTask, loadManualTasks } from './manual-tasks.js';
import { dismissReminder, generateRemindersFromCalendarEvents, getDueReminders, loadReminders, markReminderDone, snoozeReminder } from './reminders.js';
import { completeWorkQueueItem, getDailyWorkQueue, saveQueueNote } from './work-queue.js';
import { renderIcon } from './icons.js';
import { currency, number, showToast, thaiDate } from './utils.js';

const state = {
  tab: 'today',
  date: todayKey(),
  weekAnchor: new Date(),
  monthAnchor: new Date(),
  filters: { sourceType: 'all', eventType: 'all', status: 'all', priority: 'all', customer: '', location: '' },
  events: []
};

export function initCalendar() {
  syncAllCalendarEvents();
  generateRemindersFromCalendarEvents();
  state.events = loadCalendarEvents();
  renderCalendarShell();
  renderCalendar();
  bindCalendarEvents();
  window.addEventListener('calendar:refresh', () => {
    syncAllCalendarEvents();
    generateRemindersFromCalendarEvents();
    renderCalendar();
  });
}

function renderCalendarShell() {
  document.getElementById('calendarView').innerHTML = `
    <section class="calendar-header panel">
      <div><p class="eyebrow">Phase 12 Scheduling</p><h3>ปฏิทินงานรวม</h3><span>Orders, Events, Follow-up, Payments, Supplier, Inventory และ Daily Work Queue</span></div>
      <div class="calendar-header-actions">
        <button class="primary-button" id="syncCalendarBtn" type="button">${renderIcon('rotate-ccw')}Sync</button>
        <button class="primary-button" id="newManualTaskBtn" type="button">${renderIcon('plus')}Manual Task</button>
      </div>
    </section>
    <section class="calendar-filter panel" aria-label="ตัวกรองปฏิทิน">
      <label>วันที่<input id="calendarDateFilter" type="date" value="${state.date}"></label>
      <label>Source<select id="calendarSourceFilter">${optionMap({ all: 'ทั้งหมด', ...Object.fromEntries(Object.entries(sourceTypes).map(([id, item]) => [id, item.label])) }, state.filters.sourceType)}</select></label>
      <label>Type<select id="calendarTypeFilter">${optionMap({ all: 'ทั้งหมด', ...eventTypes }, state.filters.eventType)}</select></label>
      <label>Status<select id="calendarStatusFilter">${optionMap({ all: 'ทั้งหมด', ...Object.fromEntries(Object.entries(calendarStatuses).map(([id, item]) => [id, item.label])) }, state.filters.status)}</select></label>
      <label>Priority<select id="calendarPriorityFilter">${optionMap({ all: 'ทั้งหมด', ...priorities }, state.filters.priority)}</select></label>
      <button class="soft-button" data-quick-calendar="today" type="button">วันนี้</button>
      <button class="soft-button" data-quick-calendar="urgent" type="button">งานด่วน</button>
      <button class="soft-button" data-quick-calendar="delivery" type="button">จัดส่ง</button>
      <button class="soft-button" data-quick-calendar="payment" type="button">ครบกำหนดชำระ</button>
      <button class="soft-button" data-quick-calendar="overdue" type="button">งานค้าง</button>
    </section>
    <nav class="calendar-tabs panel" role="tablist">${calendarTabs.map(([id, label]) => `<button class="${id === state.tab ? 'active' : ''}" data-calendar-tab="${id}" type="button">${label}</button>`).join('')}</nav>
    <section id="calendarContent"></section>
    ${renderDetailModal()}
  `;
}

function renderCalendar() {
  state.events = loadCalendarEvents();
  document.querySelectorAll('[data-calendar-tab]').forEach(btn => btn.classList.toggle('active', btn.dataset.calendarTab === state.tab));
  const views = { today: renderToday, week: renderWeek, month: renderMonth, queue: renderQueue, reminders: renderReminders, manual: renderManualTasks, settings: renderCalendarSettings };
  document.getElementById('calendarContent').innerHTML = views[state.tab]();
}

function renderToday() {
  const events = filterCalendarEvents({ ...state.filters, date: state.date }, state.events);
  const kpis = getCalendarKpis(state.events, state.date);
  const alerts = getCalendarAlerts(state.events);
  return `
    <section class="calendar-kpis">
      ${kpi('งานวันนี้', kpis.todayCount, 'calendar-days')}
      ${kpi('งานด่วน', kpis.urgentCount, 'bell')}
      ${kpi('งานจัดส่ง', kpis.deliveryCount, 'truck')}
      ${kpi('งานจัดสถานที่', kpis.eventSetupCount, 'sparkles')}
      ${kpi('Follow-up วันนี้', kpis.followUpToday, 'users')}
      ${kpi('ครบกำหนดชำระ', kpis.paymentDue, 'credit-card')}
      ${kpi('สต็อกควรรีบใช้', kpis.useSoon, 'leaf')}
      ${kpi('งานค้างเกินกำหนด', kpis.overdue, 'pause')}
    </section>
    <section class="calendar-grid">
      <article class="panel alerts-panel"><div class="panel-heading"><div><p class="eyebrow">Alerts</p><h3>แจ้งเตือนสำคัญ</h3></div></div>${alerts.map(alert => eventRow(alert.event, alert.title)).join('') || empty('ไม่มี Alert')}</article>
      <article class="panel today-timeline"><div class="panel-heading"><div><p class="eyebrow">Today</p><h3>${thaiDate(state.date)}</h3></div></div>${renderTimeline(events)}</article>
    </section>
    <section class="time-groups">${['เช้า','กลางวัน','บ่าย','เย็น','ทั้งวัน'].map(group => `<article class="panel"><h3>${group}</h3>${events.filter(event => timeGroup(event) === group).map(event => eventRow(event)).join('') || empty('ไม่มีงาน')}</article>`).join('')}</section>
  `;
}

function renderWeek() {
  const days = getWeekEvents(state.weekAnchor, filterCalendarEvents(state.filters, state.events));
  return `<section class="calendar-nav panel"><button class="soft-button" data-week-nav="-7" type="button">Previous Week</button><button class="primary-button" data-week-nav="0" type="button">วันนี้</button><button class="soft-button" data-week-nav="7" type="button">Next Week</button></section><section class="week-grid">${days.map(day => `<article class="week-day ${day.date === todayKey() ? 'today' : ''}"><h3>${thaiDate(day.date)}</h3>${day.events.slice(0, 5).map(event => compactEvent(event)).join('') || empty('ว่าง')}</article>`).join('')}</section>`;
}

function renderMonth() {
  const days = getMonthMatrix(state.monthAnchor, filterCalendarEvents(state.filters, state.events));
  return `<section class="calendar-nav panel"><button class="soft-button" data-month-nav="-1" type="button">Previous Month</button><strong>${state.monthAnchor.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}</strong><button class="soft-button" data-month-nav="1" type="button">Next Month</button></section><section class="month-grid">${days.map(day => `<button class="month-day ${day.inMonth ? '' : 'muted'} ${day.today ? 'today' : ''}" data-day-detail="${day.date}" type="button"><span>${Number(day.date.slice(8, 10))}</span><strong>${day.events.length} งาน</strong>${day.events.slice(0, 2).map(event => `<small class="${event.sourceType}">${event.title}</small>`).join('')}${day.events.length > 2 ? `<em>+ อีก ${day.events.length - 2} งาน</em>` : ''}</button>`).join('')}</section>`;
}

function renderQueue() {
  const queue = getDailyWorkQueue(state.date);
  return `<section class="panel"><div class="panel-heading"><div><p class="eyebrow">Daily Work Queue</p><h3>งานที่ต้องทำวันนี้</h3></div></div><div class="queue-list">${queue.map(item => `<div class="queue-item ${item.priority}"><label><input type="checkbox" data-complete-queue="${item.id}"></label><div><strong>${item.startTime || 'ทั้งวัน'} • ${item.title}</strong><span>${eventTypes[item.eventType]} • ${item.customerName || '-'} • ${item.nextStep}</span><textarea data-queue-note="${item.id}" placeholder="บันทึกหมายเหตุ">${item.note || ''}</textarea></div><button class="soft-button" data-detail-event="${item.id}" type="button">ดูรายละเอียด</button><button class="soft-button" data-open-source="${item.sourceType}" type="button">เปิดต้นทาง</button></div>`).join('') || empty('ไม่มีงานในคิว')}</div></section>`;
}

function renderReminders() {
  const reminders = loadReminders();
  const due = getDueReminders(reminders);
  return `<section class="calendar-grid"><article class="panel"><div class="panel-heading"><div><p class="eyebrow">Due</p><h3>Reminder ที่ถึงเวลา</h3></div><span class="badge danger">${due.length}</span></div>${reminders.map(reminder => `<div class="reminder-row ${reminder.status}"><div><strong>${reminder.title}</strong><span>${reminder.priority} • ${new Date(reminder.remindAt).toLocaleString('th-TH')}</span></div><button class="soft-button" data-detail-event="${reminder.calendarEventId}" type="button">รายละเอียด</button><button class="soft-button" data-snooze-reminder="${reminder.id}" data-minutes="10" type="button">Snooze 10 นาที</button><button class="soft-button" data-snooze-reminder="${reminder.id}" data-minutes="60" type="button">1 ชั่วโมง</button><button class="soft-button" data-snooze-reminder="${reminder.id}" data-minutes="1440" type="button">พรุ่งนี้</button><button class="soft-button" data-dismiss-reminder="${reminder.id}" type="button">Dismiss</button><button class="primary-button" data-done-reminder="${reminder.id}" type="button">Done</button></div>`).join('') || empty('ไม่มี Reminder')}</article></section>`;
}

function renderManualTasks() {
  const tasks = loadManualTasks();
  return `<section class="calendar-grid">
    <form class="panel manual-form" id="manualTaskForm"><div class="panel-heading"><div><p class="eyebrow">Manual Task</p><h3>สร้างงาน Manual</h3></div></div>
      <label>ชื่องาน<input name="title" required></label><label>รายละเอียด<textarea name="description"></textarea></label><label>วันที่<input name="startDate" type="date" value="${todayKey()}"></label><label>เวลา<input name="startTime" type="time"></label><label>สถานที่<input name="location"></label><label>Priority<select name="priority">${optionMap(priorities, 'normal')}</select></label><label>ผู้รับผิดชอบ<input name="assignedTo" value="ทีมร้าน"></label><label class="calendar-toggle"><input name="reminderEnabled" type="checkbox" checked><span>เปิดแจ้งเตือน</span></label><label>หมายเหตุ<textarea name="note"></textarea></label><button class="primary-button" type="submit">${renderIcon('plus')}สร้างงาน</button>
    </form>
    <article class="panel"><div class="panel-heading"><div><p class="eyebrow">Manual Tasks</p><h3>รายการงาน Manual</h3></div></div>${tasks.map(task => `<div class="calendar-row"><div><strong>${task.title}</strong><span>${task.startDate} ${task.startTime || ''} • ${task.priority}</span></div><button class="soft-button" data-complete-manual="${task.id}" type="button">Done</button><button class="danger-button" data-delete-manual="${task.id}" type="button">ลบ</button></div>`).join('') || empty('ยังไม่มี Manual Task')}</article>
  </section>`;
}

function renderCalendarSettings() {
  const settings = loadCalendarSettings();
  return `<form class="panel calendar-settings-form" id="calendarSettingsForm"><div class="panel-heading"><div><p class="eyebrow">Settings</p><h3>Calendar Settings</h3></div></div><div class="calendar-form-grid">
    <label>เวลาเปิดร้าน<input name="openingTime" type="time" value="${settings.openingTime}"></label><label>เวลาปิดร้าน<input name="closingTime" type="time" value="${settings.closingTime}"></label><label>Default Reminder นาที<input name="defaultReminderMinutes" type="number" value="${settings.defaultReminderMinutes}"></label><label>Start Day<select name="calendarStartDay">${optionMap({ Sunday: 'Sunday', Monday: 'Monday' }, settings.calendarStartDay)}</select></label>
    ${['showCompletedEvents','autoSyncOrders','autoSyncEvents','autoSyncCustomers','autoSyncFinance','autoSyncInventory','autoSyncSuppliers'].map(key => `<label class="calendar-toggle"><input name="${key}" type="checkbox" ${settings[key] ? 'checked' : ''}><span>${key}</span></label>`).join('')}
    <button class="primary-button" type="submit">${renderIcon('save')}บันทึก Calendar Settings</button>
  </div></form>`;
}

function bindCalendarEvents() {
  document.getElementById('calendarView').addEventListener('click', event => {
    const tab = event.target.closest('[data-calendar-tab]')?.dataset.calendarTab;
    const statusId = event.target.closest('[data-next-status]')?.dataset.nextStatus;
    const detailId = event.target.closest('[data-detail-event]')?.dataset.detailEvent;
    const quick = event.target.closest('[data-quick-calendar]')?.dataset.quickCalendar;
    if (tab) { state.tab = tab; renderCalendar(); }
    if (statusId) nextStatus(statusId);
    if (detailId) openDetail(detailId);
    if (quick) { state.events = getQuickFilteredEvents(quick); document.getElementById('calendarContent').innerHTML = `<section class="panel">${state.events.map(event => eventRow(event)).join('') || empty('ไม่มีงาน')}</section>`; }
    if (event.target.closest('#syncCalendarBtn')) { syncAllCalendarEvents(); generateRemindersFromCalendarEvents(); showToast('Sync Calendar แล้ว'); renderCalendar(); }
    if (event.target.closest('#newManualTaskBtn')) { state.tab = 'manual'; renderCalendar(); }
    const completeQueue = event.target.closest('[data-complete-queue]')?.dataset.completeQueue;
    if (completeQueue) { completeWorkQueueItem(completeQueue); showToast('ทำงานเสร็จแล้ว'); renderCalendar(); }
    const snooze = event.target.closest('[data-snooze-reminder]');
    if (snooze) { snoozeReminder(snooze.dataset.snoozeReminder, Number(snooze.dataset.minutes)); showToast('Snooze reminder แล้ว'); renderCalendar(); }
    const dismiss = event.target.closest('[data-dismiss-reminder]')?.dataset.dismissReminder;
    if (dismiss) { dismissReminder(dismiss); showToast('Dismiss reminder แล้ว'); renderCalendar(); }
    const doneReminder = event.target.closest('[data-done-reminder]')?.dataset.doneReminder;
    if (doneReminder) { markReminderDone(doneReminder); showToast('Reminder Done'); renderCalendar(); }
    const deleteManual = event.target.closest('[data-delete-manual]')?.dataset.deleteManual;
    if (deleteManual && confirm('ลบ Manual Task นี้?')) { deleteManualTask(deleteManual); showToast('ลบ Manual Task แล้ว'); renderCalendar(); }
    const completeManual = event.target.closest('[data-complete-manual]')?.dataset.completeManual;
    if (completeManual) { const ev = loadCalendarEvents().find(item => item.sourceId === completeManual); if (ev) updateCalendarEventStatus(ev.id, 'done'); showToast('Manual Task Done'); renderCalendar(); }
    const weekNav = event.target.closest('[data-week-nav]')?.dataset.weekNav;
    if (weekNav) { state.weekAnchor = Number(weekNav) === 0 ? new Date() : addDays(state.weekAnchor, Number(weekNav)); renderCalendar(); }
    const monthNav = event.target.closest('[data-month-nav]')?.dataset.monthNav;
    if (monthNav) { state.monthAnchor = new Date(state.monthAnchor.getFullYear(), state.monthAnchor.getMonth() + Number(monthNav), 1); renderCalendar(); }
  });
  document.getElementById('calendarView').addEventListener('change', event => {
    if (event.target.id === 'calendarDateFilter') { state.date = event.target.value; renderCalendar(); }
    if (event.target.id?.startsWith('calendar') && event.target.tagName === 'SELECT') {
      state.filters.sourceType = document.getElementById('calendarSourceFilter').value;
      state.filters.eventType = document.getElementById('calendarTypeFilter').value;
      state.filters.status = document.getElementById('calendarStatusFilter').value;
      state.filters.priority = document.getElementById('calendarPriorityFilter').value;
      renderCalendar();
    }
  });
  document.getElementById('calendarView').addEventListener('submit', event => {
    event.preventDefault();
    if (event.target.id === 'manualTaskForm') {
      const data = Object.fromEntries(new FormData(event.target).entries());
      data.reminderEnabled = event.target.elements.reminderEnabled.checked;
      createManualTask(data);
      showToast('สร้าง Manual Task แล้ว');
      renderCalendar();
    }
    if (event.target.id === 'calendarSettingsForm') {
      const data = Object.fromEntries(new FormData(event.target).entries());
      event.target.querySelectorAll('input[type="checkbox"]').forEach(input => data[input.name] = input.checked);
      saveCalendarSettings(data);
      showToast('บันทึก Calendar Settings แล้ว');
      renderCalendar();
    }
  });
  document.getElementById('calendarView').addEventListener('input', event => {
    const note = event.target.dataset.queueNote;
    if (note) saveQueueNote(note, event.target.value);
  });
}

function nextStatus(id) {
  const event = loadCalendarEvents().find(item => item.id === id);
  const next = event.status === 'pending' ? 'in_progress' : event.status === 'in_progress' ? 'done' : 'pending';
  updateCalendarEventStatus(id, next);
  showToast(`อัปเดตสถานะเป็น ${calendarStatuses[next].label}`);
  renderCalendar();
}

function openDetail(id) {
  const event = loadCalendarEvents().find(item => item.id === id);
  if (!event) return;
  document.getElementById('calendarDetailBody').innerHTML = `<p class="eyebrow">${sourceTypes[event.sourceType]?.label || event.sourceType}</p><h3>${event.title}</h3><div class="calendar-detail-grid">${Object.entries({ วันที่: event.startDate, เวลา: event.startTime || 'ทั้งวัน', ประเภท: eventTypes[event.eventType], ลูกค้า: event.customerName || '-', สถานที่: event.location || '-', สถานะ: calendarStatuses[event.status]?.label || event.status, Priority: priorities[event.priority], มูลค่า: currency(event.relatedAmount || 0), ผู้รับผิดชอบ: event.assignedTo || '-' }).map(([k, v]) => `<div><span>${k}</span><strong>${v}</strong></div>`).join('')}</div><p>${event.description || event.note || ''}</p>`;
  document.getElementById('calendarDetailModal').hidden = false;
}

function renderTimeline(events) {
  const hours = Array.from({ length: 12 }, (_, i) => `${String(i + 8).padStart(2, '0')}:00`);
  return `<div class="timeline-hours">${hours.map(hour => `<div><time>${hour}</time><section>${events.filter(event => (event.startTime || '').slice(0, 2) === hour.slice(0, 2)).map(event => compactEvent(event)).join('')}</section></div>`).join('')}</div>`;
}

function eventRow(event, prefix = '') {
  return `<div class="calendar-row ${event.sourceType} ${event.priority}"><div><strong>${prefix ? `${prefix}: ` : ''}${event.startTime || 'ทั้งวัน'} ${event.title}</strong><span>${eventTypes[event.eventType] || event.eventType} • ${event.customerName || '-'} • ${event.location || '-'}</span></div><span class="badge ${calendarStatuses[event.status]?.tone || 'info'}">${calendarStatuses[event.status]?.label || event.status}</span><button class="soft-button" data-detail-event="${event.id}" type="button">รายละเอียด</button><button class="soft-button" data-next-status="${event.id}" type="button">เปลี่ยนสถานะ</button></div>`;
}

function compactEvent(event) {
  return `<button class="compact-event ${event.sourceType}" data-detail-event="${event.id}" type="button"><strong>${event.startTime || 'ทั้งวัน'} ${event.title}</strong><span>${eventTypes[event.eventType]} • ${event.priority}</span></button>`;
}

function renderDetailModal() {
  return `<div class="modal-overlay calendar-modal" id="calendarDetailModal" hidden><section class="modal-card"><button class="icon-button modal-close" type="button" onclick="document.getElementById('calendarDetailModal').hidden=true">${renderIcon('x')}</button><div id="calendarDetailBody"></div></section></div>`;
}

function kpi(label, value, icon) {
  return `<article class="calendar-kpi"><span>${renderIcon(icon)}</span><small>${label}</small><strong>${number(value)}</strong></article>`;
}

function timeGroup(event) {
  if (event.allDay || !event.startTime) return 'ทั้งวัน';
  const hour = Number(event.startTime.slice(0, 2));
  if (hour < 11) return 'เช้า';
  if (hour < 13) return 'กลางวัน';
  if (hour < 17) return 'บ่าย';
  return 'เย็น';
}

function optionMap(map, selected) {
  return Object.entries(map).map(([id, label]) => `<option value="${id}" ${id === selected ? 'selected' : ''}>${label}</option>`).join('');
}

function empty(text) {
  return `<div class="empty-state">${text}</div>`;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}
