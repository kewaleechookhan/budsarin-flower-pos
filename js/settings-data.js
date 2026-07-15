export const SYSTEM_VERSION = '1.0.0 Local Prototype';
export const APP_NAME = 'Budsarin Flower POS & Studio Manager';

export const settingsTabs = [
  ['profile', 'ข้อมูลร้าน'],
  ['brand', 'เอกสารและแบรนด์'],
  ['finance', 'การเงินและภาษี'],
  ['notifications', 'การแจ้งเตือน'],
  ['modules', 'โมดูลระบบ'],
  ['backend', 'Backend / Sync'],
  ['integrations', 'PWA / LINE / Printer'],
  ['backup', 'Backup / Restore'],
  ['health', 'Data Health'],
  ['about', 'About System']
];

export const defaultStoreProfile = {
  id: 'budsarin-main-store',
  storeNameTh: 'ร้านดอกไม้บุศรินทร์',
  storeNameEn: 'Budsarin Flower',
  businessName: 'Budsarin Flower',
  ownerName: 'บุศรินทร์',
  phone: '089-000-0000',
  lineId: '@budsarinflower',
  facebookPage: 'Budsarin Flower',
  instagram: 'budsarinflower',
  email: 'hello@budsarin.local',
  address: 'ภูเก็ต',
  district: '',
  province: 'ภูเก็ต',
  postalCode: '',
  taxId: '',
  logoPlaceholder: 'บ',
  logoDataUrl: '',
  coverImageDataUrl: '',
  backgroundImageDataUrl: '',
  openingHours: '09:00-19:00',
  defaultLanguage: 'th',
  currency: 'THB',
  timezone: 'Asia/Bangkok',
  updatedAt: new Date().toISOString()
};

export const defaultBrandSettings = {
  primaryColor: '#d9638b',
  secondaryColor: '#f5d6c6',
  accentColor: '#c89b3c',
  creamColor: '#fff7ef',
  textColor: '#3f2a2d',
  documentFooterText: 'Budsarin Flower POS & Studio Manager',
  receiptThankYouMessage: 'ขอบคุณที่ไว้วางใจ Budsarin Flower ค่ะ',
  quotationTerms: 'ใบเสนอราคานี้มีอายุ 7 วัน และราคายังไม่รวมรายการเพิ่มเติมนอกเหนือจากที่ระบุ',
  showLogoOnDocuments: true,
  showBackgroundOnPrint: false,
  documentHeaderStyle: 'classic',
  documentAccentStyle: 'pink_gold',
  receiptTitle: 'ใบเสร็จรับเงิน / ใบกำกับภาษีอย่างย่อ',
  quotationTitle: 'ใบเสนอราคา',
  deliveryNoteTitle: 'ใบส่งของ',
  customerTaxLabel: 'เลขประจำตัวผู้เสียภาษี',
  invoicePrefix: 'BF-IV',
  receiptPrefix: 'BF-RC',
  orderPrefix: 'BF-OD',
  eventPrefix: 'BF-EV',
  quotationPrefix: 'BF-QT',
  poPrefix: 'BF-PO'
};

export const defaultSystemFinanceSettings = {
  openingBalance: 30000,
  initialInvestment: 350000,
  fixedMonthlyCosts: 45000,
  targetGrossMargin: 45,
  targetNetProfit: 35000,
  minimumCashBalance: 15000,
  accountingCycleStartDay: 1,
  vatEnabled: false,
  vatRate: 7,
  serviceChargeEnabled: false,
  serviceChargeRate: 0,
  defaultPaymentMethods: ['cash', 'transfer', 'qr', 'card'],
  syncPOS: true,
  syncOrders: true,
  syncEvents: true,
  autoExpenseFromStockIn: true,
  autoPayableFromPO: true
};

export const roles = {
  owner: 'เจ้าของร้าน',
  manager: 'ผู้จัดการ',
  staff: 'พนักงาน',
  florist: 'ช่างจัดดอกไม้',
  cashier: 'แคชเชียร์',
  viewer: 'ดูข้อมูลเท่านั้น'
};

export const permissions = [
  'dashboard.view', 'pos.view', 'pos.checkout', 'orders.view', 'orders.create', 'orders.edit', 'orders.cancel',
  'events.view', 'events.create', 'events.edit', 'events.payment', 'finance.view', 'finance.create', 'finance.edit', 'finance.delete',
  'inventory.view', 'inventory.stock_in', 'inventory.stock_out', 'inventory.waste', 'suppliers.view', 'suppliers.create', 'suppliers.po',
  'customers.view', 'customers.create', 'reports.view', 'reports.export', 'settings.view', 'settings.edit', 'backup.export', 'backup.import'
];

export const defaultPermissionSettings = {
  owner: permissions,
  manager: permissions.filter(item => !['finance.delete', 'backup.import'].includes(item)),
  staff: ['dashboard.view', 'pos.view', 'pos.checkout', 'orders.view', 'orders.create', 'customers.view', 'customers.create'],
  florist: ['dashboard.view', 'orders.view', 'events.view', 'inventory.view'],
  cashier: ['dashboard.view', 'pos.view', 'pos.checkout', 'customers.view'],
  viewer: ['dashboard.view', 'orders.view', 'events.view', 'reports.view']
};

export const defaultUsers = [
  { id: 'user-owner', displayName: 'บุศรินทร์', username: 'owner', role: 'owner', pinCode: '1234', status: 'active', allowedModules: ['all'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'user-cashier', displayName: 'แคชเชียร์หน้าร้าน', username: 'cashier', role: 'cashier', pinCode: '1111', status: 'active', allowedModules: ['dashboard', 'pos', 'customers'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'user-florist', displayName: 'ทีมจัดดอกไม้', username: 'florist', role: 'florist', pinCode: '2222', status: 'active', allowedModules: ['orders', 'events', 'inventory'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
];

export const defaultNotificationSettings = {
  orderDue: { label: 'ออเดอร์ใกล้ส่ง', enabled: true, daysBefore: 1, timeOfDay: '09:00', priority: 'high', showOnDashboard: true },
  eventSetup: { label: 'Event ใกล้ Setup', enabled: true, daysBefore: 3, timeOfDay: '10:00', priority: 'high', showOnDashboard: true },
  followUp: { label: 'Follow-up ลูกค้า', enabled: true, daysBefore: 0, timeOfDay: '09:30', priority: 'normal', showOnDashboard: true },
  lowStock: { label: 'สต็อกใกล้หมด', enabled: true, daysBefore: 0, timeOfDay: '09:00', priority: 'high', showOnDashboard: true },
  useSoon: { label: 'ดอกไม้ควรรีบใช้', enabled: true, daysBefore: 1, timeOfDay: '08:30', priority: 'normal', showOnDashboard: true },
  highWaste: { label: 'Waste สูง', enabled: true, daysBefore: 0, timeOfDay: '18:00', priority: 'high', showOnDashboard: true },
  receivableDue: { label: 'ยอดค้างชำระ', enabled: true, daysBefore: 2, timeOfDay: '11:00', priority: 'normal', showOnDashboard: true },
  payableDue: { label: 'เจ้าหนี้ใกล้ครบกำหนด', enabled: true, daysBefore: 2, timeOfDay: '11:30', priority: 'normal', showOnDashboard: true },
  lowCash: { label: 'Cash Balance ต่ำ', enabled: true, daysBefore: 0, timeOfDay: '17:00', priority: 'critical', showOnDashboard: true },
  breakEven: { label: 'ยังไม่ถึงจุดคุ้มทุน', enabled: true, daysBefore: 0, timeOfDay: '17:30', priority: 'normal', showOnDashboard: true }
};

export const defaultModuleSettings = {
  pos: { stockAutoDeduct: true, receiptPreview: true, defaultDiscountType: 'amount', defaultPaymentMethod: 'cash' },
  orders: { requireDeposit: true, defaultDepositPercentage: 30, allowDraftOrder: true, autoCreateCustomer: true },
  events: { defaultDepositPercentage: 40, defaultQuotationValidDays: 7, defaultServiceCharge: 10, defaultPaymentSchedule: 'deposit_balance' },
  inventory: { allowNegativeStock: false, useSoonWarningDays: 2, expiryWarningDays: 3, targetWasteRate: 5, defaultMinimumStockByCategory: { 'ดอกไม้สด': 20, 'วัสดุห่อ': 10 } },
  customers: { vipSpendingThreshold: 10000, vipOrderCountThreshold: 5, inactiveCustomerDays: 60, birthdayReminderDays: 7 },
  reports: { defaultDateRange: 'thisMonth', enableReportCache: true }
};

export const systemPhases = [
  'Phase 1 Dashboard',
  'Phase 2 POS',
  'Phase 3 Orders',
  'Phase 4 Cost Calculator',
  'Phase 5 Finance',
  'Phase 6 Events / Event Operations',
  'Phase 7 Inventory / Waste Management',
  'Phase 8 Suppliers',
  'Phase 9 Customers / CRM',
  'Phase 10 Reports / BI',
  'Phase 11 Settings',
  'Phase 12 Calendar',
  'Phase 13 Final QA / Responsive Polish'
  ,'Phase 14 Backend/API Readiness / Conflict Resolver'
  ,'Phase 15 Mobile PWA / Offline / QR / Printer / LINE OA'
];
