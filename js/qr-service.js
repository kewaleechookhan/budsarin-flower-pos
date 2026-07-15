import { STORAGE_KEYS, readStorage, writeStorage } from './storage-registry.js';
import { showToast } from './utils.js';

export function generateEntityQRCode(entityType, entityId, label = '') {
  const payload = formatPayload(entityType, entityId);
  const record = { id: crypto.randomUUID(), entityType, entityId, payload, label, createdAt: new Date().toISOString() };
  const codes = readStorage(STORAGE_KEYS.qrCodes, []);
  codes.unshift(record);
  writeStorage(STORAGE_KEYS.qrCodes, codes.slice(0, 80));
  return record;
}

export function showQRPreview(recordOrPayload, title = 'QR Preview') {
  const record = typeof recordOrPayload === 'string' ? { payload: recordOrPayload, label: recordOrPayload } : recordOrPayload;
  let modal = document.getElementById('qrPreviewModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'qrPreviewModal';
    modal.className = 'modal-overlay';
    document.body.appendChild(modal);
  }
  modal.hidden = false;
  modal.innerHTML = `<section class="modal qr-modal" role="dialog" aria-modal="true" aria-labelledby="qrPreviewTitle">
    <button class="icon-button modal-close" data-close-qr type="button" aria-label="ปิด">×</button>
    <p class="eyebrow">Phase 15 QR</p><h3 id="qrPreviewTitle">${title}</h3>
    <div class="qr-art" aria-label="${record.payload}">${buildQrArt(record.payload)}</div>
    <code>${record.payload}</code>
    <div class="qr-actions"><button class="primary-button" data-copy-qr="${record.payload}" type="button">Copy Payload</button><button class="soft-button" data-print-qr type="button">Print QR</button></div>
  </section>`;
}

export function downloadQRCode(record) {
  const blob = new Blob([`Budsarin QR Payload\n${record.payload}\n${record.label || ''}`], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${record.payload || 'budsarin-qr'}.txt`;
  link.click();
  URL.revokeObjectURL(url);
  showToast('ดาวน์โหลด QR payload แล้ว');
}

export function printQRCode() {
  window.print();
}

export function initQRService() {
  document.addEventListener('click', async event => {
    const copy = event.target.closest('[data-copy-qr]')?.dataset.copyQr;
    if (event.target.closest('[data-close-qr]')) document.getElementById('qrPreviewModal').hidden = true;
    if (event.target.closest('[data-print-qr]')) printQRCode();
    if (copy) {
      await navigator.clipboard?.writeText(copy);
      showToast('Copy QR payload แล้ว');
    }
  });
}

function formatPayload(type, id) {
  const prefix = { product: 'BF-PRODUCT', order: 'BF-ORDER', receipt: 'BF-RECEIPT', customer: 'BF-CUSTOMER', inventory: 'BF-STOCK', purchase_order: 'BF-PO', event: 'BF-EVENT' }[type] || 'BF-ENTITY';
  return `${prefix}-${id}`;
}

function buildQrArt(text) {
  const seed = Array.from(text).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return Array.from({ length: 121 }, (_, i) => `<span class="${((i * 17 + seed) % 5) < 2 || [0,1,2,11,22,98,108,120].includes(i) ? 'on' : ''}"></span>`).join('');
}
