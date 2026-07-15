import { STORAGE_KEYS, readStorage, writeStorage } from './storage-registry.js';
import { currency, showToast } from './utils.js';
import { showQRPreview } from './qr-service.js';
import { apiCreatePaymentQR } from './api-client.js';

export function createPaymentQRCodePlaceholder({ amount = 0, customerName = 'ลูกค้า', sourceType = 'manual', sourceId = '' } = {}) {
  const refNo = `PAY-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${String(Date.now()).slice(-5)}`;
  const item = { id: crypto.randomUUID(), refNo, amount: Number(amount) || 0, customerName, sourceType, sourceId, expiresAt: new Date(Date.now() + 30 * 60000).toISOString(), status: 'pending', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  const rows = readStorage(STORAGE_KEYS.paymentQrPlaceholders, []);
  rows.unshift(item);
  writeStorage(STORAGE_KEYS.paymentQrPlaceholders, rows.slice(0, 80));
  return item;
}

export function markQRCodeAsPaid(id) {
  return updatePayment(id, { status: 'paid', paidAt: new Date().toISOString() });
}

export function expirePaymentQRCode(id) {
  return updatePayment(id, { status: 'expired' });
}

export async function copyPaymentReference(refNo) {
  await navigator.clipboard?.writeText(refNo);
  showToast('Copy payment ref แล้ว');
}

export function openPaymentQRModal(seed = {}) {
  const item = createPaymentQRCodePlaceholder(seed);
  showPaymentModal(item);
  apiCreatePaymentQR({ amount: item.amount, refNo: item.refNo, sourceType: item.sourceType, sourceId: item.sourceId })
    .then(serverItem => showPaymentModal({ ...item, providerPayload: serverItem.payload, status: serverItem.status }))
    .catch(() => {});
}

export function initQRPayment() {
  document.addEventListener('click', event => {
    const openBtn = event.target.closest('[data-open-payment-qr]');
    if (openBtn) openPaymentQRModal({
      amount: Number(openBtn.dataset.paymentAmount) || 0,
      customerName: openBtn.dataset.paymentCustomer || 'ลูกค้าหน้าร้าน',
      sourceType: openBtn.dataset.paymentSourceType || 'manual',
      sourceId: openBtn.dataset.paymentSourceId || ''
    });
    const paid = event.target.closest('[data-payment-paid]')?.dataset.paymentPaid;
    const expired = event.target.closest('[data-payment-expire]')?.dataset.paymentExpire;
    const copy = event.target.closest('[data-payment-copy]')?.dataset.paymentCopy;
    const preview = event.target.closest('[data-payment-preview]')?.dataset.paymentPreview;
    if (event.target.closest('[data-close-payment]')) document.getElementById('paymentQRModal').hidden = true;
    if (paid) { showPaymentModal(markQRCodeAsPaid(paid)); showToast('Mark as paid แล้ว'); }
    if (expired) { showPaymentModal(expirePaymentQRCode(expired)); showToast('Expire QR แล้ว'); }
    if (copy) copyPaymentReference(copy);
    if (preview) showQRPreview(`BF-PAYMENT-${preview}`, 'QR Payment Placeholder');
  });
}

function showPaymentModal(item) {
  let modal = document.getElementById('paymentQRModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'paymentQRModal';
    modal.className = 'modal-overlay';
    document.body.appendChild(modal);
  }
  modal.hidden = false;
  modal.innerHTML = `<section class="modal qr-payment-modal" role="dialog" aria-modal="true" aria-labelledby="paymentQRTitle">
    <button class="icon-button modal-close" data-close-payment type="button" aria-label="ปิด">×</button>
    <p class="eyebrow">โหมดจำลองการชำระเงิน</p><h3 id="paymentQRTitle">QR รับชำระเงิน</h3>
    <div class="settings-metrics"><div><span>ยอดเงิน</span><strong>${currency(item.amount)}</strong></div><div><span>ลูกค้า</span><strong>${item.customerName}</strong></div><div><span>สถานะ</span><strong>${item.status}</strong></div><div><span>หมดอายุ</span><strong>${item.expiresAt.slice(11, 16)}</strong></div></div>
    <code>${item.refNo}</code>
    <p class="settings-warning">${item.providerPayload ? 'สร้าง payment payload จาก backend แล้ว โปรดตรวจ PromptPay/Provider config ก่อนรับเงินจริง' : 'เป็น QR Payment Placeholder ยังไม่เชื่อมธนาคารจริง'}</p>
    <div class="qr-actions"><button class="primary-button" data-payment-preview="${item.refNo}" type="button">ดู QR</button><button class="soft-button" data-payment-copy="${item.refNo}" type="button">Copy Ref</button><button class="primary-button" data-payment-paid="${item.id}" type="button">Mark as Paid</button><button class="danger-button" data-payment-expire="${item.id}" type="button">Expire</button></div>
  </section>`;
}

function updatePayment(id, patch) {
  const rows = readStorage(STORAGE_KEYS.paymentQrPlaceholders, []);
  const index = rows.findIndex(item => item.id === id);
  if (index < 0) return null;
  rows[index] = { ...rows[index], ...patch, updatedAt: new Date().toISOString() };
  writeStorage(STORAGE_KEYS.paymentQrPlaceholders, rows);
  return rows[index];
}
