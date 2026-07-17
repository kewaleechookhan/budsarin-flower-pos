import { eventCostCategories, eventPaymentStatuses, eventTypes, projectStatuses, quotationCategories } from './events-data.js';
import { loadEvents, saveEventProject, getEventKpis, getUpcomingEvents, updateEventStatus, loadEventSettings, saveEventSettings } from './events-service.js';
import { loadEventQuotations, createQuotation, updateQuotationStatus } from './event-quotations.js';
import { loadEventPayments, recordEventPayment, detectOverdueEventPayments } from './event-payments.js';
import { addEventCost, deleteEventCost, loadEventCosts } from './event-costs.js';
import { calculateChecklistProgress, loadEventChecklists, toggleChecklistTask } from './event-checklists.js';
import { addTimelineItem, loadEventTimelines, updateTimelineStatus } from './event-timeline.js';
import { renderIcon } from './icons.js';
import { loadBrandSettings, loadStoreProfile } from './settings-service.js';
import { currency, number, showToast, thaiDate } from './utils.js';

const state = { tab: 'overview', query: '', status: 'all', selectedEventId: null };

const tabs = [
  ['overview', 'ภาพรวม'],
  ['projects', 'รายการโปรเจกต์'],
  ['quotations', 'ใบเสนอราคา'],
  ['schedule', 'ตารางงาน'],
  ['profit', 'ต้นทุนและกำไร'],
  ['checklist', 'Checklist ทีมงาน'],
  ['settings', 'ตั้งค่างาน']
];

export function initEvents() {
  renderEventsShell();
  renderEvents();
  bindEvents();
  window.addEventListener('events:updated', () => renderEvents());
}

function renderEventsShell() {
  document.getElementById('eventsView').innerHTML = `
    <section class="events-header panel">
      <div><p class="eyebrow">Phase 6 Events</p><h3>งานจัดสถานที่</h3><span>จัดการงาน Event ใบเสนอราคา มัดจำ และกำไรต่อโปรเจกต์</span></div>
      <div class="events-actions">
        <button class="primary-button" id="newEventBtn" type="button">${renderIcon('plus')}เพิ่มงานจัดสถานที่</button>
        <button class="soft-button" id="newQuotationBtn" type="button">${renderIcon('receipt')}สร้างใบเสนอราคา</button>
        <button class="soft-button" data-events-tab-shortcut="schedule" type="button">${renderIcon('calendar-days')}ดูตารางงาน</button>
      </div>
    </section>
    <nav class="events-tabs panel" role="tablist">${tabs.map(([id, label]) => `<button class="${state.tab === id ? 'active' : ''}" data-events-tab="${id}" type="button">${label}</button>`).join('')}</nav>
    <section id="eventsContent"></section>
    <div class="modal-overlay" id="eventModal" hidden></div>
    <div class="modal-overlay" id="eventPreviewModal" hidden></div>
  `;
}

function renderEvents() {
  document.querySelectorAll('[data-events-tab]').forEach(btn => btn.classList.toggle('active', btn.dataset.eventsTab === state.tab));
  const views = { overview: renderOverview, projects: renderProjects, quotations: renderQuotations, schedule: renderSchedule, profit: renderProfit, checklist: renderChecklist, settings: renderSettings };
  document.getElementById('eventsContent').innerHTML = views[state.tab]();
}

function renderOverview() {
  const events = loadEvents();
  const k = getEventKpis(events);
  const upcoming = getUpcomingEvents(events);
  const lowMargin = events.filter(item => Number(item.grossMargin) < loadEventSettings().lowMarginThreshold);
  return `
    <section class="events-kpis">
      ${kpi('งานเดือนนี้', k.thisMonth, 'calendar-days', false)}
      ${kpi('รอเสนอราคา', k.waitingQuotation, 'receipt', false)}
      ${kpi('รับมัดจำแล้ว', k.depositPaid, 'credit-card', false)}
      ${kpi('มูลค่างานรวม', k.totalValue, 'wallet')}
      ${kpi('ยอดมัดจำรวม', k.totalDeposit, 'coins')}
      ${kpi('ยอดคงเหลือ', k.balance, 'alert-circle')}
      ${kpi('กำไรประมาณการ', k.estimatedProfit, 'trending-up')}
      ${kpi('งานใกล้ถึง', k.upcoming, 'bell', false)}
    </section>
    <section class="events-dashboard-grid">
      <article class="panel"><div class="panel-heading"><div><p class="eyebrow">Project Timeline</p><h3>งานที่กำลังจะมาถึง</h3></div></div>${upcoming.slice(0, 6).map(eventRow).join('') || empty('ไม่มีงาน')}</article>
      <article class="panel"><div class="panel-heading"><div><p class="eyebrow">Profit Snapshot</p><h3>กำไรงานจัดสถานที่</h3></div></div>
        <div class="settings-metrics"><div><span>รายได้รวม</span><strong>${currency(k.totalValue)}</strong></div><div><span>ต้นทุนรวม</span><strong>${currency(k.totalValue - k.estimatedProfit)}</strong></div><div><span>กำไรขั้นต้น</span><strong>${currency(k.estimatedProfit)}</strong></div><div><span>งาน Margin ต่ำ</span><strong>${lowMargin.length}</strong></div></div>
        ${lowMargin.slice(0, 4).map(item => `<div class="event-alert-row"><strong>${item.projectName}</strong><span>${number(item.grossMargin.toFixed(1))}%</span></div>`).join('') || empty('ไม่มีงาน margin ต่ำ')}
      </article>
      <article class="panel wide"><div class="panel-heading"><div><p class="eyebrow">Recent Projects</p><h3>รายการงานล่าสุด</h3></div></div><div class="event-card-grid">${events.slice(0, 8).map(projectCard).join('')}</div></article>
    </section>
  `;
}

function renderProjects() {
  const rows = filteredEvents();
  return `<section class="panel">
    <div class="events-toolbar">
      <label>${renderIcon('search')}<input id="eventSearch" value="${escapeHtml(state.query)}" placeholder="ค้นหางาน ลูกค้า สถานที่"></label>
      <select id="eventStatusFilter">${optionMap({ all: 'ทุกสถานะ', ...Object.fromEntries(Object.entries(projectStatuses).map(([id, item]) => [id, item.label])) }, state.status)}</select>
    </div>
    <div class="event-card-grid">${rows.map(projectCard).join('') || empty('ไม่พบโปรเจกต์')}</div>
  </section>`;
}

function renderQuotations() {
  const quotes = loadEventQuotations();
  return `<section class="panel"><div class="panel-heading"><div><p class="eyebrow">Quotation</p><h3>ใบเสนอราคา</h3></div></div>
    <div class="event-table">${quotes.map(q => `<div class="event-table-row"><div><strong>${q.quotationNo}</strong><span>${q.projectName} • ${q.customerName}</span></div><b>${currency(q.totalAmount)}</b><span class="badge info">${q.quotationStatus}</span><button class="soft-button" data-preview-quote="${q.id}" type="button">Preview</button><button class="primary-button" data-send-quote="${q.id}" type="button">ส่งให้ลูกค้า</button></div>`).join('') || empty('ยังไม่มีใบเสนอราคา')}</div>
  </section>`;
}

function renderSchedule() {
  const rows = getUpcomingEvents(loadEvents());
  return `<section class="panel"><div class="panel-heading"><div><p class="eyebrow">Schedule</p><h3>ตาราง Setup / Event / Teardown</h3></div></div>
    <div class="event-schedule">${rows.map(event => `<div class="schedule-card"><time>${thaiDate(event.eventDate)}</time><div><strong>${event.projectName}</strong><span>Setup ${event.setupDate} ${event.setupTime} • Teardown ${event.teardownDate} ${event.teardownTime}</span><small>${event.venueName}</small></div>${statusBadge(projectStatuses, event.projectStatus)}</div>`).join('') || empty('ไม่มีตารางงาน')}</div>
  </section>`;
}

function renderProfit() {
  const events = loadEvents();
  const costs = loadEventCosts();
  return `<section class="events-dashboard-grid">
    <article class="panel"><div class="panel-heading"><div><p class="eyebrow">Cost Breakdown</p><h3>ต้นทุนตามหมวด</h3></div></div>${costBreakdown(costs).map(row => `<div class="finance-row"><span>${row.label}</span><strong>${currency(row.value)}</strong></div>`).join('')}</article>
    <article class="panel"><div class="panel-heading"><div><p class="eyebrow">Profit Ranking</p><h3>กำไรต่อโปรเจกต์</h3></div></div>${events.sort((a,b)=>b.grossProfit-a.grossProfit).map(item => `<div class="event-alert-row"><strong>${item.projectName}</strong><span>${currency(item.grossProfit)} • ${number(item.grossMargin.toFixed(1))}%</span></div>`).join('')}</article>
    <form class="panel" id="eventCostForm"><div class="panel-heading"><div><p class="eyebrow">Add Cost</p><h3>เพิ่มต้นทุน Event</h3></div></div>
      ${selectField('eventId','โปรเจกต์', events.map(item => [item.id, item.projectName]))}
      ${selectField('category','หมวดต้นทุน', eventCostCategories.map(item => [item,item]))}
      ${inputField('itemName','รายการต้นทุน')}
      ${inputField('quantity','จำนวน','number','1')}
      ${inputField('unitCost','ต้นทุนต่อหน่วย','number','0')}
      <label class="settings-toggle"><input name="isActual" type="checkbox"><span>เป็นต้นทุนจริง</span></label>
      <button class="primary-button" type="submit">บันทึกต้นทุน</button>
    </form>
  </section>`;
}

function renderChecklist() {
  const events = loadEvents();
  const selected = state.selectedEventId || events[0]?.id;
  state.selectedEventId = selected;
  const tasks = loadEventChecklists().filter(item => item.eventId === selected);
  const progress = calculateChecklistProgress(selected);
  return `<section class="panel">
    <div class="panel-heading"><div><p class="eyebrow">Checklist</p><h3>Checklist ทีมงาน</h3></div><span class="badge success">${progress}%</span></div>
    <select id="eventChecklistSelect">${events.map(item => `<option value="${item.id}" ${item.id === selected ? 'selected' : ''}>${item.projectName}</option>`).join('')}</select>
    <div class="checklist-board">${Object.groupBy ? Object.entries(Object.groupBy(tasks, t => t.section)).map(([section, rows]) => checklistSection(section, rows)).join('') : fallbackChecklist(tasks)}</div>
  </section>`;
}

function renderSettings() {
  const s = loadEventSettings();
  return `<form class="settings-form panel" id="eventSettingsForm">
    <div class="panel-heading"><div><p class="eyebrow">Event Settings</p><h3>ตั้งค่างานจัดสถานที่</h3></div></div>
    <div class="settings-form-grid">
      ${inputField('defaultDepositPercent','มัดจำเริ่มต้น %','number',s.defaultDepositPercent)}
      ${inputField('defaultQuotationValidDays','อายุใบเสนอราคา (วัน)','number',s.defaultQuotationValidDays)}
      ${inputField('defaultServiceChargeRate','Service Charge %','number',s.defaultServiceChargeRate)}
      ${inputField('defaultTaxRate','Tax %','number',s.defaultTaxRate)}
      ${inputField('lowMarginThreshold','Low Margin Threshold %','number',s.lowMarginThreshold)}
      ${textareaField('defaultPaymentTerms','เงื่อนไขชำระเงิน',s.defaultPaymentTerms)}
    </div>
    <button class="primary-button" type="submit">บันทึก Event Settings</button>
  </form>`;
}

function bindEvents() {
  document.getElementById('eventsView').addEventListener('click', event => {
    const tab = event.target.closest('[data-events-tab]')?.dataset.eventsTab || event.target.closest('[data-events-tab-shortcut]')?.dataset.eventsTabShortcut;
    if (tab) { state.tab = tab; return renderEvents(); }
    if (event.target.closest('#newEventBtn')) return openEventForm();
    if (event.target.closest('#newQuotationBtn')) { const ev = loadEvents()[0]; const quote = createQuotation(ev); showToast('สร้างใบเสนอราคาแล้ว'); return openQuotationPreview(quote.id); }
    const edit = event.target.closest('[data-edit-event]')?.dataset.editEvent;
    if (edit) return openEventForm(loadEvents().find(item => item.id === edit));
    const status = event.target.closest('[data-next-event-status]')?.dataset.nextEventStatus;
    if (status) { cycleStatus(status); showToast('อัปเดตสถานะโปรเจกต์แล้ว'); return renderEvents(); }
    const deposit = event.target.closest('[data-record-deposit]')?.dataset.recordDeposit;
    if (deposit) { const ev = loadEvents().find(item => item.id === deposit); recordEventPayment(ev, ev.depositAmount || Math.round(ev.finalAmount * .3)); showToast('รับมัดจำและ sync Finance แล้ว'); return renderEvents(); }
    const previewQuote = event.target.closest('[data-preview-quote]')?.dataset.previewQuote;
    if (previewQuote) return openQuotationPreview(previewQuote);
    const sendQuote = event.target.closest('[data-send-quote]')?.dataset.sendQuote;
    if (sendQuote) { updateQuotationStatus(sendQuote, 'sent'); showToast('บันทึกสถานะว่าส่งใบเสนอราคาแล้ว'); return renderEvents(); }
    const agreement = event.target.closest('[data-agreement-event]')?.dataset.agreementEvent;
    if (agreement) return openAgreementPreview(agreement);
    const task = event.target.closest('[data-toggle-event-task]')?.dataset.toggleEventTask;
    if (task) { toggleChecklistTask(task); return renderEvents(); }
    const timeline = event.target.closest('[data-done-timeline]')?.dataset.doneTimeline;
    if (timeline) { updateTimelineStatus(timeline, 'done'); showToast('อัปเดต Timeline แล้ว'); return renderEvents(); }
    if (event.target.closest('[data-close-event-modal]')) closeEventModal();
    if (event.target.closest('[data-print-event-doc]')) window.print();
  });
  document.getElementById('eventsView').addEventListener('input', event => {
    if (event.target.id === 'eventSearch') { state.query = event.target.value; renderEvents(); }
  });
  document.getElementById('eventsView').addEventListener('change', event => {
    if (event.target.id === 'eventStatusFilter') { state.status = event.target.value; renderEvents(); }
    if (event.target.id === 'eventChecklistSelect') { state.selectedEventId = event.target.value; renderEvents(); }
  });
  document.getElementById('eventsView').addEventListener('submit', event => {
    event.preventDefault();
    if (event.target.id === 'eventProjectForm') {
      try {
        const mode = event.submitter?.dataset.mode || 'project';
        const savedEvent = saveEventProject(Object.fromEntries(new FormData(event.target).entries()), mode);
        if (mode === 'quotation') {
          const quote = createQuotation(savedEvent);
          updateEventStatus(savedEvent.id, 'quotation_draft');
          showToast('บันทึกงานและสร้างใบเสนอราคาแล้ว');
          closeEventModal();
          renderEvents();
          openQuotationPreview(quote.id);
          return;
        }
        state.tab = 'projects';
        state.selectedEventId = savedEvent.id;
        showToast(mode === 'draft' ? 'บันทึกแบบร่างงานจัดสถานที่แล้ว' : 'บันทึกงานจัดสถานที่แล้ว');
        closeEventModal();
        renderEvents();
      }
      catch (error) {
        document.getElementById('eventFormError').textContent = error.message;
        showToast(error.message);
      }
    }
    if (event.target.id === 'eventCostForm') { addEventCost(Object.fromEntries(new FormData(event.target).entries()), true); showToast('บันทึกต้นทุนและ sync Finance แล้ว'); renderEvents(); }
    if (event.target.id === 'eventSettingsForm') { saveEventSettings(Object.fromEntries(new FormData(event.target).entries())); showToast('บันทึก Event Settings แล้ว'); renderEvents(); }
  });
}

function openEventForm(event = {}) {
  const modal = document.getElementById('eventModal');
  const today = new Date().toISOString().slice(0, 10);
  modal.hidden = false;
  modal.innerHTML = `<section class="modal event-form-modal" role="dialog" aria-modal="true" aria-labelledby="eventFormTitle">
    <button class="icon-button modal-close" data-close-event-modal type="button" aria-label="ปิด">×</button>
    <p class="eyebrow">Event Project</p><h3 id="eventFormTitle">${event.id ? 'แก้ไขงานจัดสถานที่' : 'เพิ่มงานจัดสถานที่'}</h3>
    <form id="eventProjectForm">
      <input type="hidden" name="id" value="${event.id || ''}">
      <section class="event-form-grid">
        <fieldset><legend>ข้อมูลลูกค้า</legend>${inputField('customerName','ชื่อลูกค้า','text',event.customerName)}${inputField('customerPhone','เบอร์โทร','tel',event.customerPhone)}${inputField('customerContact','LINE/Facebook','text',event.customerContact)}${textareaField('internalNote','หมายเหตุลูกค้า/ภายใน',event.internalNote)}</fieldset>
        <fieldset><legend>ข้อมูลงาน</legend>${inputField('projectName','ชื่องาน','text',event.projectName)}${selectField('eventType','ประเภทงาน',Object.entries(eventTypes),event.eventType)}${inputField('guestCount','จำนวนแขก','number',event.guestCount)}${inputField('themeColor','ธีมสี','text',event.themeColor)}${inputField('style','สไตล์งาน','text',event.style)}${textareaField('description','รายละเอียดงาน',event.description)}</fieldset>
        <fieldset><legend>สถานที่และเวลา</legend>${inputField('venueName','ชื่อสถานที่','text',event.venueName)}${textareaField('venueAddress','ที่อยู่สถานที่',event.venueAddress)}${inputField('venueMapLink','Map Link','url',event.venueMapLink)}${inputField('eventDate','วันที่จัดงาน','date',event.eventDate || today)}${inputField('eventStartTime','เวลาเริ่มงาน','time',event.eventStartTime || '09:00')}${inputField('eventEndTime','เวลาจบงาน','time',event.eventEndTime || '12:00')}${inputField('setupDate','วันที่ Setup','date',event.setupDate || event.eventDate || today)}${inputField('setupTime','เวลา Setup','time',event.setupTime || '08:00')}${inputField('teardownDate','วันที่รื้อถอน','date',event.teardownDate || event.eventDate || today)}${inputField('teardownTime','เวลารื้อถอน','time',event.teardownTime || '13:00')}</fieldset>
        <fieldset><legend>งบประมาณและการเงิน</legend>${inputField('quotationAmount','ยอดเสนอราคา','number',event.quotationAmount || event.finalAmount)}${inputField('discountAmount','ส่วนลด','number',event.discountAmount || 0)}${inputField('finalAmount','ยอดสุทธิ','number',event.finalAmount)}${inputField('depositAmount','ยอดมัดจำ','number',event.depositAmount)}${inputField('paidAmount','ยอดชำระแล้ว','number',event.paidAmount)}${inputField('estimatedCost','ต้นทุนประมาณการ','number',event.estimatedCost)}${selectField('paymentStatus','สถานะชำระเงิน',Object.entries(eventPaymentStatuses).map(([id,item])=>[id,item.label]),event.paymentStatus)}</fieldset>
        <fieldset><legend>ทีมงาน</legend>${inputField('teamMembers','ทีมงานที่รับผิดชอบ','text',(event.teamMembers || []).join?.(', ') || event.teamMembers || 'ทีมจัดดอกไม้')}${selectField('projectStatus','สถานะโปรเจกต์',Object.entries(projectStatuses).map(([id,item])=>[id,item.label]),event.projectStatus)}</fieldset>
      </section>
      <p class="form-error" id="eventFormError"></p>
      <div class="events-actions"><button class="soft-button" data-mode="draft" type="submit">บันทึกแบบร่าง</button><button class="primary-button" data-mode="project" type="submit">บันทึกโปรเจกต์</button><button class="primary-button" data-mode="quotation" type="submit">บันทึกและสร้างใบเสนอราคา</button></div>
    </form>
  </section>`;
}

function openQuotationPreview(id) {
  const quote = loadEventQuotations().find(item => item.id === id);
  if (!quote) return;
  const profile = loadStoreProfile();
  const brand = loadBrandSettings();
  const modal = document.getElementById('eventPreviewModal');
  modal.hidden = false;
  modal.innerHTML = `<section class="modal event-document-modal" role="dialog" aria-modal="true"><button class="icon-button modal-close" data-close-event-modal type="button">×</button>
    <article class="event-document a4-document ${brand.showBackgroundOnPrint ? 'with-bg' : ''}">
    <header class="document-header"><div class="document-brand">${brand.showLogoOnDocuments && profile.logoDataUrl ? `<img src="${profile.logoDataUrl}" alt="${profile.storeNameTh}">` : ''}<div><h2>${profile.storeNameTh || profile.storeNameEn}</h2><p>${profile.address || ''} ${profile.province || ''}</p><p>โทร ${profile.phone || '-'} ${profile.taxId ? `• Tax ID ${profile.taxId}` : ''}</p></div></div><div class="document-title"><strong>${brand.quotationTitle}</strong><span>${quote.quotationNo}</span><span>${quote.eventDate}</span></div></header>
    <div class="doc-grid"><span>ลูกค้า</span><strong>${quote.customerName}</strong><span>ชื่องาน</span><strong>${quote.projectName}</strong><span>วันที่จัดงาน</span><strong>${quote.eventDate}</strong><span>สถานที่</span><strong>${quote.venueName}</strong></div>
    <table><thead><tr><th>รายการ</th><th>จำนวน</th><th>ราคา/หน่วย</th><th>รวม</th></tr></thead><tbody>${quote.items.map(item => `<tr><td>${item.itemName}<small>${item.description}</small></td><td>${item.quantity} ${item.unit}</td><td>${currency(item.unitPrice)}</td><td>${currency(item.totalPrice)}</td></tr>`).join('')}</tbody></table>
    <div class="doc-total"><span>Subtotal</span><b>${currency(quote.subtotal)}</b><span>ส่วนลด</span><b>${currency(quote.discountAmount)}</b><span>ยอดรวมสุทธิ</span><b>${currency(quote.totalAmount)}</b><span>ยอดมัดจำ</span><b>${currency(quote.depositRequired)}</b></div>
    <p>${quote.paymentTerms}</p><p>${brand.quotationTerms}</p><p>หมายเหตุ: ${quote.note}</p><div class="signature-grid"><span>ผู้เสนอราคา</span><span>ผู้ยอมรับราคา</span></div><footer>${brand.documentFooterText}</footer></article>
    <div class="events-actions"><button class="primary-button" data-print-event-doc type="button">พิมพ์</button><button class="soft-button" data-close-event-modal type="button">ปิด</button></div>
  </section>`;
}

function openAgreementPreview(id) {
  const event = loadEvents().find(item => item.id === id);
  const modal = document.getElementById('eventPreviewModal');
  modal.hidden = false;
  modal.innerHTML = `<section class="modal event-document-modal"><button class="icon-button modal-close" data-close-event-modal type="button">×</button><article class="event-document"><h2>ข้อตกลงเบื้องต้น</h2><p>เอกสารนี้เป็นข้อตกลงเบื้องต้น ไม่ใช่สัญญากฎหมายสมบูรณ์</p><div class="doc-grid"><span>ลูกค้า</span><strong>${event.customerName}</strong><span>งาน</span><strong>${event.projectName}</strong><span>ยอดรวม</span><strong>${currency(event.finalAmount)}</strong><span>มัดจำ</span><strong>${currency(event.depositAmount)}</strong><span>Setup</span><strong>${event.setupDate} ${event.setupTime}</strong><span>Teardown</span><strong>${event.teardownDate} ${event.teardownTime}</strong></div><p>ร้านรับผิดชอบการจัดดอกไม้ ติดตั้ง และรื้อถอนตามรายการที่ตกลง ลูกค้ารับผิดชอบการอนุญาตใช้สถานที่และชำระเงินตามงวด</p><div class="signature-grid"><span>ร้าน Budsarin Flower</span><span>ลูกค้า</span></div></article><div class="events-actions"><button class="primary-button" data-print-event-doc type="button">พิมพ์</button><button class="soft-button" data-close-event-modal type="button">ปิด</button></div></section>`;
}

function closeEventModal() {
  document.getElementById('eventModal').hidden = true;
  document.getElementById('eventPreviewModal').hidden = true;
}

function filteredEvents() {
  const text = state.query.trim().toLowerCase();
  return loadEvents().filter(item => (state.status === 'all' || item.projectStatus === state.status) && (!text || `${item.projectName} ${item.customerName} ${item.venueName}`.toLowerCase().includes(text)));
}

function projectCard(item) {
  return `<article class="event-project-card"><div><p class="eyebrow">${eventTypes[item.eventType]}</p><h3>${item.projectName}</h3><span>${item.customerName} • ${item.venueName}</span></div>${statusBadge(projectStatuses, item.projectStatus)}<div class="event-money"><strong>${currency(item.finalAmount)}</strong><small>คงเหลือ ${currency(item.balanceAmount)} • Margin ${number(item.grossMargin.toFixed(1))}%</small></div><div class="bar"><span style="width:${Math.min(100, Math.round((item.paidAmount / Math.max(item.finalAmount,1))*100))}%"></span></div><div class="events-actions"><button class="soft-button" data-edit-event="${item.id}" type="button">แก้ไข</button><button class="primary-button" data-record-deposit="${item.id}" type="button">รับมัดจำ</button><button class="soft-button" data-agreement-event="${item.id}" type="button">ข้อตกลง</button><button class="soft-button" data-next-event-status="${item.id}" type="button">สถานะถัดไป</button></div></article>`;
}

function eventRow(item) {
  return `<div class="event-row"><time>${item.eventDate}<small>${item.eventStartTime}</small></time><div><strong>${item.projectName}</strong><span>${item.customerName} • ${item.venueName}</span></div>${statusBadge(projectStatuses, item.projectStatus)}</div>`;
}

function cycleStatus(id) {
  const keys = Object.keys(projectStatuses);
  const event = loadEvents().find(item => item.id === id);
  updateEventStatus(id, keys[(keys.indexOf(event.projectStatus) + 1) % keys.length]);
}

function checklistSection(section, rows) {
  return `<article><h4>${section}</h4>${rows.map(task => `<label class="event-task"><input type="checkbox" data-toggle-event-task="${task.id}" ${task.isDone ? 'checked' : ''}><span>${task.taskName}<small>${task.assignedTo} • ${task.dueDate}</small></span></label>`).join('')}</article>`;
}

function fallbackChecklist(tasks) {
  return [...new Set(tasks.map(item => item.section))].map(section => checklistSection(section, tasks.filter(item => item.section === section))).join('');
}

function costBreakdown(costs) {
  return eventCostCategories.map(label => ({ label, value: costs.filter(item => item.category === label).reduce((sum, item) => sum + Number(item.totalCost || 0), 0) })).filter(item => item.value > 0);
}

function kpi(label, value, icon, money = true) {
  return `<article class="kpi-card"><span class="kpi-icon">${renderIcon(icon)}</span><span class="kpi-label">${label}</span><strong>${money ? currency(value) : number(value)}</strong></article>`;
}

function statusBadge(map, id) {
  const item = map[id] || { label: id || '-', tone: 'info' };
  return `<span class="badge ${item.tone}">${item.label}</span>`;
}

function optionMap(options, value) {
  return Object.entries(options).map(([id, label]) => `<option value="${id}" ${id === value ? 'selected' : ''}>${label}</option>`).join('');
}

function inputField(name, label, type = 'text', value = '') {
  return `<label>${label}<input name="${name}" type="${type}" value="${escapeHtml(value ?? '')}"></label>`;
}

function textareaField(name, label, value = '') {
  return `<label class="full">${label}<textarea name="${name}">${escapeHtml(value ?? '')}</textarea></label>`;
}

function selectField(name, label, options, value = '') {
  return `<label>${label}<select name="${name}">${options.map(([id, text]) => `<option value="${id}" ${id === value ? 'selected' : ''}>${text}</option>`).join('')}</select></label>`;
}

function empty(text) {
  return `<div class="empty-state">${text}</div>`;
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[char]);
}
