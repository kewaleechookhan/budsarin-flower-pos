export const incomeCategories = [
  'ขายหน้าร้าน',
  'ออเดอร์ลูกค้า',
  'งานจัดสถานที่',
  'ค่ามัดจำ',
  'ค่าจัดส่ง',
  'ค่าบริการเพิ่มเติม',
  'รายรับอื่น ๆ'
];

export const expenseCategories = [
  'ซื้อดอกไม้',
  'ซื้อวัสดุห่อ',
  'ค่าเช่าร้าน',
  'ค่าน้ำ',
  'ค่าไฟ',
  'ค่าอินเทอร์เน็ต',
  'ค่าแรงพนักงาน',
  'ค่าจัดส่ง/ค่าน้ำมัน',
  'ค่าเช่าอุปกรณ์',
  'ค่าการตลาด',
  'ค่าซ่อมบำรุง',
  'ค่าอุปกรณ์สำนักงาน',
  'ค่าธรรมเนียมธนาคาร',
  'ภาษี/ค่าธรรมเนียม',
  'รายจ่ายอื่น ๆ'
];

export const paymentMethods = {
  cash: 'เงินสด',
  transfer: 'โอน',
  qr: 'QR',
  card: 'บัตร',
  deposit: 'มัดจำ',
  mixed: 'ผสม',
  other: 'อื่น ๆ'
};

export const paymentStatuses = {
  paid: { label: 'ชำระแล้ว', tone: 'success' },
  partial: { label: 'บางส่วน', tone: 'warning' },
  pending: { label: 'รอชำระ', tone: 'info' },
  cancelled: { label: 'ยกเลิก', tone: 'danger' },
  refunded: { label: 'คืนเงิน', tone: 'danger' }
};

export const defaultFinanceSettings = {
  openingBalance: 30000,
  initialInvestment: 350000,
  fixedMonthlyCosts: 45000,
  targetGrossMargin: 45,
  averageMonthlyNetProfit: 35000,
  targetMonthlySales: 120000,
  targetNetProfit: 35000,
  minimumCashBalance: 15000,
  accountingCycleStartDay: 1,
  syncPOS: true,
  syncOrders: true
};

const today = new Date();
const dateOf = day => new Date(today.getFullYear(), today.getMonth(), day).toISOString().slice(0, 10);

export const mockIncomeTransactions = [
  ['ขายช่อดอกไม้หน้าร้าน', 'ขายหน้าร้าน', 3200, 'cash', 'paid', 2],
  ['รับมัดจำงานแต่ง', 'ค่ามัดจำ', 12000, 'transfer', 'partial', 3],
  ['รับชำระแจกันดอกไม้', 'ออเดอร์ลูกค้า', 4500, 'qr', 'paid', 4],
  ['ค่าจัดส่งโซนเมือง', 'ค่าจัดส่ง', 350, 'cash', 'paid', 5],
  ['งานพวงหรีดวัดใกล้ร้าน', 'ออเดอร์ลูกค้า', 2800, 'transfer', 'paid', 6],
  ['งานกระเช้าเยี่ยมไข้', 'ออเดอร์ลูกค้า', 1900, 'card', 'paid', 7],
  ['ขายดอกไม้สด', 'ขายหน้าร้าน', 1600, 'cash', 'paid', 8],
  ['รับมัดจำช่อรับปริญญา', 'ค่ามัดจำ', 900, 'qr', 'partial', 9],
  ['ค่าบริการจัดโต๊ะเล็ก', 'ค่าบริการเพิ่มเติม', 2500, 'transfer', 'paid', 10],
  ['ขายการ์ดและริบบิ้น', 'ขายหน้าร้าน', 480, 'cash', 'paid', 11],
  ['รับชำระคงเหลือออเดอร์', 'ออเดอร์ลูกค้า', 2200, 'transfer', 'paid', 12],
  ['รายรับอื่น ๆ', 'รายรับอื่น ๆ', 650, 'other', 'paid', 13]
].map((row, index) => ({
  id: `inc-mock-${index + 1}`,
  transactionNo: `INC-${String(index + 1).padStart(4, '0')}`,
  date: dateOf(row[5]),
  time: `${String(9 + (index % 8)).padStart(2, '0')}:30`,
  category: row[1],
  sourceType: 'manual',
  sourceId: '',
  customerId: '',
  customerName: index % 3 === 0 ? 'ลูกค้าหน้าร้าน' : 'ลูกค้า Budsarin',
  description: row[0],
  amount: row[2],
  paymentMethod: row[3],
  paymentStatus: row[4],
  evidenceImage: 'payment-placeholder',
  note: '',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
}));

export const mockExpenseTransactions = [
  ['ซื้อกุหลาบ', 'ซื้อดอกไม้', 5200, 'transfer', 'paid', 2],
  ['ซื้อยิปโซ', 'ซื้อดอกไม้', 1300, 'cash', 'paid', 3],
  ['ซื้อกระดาษห่อ', 'ซื้อวัสดุห่อ', 1800, 'transfer', 'paid', 4],
  ['ค่าเช่าร้าน', 'ค่าเช่าร้าน', 18000, 'transfer', 'paid', 1],
  ['ค่าไฟ', 'ค่าไฟ', 4200, 'qr', 'pending', 15],
  ['ค่าน้ำ', 'ค่าน้ำ', 650, 'qr', 'pending', 15],
  ['ค่าน้ำมันจัดส่ง', 'ค่าจัดส่ง/ค่าน้ำมัน', 1100, 'cash', 'paid', 7],
  ['ค่าการตลาดออนไลน์', 'ค่าการตลาด', 2500, 'card', 'paid', 8],
  ['ค่าแรงพนักงานพาร์ตไทม์', 'ค่าแรงพนักงาน', 7200, 'transfer', 'paid', 9],
  ['ค่าซ่อมกรรไกรและอุปกรณ์', 'ค่าซ่อมบำรุง', 900, 'cash', 'paid', 10],
  ['ค่าธรรมเนียมโอน', 'ค่าธรรมเนียมธนาคาร', 280, 'transfer', 'paid', 11],
  ['ซื้อแจกันแก้ว', 'ซื้อวัสดุห่อ', 3600, 'transfer', 'partial', 12]
].map((row, index) => ({
  id: `exp-mock-${index + 1}`,
  transactionNo: `EXP-${String(index + 1).padStart(4, '0')}`,
  date: dateOf(row[5]),
  time: `${String(10 + (index % 7)).padStart(2, '0')}:00`,
  category: row[1],
  supplierId: '',
  supplierName: index % 2 ? 'Supplier Market' : 'ปากคลองตลาด',
  description: row[0],
  amount: row[2],
  paymentMethod: row[3],
  paymentStatus: row[4],
  dueDate: row[4] === 'paid' ? '' : dateOf(Math.min(row[5] + 7, 28)),
  evidenceImage: 'receipt-placeholder',
  note: '',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
}));
