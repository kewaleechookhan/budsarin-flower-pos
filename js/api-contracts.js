import { STORAGE_KEYS, readStorage, writeStorage } from './storage-registry.js';

export const defaultBackendSettings = {
  backendMode: 'central_backend',
  apiBaseUrl: '',
  syncEnabled: true,
  conflictStrategy: 'manual_review',
  requestTimeoutMs: 12000,
  lastHealthCheckAt: '',
  lastHealthStatus: 'not_checked'
};

export const defaultApiContracts = [
  ['POST', '/auth/pin-login', 'Login ด้วย username + PIN และรับ session token'],
  ['GET', '/bootstrap', 'โหลด snapshot ฐานข้อมูลกลางสำหรับเครื่องใหม่'],
  ['GET', '/collections/:name', 'อ่าน collection จากฐานข้อมูลกลาง'],
  ['POST', '/collections/:name', 'เพิ่ม/แก้ไข entity ในฐานข้อมูลกลาง'],
  ['DELETE', '/collections/:name/:id', 'ลบ entity พร้อม audit log'],
  ['POST', '/sync/offline-queue', 'ส่ง action queue จากอุปกรณ์ขึ้น backend'],
  ['GET', '/sync/status', 'ตรวจสถานะ sync ล่าสุด'],
  ['POST', '/sync/conflicts/:id/resolve', 'resolve conflict จาก Phase 14'],
  ['POST', '/qr/payment-placeholder', 'สร้าง QR payment placeholder'],
  ['GET', '/qr/entity/:type/:id', 'ค้นหา entity จาก QR payload'],
  ['GET', '/printer/settings', 'อ่าน printer settings'],
  ['PATCH', '/printer/settings', 'อัปเดต printer settings'],
  ['GET', '/line/templates', 'อ่าน LINE message templates'],
  ['POST', '/line/templates', 'บันทึก LINE template'],
  ['POST', '/line/send-placeholder', 'ส่ง LINE placeholder ผ่าน backend'],
  ['POST', '/line/send', 'ส่ง LINE OA จริงผ่าน backend token'],
  ['POST', '/printer/jobs', 'ส่งงานพิมพ์ไป browser/print adapter'],
  ['POST', '/inventory/recipes', 'บันทึก Recipe/BOM ของสินค้า'],
  ['POST', '/inventory/consume-recipe', 'ตัดสต็อกตาม BOM จาก POS/Order/Event'],
  ['POST', '/backups', 'สร้าง backup ฐานข้อมูลกลางทันที'],
  ['GET', '/backups', 'ดูรายการ backup'],
  ['POST', '/backups/restore', 'restore backup ที่เลือก'],
  ['GET', '/line/notification-logs', 'อ่าน notification logs']
].map(([method, path, description]) => ({
  id: `${method}-${path}`.replace(/[^a-z0-9]/gi, '-').toLowerCase(),
  method,
  path,
  description,
  status: 'planned',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
}));

export const databaseTables = [
  'users',
  'sessions',
  'roles',
  'stores',
  'sales',
  'orders',
  'events',
  'inventory_items',
  'inventory_recipes',
  'stock_movements',
  'waste_items',
  'income_transactions',
  'expense_transactions',
  'customers',
  'suppliers',
  'purchase_orders',
  'offline_queue',
  'sync_conflicts',
  'qr_codes',
  'payment_qr_placeholders',
  'printer_settings',
  'line_settings',
  'line_message_templates',
  'notification_logs',
  'device_sessions',
  'audit_logs'
].map(name => ({ name, columns: ['id', 'store_id', 'created_at', 'updated_at', 'created_by', 'updated_by'], status: 'planned' }));

export function loadBackendSettings() {
  return { ...defaultBackendSettings, ...readStorage(STORAGE_KEYS.backendSettings, {}) };
}

export function saveBackendSettings(settings) {
  const next = { ...loadBackendSettings(), ...settings };
  delete next.apiToken;
  delete next.serviceRoleKey;
  writeStorage(STORAGE_KEYS.backendSettings, next);
  return next;
}

export function loadApiContracts() {
  const saved = readStorage(STORAGE_KEYS.apiContracts, null);
  if (Array.isArray(saved) && saved.length) return saved;
  writeStorage(STORAGE_KEYS.apiContracts, defaultApiContracts);
  return defaultApiContracts;
}

export function simulateBackendHealthCheck() {
  const settings = loadBackendSettings();
  const status = settings.backendMode === 'local_placeholder' || !settings.apiBaseUrl ? 'placeholder' : 'ready_to_connect';
  return saveBackendSettings({ lastHealthCheckAt: new Date().toISOString(), lastHealthStatus: status });
}
