import { APP_NAME, SYSTEM_VERSION } from './settings-data.js';
import { loadStoreProfile, saveSystemSettings } from './settings-service.js';
import { ALL_STORAGE_KEYS, STORAGE_KEYS, readStorage, removeStorage, writeStorage } from './storage-registry.js';

export const backupKeys = ALL_STORAGE_KEYS;

export function exportAllData() {
  const data = {};
  backupKeys.forEach(key => {
    const value = readStorage(key, undefined);
    if (value !== undefined) data[key] = value;
  });
  return {
    version: SYSTEM_VERSION,
    appName: APP_NAME,
    exportedAt: new Date().toISOString(),
    storeProfile: loadStoreProfile(),
    data,
    metadata: createBackupMetadata(data)
  };
}

export function downloadBackupJSON() {
  const backup = exportAllData();
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `budsarin-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  recordBackupHistory(backup);
  return backup;
}

export function importBackupJSON(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        const validation = validateBackupFile(parsed);
        if (!validation.valid) return reject(new Error(validation.error));
        resolve(parsed);
      } catch {
        reject(new Error('ไฟล์ Backup ต้องเป็น JSON ที่ถูกต้อง'));
      }
    };
    reader.onerror = () => reject(new Error('อ่านไฟล์ Backup ไม่สำเร็จ'));
    reader.readAsText(file);
  });
}

export function validateBackupFile(backup) {
  if (!backup || typeof backup !== 'object') return { valid: false, error: 'ไฟล์ Backup ไม่ถูกต้อง' };
  if (backup.appName !== APP_NAME) return { valid: false, error: 'ไฟล์นี้ไม่ใช่ Backup ของ Budsarin Flower' };
  if (!backup.version) return { valid: false, error: 'Backup ไม่มี version' };
  if (!backup.data || typeof backup.data !== 'object') return { valid: false, error: 'Backup ไม่มี data object' };
  return { valid: true, error: '' };
}

export function restoreBackup(backup) {
  const validation = validateBackupFile(backup);
  if (!validation.valid) throw new Error(validation.error);
  Object.entries(backup.data).forEach(([key, value]) => {
    if (backupKeys.includes(key)) writeStorage(key, value);
  });
  saveSystemSettings({ lastBackupAt: backup.exportedAt, lastRestoreAt: new Date().toISOString() });
  return backup.metadata || createBackupMetadata(backup.data);
}

export function clearAllLocalData() {
  backupKeys.forEach(removeStorage);
  return true;
}

export function resetMockData() {
  clearAllLocalData();
  return { resetAt: new Date().toISOString() };
}

export function createBackupMetadata(data = null) {
  const source = data || exportAllData().data;
  return {
    totalCustomers: count(source.budsarin_customers),
    totalOrders: count(source.budsarin_orders),
    totalSales: count(source.budsarinFlowerPOSV2?.sales || source.budsarin_sales),
    totalEvents: count(source.budsarin_events),
    totalInventoryItems: count(source.budsarin_inventory_items),
    totalTransactions: count(source.budsarin_income_transactions) + count(source.budsarin_expense_transactions),
    totalSuppliers: count(source.budsarin_suppliers),
    totalReports: count(source.budsarin_report_presets)
  };
}

export function loadBackupHistory() {
  try {
    return readStorage(STORAGE_KEYS.backupHistory, []);
  } catch {
    return [];
  }
}

function recordBackupHistory(backup) {
  const history = loadBackupHistory();
  history.unshift({ id: crypto.randomUUID(), exportedAt: backup.exportedAt, version: backup.version, metadata: backup.metadata });
  writeStorage(STORAGE_KEYS.backupHistory, history.slice(0, 10));
  saveSystemSettings({ lastBackupAt: backup.exportedAt });
}

function count(value) {
  return Array.isArray(value) ? value.length : 0;
}
