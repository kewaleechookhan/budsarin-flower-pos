import { getCurrentDeviceSession } from './device-sessions.js';
import { getSyncStatus, processOfflineQueue } from './offline-queue.js?v=20260719b';
import { openPaymentQRModal } from './qr-payment.js';
import { generateEntityQRCode, showQRPreview } from './qr-service.js';
import { openScanner } from './scanner.js';
import { printTestReceipt } from './receipt-printer.js';
import { initSyncStatus, renderSyncStatus } from './sync-status.js?v=20260717b';
import { showToast } from './utils.js';

let installPrompt = null;
let waitingWorker = null;

export function initPWA() {
  getCurrentDeviceSession();
  renderPwaChrome();
  initSyncStatus();
  bindPwaEvents();
  registerServiceWorker();
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    installPrompt = event;
    renderInstallPrompt();
  });
}

function renderPwaChrome() {
  if (!document.getElementById('pwaStatusRoot')) document.body.insertAdjacentHTML('afterbegin', '<div id="pwaStatusRoot"></div>');
  if (!document.getElementById('pwaInstallRoot')) document.body.insertAdjacentHTML('beforeend', '<div id="pwaInstallRoot"></div>');
  if (!document.getElementById('mobileFab')) {
    document.body.insertAdjacentHTML('beforeend', `
      <div class="mobile-fab" id="mobileFab">
        <button class="primary-button fab-main" data-fab-toggle type="button" aria-label="Quick actions">+</button>
        <div class="fab-menu" id="fabMenu" hidden>
          <button data-open-scanner type="button">Scanner</button>
          <button data-open-payment-qr type="button">QR Pay</button>
          <button data-demo-qr type="button">QR Preview</button>
          <button data-print-test-receipt type="button">Test Print</button>
        </div>
      </div>
    `);
  }
  renderSyncStatus();
}

function renderInstallPrompt() {
  const root = document.getElementById('pwaInstallRoot');
  if (!root || !installPrompt) return;
  root.innerHTML = `<div class="install-banner"><div><strong>ติดตั้ง Budsarin POS</strong><span>เพิ่มไปที่ Home Screen เพื่อใช้งานบน iPad/Mobile ได้สะดวกขึ้น</span></div><button class="primary-button" data-install-app type="button">Install</button><button class="soft-button" data-dismiss-install type="button">ไว้ก่อน</button></div>`;
}

function renderUpdatePrompt() {
  const root = document.getElementById('pwaInstallRoot');
  root.innerHTML = `<div class="install-banner update"><div><strong>มีเวอร์ชันใหม่</strong><span>Refresh เพื่อใช้ app shell ล่าสุด</span></div><button class="primary-button" data-refresh-update type="button">Refresh to update</button></div>`;
}

function bindPwaEvents() {
  document.addEventListener('click', async event => {
    if (event.target.closest('[data-fab-toggle]')) document.getElementById('fabMenu').hidden = !document.getElementById('fabMenu').hidden;
    if (event.target.closest('[data-open-scanner]')) openScanner();
    if (event.target.closest('[data-open-payment-qr]')) openPaymentQRModal({ amount: 0, customerName: 'ลูกค้าหน้าร้าน' });
    if (event.target.closest('[data-demo-qr]')) showQRPreview(generateEntityQRCode('order', 'DEMO-ORDER', 'Demo Order'), 'Order Lookup QR');
    if (event.target.closest('[data-print-test-receipt]')) printTestReceipt();
    if (event.target.closest('[data-dismiss-install]')) document.getElementById('pwaInstallRoot').innerHTML = '';
    if (event.target.closest('[data-install-app]') && installPrompt) {
      await installPrompt.prompt();
      installPrompt = null;
      document.getElementById('pwaInstallRoot').innerHTML = '';
      showToast('ส่งคำขอติดตั้ง PWA แล้ว');
    }
    if (event.target.closest('[data-refresh-update]') && waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  });
  window.addEventListener('online', () => processOfflineQueue());
  window.addEventListener('offline-queue:update', () => {
    const status = getSyncStatus();
    if (status.pending || status.failed) showToast(`มี ${status.pending + status.failed} รายการรอ sync`);
  });
}

async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return showToast('Browser นี้ยังไม่รองรับ Service Worker');
  try {
    const registration = await navigator.serviceWorker.register('./service-worker.js');
    registration.addEventListener('updatefound', () => {
      const worker = registration.installing;
      worker?.addEventListener('statechange', () => {
        if (worker.state === 'installed' && navigator.serviceWorker.controller) {
          waitingWorker = worker;
          renderUpdatePrompt();
        }
      });
    });
  } catch (error) {
    console.warn('[PWA] service worker registration failed', error);
    showToast('Service Worker เปิดไม่ได้ใน environment นี้');
  }
}
