const now = new Date();
const dateKey = offset => {
  const date = new Date(now);
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
};

export const calendarTabs = [
  ['today', 'Today'],
  ['week', 'Week'],
  ['month', 'Month'],
  ['queue', 'Work Queue'],
  ['reminders', 'Reminders'],
  ['manual', 'Manual Tasks'],
  ['settings', 'Calendar Settings']
];

export const sourceTypes = {
  order: { label: 'Order', color: 'pink' },
  event_project: { label: 'Event', color: 'gold' },
  customer_followup: { label: 'Follow-up', color: 'green' },
  important_date: { label: 'วันสำคัญ', color: 'cream' },
  finance_due: { label: 'ครบกำหนดชำระ', color: 'red' },
  supplier_po: { label: 'Supplier / PO', color: 'brown' },
  inventory_alert: { label: 'Inventory', color: 'leaf' },
  manual_task: { label: 'Manual', color: 'slate' }
};

export const eventTypes = {
  pickup: 'รับสินค้า',
  delivery: 'จัดส่ง',
  preparation: 'เตรียมงาน',
  setup: 'Setup',
  teardown: 'Teardown',
  meeting: 'นัดหมาย',
  payment_due: 'ครบกำหนดชำระ',
  follow_up: 'Follow-up',
  birthday: 'วันเกิด',
  anniversary: 'วันครบรอบ',
  stock_use_soon: 'ควรรีบใช้',
  stock_expiry: 'หมดอายุ',
  purchase_order: 'รับ PO',
  manual: 'งาน Manual'
};

export const calendarStatuses = {
  pending: { label: 'รอดำเนินการ', tone: 'warning' },
  in_progress: { label: 'กำลังทำ', tone: 'info' },
  done: { label: 'เสร็จแล้ว', tone: 'success' },
  cancelled: { label: 'ยกเลิก', tone: 'danger' },
  overdue: { label: 'เกินกำหนด', tone: 'danger' }
};

export const priorities = {
  low: 'ต่ำ',
  normal: 'ปกติ',
  high: 'สูง',
  urgent: 'ด่วนมาก'
};

export const defaultCalendarSettings = {
  openingTime: '09:00',
  closingTime: '19:00',
  closedDays: [],
  defaultReminderMinutes: 60,
  showCompletedEvents: false,
  autoSyncOrders: true,
  autoSyncEvents: true,
  autoSyncCustomers: true,
  autoSyncFinance: true,
  autoSyncInventory: true,
  autoSyncSuppliers: true,
  workQueueSortingMode: 'priority_time',
  calendarStartDay: 'Sunday'
};

const baseEvents = [
  ['order', 'ord-1', 'delivery', 'จัดส่งแจกันดอกไม้', 0, '10:00', 'Andaman Hotel', 'คุณอนันต์', 2500, 'pending', 'high'],
  ['order', 'ord-2', 'preparation', 'เตรียมช่อรับปริญญา', 0, '11:30', 'Studio', 'น้องฟ้า', 890, 'in_progress', 'normal'],
  ['order', 'ord-3', 'pickup', 'ลูกค้ารับช่อกุหลาบ', 0, '15:00', 'หน้าร้าน', 'คุณมายด์', 1500, 'pending', 'urgent'],
  ['event_project', 'ev-1', 'setup', 'Setup Wedding Garden', 1, '09:00', 'เรือนแก้ว การ์เด้น', 'คุณฟ้า', 68000, 'pending', 'urgent'],
  ['event_project', 'ev-2', 'meeting', 'ประชุม Grand Opening', 2, '13:00', 'The Rose Cafe', 'The Rose Cafe', 24500, 'pending', 'high'],
  ['event_project', 'ev-3', 'teardown', 'เก็บอุปกรณ์งาน Hotel Lobby', 3, '18:00', 'Andaman Hotel', 'Andaman Hotel', 36000, 'pending', 'normal'],
  ['customer_followup', 'fu-1', 'follow_up', 'ติดตามหลังส่งงาน', 0, '14:00', 'LINE', 'คุณพลอย', 0, 'pending', 'normal'],
  ['customer_followup', 'fu-2', 'follow_up', 'โทรคอนเฟิร์มโทนสี', -1, '16:00', 'โทรศัพท์', 'คุณหมิว', 0, 'overdue', 'high'],
  ['important_date', 'date-1', 'birthday', 'วันเกิดลูกค้า VIP', 1, '', 'CRM', 'คุณกานต์', 0, 'pending', 'normal'],
  ['important_date', 'date-2', 'anniversary', 'วันครบรอบลูกค้า', 4, '', 'CRM', 'คุณพลอย', 0, 'pending', 'normal'],
  ['finance_due', 'ar-1', 'payment_due', 'รับชำระคงเหลือ Order', 0, '17:00', 'Finance', 'คุณพร', 1200, 'pending', 'high'],
  ['finance_due', 'ap-1', 'payment_due', 'จ่ายค่าวัสดุห่อ', 2, '11:00', 'Finance', 'Packaging Floral House', 3600, 'pending', 'normal'],
  ['supplier_po', 'po-1', 'purchase_order', 'รับดอกไม้สดจาก Supplier', 0, '08:30', 'หน้าร้าน', 'ตลาดดอกไม้ปากคลอง', 5200, 'pending', 'urgent'],
  ['supplier_po', 'po-2', 'purchase_order', 'ติดตาม PO แจกันแก้ว', 3, '10:30', 'โทรศัพท์', 'Glass Vase Center', 3200, 'pending', 'normal'],
  ['inventory_alert', 'inv-1', 'stock_use_soon', 'รีบใช้ยิปโซขาว', 0, '', 'ห้องเย็น', 'Inventory', 650, 'pending', 'high'],
  ['inventory_alert', 'inv-2', 'stock_expiry', 'ลิลลี่ใกล้หมดอายุ', 1, '', 'ห้องเย็น', 'Inventory', 1650, 'pending', 'high'],
  ['manual_task', 'manual-1', 'manual', 'เช็กริบบิ้นและการ์ด', 0, '09:30', 'Studio', 'ทีมร้าน', 0, 'pending', 'normal'],
  ['manual_task', 'manual-2', 'manual', 'ถ่ายรูปสินค้าใหม่', 0, '13:30', 'หน้าร้าน', 'ทีม Marketing', 0, 'pending', 'low'],
  ['order', 'ord-4', 'delivery', 'จัดส่งพวงหรีด', -1, '12:00', 'วัดใกล้ร้าน', 'คุณพร', 2000, 'overdue', 'urgent'],
  ['event_project', 'ev-4', 'setup', 'Setup งานหมั้น', 5, '10:00', 'Private House', 'คุณแพรว', 18500, 'pending', 'high']
];

export const mockCalendarEvents = baseEvents.map((row, index) => ({
  id: `cal-mock-${index + 1}`,
  calendarNo: `CAL-${String(index + 1).padStart(4, '0')}`,
  sourceType: row[0],
  sourceId: row[1],
  title: row[3],
  description: `${eventTypes[row[2]] || row[2]} จาก ${sourceTypes[row[0]]?.label || row[0]}`,
  eventType: row[2],
  startDate: dateKey(row[4]),
  startTime: row[5],
  endDate: dateKey(row[4]),
  endTime: row[5] ? addMinutes(row[5], 60) : '',
  allDay: !row[5],
  location: row[6],
  customerId: '',
  customerName: row[7],
  relatedAmount: row[8],
  status: row[9],
  priority: row[10],
  assignedTo: row[0] === 'manual_task' ? row[7] : 'ทีมร้าน',
  reminderEnabled: true,
  reminderMinutesBefore: 60,
  colorKey: sourceTypes[row[0]]?.color || 'pink',
  note: '',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
}));

export const mockReminders = mockCalendarEvents.slice(0, 10).map((event, index) => ({
  id: `reminder-mock-${index + 1}`,
  calendarEventId: event.id,
  sourceType: event.sourceType,
  sourceId: event.sourceId,
  title: event.title,
  remindAt: `${event.startDate}T${event.startTime || '09:00'}:00.000Z`,
  priority: event.priority,
  status: index % 4 === 0 ? 'shown' : 'pending',
  shownAt: '',
  dismissedAt: '',
  snoozedUntil: '',
  createdAt: new Date().toISOString()
}));

function addMinutes(time, minutes) {
  const [h, m] = time.split(':').map(Number);
  const date = new Date(2026, 0, 1, h, m + minutes);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}
