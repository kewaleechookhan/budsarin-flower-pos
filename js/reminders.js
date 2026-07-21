import { loadCalendarEvents } from './calendar-service.js';

const KEY = 'budsarin_reminders';

export function loadReminders() {
  return loadArray(KEY, []);
}

export function saveReminders(reminders) {
  localStorage.setItem(KEY, JSON.stringify(reminders));
  return reminders;
}

export function generateRemindersFromCalendarEvents(events = loadCalendarEvents()) {
  const reminders = loadReminders();
  events.filter(event => event.reminderEnabled && event.startDate).forEach(event => {
    if (reminders.some(item => item.calendarEventId === event.id)) return;
    reminders.push({
      id: crypto.randomUUID(),
      calendarEventId: event.id,
      sourceType: event.sourceType,
      sourceId: event.sourceId,
      title: event.title,
      remindAt: calculateRemindAt(event),
      priority: event.priority,
      status: 'pending',
      shownAt: '',
      dismissedAt: '',
      snoozedUntil: '',
      createdAt: new Date().toISOString()
    });
  });
  return saveReminders(reminders);
}

export function getDueReminders(reminders = loadReminders()) {
  const now = new Date().toISOString();
  return reminders.filter(item => ['pending', 'snoozed'].includes(item.status) && (item.snoozedUntil || item.remindAt) <= now);
}

export function dismissReminder(id) {
  return updateReminder(id, { status: 'dismissed', dismissedAt: new Date().toISOString() });
}

export function snoozeReminder(id, minutes) {
  const until = new Date(Date.now() + minutes * 60 * 1000).toISOString();
  return updateReminder(id, { status: 'snoozed', snoozedUntil: until });
}

export function markReminderDone(id) {
  return updateReminder(id, { status: 'done', dismissedAt: new Date().toISOString() });
}

function updateReminder(id, patch) {
  const reminders = loadReminders();
  const item = reminders.find(row => row.id === id);
  if (!item) throw new Error('ไม่พบ Reminder');
  Object.assign(item, patch);
  saveReminders(reminders);
  return item;
}

function calculateRemindAt(event) {
  const date = new Date(`${event.startDate}T${event.startTime || '09:00'}:00`);
  date.setMinutes(date.getMinutes() - (Number(event.reminderMinutesBefore) || 60));
  return date.toISOString();
}

function loadArray(key, fallback) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key));
    return Array.isArray(parsed) ? parsed : [...fallback];
  } catch {
    return [...fallback];
  }
}
