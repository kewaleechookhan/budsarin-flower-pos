import { defaultChecklistSections } from './events-data.js';
import { readStorage, writeStorage, STORAGE_KEYS } from './storage-registry.js';

const KEY = STORAGE_KEYS.eventChecklists;

export function loadEventChecklists() {
  const saved = readStorage(KEY, null);
  if (Array.isArray(saved)) return saved;
  writeStorage(KEY, []);
  return [];
}

export const saveEventChecklists = rows => writeStorage(KEY, rows);

export function generateDefaultChecklist(event) {
  return Object.entries(defaultChecklistSections).flatMap(([section, tasks]) => tasks.map((taskName, index) => ({
    id: `${event.id}-${section}-${index}`.replace(/\s/g, '-'),
    eventId: event.id,
    section,
    taskName,
    assignedTo: index % 2 ? 'ทีมจัดดอกไม้' : 'ผู้จัดการร้าน',
    dueDate: event.setupDate,
    isDone: false,
    completedAt: '',
    note: ''
  })));
}

export function toggleChecklistTask(id) {
  const rows = loadEventChecklists();
  const item = rows.find(row => row.id === id);
  if (!item) return null;
  item.isDone = !item.isDone;
  item.completedAt = item.isDone ? new Date().toISOString() : '';
  saveEventChecklists(rows);
  return item;
}

export const calculateChecklistProgress = eventId => {
  const rows = loadEventChecklists().filter(item => item.eventId === eventId);
  return rows.length ? Math.round(rows.filter(item => item.isDone).length / rows.length * 100) : 0;
};

export const filterChecklistBySection = (eventId, section) => loadEventChecklists().filter(item => item.eventId === eventId && (!section || item.section === section));
