import { upsertCalendarEvents, loadCalendarEvents, saveCalendarEvents, updateCalendarEventStatus, rescheduleCalendarEvent } from './calendar-service.js';

const KEY = 'budsarin_manual_tasks';

export function loadManualTasks() {
  return loadArray(KEY, []);
}

export function saveManualTasks(tasks) {
  localStorage.setItem(KEY, JSON.stringify(tasks));
  return tasks;
}

export function createManualTask(data) {
  const tasks = loadManualTasks();
  const task = normalizeTask(data);
  tasks.unshift(task);
  saveManualTasks(tasks);
  upsertCalendarEvents([manualTaskToEvent(task)]);
  return task;
}

export function editManualTask(id, data) {
  const tasks = loadManualTasks();
  const index = tasks.findIndex(item => item.id === id);
  if (index < 0) throw new Error('ไม่พบ Manual Task');
  tasks[index] = { ...tasks[index], ...data, updatedAt: new Date().toISOString() };
  saveManualTasks(tasks);
  upsertCalendarEvents([manualTaskToEvent(tasks[index])]);
  return tasks[index];
}

export function deleteManualTask(id) {
  saveManualTasks(loadManualTasks().filter(item => item.id !== id));
  saveCalendarEvents(loadCalendarEvents().filter(item => !(item.sourceType === 'manual_task' && item.sourceId === id)));
}

export function completeManualTask(id) {
  const task = editManualTask(id, { status: 'done', completedAt: new Date().toISOString() });
  const event = loadCalendarEvents().find(item => item.sourceType === 'manual_task' && item.sourceId === id);
  if (event) updateCalendarEventStatus(event.id, 'done');
  return task;
}

export function rescheduleManualTask(id, date, time) {
  const task = editManualTask(id, { startDate: date, startTime: time });
  const event = loadCalendarEvents().find(item => item.sourceType === 'manual_task' && item.sourceId === id);
  if (event) rescheduleCalendarEvent(event.id, date, time);
  return task;
}

export function manualTaskToEvent(task) {
  return {
    sourceType: 'manual_task',
    sourceId: task.id,
    title: task.title,
    description: task.description,
    eventType: 'manual',
    startDate: task.startDate,
    startTime: task.startTime,
    endDate: task.startDate,
    endTime: '',
    allDay: !task.startTime,
    location: task.location,
    customerId: '',
    customerName: task.assignedTo || 'ทีมร้าน',
    relatedAmount: 0,
    status: task.status,
    priority: task.priority,
    assignedTo: task.assignedTo,
    reminderEnabled: task.reminderEnabled,
    reminderMinutesBefore: 60,
    colorKey: 'slate',
    note: task.note || ''
  };
}

function normalizeTask(data) {
  return {
    id: data.id || crypto.randomUUID(),
    title: data.title || 'Manual Task',
    description: data.description || '',
    startDate: data.startDate || new Date().toISOString().slice(0, 10),
    startTime: data.startTime || '',
    location: data.location || '',
    priority: data.priority || 'normal',
    assignedTo: data.assignedTo || 'ทีมร้าน',
    reminderEnabled: Boolean(data.reminderEnabled),
    note: data.note || '',
    status: data.status || 'pending',
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

function loadArray(key, fallback) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key));
    return Array.isArray(parsed) ? parsed : [...fallback];
  } catch {
    return [...fallback];
  }
}
