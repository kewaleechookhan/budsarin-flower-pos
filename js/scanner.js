import { loadCustomers } from './customers-service.js';
import { loadOrders } from './orders-service.js';
import { products } from './products-data.js';
import { loadPosState } from './storage.js';
import { showToast } from './utils.js';

let stream = null;
let torchEnabled = false;

export function openScanner() {
  let modal = document.getElementById('scannerModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'scannerModal';
    modal.className = 'modal-overlay scanner-overlay';
    document.body.appendChild(modal);
  }
  modal.hidden = false;
  modal.innerHTML = `<section class="modal scanner-modal" role="dialog" aria-modal="true" aria-labelledby="scannerTitle">
    <button class="icon-button modal-close" data-close-scanner type="button" aria-label="ปิด">×</button>
    <p class="eyebrow">Barcode / QR Scanner</p><h3 id="scannerTitle">สแกนรหัส Budsarin</h3>
    <div class="scanner-stage"><video id="scannerVideo" muted playsinline></video><div class="scanner-frame"></div></div>
    <p class="settings-warning" id="scannerMessage">กล้องจะถูกขอสิทธิ์เฉพาะตอนเปิด Scanner เท่านั้น</p>
    <div class="inline-fields"><input id="manualScanInput" inputmode="text" placeholder="เช่น BF-ORDER-ORD-20260706-001"><button class="primary-button" data-manual-scan type="button">ค้นหา</button></div>
    <div class="qr-actions"><button class="soft-button" data-camera-start type="button">เปิดกล้อง</button><button class="soft-button" data-flashlight-toggle type="button">ไฟฉาย</button></div>
    <div id="scanResult" class="scan-result"></div>
  </section>`;
}

export function closeScanner() {
  if (stream) stream.getTracks().forEach(track => track.stop());
  stream = null;
  torchEnabled = false;
  const modal = document.getElementById('scannerModal');
  if (modal) modal.hidden = true;
}

export async function requestCameraPermission() {
  const message = document.getElementById('scannerMessage');
  try {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('Browser นี้ยังไม่รองรับ Camera API');
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    document.getElementById('scannerVideo').srcObject = stream;
    await document.getElementById('scannerVideo').play();
    message.textContent = 'เปิดกล้องแล้ว: V1 ใช้ manual fallback สำหรับอ่านรหัสจริง';
    showToast('เปิดกล้องสำหรับ Scanner แล้ว');
  } catch (error) {
    message.textContent = `ไม่สามารถเปิดกล้องได้: ${error.message}`;
    showToast('ไม่สามารถเปิดกล้องได้ ใช้ manual input แทน', 'error');
  }
}

export function parseBudsarinCode(value = '') {
  const text = value.trim();
  const patterns = [
    ['product', /^BF-PRODUCT-(.+)$/],
    ['order', /^BF-ORDER-(.+)$/],
    ['receipt', /^BF-RECEIPT-(.+)$/],
    ['customer', /^BF-CUSTOMER-(.+)$/],
    ['inventory', /^BF-STOCK-(.+)$/],
    ['purchase_order', /^BF-PO-(.+)$/]
  ];
  const match = patterns.map(([type, regex]) => [type, text.match(regex)]).find(([, result]) => result);
  return match ? { type: match[0], id: match[1][1], raw: text } : { type: 'unknown', id: text, raw: text };
}

export function lookupScannedEntity(code) {
  const parsed = typeof code === 'string' ? parseBudsarinCode(code) : code;
  if (parsed.type === 'product') return { parsed, item: products.find(item => item.id === parsed.id) };
  if (parsed.type === 'order') return { parsed, item: loadOrders().find(item => item.orderNo === parsed.id || item.id === parsed.id) };
  if (parsed.type === 'receipt') return { parsed, item: loadPosState().sales.find(item => item.saleNo === parsed.id || item.id === parsed.id) };
  if (parsed.type === 'customer') return { parsed, item: loadCustomers().find(item => item.customerCode === parsed.id || item.id === parsed.id) };
  return { parsed, item: null };
}

export function handleScanResult(value) {
  const result = lookupScannedEntity(value);
  const target = document.getElementById('scanResult');
  if (target) {
    target.innerHTML = result.item
      ? `<div class="settings-success"><strong>พบข้อมูล ${result.parsed.type}</strong><span>${result.item.name || result.item.title || result.item.customerName || result.item.saleNo || result.parsed.id}</span></div>`
      : `<div class="settings-warning"><strong>ไม่พบข้อมูล</strong><span>${result.parsed.raw}</span></div>`;
  }
  showToast(result.item ? 'Scan success' : 'ไม่พบข้อมูลจากรหัสนี้');
  return result;
}

export async function toggleFlashlight() {
  const track = stream?.getVideoTracks?.()[0];
  if (!track) {
    showToast('กรุณาเปิดกล้องก่อนใช้ไฟฉาย');
    return;
  }
  const capabilities = track.getCapabilities?.() || {};
  if (!capabilities.torch) {
    showToast('อุปกรณ์หรือ browser นี้ยังไม่รองรับไฟฉาย');
    return;
  }
  try {
    torchEnabled = !torchEnabled;
    await track.applyConstraints({ advanced: [{ torch: torchEnabled }] });
    showToast(torchEnabled ? 'เปิดไฟฉายแล้ว' : 'ปิดไฟฉายแล้ว');
  } catch {
    showToast('ไม่สามารถควบคุมไฟฉายจาก browser นี้ได้');
  }
}

export function initScanner() {
  document.addEventListener('click', event => {
    if (event.target.closest('[data-open-scanner]')) openScanner();
    if (event.target.closest('[data-close-scanner]')) closeScanner();
    if (event.target.closest('[data-camera-start]')) requestCameraPermission();
    if (event.target.closest('[data-flashlight-toggle]')) toggleFlashlight();
    if (event.target.closest('[data-manual-scan]')) handleScanResult(document.getElementById('manualScanInput').value);
  });
}
