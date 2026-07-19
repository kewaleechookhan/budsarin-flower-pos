import { readStorage, writeStorage, STORAGE_KEYS } from './storage-registry.js';
import { calculateEventPaidAmount } from './event-calculations.js';

const KEY = STORAGE_KEYS.eventPayments;
const INCOME_KEY = STORAGE_KEYS.incomeTransactions;

export function loadEventPayments() {
  return readStorage(KEY, []);
}

export const saveEventPayments = rows => writeStorage(KEY, rows);

export function createPaymentSchedule(event) {
  const total = Number(event.finalAmount || 0);
  const rows = [
    ['มัดจำ 30%', 0.3, event.setupDate],
    ['งวดก่อนวันงาน 50%', 0.5, event.eventDate],
    ['งวดหลังจบงาน 20%', 0.2, event.teardownDate]
  ];
  return rows.map((row, index) => ({
    id: `${event.id}-pay-${index + 1}`,
    eventId: event.id,
    paymentNo: index + 1,
    paymentName: row[0],
    dueDate: row[2],
    amount: Math.round(total * row[1]),
    paidAmount: index === 0 ? Number(event.paidAmount || 0) : 0,
    paymentMethod: 'transfer',
    paymentStatus: index === 0 && Number(event.paidAmount || 0) > 0 ? 'paid' : 'unpaid',
    paidAt: index === 0 && Number(event.paidAmount || 0) > 0 ? new Date().toISOString() : '',
    note: ''
  }));
}

export function ensureEventPayments(events) {
  const current = loadEventPayments();
  const missing = events.filter(event => !current.some(payment => payment.eventId === event.id));
  if (missing.length) saveEventPayments([...current, ...missing.flatMap(createPaymentSchedule)]);
  return loadEventPayments();
}

export function recordEventPayment(event, amount, method = 'transfer', note = '') {
  const payments = ensureEventPayments([event]);
  let target = payments.find(item => item.eventId === event.id && item.paymentStatus !== 'paid') || payments.find(item => item.eventId === event.id);
  if (!target) {
    target = createPaymentSchedule(event)[0];
    payments.push(target);
  }
  target.paidAmount = Math.min(Number(target.amount || 0), Number(target.paidAmount || 0) + Number(amount || 0));
  target.paymentMethod = method;
  target.paymentStatus = target.paidAmount >= target.amount ? 'paid' : 'partial';
  target.paidAt = new Date().toISOString();
  target.note = note;
  saveEventPayments(payments);
  syncEventPaymentToFinance(event, target);
  return target;
}

export function syncEventPaymentToFinance(event, payment) {
  const income = readStorage(INCOME_KEY, []);
  const sourceId = `${event.id}-${payment.id}`;
  const existing = income.find(item => item.sourceType === 'event' && item.sourceId === sourceId);
  if (existing) {
    existing.amount = Number(payment.paidAmount || 0);
    existing.paymentMethod = payment.paymentMethod;
    existing.paymentStatus = 'paid';
    existing.updatedAt = new Date().toISOString();
    writeStorage(INCOME_KEY, income);
    window.dispatchEvent(new CustomEvent('finance:update', { detail: existing }));
    return existing;
  }
  const item = {
    id: crypto.randomUUID(),
    transactionNo: `EV-INC-${String(income.length + 1).padStart(4, '0')}`,
    date: new Date().toISOString().slice(0, 10),
    description: `${payment.paymentName} • ${event.projectName}`,
    category: payment.paymentName.includes('มัดจำ') ? 'ค่ามัดจำ' : 'งานจัดสถานที่',
    amount: Number(payment.paidAmount || 0),
    paymentMethod: payment.paymentMethod,
    paymentStatus: 'paid',
    sourceType: 'event',
    sourceId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  income.unshift(item);
  writeStorage(INCOME_KEY, income);
  window.dispatchEvent(new CustomEvent('finance:update', { detail: item }));
  return item;
}

export const detectOverdueEventPayments = () => loadEventPayments().filter(item => item.paymentStatus !== 'paid' && item.dueDate < new Date().toISOString().slice(0, 10));
export const getEventPaidAmount = eventId => calculateEventPaidAmount(loadEventPayments().filter(item => item.eventId === eventId));
