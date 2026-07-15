const now = new Date();
const dateOf = offset => {
  const date = new Date(now);
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
};

export const eventTypes = {
  wedding: 'งานแต่งงาน',
  birthday: 'งานวันเกิด',
  opening: 'งานเปิดร้าน',
  meeting: 'งานประชุม',
  ceremony: 'งานพิธี',
  graduation: 'งานรับปริญญา',
  funeral: 'งานศพ/พิธีไว้อาลัย',
  corporate: 'งานองค์กร',
  private_party: 'งานเลี้ยงส่วนตัว',
  other: 'อื่น ๆ'
};

export const projectStatuses = {
  lead: { label: 'ลูกค้าสอบถาม', tone: 'info' },
  quotation_draft: { label: 'ร่างใบเสนอราคา', tone: 'warning' },
  quotation_sent: { label: 'ส่งใบเสนอราคาแล้ว', tone: 'gold' },
  negotiating: { label: 'กำลังต่อรอง', tone: 'pink' },
  confirmed: { label: 'ยืนยันงาน', tone: 'success' },
  deposit_paid: { label: 'รับมัดจำแล้ว', tone: 'success' },
  planning: { label: 'วางแผนงาน', tone: 'info' },
  preparing: { label: 'เตรียมงาน', tone: 'pink' },
  setup: { label: 'กำลังติดตั้ง', tone: 'gold' },
  event_day: { label: 'วันจัดงาน', tone: 'danger' },
  teardown: { label: 'รื้อถอน', tone: 'warning' },
  completed: { label: 'เสร็จสิ้น', tone: 'success' },
  cancelled: { label: 'ยกเลิก', tone: 'danger' }
};

export const eventPaymentStatuses = {
  unpaid: { label: 'ยังไม่ชำระ', tone: 'warning' },
  deposit: { label: 'ชำระมัดจำ', tone: 'gold' },
  partial: { label: 'ชำระบางส่วน', tone: 'info' },
  paid: { label: 'ชำระครบ', tone: 'success' },
  overdue: { label: 'เกินกำหนด', tone: 'danger' },
  cancelled: { label: 'ยกเลิก', tone: 'danger' },
  refunded: { label: 'คืนเงิน', tone: 'warning' }
};

export const quotationCategories = [
  'Backdrop', 'ช่อเจ้าสาว', 'ช่อเพื่อนเจ้าสาว', 'โต๊ะลงทะเบียน', 'ดอกไม้หน้าเวที',
  'ดอกไม้โต๊ะอาหาร', 'แจกันตกแต่ง', 'ซุ้มดอกไม้', 'พวงมาลัย/ดอกไม้พิธี',
  'ค่าแรงทีมงาน', 'ค่าขนส่ง', 'ค่าเช่าอุปกรณ์', 'ค่าออกแบบ', 'อื่น ๆ'
];

export const eventCostCategories = [
  'ดอกไม้', 'ใบไม้', 'วัสดุตกแต่ง', 'โครงสร้าง / Backdrop', 'แจกัน / ภาชนะ',
  'ผ้า / ริบบิ้น', 'ป้าย / สิ่งพิมพ์', 'ค่าแรงทีมงาน', 'ค่ารถ / ค่าน้ำมัน',
  'ค่าอาหารทีมงาน', 'ค่าเช่าอุปกรณ์', 'ค่าที่พัก', 'Waste / Loss', 'ค่าใช้จ่ายแฝง', 'อื่น ๆ'
];

export const defaultEventSettings = {
  defaultDepositPercent: 30,
  defaultPaymentTerms: 'มัดจำ 30% ก่อนเริ่มงาน และชำระส่วนที่เหลือก่อนวันจัดงาน',
  defaultQuotationValidDays: 7,
  lowMarginThreshold: 30,
  defaultTaxRate: 0,
  defaultServiceChargeRate: 0
};

const rows = [
  ['EV-202607-001', 'Wedding White Green Garden', 'wedding', 'คุณฟ้า และคุณบอส', '082-666-8888', 'เรือนแก้ว การ์เด้น', 8, 68000, 30000, 36000, 'deposit_paid', 'planning', 'ขาวเขียว', 'Garden romantic', 180],
  ['EV-202607-002', 'Pastel Birthday Private Party', 'birthday', 'คุณมายด์', '089-111-2233', 'บ้านส่วนตัว ลากูน่า', 4, 18500, 6000, 9200, 'deposit', 'confirmed', 'ชมพูพาสเทล', 'Sweet pastel', 35],
  ['EV-202607-003', 'Grand Opening Rose Cafe', 'opening', 'The Rose Cafe', '086-777-8899', 'สุขุมวิท 39', 12, 24500, 10000, 12500, 'deposit', 'preparing', 'ครีมทอง', 'Luxury cafe', 80],
  ['EV-202607-004', 'Corporate Meeting Floral Stage', 'corporate', 'Andaman Hotel', '081-222-3344', 'Andaman Hotel Ballroom', 16, 36000, 18000, 16400, 'partial', 'quotation_sent', 'ขาวน้ำเงิน', 'Corporate elegant', 120],
  ['EV-202607-005', 'Graduation Floral Booth', 'graduation', 'คุณแพรว', '089-111-3333', 'มหาวิทยาลัยตัวอย่าง', 20, 15500, 5000, 8200, 'deposit', 'lead', 'เหลืองครีม', 'Fresh celebration', 60],
  ['EV-202607-006', 'Memorial Ceremony White Floral', 'funeral', 'คุณกานต์', '087-777-8888', 'ศาลาพิธี เมืองภูเก็ต', 2, 22000, 0, 11200, 'unpaid', 'quotation_draft', 'ขาวเขียว', 'สุภาพ เรียบง่าย', 100]
];

export const mockEventProjects = rows.map((row, index) => {
  const finalAmount = row[7];
  const paidAmount = row[8];
  const estimatedCost = row[9];
  const grossProfit = finalAmount - estimatedCost;
  return {
    id: `event-${index + 1}`,
    eventNo: row[0],
    projectName: row[1],
    eventType: row[2],
    customerId: `event-customer-${index + 1}`,
    customerName: row[3],
    customerPhone: row[4],
    customerContact: index % 2 ? 'Facebook' : 'LINE',
    venueName: row[5],
    venueAddress: `${row[5]} จังหวัดภูเก็ต`,
    venueMapLink: '',
    eventDate: dateOf(row[6]),
    eventStartTime: '17:00',
    eventEndTime: '21:00',
    setupDate: dateOf(row[6] - 1),
    setupTime: '10:00',
    teardownDate: dateOf(row[6] + 1),
    teardownTime: '09:00',
    guestCount: row[14],
    themeColor: row[12],
    style: row[13],
    description: `${row[1]} พร้อมตกแต่งดอกไม้สดตามธีม`,
    referenceImage: 'event-reference-placeholder',
    quotationId: `quotation-${index + 1}`,
    quotationAmount: finalAmount,
    discountAmount: 0,
    finalAmount,
    depositAmount: Math.round(finalAmount * 0.3),
    paidAmount,
    balanceAmount: Math.max(finalAmount - paidAmount, 0),
    estimatedCost,
    actualCost: index % 2 ? estimatedCost + 1200 : 0,
    grossProfit,
    grossMargin: finalAmount ? grossProfit / finalAmount * 100 : 0,
    paymentStatus: row[10],
    projectStatus: row[11],
    teamMembers: ['ทีมจัดดอกไม้', 'ทีมขนส่ง'],
    internalNote: 'ตรวจ reference และยืนยัน mood board ก่อนสั่งดอกไม้',
    createdAt: new Date(now.getFullYear(), now.getMonth(), 1 + index).toISOString(),
    updatedAt: new Date(now.getFullYear(), now.getMonth(), 1 + index).toISOString()
  };
});

export const defaultQuotationItems = [
  ['Backdrop', 'Backdrop ดอกไม้สด', 'โครง backdrop พร้อมดอกไม้สด', 1, 'ชุด', 18000, 9200],
  ['โต๊ะลงทะเบียน', 'ดอกไม้โต๊ะลงทะเบียน', 'แจกันและ arrangement หน้าโต๊ะ', 1, 'ชุด', 6500, 3100],
  ['ดอกไม้โต๊ะอาหาร', 'Centerpiece โต๊ะอาหาร', 'แจกันดอกไม้ตามธีม', 8, 'โต๊ะ', 1800, 820],
  ['ค่าแรงทีมงาน', 'ทีมติดตั้งและรื้อถอน', 'ทีมงาน setup + teardown', 1, 'งาน', 8500, 5200],
  ['ค่าขนส่ง', 'ค่าขนส่งอุปกรณ์', 'รถขนส่งและน้ำมัน', 1, 'เที่ยว', 2500, 1400]
].map((row, index) => ({
  id: `quotation-item-${index + 1}`,
  category: row[0],
  itemName: row[1],
  description: row[2],
  quantity: row[3],
  unit: row[4],
  unitPrice: row[5],
  unitCost: row[6],
  totalPrice: row[3] * row[5],
  totalCost: row[3] * row[6]
}));

export const defaultChecklistSections = {
  'ก่อนรับงาน': ['เก็บข้อมูลลูกค้า', 'รับ Reference', 'ประเมินงบประมาณ', 'ส่งใบเสนอราคา', 'รับมัดจำ'],
  'ก่อนวันงาน': ['สรุปรายการดอกไม้', 'สั่งดอกไม้', 'เตรียมวัสดุ', 'เตรียมอุปกรณ์', 'ยืนยันสถานที่', 'ยืนยันทีมงาน', 'เตรียมรถขนส่ง'],
  'วัน Setup': ['ตรวจเช็กดอกไม้', 'โหลดอุปกรณ์ขึ้นรถ', 'เดินทางไปสถานที่', 'ติดตั้ง Backdrop', 'จัดดอกไม้จุดหลัก', 'ถ่ายภาพส่งลูกค้า', 'ตรวจงานก่อนส่งมอบ'],
  'หลังจบงาน': ['รื้อถอน', 'ตรวจอุปกรณ์', 'บันทึกต้นทุนจริง', 'เก็บยอดคงเหลือ', 'ปิดโปรเจกต์', 'บันทึกภาพผลงาน']
};
