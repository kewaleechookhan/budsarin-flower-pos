export const jobTypes = {
  bouquet: 'ช่อดอกไม้',
  vase: 'แจกัน',
  basket: 'กระเช้า',
  wreath: 'พวงหรีด',
  fresh_flower: 'ดอกไม้สด',
  gift_set: 'ชุดของขวัญ',
  custom: 'งาน Custom',
  event_piece: 'ชิ้นงานสำหรับงานจัดสถานที่'
};

export const costCategories = [
  'ดอกไม้หลัก',
  'ดอกไม้เสริม',
  'ใบไม้ / Greenery',
  'วัสดุห่อ',
  'ริบบิ้น',
  'การ์ด',
  'กล่อง / แจกัน / ตะกร้า',
  'อุปกรณ์ตกแต่ง',
  'ค่าแรง',
  'ค่าจัดส่ง',
  'Waste / Loss',
  'ค่าใช้จ่ายแฝง',
  'อื่น ๆ'
];

export const unitOptions = ['ดอก', 'ก้าน', 'กำ', 'ใบ', 'ชิ้น', 'แผ่น', 'เมตร', 'ม้วน', 'กล่อง', 'ใบ/ลูก', 'ชุด', 'ครั้ง', 'บาท', 'อื่น ๆ'];

export const mockCostItems = [
  ['กุหลาบชมพู', 'ดอกไม้หลัก', 'ดอก', 38, 'Rose Garden'],
  ['กุหลาบแดง', 'ดอกไม้หลัก', 'ดอก', 38, 'Rose Garden'],
  ['ลิลลี่ขาว', 'ดอกไม้หลัก', 'ก้าน', 72, 'Phuket Flower Hub'],
  ['คาร์เนชั่น', 'ดอกไม้เสริม', 'ดอก', 18, 'Flora Market'],
  ['ยิปโซ', 'ดอกไม้เสริม', 'กำ', 55, 'Flora Market'],
  ['ใบยูคาลิปตัส', 'ใบไม้ / Greenery', 'กำ', 40, 'Green House'],
  ['ใบเฟิร์น', 'ใบไม้ / Greenery', 'กำ', 25, 'Green House'],
  ['กระดาษห่อพรีเมียม', 'วัสดุห่อ', 'แผ่น', 18, 'Wrap Studio'],
  ['ริบบิ้นซาติน', 'ริบบิ้น', 'เมตร', 12, 'Wrap Studio'],
  ['การ์ดข้อความ', 'การ์ด', 'ใบ', 8, 'Local Print'],
  ['กล่องใสดอกไม้', 'กล่อง / แจกัน / ตะกร้า', 'กล่อง', 70, 'Gift Box Co.'],
  ['แจกันแก้ว', 'กล่อง / แจกัน / ตะกร้า', 'ใบ/ลูก', 180, 'Vase Supply'],
  ['ตะกร้าหวาย', 'กล่อง / แจกัน / ตะกร้า', 'ใบ/ลูก', 150, 'Basket Home'],
  ['ค่าแรงจัดช่อ', 'ค่าแรง', 'ครั้ง', 180, 'In-house'],
  ['ค่าจัดส่งในเมือง', 'ค่าจัดส่ง', 'ครั้ง', 100, 'Delivery Team'],
  ['ค่าเสียหายดอกไม้', 'Waste / Loss', 'บาท', 80, 'Estimate']
].map((row, index) => ({
  id: `cost-mock-${index + 1}`,
  name: row[0],
  category: row[1],
  defaultUnit: row[2],
  defaultCost: row[3],
  supplier: row[4],
  stockTracking: !['ค่าแรง', 'ค่าจัดส่ง', 'Waste / Loss'].includes(row[1])
}));

export const defaultCostItems = [
  { id: crypto.randomUUID(), category: 'ดอกไม้หลัก', itemName: 'กุหลาบชมพู', quantity: 12, unit: 'ดอก', unitCost: 38, supplier: 'Rose Garden', note: '' },
  { id: crypto.randomUUID(), category: 'ดอกไม้เสริม', itemName: 'ยิปโซ', quantity: 1, unit: 'กำ', unitCost: 55, supplier: 'Flora Market', note: '' },
  { id: crypto.randomUUID(), category: 'ใบไม้ / Greenery', itemName: 'ใบยูคาลิปตัส', quantity: 1, unit: 'กำ', unitCost: 40, supplier: 'Green House', note: '' },
  { id: crypto.randomUUID(), category: 'วัสดุห่อ', itemName: 'กระดาษห่อพรีเมียม', quantity: 2, unit: 'แผ่น', unitCost: 18, supplier: 'Wrap Studio', note: '' },
  { id: crypto.randomUUID(), category: 'ค่าแรง', itemName: 'ค่าแรงจัดช่อ', quantity: 1, unit: 'ครั้ง', unitCost: 180, supplier: 'In-house', note: '' }
];
