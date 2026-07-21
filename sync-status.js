import { clearSyncedActions, getSyncStatus, processOfflineQueue, retryFailedSync } from './offline-queue.js?v=20260713g';
import { showToast } from './utils.js';

let root;

export function initSyncStatus() {
  root = document.getElementById('pwaStatusRoot') || document.body.appendChild(Object.assign(document.createElement('div'), { id: 'pwaStatusRoot' }));
  renderSyncStatus();
  window.addEventListener('online', async () => {
    showToast('กลับมาออนไลน์แล้ว กำลัง sync queue');
    await processOfflineQueue();
    renderSyncStatus();
  });
  window.addEventListener('offline', () => {
    showToast('เข้าสู่ Offline Mode ข้อมูลจะถูกเก็บไว้ในเครื่อง');
    renderSyncStatus();
  });
  window.addEventListener('offline-queue:update', renderSyncStatus);
  document.addEventListener('click', async event => {
    if (event.target.closest('[data-sync-now]')) { await processOfflineQueue(); showToast('ตรวจ sync queue แล้ว'); renderSyncStatus(); }
    if (event.target.closest('[data-retry-sync]')) { await retryFailedSync(); showToast('Retry รายการ sync ที่ล้มเหลวแล้ว'); renderSyncStatus(); }
    if (event.target.closest('[data-clear-synced]')) { clearSyncedActions(); showToast('ล้างรายการที่ sync แล้ว'); renderSyncStatus(); }
  });
}

export function renderSyncStatus() {
  if (!root) return;
  const s = getSyncStatus();
  const queueCount = s.pending + s.failed + s.conflict;
  if (s.online) {
    root.innerHTML = '';
    return;
  }
  root.innerHTML = `
    <div class="offline-banner ${s.online ? 'online' : 'offline'}" role="status">
      <strong>${s.online ? 'Online' : 'Offline Mode'}</strong>
      <span>${queueCount} รายการรอ sync</span>
      <button class="soft-button" data-sync-now type="button">Sync</button>
      ${s.failed ? '<button class="soft-button" data-retry-sync type="button">Retry</button>' : ''}
      ${s.synced ? '<button class="soft-button" data-clear-synced type="button">Clear synced</button>' : ''}
    </div>
  `;
}
