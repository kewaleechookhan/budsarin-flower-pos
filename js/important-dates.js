import { mockImportantDates } from './customers-data.js';

const IMPORTANT_KEY = 'budsarin_customer_important_dates';

export const loadImportantDates = () => loadArray(IMPORTANT_KEY, mockImportantDates);
export const saveImportantDates = dates => localStorage.setItem(IMPORTANT_KEY, JSON.stringify(dates));

export function addImportantDate(data) {
  const dates = loadImportantDates();
  const item = { id: crypto.randomUUID(), reminderDaysBefore: 7, isRecurring: true, lastReminderSent: '', note: '', createdAt: new Date().toISOString(), ...data };
  dates.unshift(item);
  saveImportantDates(dates);
  return item;
}

export function editImportantDate(id, data) {
  const dates = loadImportantDates();
  const index = dates.findIndex(item => item.id === id);
  if (index >= 0) dates[index] = { ...dates[index], ...data };
  saveImportantDates(dates);
  return dates[index];
}

export function deleteImportantDate(id) {
  saveImportantDates(loadImportantDates().filter(item => item.id !== id));
}

export function getUpcomingImportantDates(days = 30, today = new Date()) {
  return loadImportantDates().map(item => ({ ...item, daysUntil: calculateDaysUntilDate(item.date, today) }))
    .filter(item => item.daysUntil >= 0 && item.daysUntil <= days)
    .sort((a, b) => a.daysUntil - b.daysUntil);
}

export function calculateDaysUntilDate(date, today = new Date()) {
  if (!date) return 9999;
  const current = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const targetRaw = new Date(`${date}T00:00:00`);
  let target = new Date(current.getFullYear(), targetRaw.getMonth(), targetRaw.getDate());
  if (target < current) target = new Date(current.getFullYear() + 1, targetRaw.getMonth(), targetRaw.getDate());
  return Math.ceil((target - current) / 86400000);
}

export function generateImportantDateReminder(item) {
  return `สวัสดีค่ะคุณ ${item.customerName} ใกล้ถึง${item.title}แล้วนะคะ ทางร้าน Budsarin Flower ยินดีช่วยจัดช่อดอกไม้สำหรับโอกาสพิเศษค่ะ`;
}

export function markReminderDone(id) {
  return editImportantDate(id, { lastReminderSent: new Date().toISOString() });
}

function loadArray(key, fallback) {
  try {
    const saved = JSON.parse(localStorage.getItem(key));
    if (Array.isArray(saved)) return saved;
  } catch {}
  localStorage.setItem(key, JSON.stringify(fallback));
  return structuredClone(fallback);
}
