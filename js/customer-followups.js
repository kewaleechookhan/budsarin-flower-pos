import { mockFollowUps } from './customers-data.js';

const FOLLOW_KEY = 'budsarin_customer_followups';

export const loadFollowUps = () => loadArray(FOLLOW_KEY, mockFollowUps);
export const saveFollowUps = items => localStorage.setItem(FOLLOW_KEY, JSON.stringify(items));

export function createFollowUp(data) {
  const items = loadFollowUps();
  const item = { id: crypto.randomUUID(), status: 'pending', priority: 'normal', note: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), ...data };
  items.unshift(item);
  saveFollowUps(items);
  return item;
}

export function editFollowUp(id, data) {
  const items = loadFollowUps();
  const index = items.findIndex(item => item.id === id);
  if (index >= 0) items[index] = { ...items[index], ...data, updatedAt: new Date().toISOString() };
  saveFollowUps(items);
  return items[index];
}

export function deleteFollowUp(id) {
  saveFollowUps(loadFollowUps().filter(item => item.id !== id));
}

export function markFollowUpDone(id) {
  return editFollowUp(id, { status: 'done' });
}

export function detectOverdueFollowUps(today = new Date()) {
  const current = today.toISOString().slice(0, 10);
  return loadFollowUps().map(item => item.status === 'pending' && item.dueDate < current ? { ...item, status: 'overdue' } : item);
}

export function getTodayFollowUps(today = new Date()) {
  const current = today.toISOString().slice(0, 10);
  return detectOverdueFollowUps(today).filter(item => item.dueDate === current && item.status !== 'done');
}

export function getUpcomingFollowUps(days = 7, today = new Date()) {
  const end = new Date(today.getTime() + days * 86400000).toISOString().slice(0, 10);
  const current = today.toISOString().slice(0, 10);
  return detectOverdueFollowUps(today).filter(item => item.dueDate >= current && item.dueDate <= end && item.status !== 'done').sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

function loadArray(key, fallback) {
  try {
    const saved = JSON.parse(localStorage.getItem(key));
    if (Array.isArray(saved)) return saved;
  } catch {}
  localStorage.setItem(key, JSON.stringify(fallback));
  return structuredClone(fallback);
}
