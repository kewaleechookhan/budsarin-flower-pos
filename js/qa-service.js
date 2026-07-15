import { ALL_STORAGE_KEYS, readStorage } from './storage-registry.js';
import { showToast } from './utils.js';

export function initializeGlobalQA() {
  window.addEventListener('error', event => {
    console.error('[Budsarin Error]', event.error || event.message);
    showToast('พบข้อผิดพลาด ระบบยังคงทำงานด้วยข้อมูลสำรอง');
  });
  window.addEventListener('unhandledrejection', event => {
    console.error('[Budsarin Promise]', event.reason);
    showToast('ทำรายการไม่สำเร็จ กรุณาลองอีกครั้ง');
  });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    document.querySelectorAll('[role="dialog"]:not([hidden])').forEach(dialog => {
      const overlay = dialog.closest('[id$="Overlay"], .settings-confirm') || dialog;
      if ('hidden' in overlay) overlay.hidden = true;
    });
  });
}

export function runIntegrationSnapshot() {
  const brokenKeys = ALL_STORAGE_KEYS.filter(key => {
    const raw = localStorage.getItem(key);
    if (raw == null) return false;
    return raw !== '' && readStorage(key, Symbol.for('broken')) === Symbol.for('broken');
  });
  const modules = ['dashboardView', 'posView', 'ordersView', 'costView', 'financeView', 'suppliersView', 'customersView', 'reportsView', 'settingsView', 'calendarView'];
  const missingViews = modules.filter(id => !document.getElementById(id));
  return {
    ok: brokenKeys.length === 0 && missingViews.length === 0,
    brokenKeys,
    missingViews,
    checkedAt: new Date().toISOString()
  };
}
