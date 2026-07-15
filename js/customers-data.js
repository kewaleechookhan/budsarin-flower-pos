export const customerTypes = {
  walk_in: 'ลูกค้าหน้าร้าน',
  online: 'ลูกค้าออนไลน์',
  event: 'ลูกค้างานจัดสถานที่',
  corporate: 'ลูกค้าองค์กร',
  vip: 'VIP',
  other: 'อื่น ๆ'
};

export const customerSegments = {
  new: 'ลูกค้าใหม่',
  regular: 'ลูกค้าประจำ',
  vip: 'ลูกค้ามูลค่าสูง',
  inactive: 'ไม่ได้ซื้อซ้ำนาน',
  lead: 'ลูกค้าสนใจ',
  corporate: 'องค์กร'
};

export const customerStatuses = {
  active: { label: 'ใช้งานอยู่', tone: 'success' },
  inactive: { label: 'ไม่ใช้งาน', tone: 'warning' },
  blocked: { label: 'บล็อก', tone: 'danger' }
};

export const dateTypes = {
  birthday: 'วันเกิด',
  anniversary: 'วันครบรอบ',
  wedding: 'วันแต่งงาน',
  graduation: 'วันรับปริญญา',
  memorial: 'วันรำลึก',
  corporate: 'วันสำคัญองค์กร',
  other: 'อื่น ๆ'
};

export const followUpTypes = {
  birthday_offer: 'เสนอวันเกิด',
  anniversary_offer: 'เสนอวันครบรอบ',
  after_sale: 'หลังการขาย',
  event_follow_up: 'ติดตามงาน Event',
  payment_follow_up: 'ติดตามชำระเงิน',
  inactive_customer: 'ลูกค้าหายไป',
  custom: 'กำหนดเอง'
};

export const followUpStatuses = {
  pending: { label: 'รอติดตาม', tone: 'warning' },
  done: { label: 'เสร็จแล้ว', tone: 'success' },
  cancelled: { label: 'ยกเลิก', tone: 'danger' },
  overdue: { label: 'เกินกำหนด', tone: 'danger' }
};

const now = new Date();
const dateOf = day => new Date(now.getFullYear(), now.getMonth(), day).toISOString().slice(0, 10);
const oldDate = days => new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);

export const mockCustomers = [
  ['CUS-001', 'คุณมะลิ', '081-111-2222', '@mali', 'walk_in', 'regular', 12600, 5, 4, 'ช่อเกาหลี', 'ชมพูพาสเทล'],
  ['CUS-002', 'คุณโรส', '082-222-3333', '@rose', 'online', 'vip', 28500, 11, 8, 'ช่อใหญ่พรีเมียม', 'แดงไวน์'],
  ['CUS-003', 'บริษัท Bloom Co.', '083-333-4444', '@bloomco', 'corporate', 'corporate', 42000, 8, 12, 'กระเช้าองค์กร', 'ขาวเขียว'],
  ['CUS-004', 'คุณพริม', '084-444-5555', '@prim', 'event', 'vip', 68000, 3, 18, 'งานแต่ง', 'ครีมทอง'],
  ['CUS-005', 'คุณน้ำ', '085-555-6666', '@nam', 'online', 'new', 1800, 1, 5, 'แจกัน', 'ฟ้าอ่อน'],
  ['CUS-006', 'คุณมายด์', '086-666-7777', '@mind', 'walk_in', 'regular', 9200, 4, 20, 'ช่อมินิมอล', 'ขาวชมพู'],
  ['CUS-007', 'คุณกานต์', '087-777-8888', '@kan', 'other', 'inactive', 3500, 2, 130, 'พวงหรีด', 'ขาว'],
  ['CUS-008', 'คุณพลอย', '088-888-9999', '@ploy', 'online', 'regular', 14500, 6, 11, 'ดอกไม้สด', 'ม่วง'],
  ['CUS-009', 'คุณแพรว', '089-111-3333', '@praew', 'walk_in', 'lead', 0, 0, 0, 'ช่อรับปริญญา', 'เหลือง'],
  ['CUS-010', 'คุณแตงโม', '080-222-4444', '@tangmo', 'vip', 'vip', 35500, 10, 6, 'กุหลาบพรีเมียม', 'ชมพูแดง'],
  ['CUS-011', 'คุณออม', '081-555-7777', '@aom', 'event', 'regular', 15600, 3, 25, 'งานหมั้น', 'พีช'],
  ['CUS-012', 'คุณฟ้า', '082-666-8888', '@fah', 'online', 'new', 2600, 1, 2, 'กระเช้าเยี่ยมไข้', 'สดใส']
].map((row, index) => ({
  id: `customer-${index + 1}`,
  customerCode: row[0],
  customerName: row[1],
  phone: row[2],
  lineId: row[3],
  facebook: row[3].replace('@', 'fb/'),
  email: `customer${index + 1}@budsarin.local`,
  address: `ที่อยู่ตัวอย่าง ${index + 1}`,
  district: 'เมือง',
  province: index % 3 === 0 ? 'กรุงเทพฯ' : 'นนทบุรี',
  birthday: dateOf(Math.min(index + 3, 28)),
  anniversaryDate: dateOf(Math.min(index + 10, 28)),
  importantDates: [],
  customerType: row[4],
  customerSegment: row[5],
  preferredFlowerStyle: row[9],
  preferredColorTheme: row[10],
  favoriteProducts: row[9],
  averageBudget: row[7] ? Math.round(row[6] / row[7]) : 1800,
  totalSpent: row[6],
  totalOrders: row[7],
  lastOrderDate: row[7] ? oldDate(row[8]) : '',
  lastContactDate: oldDate(Math.max(row[8] - 2, 1)),
  consentToContact: true,
  status: row[5] === 'inactive' ? 'inactive' : 'active',
  note: '',
  createdAt: now.toISOString(),
  updatedAt: now.toISOString()
}));

export const mockImportantDates = mockCustomers.map((customer, index) => ({
  id: `date-${index + 1}`,
  customerId: customer.id,
  customerName: customer.customerName,
  dateType: index % 3 === 0 ? 'birthday' : index % 3 === 1 ? 'anniversary' : 'graduation',
  date: dateOf(Math.min(index + 2, 28)),
  title: index % 3 === 0 ? 'วันเกิด' : index % 3 === 1 ? 'วันครบรอบ' : 'วันรับปริญญา',
  description: 'โอกาสสำคัญสำหรับเสนอช่อดอกไม้',
  reminderDaysBefore: 7,
  isRecurring: true,
  lastReminderSent: '',
  note: '',
  createdAt: now.toISOString()
}));

export const mockFollowUps = mockCustomers.map((customer, index) => ({
  id: `follow-${index + 1}`,
  customerId: customer.id,
  customerName: customer.customerName,
  followUpType: index % 4 === 0 ? 'birthday_offer' : index % 4 === 1 ? 'after_sale' : index % 4 === 2 ? 'inactive_customer' : 'custom',
  title: index % 4 === 0 ? 'ทักวันเกิด' : index % 4 === 1 ? 'ขอบคุณหลังการขาย' : index % 4 === 2 ? 'ทักลูกค้าที่หายไป' : 'ติดตามทั่วไป',
  description: 'ติดต่อลูกค้าพร้อมข้อความแนะนำ',
  dueDate: dateOf(Math.min(index + 1, 28)),
  status: index % 5 === 0 ? 'done' : 'pending',
  priority: index % 3 === 0 ? 'high' : index % 3 === 1 ? 'normal' : 'low',
  relatedOrderId: '',
  relatedEventId: '',
  note: '',
  createdAt: now.toISOString(),
  updatedAt: now.toISOString()
}));

export const mockPurchaseHistory = Array.from({ length: 20 }, (_, index) => {
  const customer = mockCustomers[index % mockCustomers.length];
  const amount = 900 + (index % 7) * 650;
  return {
    id: `hist-${index + 1}`,
    customerId: customer.id,
    customerName: customer.customerName,
    sourceType: index % 2 ? 'order' : 'pos_sale',
    sourceId: `source-${index + 1}`,
    date: oldDate(index * 5 + 1),
    description: index % 2 ? 'ออเดอร์ช่อดอกไม้' : 'ขายหน้าร้าน',
    category: index % 3 === 0 ? 'ช่อดอกไม้' : index % 3 === 1 ? 'แจกัน' : 'กระเช้า',
    colorTheme: customer.preferredColorTheme,
    flowerStyle: customer.preferredFlowerStyle,
    amount
  };
});
