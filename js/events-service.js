import { defaultEventSettings } from './events-data.js';
import { calculateEventGrossMargin, calculateEventGrossProfit } from './event-calculations.js';
import { ensureEventPayments, getEventPaidAmount } from './event-payments.js';
import { loadEventCosts } from './event-costs.js';
import { loadEventChecklists } from './event-checklists.js';
import { loadEventTimelines } from './event-timeline.js';
import { loadEventQuotations } from './event-quotations.js';
import { STORAGE_KEYS, readStorage, writeStorage } from './storage-registry.js';
import { loadState, saveState } from './storage.js';

const KEY = STORAGE_KEYS.events;
const SETTINGS_KEY = STORAGE_KEYS.eventSettings || 'budsarin_event_settings';

export function loadEvents() {
  const saved = readStorage(KEY, null);
  if (Array.isArray(saved)) {
    ensureEventPayments(saved);
    return saved.map(hydrateEvent);
  }
  saveEvents([]);
  loadEventCosts();
  loadEventChecklists();
  loadEventTimelines();
  loadEventQuotations();
  return [];
}

export function saveEvents(events) {
  writeStorage(KEY, events);
  syncDashboardFromEvents(events);
  return events;
}

export function loadEventSettings() {
  return { ...defaultEventSettings, ...readStorage(SETTINGS_KEY, {}) };
}

export const saveEventSettings = settings => writeStorage(SETTINGS_KEY, { ...loadEventSettings(), ...settings });

export function saveEventProject(data, mode = 'project') {
  const events = loadEvents();
  const event = normalizeEvent(data, events, mode);
  validateEvent(event, mode);
  const index = events.findIndex(item => item.id === event.id);
  if (index >= 0) events[index] = event;
  else events.unshift(event);
  saveEvents(events);
  ensureEventPayments([event]);
  window.dispatchEvent(new CustomEvent('events:updated', { detail: event }));
  return event;
}

export function updateEventStatus(id, status) {
  const events = loadEvents();
  const event = events.find(item => item.id === id);
  if (!event) return null;
  event.projectStatus = status;
  event.updatedAt = new Date().toISOString();
  saveEvents(events);
  return event;
}

export function deleteEventProject(id) {
  const next = loadEvents().filter(item => item.id !== id);
  saveEvents(next);
  window.dispatchEvent(new CustomEvent('events:updated', { detail: { id, deleted: true } }));
  window.dispatchEvent(new CustomEvent('calendar:refresh'));
  return next;
}

export function cancelEvent(id, reason = '') {
  const event = updateEventStatus(id, 'cancelled');
  if (event) event.internalNote = `${event.internalNote || ''}\nยกเลิก: ${reason}`;
  saveEvents(loadEvents().map(item => item.id === id ? event : item));
  return event;
}

export function getEventKpis(events = loadEvents()) {
  const month = new Date().toISOString().slice(0, 7);
  const active = events.filter(item => item.projectStatus !== 'cancelled');
  return {
    thisMonth: active.filter(item => item.eventDate?.startsWith(month)).length,
    waitingQuotation: active.filter(item => ['lead', 'quotation_draft', 'quotation_sent'].includes(item.projectStatus)).length,
    depositPaid: active.filter(item => ['deposit_paid', 'planning', 'preparing', 'setup'].includes(item.projectStatus) || Number(item.paidAmount) > 0).length,
    totalValue: active.reduce((sum, item) => sum + Number(item.finalAmount || 0), 0),
    totalDeposit: active.reduce((sum, item) => sum + Number(item.depositAmount || 0), 0),
    balance: active.reduce((sum, item) => sum + Number(item.balanceAmount || 0), 0),
    estimatedProfit: active.reduce((sum, item) => sum + Number(item.grossProfit || 0), 0),
    upcoming: active.filter(item => item.eventDate >= new Date().toISOString().slice(0, 10)).length
  };
}

export function getUpcomingEvents(events = loadEvents()) {
  const today = new Date().toISOString().slice(0, 10);
  return events.filter(item => item.eventDate >= today && item.projectStatus !== 'cancelled').sort((a, b) => a.eventDate.localeCompare(b.eventDate));
}

export function syncDashboardFromEvents(events = loadEvents()) {
  const dashboard = loadState(null);
  if (!dashboard) return;
  const upcoming = getUpcomingEvents(events).slice(0, 4);
  dashboard.events = upcoming.map(item => ({
    name: item.projectName,
    customer: item.customerName,
    date: item.eventDate,
    place: item.venueName,
    value: item.finalAmount,
    deposit: item.paidAmount,
    progress: Math.min(Math.round((Number(item.paidAmount || 0) / Math.max(Number(item.finalAmount || 1), 1)) * 100), 100),
    status: item.projectStatus
  }));
  if (dashboard.finance) {
    const kpis = getEventKpis(events);
    dashboard.finance.revenue = Math.max(Number(dashboard.finance.revenue || 0), kpis.totalValue);
    dashboard.finance.grossProfit = Math.max(Number(dashboard.finance.grossProfit || 0), kpis.estimatedProfit);
    dashboard.finance.receivable = Math.max(Number(dashboard.finance.receivable || 0), kpis.balance);
  }
  saveState(dashboard);
  window.dispatchEvent(new CustomEvent('dashboard:update', { detail: dashboard }));
}

function hydrateEvent(event) {
  const costs = loadEventCosts().filter(item => item.eventId === event.id);
  const paidAmount = getEventPaidAmount(event.id) || Number(event.paidAmount || 0);
  const totalCost = costs.reduce((sum, item) => sum + Number(item.totalCost || 0), 0) || Number(event.estimatedCost || 0);
  const grossProfit = calculateEventGrossProfit(event.finalAmount, totalCost);
  return {
    ...event,
    paidAmount,
    balanceAmount: Math.max(Number(event.finalAmount || 0) - paidAmount, 0),
    estimatedCost: totalCost,
    grossProfit,
    grossMargin: calculateEventGrossMargin(event.finalAmount, totalCost)
  };
}

function normalizeEvent(data, events, mode) {
  const finalAmount = Math.max(Number(data.finalAmount || data.quotationAmount || 0), 0);
  const paidAmount = Math.max(Number(data.paidAmount || 0), 0);
  const estimatedCost = Math.max(Number(data.estimatedCost || 0), 0);
  const grossProfit = finalAmount - estimatedCost;
  const now = new Date().toISOString();
  return {
    id: data.id || crypto.randomUUID(),
    eventNo: data.eventNo || nextEventNo(events),
    projectName: data.projectName || '',
    eventType: data.eventType || 'wedding',
    customerId: data.customerId || `event-customer-${Date.now()}`,
    customerName: data.customerName || '',
    customerPhone: data.customerPhone || '',
    customerContact: data.customerContact || '',
    venueName: data.venueName || '',
    venueAddress: data.venueAddress || '',
    venueMapLink: data.venueMapLink || '',
    eventDate: data.eventDate || '',
    eventStartTime: data.eventStartTime || '',
    eventEndTime: data.eventEndTime || '',
    setupDate: data.setupDate || data.eventDate || '',
    setupTime: data.setupTime || '',
    teardownDate: data.teardownDate || data.eventDate || '',
    teardownTime: data.teardownTime || '',
    guestCount: Number(data.guestCount || 0),
    themeColor: data.themeColor || '',
    style: data.style || '',
    description: data.description || '',
    referenceImage: data.referenceImage || 'event-reference-placeholder',
    quotationId: data.quotationId || '',
    quotationAmount: Number(data.quotationAmount || finalAmount),
    discountAmount: Number(data.discountAmount || 0),
    finalAmount,
    depositAmount: Number(data.depositAmount || 0),
    paidAmount,
    balanceAmount: Math.max(finalAmount - paidAmount, 0),
    estimatedCost,
    actualCost: Number(data.actualCost || 0),
    grossProfit,
    grossMargin: finalAmount ? grossProfit / finalAmount * 100 : 0,
    paymentStatus: paidAmount >= finalAmount && finalAmount > 0 ? 'paid' : paidAmount > 0 ? 'deposit' : 'unpaid',
    projectStatus: mode === 'draft' ? 'quotation_draft' : (data.projectStatus || 'lead'),
    teamMembers: Array.isArray(data.teamMembers) ? data.teamMembers : String(data.teamMembers || 'ทีมจัดดอกไม้').split(',').map(item => item.trim()).filter(Boolean),
    internalNote: data.internalNote || '',
    createdAt: data.createdAt || now,
    updatedAt: now
  };
}

function validateEvent(event, mode = 'project') {
  if (mode === 'draft') {
    if (!event.customerName && !event.projectName) throw new Error('กรุณากรอกชื่อลูกค้าหรือชื่องานอย่างน้อย 1 ช่อง');
    return;
  }
  if (!event.customerName) throw new Error('กรุณากรอกชื่อลูกค้า');
  if (!event.customerPhone) throw new Error('กรุณากรอกเบอร์โทร');
  if (!event.projectName) throw new Error('กรุณากรอกชื่องาน');
  if (!event.eventType) throw new Error('กรุณาเลือกประเภทงาน');
  if (!event.eventDate) throw new Error('กรุณาเลือกวันที่จัดงาน');
  if (event.finalAmount < 0) throw new Error('ยอดเสนอราคาต้องไม่ติดลบ');
  if (event.depositAmount > event.finalAmount) throw new Error('ยอดมัดจำห้ามมากกว่ายอดสุทธิ');
  if (event.paidAmount > event.finalAmount) throw new Error('ยอดชำระแล้วห้ามมากกว่ายอดสุทธิ');
}

function nextEventNo(events) {
  const date = new Date().toISOString().slice(0, 7).replace('-', '');
  return `EV-${date}-${String(events.length + 1).padStart(3, '0')}`;
}
