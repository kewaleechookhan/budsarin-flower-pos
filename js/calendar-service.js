import { calendarStatuses, defaultCalendarSettings, sourceTypes } from './calendar-data.js';

const EVENT_KEY = 'budsarin_calendar_events';
const SETTINGS_KEY = 'budsarin_calendar_settings';

export const todayKey = () => new Date().toISOString().slice(0, 10);

export function loadCalendarEvents() {
  return loadArray(EVENT_KEY, []).map(event => ({ ...event, status: inferStatus(event) }));
}

export function saveCalendarEvents(events) {
  localStorage.setItem(EVENT_KEY, JSON.stringify(events));
  window.dispatchEvent(new CustomEvent('calendar:update', { detail: events }));
  return events;
}

export function loadCalendarSettings() {
  try {
    return { ...defaultCalendarSettings, ...(JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {}) };
  } catch {
    return { ...defaultCalendarSettings };
  }
}

export function saveCalendarSettings(settings) {
  const next = { ...loadCalendarSettings(), ...settings };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  return next;
}

export function upsertCalendarEvents(incoming = []) {
  const existing = loadCalendarEvents();
  incoming.forEach(item => {
    const key = uniqueKey(item);
    const index = existing.findIndex(row => uniqueKey(row) === key);
    if (index >= 0) existing[index] = { ...existing[index], ...item, updatedAt: new Date().toISOString() };
    else existing.push({ id: crypto.randomUUID(), calendarNo: `CAL-${String(existing.length + 1).padStart(4, '0')}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), ...item });
  });
  return saveCalendarEvents(existing);
}

export function filterCalendarEvents(filters = {}, events = loadCalendarEvents()) {
  return events.filter(event => {
    if (filters.date && event.startDate !== filters.date) return false;
    if (filters.sourceType && filters.sourceType !== 'all' && event.sourceType !== filters.sourceType) return false;
    if (filters.eventType && filters.eventType !== 'all' && event.eventType !== filters.eventType) return false;
    if (filters.status && filters.status !== 'all' && event.status !== filters.status) return false;
    if (filters.priority && filters.priority !== 'all' && event.priority !== filters.priority) return false;
    if (filters.customer && !String(event.customerName || '').toLowerCase().includes(filters.customer.toLowerCase())) return false;
    if (filters.location && !String(event.location || '').toLowerCase().includes(filters.location.toLowerCase())) return false;
    return true;
  });
}

export function getTodayEvents(events = loadCalendarEvents(), date = todayKey()) {
  return events.filter(event => event.startDate === date);
}

export function getWeekEvents(anchor = new Date(), events = loadCalendarEvents()) {
  const start = startOfWeek(anchor);
  const dates = Array.from({ length: 7 }, (_, index) => toDateKey(addDays(start, index)));
  return dates.map(date => ({ date, events: events.filter(event => event.startDate === date) }));
}

export function getMonthMatrix(anchor = new Date(), events = loadCalendarEvents()) {
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const start = startOfWeek(first);
  return Array.from({ length: 42 }, (_, index) => {
    const date = toDateKey(addDays(start, index));
    return { date, inMonth: date.slice(0, 7) === toDateKey(first).slice(0, 7), today: date === todayKey(), events: events.filter(event => event.startDate === date) };
  });
}

export function getCalendarKpis(events = loadCalendarEvents(), date = todayKey()) {
  const today = getTodayEvents(events, date);
  return {
    todayCount: today.length,
    urgentCount: events.filter(item => item.priority === 'urgent' && item.status !== 'done').length,
    deliveryCount: today.filter(item => item.eventType === 'delivery').length,
    eventSetupCount: today.filter(item => item.sourceType === 'event_project').length,
    followUpToday: today.filter(item => item.eventType === 'follow_up').length,
    paymentDue: today.filter(item => item.eventType === 'payment_due').length,
    useSoon: today.filter(item => ['stock_use_soon', 'stock_expiry'].includes(item.eventType)).length,
    overdue: events.filter(item => item.status === 'overdue').length
  };
}

export function getCalendarAlerts(events = loadCalendarEvents()) {
  const now = new Date();
  const inHour = new Date(now.getTime() + 60 * 60 * 1000);
  const tomorrow = toDateKey(addDays(now, 1));
  return [
    ...events.filter(item => item.status === 'overdue').map(item => alert('งานที่เลยเวลาแล้ว', item)),
    ...events.filter(item => item.startDate === todayKey() && item.startTime && toDate(item) >= now && toDate(item) <= inHour).map(item => alert('งานที่ใกล้ถึงใน 1 ชั่วโมง', item)),
    ...events.filter(item => item.startDate === tomorrow && item.eventType === 'setup').map(item => alert('Event Setup พรุ่งนี้', item)),
    ...events.filter(item => item.sourceType === 'order' && item.eventType === 'preparation' && item.status === 'pending').map(item => alert('ออเดอร์ที่ยังไม่ได้เตรียม', item)),
    ...events.filter(item => ['birthday', 'anniversary'].includes(item.eventType) && item.startDate >= todayKey()).slice(0, 3).map(item => alert('ลูกค้าวันสำคัญใกล้ถึง', item)),
    ...events.filter(item => item.eventType === 'payment_due' && item.startDate <= tomorrow).map(item => alert('ครบกำหนดชำระ', item))
  ].slice(0, 10);
}

export function updateCalendarEventStatus(id, status) {
  const events = loadCalendarEvents();
  const event = events.find(item => item.id === id);
  if (!event) throw new Error('ไม่พบงานในปฏิทิน');
  event.status = status;
  event.updatedAt = new Date().toISOString();
  syncStatusToSource(event, status);
  saveCalendarEvents(events);
  return event;
}

export function rescheduleCalendarEvent(id, date, time) {
  const events = loadCalendarEvents();
  const event = events.find(item => item.id === id);
  if (!event) throw new Error('ไม่พบงานในปฏิทิน');
  event.startDate = date || event.startDate;
  event.endDate = date || event.endDate;
  event.startTime = time || event.startTime;
  event.updatedAt = new Date().toISOString();
  saveCalendarEvents(events);
  return event;
}

export function getDashboardSchedule(fallback = []) {
  const today = getTodayEvents().filter(item => item.status !== 'done').sort(sortByTime);
  if (!today.length) return fallback;
  return today.slice(0, 6).map(item => ({
    id: item.id,
    time: item.allDay ? 'ทั้งวัน' : item.startTime || '--:--',
    type: item.title,
    customer: item.customerName || sourceTypes[item.sourceType]?.label || 'Calendar',
    status: item.status === 'done' ? 'completed' : item.status === 'in_progress' ? 'preparing' : item.status === 'overdue' ? 'pending' : 'ready',
    note: `${sourceTypes[item.sourceType]?.label || item.sourceType} • ${item.location || '-'}`
  }));
}

export function getQuickFilteredEvents(type) {
  const events = loadCalendarEvents();
  const today = todayKey();
  const map = {
    today: event => event.startDate === today,
    urgent: event => event.priority === 'urgent',
    delivery: event => event.eventType === 'delivery',
    event: event => event.sourceType === 'event_project',
    followup: event => event.eventType === 'follow_up',
    payment: event => event.eventType === 'payment_due',
    inventory: event => ['stock_use_soon', 'stock_expiry'].includes(event.eventType),
    overdue: event => event.status === 'overdue'
  };
  return events.filter(map[type] || (() => true));
}

export function sortByTime(a, b) {
  if (a.status === 'overdue' && b.status !== 'overdue') return -1;
  if (b.status === 'overdue' && a.status !== 'overdue') return 1;
  return String(a.startTime || '99:99').localeCompare(String(b.startTime || '99:99'));
}

function syncStatusToSource(event, status) {
  if (event.sourceType === 'customer_followup' && status === 'done') updateArrayItem('budsarin_customer_followups', event.sourceId, { status: 'done', completedAt: new Date().toISOString() });
  if (event.sourceType === 'manual_task') updateArrayItem('budsarin_manual_tasks', event.sourceId, { status, updatedAt: new Date().toISOString() });
  if (event.sourceType === 'order') {
    const orderStatus = event.eventType === 'preparation' && status === 'in_progress' ? 'preparing' : status === 'done' && ['pickup', 'delivery'].includes(event.eventType) ? 'completed' : '';
    if (orderStatus) updateArrayItem('budsarin_orders', event.sourceId, { orderStatus, updatedAt: new Date().toISOString() });
  }
}

function updateArrayItem(key, id, patch) {
  try {
    const rows = JSON.parse(localStorage.getItem(key)) || [];
    const index = rows.findIndex(item => item.id === id || item.orderNo === id);
    if (index >= 0) {
      rows[index] = { ...rows[index], ...patch };
      localStorage.setItem(key, JSON.stringify(rows));
    }
  } catch {}
}

function inferStatus(event) {
  if (['done', 'cancelled'].includes(event.status)) return event.status;
  if (event.startDate < todayKey()) return 'overdue';
  return event.status || 'pending';
}

function uniqueKey(event) {
  return `${event.sourceType}:${event.sourceId}:${event.eventType}:${event.startDate}`;
}

function loadArray(key, fallback = []) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key));
    return Array.isArray(parsed) ? parsed : [...fallback];
  } catch {
    return [...fallback];
  }
}

function startOfWeek(date) {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function toDateKey(date) {
  return date.toISOString().slice(0, 10);
}

function toDate(event) {
  return new Date(`${event.startDate}T${event.startTime || '23:59'}:00`);
}

function alert(title, event) {
  return { id: `${title}-${event.id}`, title, event };
}
