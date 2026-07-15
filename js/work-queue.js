import { getTodayEvents, updateCalendarEventStatus } from './calendar-service.js';

const priorityRank = { urgent: 0, high: 1, normal: 2, low: 3 };

export function getDailyWorkQueue(date = new Date().toISOString().slice(0, 10)) {
  return getTodayEvents().filter(item => item.startDate === date && item.status !== 'done' && item.status !== 'cancelled').sort(queueSort).map(item => ({
    ...item,
    nextStep: nextStepFor(item)
  }));
}

export function completeWorkQueueItem(id) {
  return updateCalendarEventStatus(id, 'done');
}

export function saveQueueNote(id, note) {
  const rows = JSON.parse(localStorage.getItem('budsarin_calendar_events') || '[]');
  const item = rows.find(row => row.id === id);
  if (!item) throw new Error('ไม่พบงาน');
  item.note = note;
  item.updatedAt = new Date().toISOString();
  localStorage.setItem('budsarin_calendar_events', JSON.stringify(rows));
  return item;
}

function queueSort(a, b) {
  if (a.status === 'overdue' && b.status !== 'overdue') return -1;
  if (b.status === 'overdue' && a.status !== 'overdue') return 1;
  if ((priorityRank[a.priority] ?? 9) !== (priorityRank[b.priority] ?? 9)) return (priorityRank[a.priority] ?? 9) - (priorityRank[b.priority] ?? 9);
  return String(a.startTime || '99:99').localeCompare(String(b.startTime || '99:99'));
}

function nextStepFor(item) {
  if (item.eventType === 'preparation') return 'เตรียมดอกไม้และเช็ก checklist';
  if (item.eventType === 'delivery') return 'ตรวจสินค้าและออกจัดส่ง';
  if (item.eventType === 'setup') return 'ยืนยันทีมและอุปกรณ์ setup';
  if (item.eventType === 'payment_due') return 'ติดตามยอดชำระ';
  if (item.eventType === 'follow_up') return 'ติดต่อผ่านช่องทางลูกค้า';
  if (item.eventType?.startsWith('stock')) return 'ตรวจ stock และวางแผนใช้ก่อน';
  return 'ดำเนินงานตามรายละเอียด';
}
