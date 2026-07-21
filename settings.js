import { settingsTabs, roles, permissions, systemPhases, APP_NAME, SYSTEM_VERSION } from './settings-data.js';
import { addUser, initializeSettingsDefaults, loadBrandSettings, loadModuleSettings, loadStoreProfile, loadSystemFinanceSettings, loadSystemSettings, loadUsers, saveBrandSettings, saveModuleSettings, saveStoreProfile, saveSystemFinanceSettings, updateUser } from './settings-service.js';
import { getRolePermissions, loadPermissionSettings, savePermissionSettings } from './permissions.js';
import { loadNotificationSettings, updateNotificationSetting } from './notifications-settings.js';
import { clearAllLocalData, createBackupMetadata, downloadBackupJSON, exportAllData, importBackupJSON, loadBackupHistory, resetMockData, restoreBackup, validateBackupFile } from './backup-restore.js';
import { exportHealthReport, repairMinorIssues, runDataHealthCheck } from './data-health.js';
import { backupBeforeReset, checkSeedStatus, clearAllData, resetDemoData, resetToProductionData, restoreFromBackup, seedDemoData } from './demo-data.js';
import { getCurrentDeviceSession, loadDeviceSessions, removeDeviceSession } from './device-sessions.js';
import { renderIcon } from './icons.js';
import { filterAuditLogs, loadAuditLogs, logAudit } from './audit-log.js';
import { databaseTables, loadApiContracts, loadBackendSettings, saveBackendSettings, simulateBackendHealthCheck } from './api-contracts.js';
import { apiHealth } from './api-client.js';
import { getConflictSummary, loadSyncConflicts, resolveSyncConflict, seedDemoConflict } from './conflict-resolver.js';
import { copyMessageToClipboard, defaultLineTemplates, getNotificationLogsForSettings, loadLineSettings, loadLineTemplates, previewLineMessage, saveLineSettings, saveLineTemplates, sendLineMessagePlaceholder } from './line-integration.js';
import { getSyncStatus } from './offline-queue.js';
import { detectPrinterCapabilityPlaceholder, loadPrinterSettings, savePrinterSettings } from './receipt-printer.js';
import { currency, number, showToast } from './utils.js';

const state = { tab: 'profile', pendingBackup: null, health: null };

export function initSettings() {
  initializeSettingsDefaults();
  renderSettingsShell();
  renderSettings();
  bindSettingsEvents();
}

function renderSettingsShell() {
  document.getElementById('settingsView').innerHTML = `
    <section class="settings-header panel">
      <div><p class="eyebrow">Phase 11 System Settings</p><h3>ตั้งค่าร้าน</h3><span>Store profile, permissions, notifications, backup และ data health</span></div>
      <div class="settings-header-actions">
        <button class="primary-button" id="settingsSaveCurrentBtn" type="button">${renderIcon('save')}บันทึกหน้านี้</button>
        <button class="soft-button" id="settingsHealthQuickBtn" type="button">${renderIcon('settings')}ตรวจสุขภาพข้อมูล</button>
      </div>
    </section>
    <nav class="settings-tabs panel" role="tablist">${settingsTabs.map(([id, label]) => `<button class="${id === state.tab ? 'active' : ''}" data-settings-tab="${id}" type="button">${label}</button>`).join('')}</nav>
    <section id="settingsContent"></section>
    <div class="settings-confirm" id="settingsConfirm" hidden role="dialog" aria-modal="true" aria-labelledby="settingsConfirmTitle">
      <section class="panel settings-confirm-box">
        <h3 id="settingsConfirmTitle">ยืนยันการทำรายการ</h3>
        <p id="settingsConfirmText">ต้องการทำรายการนี้หรือไม่</p>
        <div><button class="danger-button" id="settingsConfirmYes" type="button">ยืนยัน</button><button class="soft-button" id="settingsConfirmNo" type="button">ยกเลิก</button></div>
      </section>
    </div>
  `;
}

function renderSettings() {
  document.querySelectorAll('[data-settings-tab]').forEach(btn => btn.classList.toggle('active', btn.dataset.settingsTab === state.tab));
  const views = { profile: renderProfile, brand: renderBrand, finance: renderFinance, users: renderUsers, notifications: renderNotifications, modules: renderModules, backend: renderBackend, integrations: renderIntegrations, backup: renderBackup, health: renderHealth, about: renderAbout };
  if (!views[state.tab]) state.tab = 'profile';
  document.getElementById('settingsContent').innerHTML = views[state.tab]();
}

function renderProfile() {
  const s = loadStoreProfile();
  return `<form class="settings-form panel" id="storeProfileForm">
    <div class="panel-heading"><div><p class="eyebrow">Store Profile</p><h3>ข้อมูลร้าน</h3></div></div>
    <div class="settings-form-grid">
      ${input('storeNameTh', 'ชื่อร้านภาษาไทย', s.storeNameTh)}
      ${input('storeNameEn', 'ชื่อร้านภาษาอังกฤษ', s.storeNameEn)}
      ${input('businessName', 'ชื่อจดทะเบียน/ธุรกิจ', s.businessName)}
      ${input('ownerName', 'เจ้าของร้าน', s.ownerName)}
      ${input('phone', 'เบอร์โทร', s.phone)}
      ${input('lineId', 'LINE ID', s.lineId)}
      ${input('facebookPage', 'Facebook Page', s.facebookPage)}
      ${input('instagram', 'Instagram', s.instagram)}
      ${input('email', 'Email', s.email, 'email')}
      ${input('taxId', 'Tax ID', s.taxId)}
      ${input('address', 'ที่อยู่', s.address, 'text', true)}
      ${input('district', 'อำเภอ/เขต', s.district)}
      ${input('province', 'จังหวัด', s.province)}
      ${input('postalCode', 'รหัสไปรษณีย์', s.postalCode)}
      ${input('logoPlaceholder', 'Logo Placeholder', s.logoPlaceholder)}
      ${input('openingHours', 'เวลาเปิดทำการ', s.openingHours)}
      ${select('defaultLanguage', 'ภาษาเริ่มต้น', s.defaultLanguage, [['th', 'ไทย'], ['en', 'English']])}
      ${select('currency', 'สกุลเงิน', s.currency, [['THB', 'THB'], ['USD', 'USD']])}
      ${input('timezone', 'Timezone', s.timezone)}
    </div>
    <section class="brand-upload-grid">
      ${imageUploadCard('logoDataUrl', 'โลโก้ร้าน', s.logoDataUrl, 'ใช้บนแถบเมนู ใบเสร็จ และเอกสารทั้งหมด')}
      ${imageUploadCard('coverImageDataUrl', 'ภาพปกร้าน', s.coverImageDataUrl, 'ใช้สำหรับหน้าปกเอกสาร/รายงาน')}
      ${imageUploadCard('backgroundImageDataUrl', 'พื้นหลังเอกสาร', s.backgroundImageDataUrl, 'ใช้เป็นลายน้ำหรือพื้นหลังตอนพิมพ์')}
    </section>
    <p class="settings-success">ข้อมูลนี้จะถูกใช้ในใบเสร็จ ใบงาน Reports และ Dashboard header</p>
  </form>`;
}

function renderBrand() {
  const b = loadBrandSettings();
  return `<form class="settings-form panel" id="brandSettingsForm">
    <div class="panel-heading"><div><p class="eyebrow">Brand & Documents</p><h3>เอกสารและแบรนด์</h3></div></div>
    <div class="settings-form-grid">
      ${input('primaryColor', 'Primary Color', b.primaryColor, 'color')}
      ${input('secondaryColor', 'Secondary Color', b.secondaryColor, 'color')}
      ${input('accentColor', 'Accent Color', b.accentColor, 'color')}
      ${input('creamColor', 'Cream Color', b.creamColor, 'color')}
      ${input('textColor', 'Text Color', b.textColor, 'color')}
      ${input('receiptPrefix', 'Receipt Prefix', b.receiptPrefix)}
      ${input('orderPrefix', 'Order Prefix', b.orderPrefix)}
      ${input('eventPrefix', 'Event Prefix', b.eventPrefix)}
      ${input('quotationPrefix', 'Quotation Prefix', b.quotationPrefix)}
      ${input('poPrefix', 'Purchase Order Prefix', b.poPrefix)}
      ${textarea('receiptThankYouMessage', 'ข้อความขอบคุณในใบเสร็จ', b.receiptThankYouMessage)}
      ${textarea('quotationTerms', 'เงื่อนไขใบเสนอราคา', b.quotationTerms)}
      ${textarea('documentFooterText', 'Footer เอกสาร', b.documentFooterText)}
      ${toggle('showLogoOnDocuments', 'แสดงโลโก้บนเอกสาร', b.showLogoOnDocuments)}
      ${toggle('showBackgroundOnPrint', 'ใช้ภาพพื้นหลังตอนพิมพ์', b.showBackgroundOnPrint)}
      ${select('documentHeaderStyle', 'สไตล์หัวเอกสาร', b.documentHeaderStyle, [['classic', 'Classic A4'], ['minimal', 'Minimal'], ['official', 'Official / ราชการ']])}
      ${select('documentAccentStyle', 'โทนสีเอกสาร', b.documentAccentStyle, [['pink_gold', 'ชมพู-ทอง'], ['mono', 'ขาวดำทางการ'], ['deep', 'เข้มเรียบ']])}
      ${input('receiptTitle', 'ชื่อหัวใบเสร็จ', b.receiptTitle)}
      ${input('quotationTitle', 'ชื่อหัวใบเสนอราคา', b.quotationTitle)}
      ${input('deliveryNoteTitle', 'ชื่อหัวใบส่งของ', b.deliveryNoteTitle)}
      ${input('customerTaxLabel', 'ป้าย Tax ID ลูกค้า', b.customerTaxLabel)}
    </div>
  </form>`;
}

function renderFinance() {
  const f = loadSystemFinanceSettings();
  return `<form class="settings-form panel" id="financeSettingsForm">
    <div class="panel-heading"><div><p class="eyebrow">Finance & Tax</p><h3>การเงินและภาษี</h3></div></div>
    <div class="settings-form-grid">
      ${input('openingBalance', 'Opening Balance', f.openingBalance, 'number')}
      ${input('initialInvestment', 'Initial Investment', f.initialInvestment, 'number')}
      ${input('fixedMonthlyCosts', 'Fixed Monthly Costs', f.fixedMonthlyCosts, 'number')}
      ${input('targetGrossMargin', 'Target Gross Margin %', f.targetGrossMargin, 'number')}
      ${input('targetNetProfit', 'Target Net Profit', f.targetNetProfit, 'number')}
      ${input('minimumCashBalance', 'Minimum Cash Balance', f.minimumCashBalance, 'number')}
      ${input('accountingCycleStartDay', 'Accounting Start Day', f.accountingCycleStartDay, 'number')}
      ${input('vatRate', 'VAT Rate %', f.vatRate, 'number')}
      ${input('serviceChargeRate', 'Service Charge Rate %', f.serviceChargeRate, 'number')}
      ${toggle('vatEnabled', 'เปิด VAT', f.vatEnabled)}
      ${toggle('serviceChargeEnabled', 'เปิด Service Charge', f.serviceChargeEnabled)}
      ${toggle('syncPOS', 'Auto Sync POS to Finance', f.syncPOS)}
      ${toggle('syncOrders', 'Auto Sync Orders to Finance', f.syncOrders)}
      ${toggle('syncEvents', 'Auto Sync Events to Finance', f.syncEvents)}
      ${toggle('autoExpenseFromStockIn', 'Auto Create Expense from Stock In', f.autoExpenseFromStockIn)}
      ${toggle('autoPayableFromPO', 'Auto Create Payable from PO', f.autoPayableFromPO)}
    </div>
  </form>`;
}

function renderUsers() {
  const users = loadUsers();
  const permissionSettings = loadPermissionSettings();
  return `<section class="settings-grid">
    <form class="settings-form panel" id="userForm">
      <div class="panel-heading"><div><p class="eyebrow">Users</p><h3>เพิ่มผู้ใช้งาน</h3></div></div>
      <div class="settings-form-grid compact">
        ${input('displayName', 'ชื่อที่แสดง', '')}
        ${input('username', 'Username', '')}
        ${select('role', 'Role', 'staff', Object.entries(roles))}
        ${input('pinCode', 'PIN', '', 'password')}
      </div>
      <button class="primary-button" type="submit">${renderIcon('plus')}เพิ่มผู้ใช้งาน</button>
    </form>
    <article class="panel">
      <div class="panel-heading"><div><p class="eyebrow">User List</p><h3>ผู้ใช้งาน</h3></div></div>
      <div class="settings-list">${users.map(user => `<div class="settings-row"><div><strong>${user.displayName}</strong><span>${user.username} • ${roles[user.role]} • ${user.status}</span></div><button class="soft-button" data-toggle-user="${user.id}" type="button">${user.status === 'active' ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}</button></div>`).join('')}</div>
    </article>
    <article class="panel permission-panel">
      <div class="panel-heading"><div><p class="eyebrow">Permissions</p><h3>สิทธิ์ตาม Role</h3></div></div>
      ${Object.entries(roles).map(([role, label]) => `<details><summary>${label}</summary><div class="permission-chips">${permissions.map(permission => `<label><input type="checkbox" data-role="${role}" data-permission="${permission}" ${permissionSettings[role]?.includes(permission) ? 'checked' : ''}>${permission}</label>`).join('')}</div></details>`).join('')}
    </article>
  </section>`;
}

function renderNotifications() {
  const settings = loadNotificationSettings();
  return `<section class="panel"><div class="panel-heading"><div><p class="eyebrow">Notifications</p><h3>การแจ้งเตือน</h3></div></div><div class="settings-list">${Object.entries(settings).map(([id, item]) => `
    <div class="settings-row notification-row">
      <div><strong>${item.label}</strong><span>${item.priority} • ${item.daysBefore} วันก่อน • ${item.timeOfDay}</span></div>
      ${toggle(`notify-${id}`, 'เปิดใช้งาน', item.enabled, `data-notify="${id}" data-field="enabled"`)}
      <label>Days<input type="number" value="${item.daysBefore}" data-notify="${id}" data-field="daysBefore"></label>
      <label>Time<input type="time" value="${item.timeOfDay}" data-notify="${id}" data-field="timeOfDay"></label>
      ${toggle(`dash-${id}`, 'Dashboard', item.showOnDashboard, `data-notify="${id}" data-field="showOnDashboard"`)}
    </div>`).join('')}</div></section>`;
}

function renderModules() {
  const m = loadModuleSettings();
  return `<form class="settings-form panel" id="moduleSettingsForm">
    <div class="panel-heading"><div><p class="eyebrow">Module Settings</p><h3>โมดูลระบบ</h3></div></div>
    <section class="module-settings-grid">
      ${moduleCard('POS', 'pos', m.pos, [['stockAutoDeduct', 'เปิด/ปิด stock auto deduct'], ['receiptPreview', 'เปิด/ปิด receipt preview']], [['defaultDiscountType', 'Default discount type'], ['defaultPaymentMethod', 'Default payment method']])}
      ${moduleCard('Orders', 'orders', m.orders, [['requireDeposit', 'Require deposit'], ['allowDraftOrder', 'Allow draft order'], ['autoCreateCustomer', 'Auto create customer']], [['defaultDepositPercentage', 'Default deposit %']])}
      ${moduleCard('Events', 'events', m.events, [], [['defaultDepositPercentage', 'Default deposit %'], ['defaultQuotationValidDays', 'Quotation valid days'], ['defaultServiceCharge', 'Default service charge']])}
      ${moduleCard('Inventory', 'inventory', m.inventory, [['allowNegativeStock', 'Allow negative stock']], [['useSoonWarningDays', 'Use soon days'], ['expiryWarningDays', 'Expiry days'], ['targetWasteRate', 'Target waste rate']])}
      ${moduleCard('Customers', 'customers', m.customers, [], [['vipSpendingThreshold', 'VIP spending'], ['vipOrderCountThreshold', 'VIP order count'], ['inactiveCustomerDays', 'Inactive days'], ['birthdayReminderDays', 'Birthday reminder days']])}
      ${moduleCard('Reports', 'reports', m.reports, [['enableReportCache', 'Enable report cache']], [['defaultDateRange', 'Default date range']])}
    </section>
  </form>`;
}

function renderBackup() {
  const metadata = createBackupMetadata(exportAllData().data);
  const history = loadBackupHistory();
  const seedStatus = checkSeedStatus();
  return `<section class="settings-grid">
    <article class="panel backup-card"><div class="panel-heading"><div><p class="eyebrow">Backup</p><h3>Export / Import ข้อมูล</h3></div></div>
      <div class="backup-actions">
        <button class="primary-button" id="backupDownloadBtn" type="button">${renderIcon('download')}Download Backup JSON</button>
        <label class="soft-button import-button">Import JSON<input id="backupImportInput" type="file" accept="application/json"></label>
        <button class="danger-button" id="restoreBackupBtn" type="button" ${state.pendingBackup ? '' : 'disabled'}>Restore Backup</button>
      </div>
      <div class="settings-metrics">${Object.entries(metadata).map(([key, value]) => `<div><span>${key}</span><strong>${number(value)}</strong></div>`).join('')}</div>
      <p class="settings-warning">Restore หรือ Clear Data จะมี confirm ก่อนเสมอ และ invalid JSON จะไม่ทับข้อมูลเดิม</p>
    </article>
    <article class="panel demo-data-card"><div class="panel-heading"><div><p class="eyebrow">Phase 13 Demo Data</p><h3>Seed / Reset ข้อมูลตัวอย่าง</h3></div></div>
      <div class="settings-metrics">
        <div><span>Seed Keys</span><strong>${number(seedStatus.present)} / ${number(seedStatus.total)}</strong></div>
        <div><span>Last Seed</span><strong>${seedStatus.lastSeededAt ? seedStatus.lastSeededAt.slice(0, 10) : '-'}</strong></div>
      </div>
      <div class="backup-actions">
        <button class="primary-button" id="seedDemoBtn" type="button">${renderIcon('plus')}เติมข้อมูลตัวอย่าง</button>
        <button class="soft-button" id="backupBeforeResetBtn" type="button">${renderIcon('download')}สำรองก่อนรีเซ็ต</button>
        <button class="danger-button" id="resetProductionBtn" type="button">เริ่มใช้งานจริง: ล้างตัวอย่างให้เป็น 0</button>
        <button class="danger-button" id="resetDemoBtn" type="button">รีเซ็ตข้อมูลตัวอย่าง</button>
        <button class="danger-button" id="clearAllDataBtn" type="button">ล้างข้อมูลทั้งหมด</button>
        <button class="soft-button" id="restoreResetBackupBtn" type="button">กู้คืน backup ล่าสุด</button>
      </div>
      <p class="settings-warning">เติมข้อมูลตัวอย่างจะไม่ทับข้อมูลเดิม ส่วน Reset/Clear ต้องยืนยันก่อนทุกครั้ง</p>
    </article>
    <article class="panel danger-zone"><div class="panel-heading"><div><p class="eyebrow">Danger Zone</p><h3>ล้างข้อมูล</h3></div></div>
      <button class="danger-button" id="resetMockBtn" type="button">Reset mock data</button>
      <button class="danger-button" id="clearDataBtn" type="button">Clear local data</button>
    </article>
    <article class="panel"><div class="panel-heading"><div><p class="eyebrow">History</p><h3>Backup History</h3></div></div>
      ${history.map(item => `<div class="settings-row"><div><strong>${item.exportedAt}</strong><span>${item.version}</span></div></div>`).join('') || '<div class="empty-state">ยังไม่มี backup history</div>'}
    </article>
  </section>`;
}

function renderHealth() {
  const report = state.health || runDataHealthCheck();
  state.health = report;
  return `<section class="panel">
    <div class="panel-heading"><div><p class="eyebrow">Data Health</p><h3>ตรวจสุขภาพข้อมูลระบบ</h3></div></div>
    <div class="health-actions"><button class="primary-button" id="runHealthBtn" type="button">ตรวจสอบข้อมูล</button><button class="soft-button" id="repairHealthBtn" type="button">แก้ไขอัตโนมัติเท่าที่ปลอดภัย</button><button class="soft-button" id="exportHealthBtn" type="button">Export Health Report</button></div>
    <div class="settings-metrics"><div><span>Passed</span><strong>${number(report.passed)}</strong></div><div><span>Warning</span><strong>${number(report.warning)}</strong></div><div><span>Critical</span><strong>${number(report.critical)}</strong></div></div>
    <div class="health-list">${report.checks.map(item => `<div class="health-row ${item.status}"><span>${item.status}</span><div><strong>${item.title}</strong><small>${item.detail}</small></div></div>`).join('')}</div>
  </section>`;
}

function renderIntegrations() {
  getCurrentDeviceSession();
  const printer = loadPrinterSettings();
  const line = loadLineSettings();
  const templates = loadLineTemplates();
  const logs = getNotificationLogsForSettings();
  const devices = loadDeviceSessions();
  const sync = getSyncStatus();
  const capability = detectPrinterCapabilityPlaceholder();
  return `<section class="settings-grid">
    <form class="settings-form panel" id="printerSettingsForm">
      <div class="panel-heading"><div><p class="eyebrow">Receipt Printer</p><h3>ตั้งค่าเครื่องพิมพ์ใบเสร็จ</h3></div></div>
      <div class="settings-form-grid compact">
        ${select('printerMode', 'Printer Mode', printer.printerMode, [['browser_print','AirPrint / Browser Print'],['thermal_58mm','Thermal 58mm Layout'],['thermal_80mm','Thermal 80mm Layout'],['webusb_placeholder','WebUSB Placeholder'],['bluetooth_placeholder','Bluetooth Placeholder']])}
        ${select('paperWidth', 'Paper Width', printer.paperWidth, [['80mm','80mm'],['58mm','58mm'],['A4','A4']])}
        ${input('copies', 'Copies', printer.copies, 'number')}
        ${toggle('showLogo', 'Show Logo', printer.showLogo)}
        ${toggle('showQRCode', 'Show QR Code', printer.showQRCode)}
        ${toggle('showTaxId', 'Show Tax ID', printer.showTaxId)}
        ${textarea('footerMessage', 'Footer Message', printer.footerMessage)}
      </div>
      <div class="backup-actions"><button class="primary-button" type="submit">${renderIcon('save')}บันทึก Printer</button><button class="soft-button" data-print-test-receipt type="button">ทดสอบ AirPrint</button><button class="soft-button" data-detect-printer type="button">Detect Capability</button></div>
      <p class="settings-warning">AirPrint / Browser Print ใช้งานได้บน iPad เมื่อเครื่องพิมพ์รองรับ AirPrint และอยู่ Wi-Fi เดียวกัน ส่วน WebUSB/Bluetooth เป็น placeholder (${capability.webUsb ? 'WebUSB supported' : 'WebUSB unavailable'}, ${capability.bluetooth ? 'Bluetooth supported' : 'Bluetooth unavailable'})</p>
    </form>
    <form class="settings-form panel" id="lineSettingsForm">
      <div class="panel-heading"><div><p class="eyebrow">LINE OA</p><h3>LINE Integration Settings</h3></div></div>
      <div class="settings-form-grid compact">
        ${toggle('lineIntegrationEnabled', 'Enable LINE OA', line.lineIntegrationEnabled)}
        ${input('lineChannelId', 'LINE Channel ID', line.lineChannelId)}
        ${input('lineOaName', 'LINE OA Name', line.lineOaName)}
        ${input('lineWebhookUrl', 'Webhook URL placeholder', line.lineWebhookUrl)}
        ${toggle('lineNotifyOrderStatus', 'Order Status Notification', line.lineNotifyOrderStatus)}
        ${toggle('lineNotifyPaymentReminder', 'Payment Reminder', line.lineNotifyPaymentReminder)}
        ${toggle('lineNotifyImportantDates', 'Important Dates', line.lineNotifyImportantDates)}
      </div>
      <p class="settings-warning">ไม่เก็บ Channel Access Token ใน frontend ให้ตั้งค่าเป็น environment variable ใน Production backend เท่านั้น</p>
      <button class="primary-button" type="submit">${renderIcon('save')}บันทึก LINE Settings</button>
    </form>
    <article class="panel permission-panel">
      <div class="panel-heading"><div><p class="eyebrow">LINE Templates</p><h3>Template Manager</h3></div><button class="soft-button" id="resetLineTemplatesBtn" type="button">Reset Templates</button></div>
      <div class="settings-list">${templates.map(item => `<div class="settings-row line-template-row"><div><strong>${item.templateName}</strong><span>${item.templateKey} • ${item.variables.join(', ') || 'no variables'}</span><small>${escapeHtml(item.messageText)}</small></div><button class="soft-button" data-preview-line="${item.templateKey}" type="button">Preview</button><button class="soft-button" data-copy-line="${item.templateKey}" type="button">Copy</button><button class="primary-button" data-send-line="${item.templateKey}" type="button">Test Send</button></div>`).join('')}</div>
      <div class="line-preview-box" id="linePreviewBox">${escapeHtml(previewLineMessage(templates[0]?.templateKey || 'thank_you', sampleLineVars()))}</div>
    </article>
    <article class="panel">
      <div class="panel-heading"><div><p class="eyebrow">Sync Status</p><h3>Offline Queue</h3></div></div>
      <div class="settings-metrics"><div><span>Pending</span><strong>${number(sync.pending)}</strong></div><div><span>Failed</span><strong>${number(sync.failed)}</strong></div><div><span>Synced</span><strong>${number(sync.synced)}</strong></div><div><span>Last Sync</span><strong>${sync.lastSuccessfulSync ? sync.lastSuccessfulSync.slice(0, 16) : '-'}</strong></div></div>
    </article>
    <article class="panel">
      <div class="panel-heading"><div><p class="eyebrow">Device Sessions</p><h3>อุปกรณ์ที่เคยใช้งาน</h3></div></div>
      <div class="settings-list">${devices.map(item => `<div class="settings-row"><div><strong>${item.deviceName}</strong><span>${item.deviceType} • ${item.syncStatus} • ${item.lastSeenAt.slice(0, 16)}</span><small>${escapeHtml(item.browser)}</small></div><button class="soft-button" data-remove-device="${item.id}" type="button">ลบอุปกรณ์</button></div>`).join('') || '<div class="empty-state">ยังไม่มี device session</div>'}</div>
    </article>
    <article class="panel">
      <div class="panel-heading"><div><p class="eyebrow">Notification Log</p><h3>ประวัติการแจ้งเตือน</h3></div></div>
      <div class="settings-list">${logs.slice(0, 12).map(item => `<div class="settings-row"><div><strong>${item.templateKey || item.channel}</strong><span>${item.channel} • ${item.status} • ${item.createdAt.slice(0, 16)}</span><small>${escapeHtml(item.message)}</small></div></div>`).join('') || '<div class="empty-state">ยังไม่มี Notification Log</div>'}</div>
    </article>
  </section>`;
}

function renderBackend() {
  const backend = loadBackendSettings();
  const contracts = loadApiContracts();
  const conflicts = loadSyncConflicts();
  const summary = getConflictSummary();
  const auditLogs = loadAuditLogs();
  return `<section class="settings-grid">
    <form class="settings-form panel" id="backendSettingsForm">
      <div class="panel-heading"><div><p class="eyebrow">Phase 14 Backend/API</p><h3>Backend readiness</h3></div></div>
      <div class="settings-form-grid compact">
        ${select('backendMode', 'Backend Mode', backend.backendMode, [['local_placeholder','Local Placeholder'],['rest_api','REST API'],['supabase','Supabase'],['custom','Custom Backend']])}
        ${input('apiBaseUrl', 'API Base URL', backend.apiBaseUrl)}
        ${toggle('syncEnabled', 'เปิด Sync จริงเมื่อมี backend', backend.syncEnabled)}
        ${select('conflictStrategy', 'Conflict Strategy', backend.conflictStrategy, [['manual_review','Manual Review'],['local_wins','Local Wins'],['remote_wins','Remote Wins'],['newest_wins','Newest Wins']])}
        ${input('requestTimeoutMs', 'Request Timeout ms', backend.requestTimeoutMs, 'number')}
      </div>
      <div class="backup-actions"><button class="primary-button" type="submit">${renderIcon('save')}บันทึก Backend</button><button class="soft-button" id="backendHealthBtn" type="button">Health Check</button></div>
      <p class="settings-warning">ไม่เก็บ secret/token ใน frontend และใช้ backend server สำหรับงาน production</p>
      <div class="settings-metrics"><div><span>Health</span><strong>${backend.lastHealthStatus}</strong></div><div><span>Last Check</span><strong>${backend.lastHealthCheckAt ? backend.lastHealthCheckAt.slice(0, 16) : '-'}</strong></div></div>
    </form>
    <article class="panel">
      <div class="panel-heading"><div><p class="eyebrow">Sync Conflicts</p><h3>Conflict Resolver</h3></div><button class="soft-button" id="seedConflictBtn" type="button">สร้างตัวอย่าง Conflict</button></div>
      <div class="settings-metrics"><div><span>Open</span><strong>${number(summary.open)}</strong></div><div><span>Resolved</span><strong>${number(summary.resolved)}</strong></div><div><span>Total</span><strong>${number(summary.total)}</strong></div></div>
      <div class="settings-list">${conflicts.slice(0, 8).map(item => `<div class="settings-row conflict-row"><div><strong>${item.entityType} • ${item.entityId}</strong><span>${item.reason} • ${item.status}</span><small>local ${escapeHtml(JSON.stringify(item.localPayload).slice(0, 90))}</small><small>remote ${escapeHtml(JSON.stringify(item.remotePayload).slice(0, 90))}</small></div>${item.status === 'open' ? `<button class="primary-button" data-resolve-conflict="${item.id}" data-resolution="keep_local" type="button">Keep local</button><button class="soft-button" data-resolve-conflict="${item.id}" data-resolution="keep_remote" type="button">Use remote</button><button class="soft-button" data-resolve-conflict="${item.id}" data-resolution="merge_manual" type="button">Merge</button>` : `<span class="badge success">${item.resolution}</span>`}</div>`).join('') || '<div class="empty-state">ยังไม่มี sync conflict</div>'}</div>
    </article>
    <article class="panel permission-panel">
      <div class="panel-heading"><div><p class="eyebrow">API Contracts</p><h3>Production endpoints blueprint</h3></div></div>
      <div class="settings-list">${contracts.map(item => `<div class="settings-row"><div><strong>${item.method} ${item.path}</strong><span>${item.description}</span></div><span class="badge info">${item.status}</span></div>`).join('')}</div>
    </article>
    <article class="panel">
      <div class="panel-heading"><div><p class="eyebrow">Database Tables</p><h3>Schema blueprint</h3></div></div>
      <div class="phase-list">${databaseTables.map(item => `<span>${item.name}</span>`).join('')}</div>
    </article>
    <article class="panel">
      <div class="panel-heading"><div><p class="eyebrow">Audit Log</p><h3>Action history</h3></div><button class="soft-button" id="logAuditTestBtn" type="button">Test Audit</button></div>
      <div class="settings-list">${auditLogs.slice(0, 12).map(item => `<div class="settings-row"><div><strong>${item.action}</strong><span>${item.entityType || '-'} • ${item.status} • ${item.createdAt.slice(0, 16)}</span><small>${escapeHtml(item.detail)}</small></div></div>`).join('') || '<div class="empty-state">ยังไม่มี Audit Log</div>'}</div>
    </article>
  </section>`;
}

function renderAbout() {
  const profile = loadStoreProfile();
  const system = loadSystemSettings();
  return `<section class="settings-grid">
    <article class="panel"><div class="panel-heading"><div><p class="eyebrow">About</p><h3>${APP_NAME}</h3></div></div>
      <div class="settings-metrics about"><div><span>Version</span><strong>${SYSTEM_VERSION}</strong></div><div><span>ร้านที่ใช้งาน</span><strong>${profile.storeNameEn}</strong></div><div><span>Storage mode</span><strong>LocalStorage</strong></div><div><span>Last backup</span><strong>${system.lastBackupAt || '-'}</strong></div><div><span>Browser</span><strong>${navigator.userAgent.slice(0, 42)}...</strong></div><div><span>Device width</span><strong>${window.innerWidth}px</strong></div><div><span>Data size estimate</span><strong>${estimateLocalStorageSize()} KB</strong></div></div>
    </article>
    <article class="panel"><div class="panel-heading"><div><p class="eyebrow">Phases</p><h3>Phase ที่พัฒนาแล้ว</h3></div></div><div class="phase-list">${systemPhases.map(item => `<span>${item}</span>`).join('')}</div></article>
  </section>`;
}

function bindSettingsEvents() {
  document.getElementById('settingsView').addEventListener('click', event => {
    const tab = event.target.closest('[data-settings-tab]')?.dataset.settingsTab;
    const toggleUser = event.target.closest('[data-toggle-user]')?.dataset.toggleUser;
    if (tab) { state.tab = tab; renderSettings(); }
    if (toggleUser) toggleUserStatus(toggleUser);
    if (event.target.closest('#backupDownloadBtn')) { downloadBackupJSON(); showToast('Export Backup JSON แล้ว'); renderSettings(); }
    if (event.target.closest('#restoreBackupBtn')) confirmAction('Restore Backup จะทับข้อมูล LocalStorage ปัจจุบัน', () => { restoreBackup(state.pendingBackup); state.pendingBackup = null; showToast('Restore Backup สำเร็จ'); renderSettings(); });
    if (event.target.closest('#clearDataBtn')) confirmAction('Clear local data จะลบข้อมูลทั้งหมดในระบบนี้', () => { clearAllLocalData(); initializeSettingsDefaults(); showToast('ล้างข้อมูล local แล้ว'); renderSettings(); });
    if (event.target.closest('#resetMockBtn')) confirmAction('Reset mock data จะล้างข้อมูล local และคืนค่า default', () => { resetMockData(); initializeSettingsDefaults(); showToast('Reset mock data แล้ว'); renderSettings(); });
    if (event.target.closest('#seedDemoBtn')) { const result = seedDemoData(); initializeSettingsDefaults(); showToast(`เติมข้อมูลตัวอย่าง ${result.seeded} key`); renderSettings(); }
    if (event.target.closest('#backupBeforeResetBtn')) { backupBeforeReset('manual-settings'); showToast('สำรองข้อมูลก่อนรีเซ็ตแล้ว'); renderSettings(); }
    if (event.target.closest('#resetProductionBtn')) confirmAction('เริ่มใช้งานจริงจะสำรองข้อมูลเดิมก่อน แล้วล้างรายการขาย สินค้า ลูกค้า ออเดอร์ สต็อก รายรับรายจ่าย และข้อมูลตัวอย่างให้เป็น 0', () => { const result = resetToProductionData(); initializeSettingsDefaults(); showToast(`พร้อมใช้งานจริงแล้ว ล้าง ${result.reset} key`); renderSettings(); });
    if (event.target.closest('#resetDemoBtn')) confirmAction('รีเซ็ตข้อมูลตัวอย่างจะสำรองข้อมูลเดิมก่อน แล้วเขียน demo data ใหม่ทั้งหมด', () => { const result = resetDemoData(); initializeSettingsDefaults(); showToast(`รีเซ็ต demo data แล้ว ${result.seeded} key`); renderSettings(); });
    if (event.target.closest('#clearAllDataBtn')) confirmAction('ล้างข้อมูลทั้งหมดจะลบ LocalStorage ทุก key ของระบบนี้ แต่เก็บ backup reset ล่าสุดไว้', () => { backupBeforeReset('clear-all-data'); clearAllData(); initializeSettingsDefaults(); showToast('ล้างข้อมูลทั้งหมดแล้ว'); renderSettings(); });
    if (event.target.closest('#restoreResetBackupBtn')) { const backup = restoreFromBackup(); initializeSettingsDefaults(); showToast(backup ? 'กู้คืน backup ล่าสุดแล้ว' : 'ยังไม่มี backup สำหรับกู้คืน'); renderSettings(); }
    if (event.target.closest('#runHealthBtn') || event.target.closest('#settingsHealthQuickBtn')) { state.health = runDataHealthCheck(); state.tab = 'health'; renderSettings(); showToast('ตรวจสุขภาพข้อมูลแล้ว'); }
    if (event.target.closest('#repairHealthBtn')) { const result = repairMinorIssues(); state.health = runDataHealthCheck(); renderSettings(); showToast(`แก้ไขอัตโนมัติ ${result.repaired} รายการ`); }
    if (event.target.closest('#exportHealthBtn')) { exportHealthReport(state.health); showToast('Export Health Report แล้ว'); }
    if (event.target.closest('#settingsSaveCurrentBtn')) saveCurrentTab();
    const previewLine = event.target.closest('[data-preview-line]')?.dataset.previewLine;
    const copyLine = event.target.closest('[data-copy-line]')?.dataset.copyLine;
    const sendLine = event.target.closest('[data-send-line]')?.dataset.sendLine;
    const removeDevice = event.target.closest('[data-remove-device]')?.dataset.removeDevice;
    const clearProfileImage = event.target.closest('[data-clear-profile-image]')?.dataset.clearProfileImage;
    if (previewLine) document.getElementById('linePreviewBox').textContent = previewLineMessage(previewLine, sampleLineVars());
    if (copyLine) copyMessageToClipboard(previewLineMessage(copyLine, sampleLineVars()));
    if (sendLine) { sendLineMessagePlaceholder({ templateKey: sendLine, variables: sampleLineVars(), sourceType: 'settings_preview' }); renderSettings(); }
    if (event.target.closest('#resetLineTemplatesBtn')) { saveLineTemplates(defaultLineTemplates); showToast('Reset LINE templates แล้ว'); renderSettings(); }
    if (removeDevice) { removeDeviceSession(removeDevice); showToast('ลบอุปกรณ์แล้ว'); renderSettings(); }
    if (clearProfileImage) { saveStoreProfile({ [clearProfileImage]: '' }); showToast('ลบรูปภาพแล้ว'); renderSettings(); }
    if (event.target.closest('#backendHealthBtn')) {
      apiHealth().then(result => {
        saveBackendSettings({ lastHealthCheckAt: result.time, lastHealthStatus: result.ok ? 'online' : 'error' });
        showToast('Backend online');
        renderSettings();
      }).catch(() => {
        simulateBackendHealthCheck();
        showToast('ยังเชื่อม Backend ไม่ได้ ใช้ค่า settings ปัจจุบัน');
        renderSettings();
      });
    }
    if (event.target.closest('#seedConflictBtn')) { seedDemoConflict(); showToast('สร้าง sync conflict ตัวอย่างแล้ว'); renderSettings(); }
    const resolveConflictId = event.target.closest('[data-resolve-conflict]')?.dataset.resolveConflict;
    const resolution = event.target.closest('[data-resolve-conflict]')?.dataset.resolution;
    if (resolveConflictId) { resolveSyncConflict(resolveConflictId, resolution); showToast(`Resolve conflict: ${resolution}`); renderSettings(); }
    if (event.target.closest('#logAuditTestBtn')) { logAudit({ action: 'audit_test', entityType: 'settings', detail: 'Phase 14 audit test' }); showToast('เขียน Audit Log แล้ว'); renderSettings(); }
  });
  document.getElementById('settingsView').addEventListener('change', event => {
    const notify = event.target.dataset.notify;
    const permission = event.target.dataset.permission;
    if (notify) {
      const field = event.target.dataset.field;
      updateNotificationSetting(notify, { [field]: event.target.type === 'checkbox' ? event.target.checked : event.target.value });
      showToast('บันทึกการแจ้งเตือนแล้ว');
    }
    if (permission) savePermissionFromUI();
  });
  document.getElementById('settingsView').addEventListener('submit', event => {
    event.preventDefault();
    if (event.target.id === 'userForm') {
      addUser(Object.fromEntries(new FormData(event.target).entries()));
      showToast('เพิ่มผู้ใช้งานแล้ว');
      renderSettings();
    }
    if (event.target.id === 'printerSettingsForm') {
      savePrinterSettings(normalizeForm(Object.fromEntries(new FormData(event.target).entries()), event.target));
      showToast('บันทึก Printer Settings แล้ว');
      renderSettings();
    }
    if (event.target.id === 'lineSettingsForm') {
      saveLineSettings(normalizeForm(Object.fromEntries(new FormData(event.target).entries()), event.target));
      showToast('บันทึก LINE Settings แล้ว');
      renderSettings();
    }
    if (event.target.id === 'backendSettingsForm') {
      saveBackendSettings(normalizeForm(Object.fromEntries(new FormData(event.target).entries()), event.target));
      showToast('บันทึก Backend Settings แล้ว');
      renderSettings();
    }
  });
  document.getElementById('settingsView').addEventListener('change', async event => {
    if (event.target.id === 'backupImportInput') {
      try {
        state.pendingBackup = await importBackupJSON(event.target.files[0]);
        const validation = validateBackupFile(state.pendingBackup);
        showToast(validation.valid ? 'ไฟล์ Backup พร้อม Restore' : validation.error);
        renderSettings();
      } catch (error) {
        state.pendingBackup = null;
        showToast(error.message);
        renderSettings();
      }
    }
    if (event.target.matches('[data-image-upload]')) {
      try {
        await saveProfileImage(event.target.dataset.imageUpload, event.target.files[0]);
        showToast('อัปโหลดรูปภาพร้านแล้ว');
        renderSettings();
      } catch (error) {
        showToast(error.message);
      }
    }
  });
  document.getElementById('settingsConfirmNo').addEventListener('click', closeConfirm);
}

function saveCurrentTab() {
  try {
    if (state.tab === 'profile') saveStoreProfile(Object.fromEntries(new FormData(document.getElementById('storeProfileForm')).entries()));
    if (state.tab === 'brand') saveBrandSettings(normalizeForm(Object.fromEntries(new FormData(document.getElementById('brandSettingsForm')).entries()), document.getElementById('brandSettingsForm')));
    if (state.tab === 'finance') saveSystemFinanceSettings(normalizeForm(Object.fromEntries(new FormData(document.getElementById('financeSettingsForm')).entries()), document.getElementById('financeSettingsForm')));
    if (state.tab === 'modules') saveModuleSettings(readModuleSettings());
    showToast('บันทึก Settings แล้ว');
    renderSettings();
  } catch (error) {
    showToast(error.message);
  }
}

async function saveProfileImage(field, file) {
  if (!file) return;
  if (!file.type.startsWith('image/')) throw new Error('กรุณาเลือกไฟล์รูปภาพ');
  if (file.size > 1_500_000) throw new Error('ไฟล์รูปควรไม่เกิน 1.5MB เพื่อให้เปิดบน iPad ได้เร็ว');
  const dataUrl = await fileToDataUrl(file);
  saveStoreProfile({ [field]: dataUrl });
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('อ่านไฟล์รูปไม่สำเร็จ'));
    reader.readAsDataURL(file);
  });
}

function toggleUserStatus(id) {
  const user = loadUsers().find(item => item.id === id);
  if (!user) return;
  updateUser(id, { status: user.status === 'active' ? 'inactive' : 'active' });
  showToast('อัปเดตสถานะผู้ใช้งานแล้ว');
  renderSettings();
}

function savePermissionFromUI() {
  const next = {};
  document.querySelectorAll('[data-permission]').forEach(input => {
    next[input.dataset.role] ||= [];
    if (input.checked) next[input.dataset.role].push(input.dataset.permission);
  });
  savePermissionSettings(next);
  showToast('บันทึกสิทธิ์แล้ว');
}

function readModuleSettings() {
  const current = loadModuleSettings();
  document.querySelectorAll('[data-module][name]').forEach(input => {
    const module = input.dataset.module;
    current[module][input.name] = input.type === 'checkbox' ? input.checked : input.type === 'number' ? Number(input.value) : input.value;
  });
  return current;
}

function confirmAction(text, action) {
  document.getElementById('settingsConfirmText').textContent = text;
  document.getElementById('settingsConfirm').hidden = false;
  document.getElementById('settingsConfirmYes').focus();
  document.getElementById('settingsConfirmYes').onclick = () => {
    action();
    closeConfirm();
  };
}

function closeConfirm() {
  document.getElementById('settingsConfirm').hidden = true;
}

function input(name, label, value, type = 'text', full = false) {
  return `<label class="${full ? 'full' : ''}">${label}<input name="${name}" type="${type}" value="${escapeHtml(value)}"></label>`;
}

function textarea(name, label, value) {
  return `<label class="full">${label}<textarea name="${name}">${escapeHtml(value)}</textarea></label>`;
}

function select(name, label, value, options) {
  return `<label>${label}<select name="${name}">${options.map(([id, text]) => `<option value="${id}" ${id === value ? 'selected' : ''}>${text}</option>`).join('')}</select></label>`;
}

function toggle(name, label, checked, extra = '') {
  return `<label class="settings-toggle"><input name="${name}" type="checkbox" ${checked ? 'checked' : ''} ${extra}><span>${label}</span></label>`;
}

function imageUploadCard(field, title, value, hint) {
  return `<article class="brand-upload-card">
    <div class="brand-upload-preview">${value ? `<img src="${value}" alt="${title}">` : '<span>ไม่มีรูป</span>'}</div>
    <div><strong>${title}</strong><small>${hint}</small></div>
    <label class="soft-button">อัปโหลดรูป<input data-image-upload="${field}" type="file" accept="image/*"></label>
    ${value ? `<button class="danger-button" data-clear-profile-image="${field}" type="button">ลบรูป</button>` : ''}
  </article>`;
}

function moduleCard(title, module, values, toggles, fields) {
  return `<article class="module-card"><h4>${title}</h4>${toggles.map(([name, label]) => toggle(name, label, values[name], `data-module="${module}"`)).join('')}${fields.map(([name, label]) => `<label>${label}<input data-module="${module}" name="${name}" type="${typeof values[name] === 'number' ? 'number' : 'text'}" value="${escapeHtml(values[name])}"></label>`).join('')}</article>`;
}

function normalizeForm(data, form) {
  form.querySelectorAll('input[type="checkbox"]').forEach(input => data[input.name] = input.checked);
  form.querySelectorAll('input[type="number"]').forEach(input => data[input.name] = Number(input.value) || 0);
  return data;
}

function estimateLocalStorageSize() {
  let total = 0;
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    total += key.length + (localStorage.getItem(key) || '').length;
  }
  return Math.round(total / 1024);
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[char]);
}

function sampleLineVars() {
  return {
    customerName: 'คุณมายด์',
    orderNo: 'ORD-DEMO-001',
    status: 'พร้อมส่ง',
    eventName: 'Wedding Garden Setup',
    amount: currency(1500),
    dueDate: new Date().toISOString().slice(0, 10),
    pickupTime: '15:00',
    paymentRef: 'PAY-DEMO-001'
  };
}
