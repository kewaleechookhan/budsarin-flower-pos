const now = new Date();
const dateOf = day => new Date(now.getFullYear(), now.getMonth(), day).toISOString().slice(0, 10);

export const reportTabs = [
  ['executive', 'Executive Dashboard'],
  ['sales', 'Sales Report'],
  ['profit', 'Profit Report'],
  ['finance', 'Finance Report'],
  ['inventory', 'Inventory & Waste'],
  ['events', 'Events Report'],
  ['customers', 'Customer Report'],
  ['suppliers', 'Supplier Report'],
  ['breakeven', 'Break-even Report'],
  ['export', 'Export Center']
];

export const dateRangePresets = {
  today: 'วันนี้',
  last7days: '7 วัน',
  thisMonth: 'เดือนนี้',
  lastMonth: 'เดือนก่อน',
  thisQuarter: 'ไตรมาสนี้',
  thisYear: 'ปีนี้',
  custom: 'กำหนดเอง'
};

export const defaultReportFilters = {
  dateRange: 'thisMonth',
  startDate: dateOf(1),
  endDate: dateOf(now.getDate()),
  channel: 'all',
  category: 'all',
  status: 'all',
  customerSegment: 'all',
  supplierId: 'all',
  eventType: 'all',
  paymentMethod: 'all'
};

export const reportTypes = [
  ['sales', 'Sales Report'],
  ['profit', 'Profit Report'],
  ['finance', 'Finance Report'],
  ['inventory', 'Inventory Report'],
  ['waste', 'Waste Report'],
  ['events', 'Events Report'],
  ['customers', 'Customer Report'],
  ['suppliers', 'Supplier Report'],
  ['breakeven', 'Break-even Report']
];

export const mockEvents = [
  ['EV-001', 'Wedding Garden Setup', 'คุณฟ้า และคุณบอส', 'wedding', 68000, 30000, 36000, '2026-07-12', 'confirmed'],
  ['EV-002', 'Grand Opening Floral', 'The Rose Cafe', 'corporate', 24500, 10000, 12500, '2026-07-18', 'planning'],
  ['EV-003', 'Hotel Lobby Refresh', 'Andaman Hotel', 'corporate', 36000, 18000, 16400, '2026-07-21', 'confirmed'],
  ['EV-004', 'Engagement Dinner', 'คุณแพรว', 'private', 18500, 9000, 8200, '2026-07-27', 'draft']
].map((row, index) => ({
  id: `event-mock-${index + 1}`,
  eventNo: row[0],
  eventName: row[1],
  customerName: row[2],
  eventType: row[3],
  totalAmount: row[4],
  depositAmount: row[5],
  estimatedCost: row[6],
  grossProfit: row[4] - row[6],
  grossMargin: row[4] ? ((row[4] - row[6]) / row[4]) * 100 : 0,
  eventDate: row[7],
  status: row[8],
  createdAt: `${row[7]}T09:00:00.000Z`
}));

export const mockInventoryItems = [
  ['กุหลาบชมพู', 'ดอกไม้สด', 120, 18, 35, 180, '2026-07-05'],
  ['กุหลาบแดง', 'ดอกไม้สด', 86, 22, 30, 140, '2026-07-05'],
  ['ลิลลี่ขาว', 'ดอกไม้สด', 28, 55, 12, 50, '2026-07-04'],
  ['ยิปโซ', 'ดอกไม้สด', 6, 65, 10, 40, '2026-07-03'],
  ['กระดาษห่อพรีเมียม', 'วัสดุห่อ', 80, 35, 20, 120, '2026-07-02'],
  ['ริบบิ้นซาติน', 'ริบบิ้น', 18, 120, 8, 30, '2026-07-02'],
  ['แจกันแก้ว', 'กล่อง / แจกัน / ตะกร้า', 12, 180, 6, 24, '2026-07-01']
].map((row, index) => ({
  id: `inv-mock-${index + 1}`,
  itemName: row[0],
  category: row[1],
  quantity: row[2],
  unitCost: row[3],
  averagePurchasePrice: row[3],
  reorderPoint: row[4],
  targetStock: row[5],
  expiryDate: index < 4 ? dateOf(Math.min(now.getDate() + index + 1, 28)) : '',
  lastPurchaseDate: row[6]
}));

export const mockStockMovements = [
  ['stock_in', 'กุหลาบชมพู', 100, 18, 2],
  ['stock_out', 'กุหลาบชมพู', 32, 18, 3],
  ['stock_in', 'ยิปโซ', 20, 65, 3],
  ['stock_out', 'ยิปโซ', 14, 65, 5],
  ['stock_in', 'แจกันแก้ว', 12, 180, 4],
  ['stock_out', 'แจกันแก้ว', 4, 180, 6]
].map((row, index) => ({
  id: `move-mock-${index + 1}`,
  movementType: row[0],
  itemName: row[1],
  quantity: row[2],
  unitCost: row[3],
  date: dateOf(row[4]),
  createdAt: `${dateOf(row[4])}T10:00:00.000Z`
}));

export const mockWasteItems = [
  ['กุหลาบชมพู', 'หมดอายุ', 12, 18, 3],
  ['ยิปโซ', 'ช้ำจากขนส่ง', 5, 65, 4],
  ['ลิลลี่ขาว', 'เหลือจากงาน', 3, 55, 5],
  ['กระดาษห่อ', 'ตัดพลาด', 8, 35, 7],
  ['กุหลาบแดง', 'คุณภาพไม่ผ่าน', 10, 22, 8]
].map((row, index) => ({
  id: `waste-mock-${index + 1}`,
  itemName: row[0],
  reason: row[1],
  quantity: row[2],
  unitCost: row[3],
  amount: row[2] * row[3],
  date: dateOf(row[4]),
  createdAt: `${dateOf(row[4])}T12:00:00.000Z`
}));

export const defaultReportSettings = {
  cacheReports: true,
  defaultDateRange: 'thisMonth',
  showMockFallbackBadge: false
};
