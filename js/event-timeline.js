import { readStorage, writeStorage, STORAGE_KEYS } from './storage-registry.js';

const KEY = STORAGE_KEYS.eventTimelines;

export function loadEventTimelines() {
  const saved = readStorage(KEY, null);
  if (Array.isArray(saved)) return saved;
  writeStorage(KEY, []);
  return [];
}

export const saveEventTimelines = rows => writeStorage(KEY, rows);

export function addTimelineItem(data) {
  const rows = loadEventTimelines();
  const item = { id: crypto.randomUUID(), status: 'pending', assignedTo: 'ทีมร้าน', ...data };
  rows.unshift(item);
  saveEventTimelines(rows);
  return item;
}

export function updateTimelineStatus(id, status) {
  const rows = loadEventTimelines();
  const item = rows.find(row => row.id === id);
  if (!item) return null;
  item.status = status;
  saveEventTimelines(rows);
  return item;
}

export function generateDefaultTimelineFromEvent(event) {
  return [
    [event.createdAt, 'รับข้อมูลลูกค้า', 'บันทึก lead และ reference', 'meeting'],
    [`${event.setupDate}T${event.setupTime}:00.000Z`, 'Setup งาน', `ติดตั้งที่ ${event.venueName}`, 'setup'],
    [`${event.eventDate}T${event.eventStartTime}:00.000Z`, 'วันจัดงาน', event.projectName, 'event'],
    [`${event.teardownDate}T${event.teardownTime}:00.000Z`, 'รื้อถอน', 'เก็บอุปกรณ์และตรวจความเรียบร้อย', 'teardown']
  ].map((row, index) => ({
    id: `${event.id}-timeline-${index + 1}`,
    eventId: event.id,
    datetime: row[0],
    title: row[1],
    description: row[2],
    type: row[3],
    status: index === 0 ? 'done' : 'pending',
    assignedTo: index === 1 ? 'ทีมติดตั้ง' : 'ทีมร้าน'
  }));
}
