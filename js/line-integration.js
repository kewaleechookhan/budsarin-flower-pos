import { logNotification, loadNotificationLogs } from './notification-log.js';
import { loadStoreProfile } from './settings-service.js';
import { STORAGE_KEYS, readStorage, writeStorage } from './storage-registry.js';
import { showToast } from './utils.js';
import { apiSendLine } from './api-client.js';

export const defaultLineSettings = {
  lineIntegrationEnabled: false,
  lineChannelId: '',
  lineOaName: 'Budsarin Flower',
  lineWebhookUrl: '',
  lineNotifyOrderStatus: true,
  lineNotifyPaymentReminder: true,
  lineNotifyImportantDates: true
};

export const defaultLineTemplates = [
  ['order_status', 'แจ้งสถานะออเดอร์', 'สวัสดีค่ะ {customerName} ออเดอร์ {orderNo} ตอนนี้สถานะคือ {status} - {storeName}'],
  ['pickup_reminder', 'แจ้งเตือนรับสินค้า', 'คุณ {customerName} รับสินค้า {orderNo} ได้เวลา {pickupTime} ค่ะ'],
  ['balance_due', 'แจ้งยอดคงเหลือ', 'ยอดคงเหลือ {amount} สำหรับ {orderNo} กรุณาชำระภายใน {dueDate} Ref: {paymentRef}'],
  ['event_deposit', 'แจ้งมัดจำ Event', 'งาน {eventName} มียอดมัดจำ {amount} กรุณายืนยันภายใน {dueDate}'],
  ['birthday_offer', 'แจ้งเตือนวันเกิด', 'สุขสันต์วันเกิดค่ะ {customerName} จาก {storeName}'],
  ['thank_you', 'ขอบคุณหลังการซื้อ', 'ขอบคุณที่ไว้วางใจ {storeName} ค่ะ คุณ {customerName}'],
  ['event_followup', 'Follow-up หลังงาน Event', 'ขอบคุณสำหรับงาน {eventName} ค่ะ หากต้องการปรับปรุงเพิ่มเติมแจ้งได้เลย'],
  ['quotation_notice', 'แจ้งใบเสนอราคา', 'ส่งใบเสนอราคาสำหรับ {eventName} ยอด {amount} แล้วค่ะ']
].map(([templateKey, templateName, messageText]) => ({
  id: `line-template-${templateKey}`,
  templateKey,
  templateName,
  channel: 'line',
  messageText,
  variables: Array.from(messageText.matchAll(/\{([^}]+)\}/g)).map(match => match[1]),
  enabled: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
}));

export function loadLineSettings() {
  return { ...defaultLineSettings, ...readStorage(STORAGE_KEYS.lineSettings, {}) };
}

export function saveLineSettings(settings) {
  const next = { ...loadLineSettings(), ...settings };
  delete next.lineChannelAccessToken;
  writeStorage(STORAGE_KEYS.lineSettings, next);
  return next;
}

export function loadLineTemplates() {
  const saved = readStorage(STORAGE_KEYS.lineMessageTemplates, null);
  if (Array.isArray(saved) && saved.length) return saved;
  writeStorage(STORAGE_KEYS.lineMessageTemplates, defaultLineTemplates);
  return defaultLineTemplates;
}

export function saveLineTemplates(templates) {
  return writeStorage(STORAGE_KEYS.lineMessageTemplates, templates);
}

export function renderMessageTemplate(template, variables = {}) {
  const profile = loadStoreProfile();
  const merged = { storeName: profile.storeNameEn || 'Budsarin Flower', ...variables };
  return String(template.messageText || '').replace(/\{([^}]+)\}/g, (_, key) => merged[key] ?? `{${key}}`);
}

export function previewLineMessage(templateKey, variables = {}) {
  const template = loadLineTemplates().find(item => item.templateKey === templateKey) || loadLineTemplates()[0];
  return renderMessageTemplate(template, variables);
}

export function sendLineMessagePlaceholder({ customerId = '', templateKey = 'thank_you', variables = {}, sourceType = '', sourceId = '' } = {}) {
  const message = previewLineMessage(templateKey, variables);
  const log = logNotification({ customerId, channel: 'line', templateKey, message, status: 'queued', sourceType, sourceId, errorMessage: 'LINE OA API ยังไม่ได้เปิดใช้งาน กรุณาตั้งค่า Channel Access Token ใน Production' });
  apiSendLine({ to: variables.lineUserId || customerId, message, sourceType, sourceId })
    .then(result => showToast(result.status === 'sent' ? 'ส่ง LINE ผ่าน backend แล้ว' : 'LINE backend ยังขาด token/config'))
    .catch(() => showToast('LINE OA API ยังไม่ได้เปิดใช้งาน กรุณาตั้งค่า Channel Access Token ใน Production'));
  return log;
}

export async function copyMessageToClipboard(message) {
  await navigator.clipboard?.writeText(message);
  showToast('Copy LINE message แล้ว');
}

export function getNotificationLogsForSettings() {
  return loadNotificationLogs();
}
