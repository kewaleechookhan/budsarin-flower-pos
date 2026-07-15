export const orderStatuses = {
  draft: { label: 'แบบร่าง', tone: 'info' },
  pending_payment: { label: 'รอชำระเงิน', tone: 'warning' },
  deposit_paid: { label: 'ชำระมัดจำแล้ว', tone: 'gold' },
  waiting_prepare: { label: 'รอจัดดอกไม้', tone: 'pink' },
  preparing: { label: 'กำลังจัด', tone: 'pink' },
  ready: { label: 'พร้อมส่ง/พร้อมรับ', tone: 'success' },
  delivering: { label: 'กำลังจัดส่ง', tone: 'gold' },
  completed: { label: 'เสร็จสิ้น', tone: 'success' },
  cancelled: { label: 'ยกเลิก', tone: 'danger' }
};

export const paymentStatuses = {
  unpaid: { label: 'ยังไม่ชำระ', tone: 'warning' },
  deposit: { label: 'ชำระมัดจำ', tone: 'gold' },
  partial: { label: 'ชำระบางส่วน', tone: 'info' },
  paid: { label: 'ชำระครบ', tone: 'success' },
  refunded: { label: 'คืนเงิน', tone: 'info' },
  cancelled: { label: 'ยกเลิก', tone: 'danger' }
};

export const orderTypes = {
  bouquet: 'ช่อดอกไม้',
  vase: 'แจกัน',
  basket: 'กระเช้า',
  wreath: 'พวงหรีด',
  fresh_flower: 'ดอกไม้สด',
  gift: 'ของขวัญ',
  custom: 'งาน Custom',
  delivery: 'จัดส่ง',
  other: 'อื่น ๆ'
};

export const mockOrders = [
  ['ORD-20260706-001', 'คุณมายด์', '089-111-2233', 'bouquet', 'ช่อกุหลาบชมพูวันเกิด', 1500, 720, 500, '2026-07-06', '10:00', 'waiting_prepare', 'deposit', 'ชมพูครีม', 'Luxury romantic'],
  ['ORD-20260706-002', 'คุณอนันต์', '081-222-3344', 'vase', 'แจกันดอกไม้แสดงความยินดี', 2500, 1200, 2500, '2026-07-06', '13:30', 'ready', 'paid', 'ขาวทอง', 'Modern minimal'],
  ['ORD-20260706-003', 'คุณพร', '082-333-4455', 'wreath', 'พวงหรีดดอกไม้สด', 2000, 960, 0, '2026-07-07', '09:30', 'pending_payment', 'unpaid', 'ขาวเขียว', 'สุภาพ'],
  ['ORD-20260706-004', 'น้องฟ้า', '083-444-5566', 'bouquet', 'ช่อรับปริญญา', 890, 390, 890, '2026-07-08', '15:00', 'completed', 'paid', 'พาสเทล', 'น่ารักสดใส'],
  ['ORD-20260706-005', 'คุณหมิว', '084-555-6677', 'basket', 'กระเช้าเยี่ยมไข้', 1800, 880, 900, '2026-07-09', '11:00', 'deposit_paid', 'deposit', 'ขาวเหลือง', 'อบอุ่น'],
  ['ORD-20260706-006', 'คุณธนา', '085-666-7788', 'custom', 'ช่อดอกไม้ Custom โทนขาวเขียว', 3200, 1550, 1600, '2026-07-10', '17:00', 'preparing', 'partial', 'ขาวเขียว', 'Garden loose'],
  ['ORD-20260706-007', 'The Rose Cafe', '086-777-8899', 'delivery', 'ออร์เดอร์จัดส่งดอกไม้รายวัน', 1200, 540, 0, '2026-07-06', '16:30', 'delivering', 'unpaid', 'ชมพูอ่อน', 'Daily fresh'],
  ['ORD-20260706-008', 'คุณบอส', '087-888-9900', 'custom', 'ช่อดอกไม้ครบรอบแต่งงาน', 4500, 2150, 2000, '2026-07-12', '18:00', 'draft', 'deposit', 'แดงไวน์', 'Premium grand']
].map((row, index) => ({
  id: `mock-${index + 1}`,
  orderNo: row[0],
  customerId: `C-${index + 1}`,
  customerName: row[1],
  customerPhone: row[2],
  customerContact: 'LINE',
  customerAddress: 'ภูเก็ต',
  isNewCustomer: index % 2 === 0,
  orderType: row[3],
  title: row[4],
  description: `${row[4]} พร้อมจัดตามโทนที่ลูกค้าต้องการ`,
  budget: row[5],
  totalAmount: row[5],
  estimatedCost: row[6],
  grossProfit: row[5] - row[6],
  grossMargin: row[5] ? ((row[5] - row[6]) / row[5]) * 100 : 0,
  colorTheme: row[12],
  flowerStyle: row[13],
  cardMessage: 'ขอให้เป็นวันที่สดใส',
  referenceImage: 'reference-placeholder',
  dueDate: row[8],
  dueTime: row[9],
  pickupMethod: index % 3 === 0 ? 'pickup' : 'delivery',
  deliveryAddress: index % 3 === 0 ? '' : 'จัดส่งในเมืองภูเก็ต',
  deliveryFee: index % 3 === 0 ? 0 : 100,
  recipientName: row[1],
  recipientPhone: row[2],
  depositAmount: row[7] === row[5] ? 0 : row[7],
  paidAmount: row[11] === 'paid' ? row[5] : row[7],
  balanceAmount: Math.max(row[5] - row[7], 0),
  paymentMethod: row[11] === 'paid' ? 'transfer' : 'cash',
  paymentStatus: row[11],
  orderStatus: row[10],
  internalNote: 'ตรวจเช็กริบบิ้นและการ์ดก่อนส่ง',
  createdAt: new Date(2026, 6, 6, 9, index * 5).toISOString(),
  updatedAt: new Date(2026, 6, 6, 9, index * 5).toISOString()
}));
