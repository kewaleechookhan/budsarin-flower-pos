import { calculateBreakEvenSales } from './calculations.js';

const breakEvenTarget = calculateBreakEvenSales(45000, 0.45);

export const mockData = {
  kpis: [
    { id: 'sales', label: 'ยอดขายวันนี้', value: 8950, type: 'money', compare: '+18% จากเมื่อวาน', trend: 'up', icon: 'receipt' },
    { id: 'orders', label: 'ออร์เดอร์วันนี้', value: 7, suffix: 'งาน', compare: '+2 งาน', trend: 'up', icon: 'package-check' },
    { id: 'profit', label: 'กำไรประมาณการ', value: 3280, type: 'money', compare: 'Margin 36.6%', trend: 'up', icon: 'trending-up' },
    { id: 'deliveries', label: 'งานที่ต้องส่งวันนี้', value: 4, suffix: 'งาน', compare: 'พร้อมส่ง 1 งาน', trend: 'flat', icon: 'truck' },
    { id: 'receivable', label: 'ยอดค้างชำระ', value: 12500, type: 'money', compare: '3 ออร์เดอร์', trend: 'down', icon: 'credit-card' },
    { id: 'waste', label: 'Waste Cost เดือนนี้', value: 1250, type: 'money', compare: '-7% จากเดือนก่อน', trend: 'down', icon: 'leaf' }
  ],
  breakEven: {
    currentSales: 72500,
    targetSales: breakEvenTarget,
    fixedCosts: 45000,
    grossMarginRate: 0.45
  },
  salesChart: {
    week: [5200, 7600, 6900, 8950, 6200, 11400, 9800],
    month: [38500, 44200, 51800, 60100, 72500]
  },
  schedule: [
    { id: 1, time: '10:00', type: 'รับช่อดอกไม้วันเกิด', customer: 'คุณมายด์', status: 'preparing', note: 'โทนชมพูครีม' },
    { id: 2, time: '13:30', type: 'จัดส่งแจกันดอกไม้', customer: 'โรงแรมอันดามัน', status: 'ready', note: 'รับเงินปลายทาง' },
    { id: 3, time: '16:00', type: 'นัดดูสถานที่งานแต่งงาน', customer: 'คุณฟ้า และคุณบอส', status: 'pending', note: 'Backdrop ดอกไม้สด' },
    { id: 4, time: '18:00', type: 'เตรียมดอกไม้สำหรับงานพรุ่งนี้', customer: 'ทีมสตูดิโอ', status: 'delivering', note: 'เช็กสต็อกกุหลาบขาว' }
  ],
  orderStatus: [
    ['pending', 3], ['deposit', 5], ['preparing', 4], ['ready', 2], ['delivering', 1], ['completed', 12], ['cancelled', 1]
  ],
  stockAlerts: [
    { name: 'กุหลาบชมพู', detail: 'ควรใช้ภายใน 1 วัน', qty: '24 ดอก', level: 'warning' },
    { name: 'ยิปโซขาว', detail: 'ต่ำกว่าจุดสั่งซื้อ', qty: '3 กำ', level: 'danger' },
    { name: 'ลิลลี่ขาว', detail: 'เหมาะกับงานแจกันวันนี้', qty: '8 ดอก', level: 'warning' },
    { name: 'ริบบิ้นแชมเปญ', detail: 'ต้องสั่งเพิ่มก่อนสุดสัปดาห์', qty: '2 ม้วน', level: 'danger' }
  ],
  events: [
    { name: 'Wedding Garden Setup', customer: 'คุณฟ้า และคุณบอส', date: '2026-07-12', place: 'เรือนแก้ว การ์เด้น', value: 68000, deposit: 30000, progress: 62, status: 'เตรียมแบบดอกไม้' },
    { name: 'Grand Opening', customer: 'The Rose Cafe', date: '2026-07-18', place: 'สุขุมวิท 39', value: 24500, deposit: 10000, progress: 38, status: 'รอคอนเฟิร์มสีหลัก' }
  ],
  finance: {
    revenue: 184500,
    expenses: 96500,
    grossProfit: 88000,
    netProfit: 52000,
    receivable: 38500,
    payable: 14200,
    cashBalance: 126800
  },
  notifications: [
    'มีออร์เดอร์ใหม่รอคอนเฟิร์ม 2 รายการ',
    'ยิปโซขาวต่ำกว่าจุดสั่งซื้อ',
    'งาน Wedding Garden Setup ต้องยืนยันแบบภายในวันนี้'
  ],
  userAdds: []
};
