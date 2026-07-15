export const STATUS = {
  pending: { label: 'รอชำระเงิน', tone: 'warning' },
  deposit: { label: 'ชำระมัดจำแล้ว', tone: 'info' },
  preparing: { label: 'กำลังจัดดอกไม้', tone: 'pink' },
  ready: { label: 'พร้อมส่ง', tone: 'success' },
  delivering: { label: 'กำลังจัดส่ง', tone: 'gold' },
  completed: { label: 'เสร็จสิ้น', tone: 'success' },
  cancelled: { label: 'ยกเลิก', tone: 'danger' }
};

export const MENU_ITEMS = [
  ['dashboard', 'ภาพรวม', 'Dashboard', 'layout-dashboard'],
  ['pos', 'ขายหน้าร้าน', 'POS', 'shopping-bag'],
  ['orders', 'ออร์เดอร์ลูกค้า', 'Orders', 'package'],
  ['events', 'งานจัดสถานที่', 'Events', 'sparkles'],
  ['calendar', 'ปฏิทินงาน', 'Calendar', 'calendar-days'],
  ['products', 'สินค้าและบริการ', 'Products', 'flower'],
  ['cost', 'คำนวณต้นทุน', 'Cost Calculator', 'calculator'],
  ['inventory', 'สต็อกดอกไม้', 'Inventory', 'boxes'],
  ['finance', 'รายรับรายจ่าย', 'Finance', 'wallet'],
  ['customers', 'ลูกค้า', 'Customers', 'users'],
  ['suppliers', 'ซัพพลายเออร์', 'Suppliers', 'truck'],
  ['reports', 'รายงาน', 'Reports', 'bar-chart-3'],
  ['settings', 'ตั้งค่าร้าน', 'Settings', 'settings']
];

export const QUICK_ADD_ITEMS = [
  ['new-order', 'รับออร์เดอร์ใหม่'],
  ['pos-sale', 'ขายหน้าร้าน'],
  ['income', 'เพิ่มรายรับ'],
  ['expense', 'เพิ่มรายจ่าย'],
  ['event', 'เพิ่มงานจัดสถานที่'],
  ['customer', 'เพิ่มลูกค้า']
];
