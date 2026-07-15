import { defaultQuotationItems, mockEventProjects } from './events-data.js';
import { calculateQuotationTotal } from './event-calculations.js';
import { readStorage, writeStorage, STORAGE_KEYS } from './storage-registry.js';

const KEY = STORAGE_KEYS.eventQuotations;

export function loadEventQuotations() {
  const saved = readStorage(KEY, null);
  if (Array.isArray(saved) && saved.length) return saved;
  const rows = mockEventProjects.map((event, index) => createQuotationFromEvent(event, `quotation-${index + 1}`));
  writeStorage(KEY, rows);
  return rows;
}

export const saveEventQuotations = rows => writeStorage(KEY, rows);

export function createQuotation(event, items = defaultQuotationItems) {
  const rows = loadEventQuotations();
  const quote = createQuotationFromEvent(event, crypto.randomUUID(), items);
  rows.unshift(quote);
  saveEventQuotations(rows);
  return quote;
}

export function updateQuotationStatus(id, status) {
  const rows = loadEventQuotations();
  const quote = rows.find(item => item.id === id);
  if (!quote) return null;
  quote.quotationStatus = status;
  quote.updatedAt = new Date().toISOString();
  saveEventQuotations(rows);
  return quote;
}

export function deleteQuotation(id) {
  saveEventQuotations(loadEventQuotations().filter(item => item.id !== id));
}

export function createQuotationFromEvent(event, id = crypto.randomUUID(), items = defaultQuotationItems) {
  const totals = calculateQuotationTotal({ items, discountType: 'baht', discountValue: event.discountAmount || 0 });
  return {
    id,
    quotationNo: `QT-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${String(Date.now()).slice(-4)}`,
    eventId: event.id,
    customerName: event.customerName,
    customerPhone: event.customerPhone,
    projectName: event.projectName,
    eventDate: event.eventDate,
    venueName: event.venueName,
    items: structuredClone(items),
    subtotal: totals.subtotal,
    discountType: 'baht',
    discountValue: event.discountAmount || 0,
    discountAmount: totals.discountAmount,
    taxRate: 0,
    taxAmount: totals.taxAmount,
    serviceChargeRate: 0,
    serviceChargeAmount: totals.serviceChargeAmount,
    totalAmount: event.finalAmount || totals.totalAmount,
    depositRequired: event.depositAmount || Math.round((event.finalAmount || totals.totalAmount) * 0.3),
    paymentTerms: 'มัดจำ 30% ก่อนเริ่มงาน ส่วนที่เหลือก่อนวันงาน',
    validUntil: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    quotationStatus: event.projectStatus === 'quotation_sent' ? 'sent' : 'draft',
    note: 'ราคานี้ยังไม่รวมรายการเพิ่มเติมนอกเหนือจากที่ระบุ',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}
