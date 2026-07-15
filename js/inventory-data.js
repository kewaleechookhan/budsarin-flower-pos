const now = new Date();
const dateOf = offset => {
  const date = new Date(now);
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
};

export const inventoryCategories = {
  fresh_flower: 'ดอกไม้สด',
  greenery: 'ใบไม้ / Greenery',
  wrapping: 'กระดาษห่อ',
  ribbon: 'ริบบิ้น',
  container: 'กล่อง / แจกัน / ตะกร้า',
  card: 'การ์ด',
  decor: 'อุปกรณ์ตกแต่ง',
  event_equipment: 'อุปกรณ์งานจัดสถานที่',
  tool: 'เครื่องมือ',
  other: 'อื่น ๆ'
};

export const qualityStatuses = {
  fresh: { label: 'สดมาก', tone: 'success' },
  good: { label: 'ใช้งานได้', tone: 'info' },
  use_soon: { label: 'ควรรีบใช้', tone: 'warning' },
  damaged: { label: 'เสียหาย', tone: 'danger' },
  disposed: { label: 'ตัดจำหน่าย', tone: 'danger' }
};

export const movementTypes = {
  stock_in: 'รับเข้า',
  stock_out: 'ตัดออก',
  adjustment: 'ปรับยอด',
  waste: 'ของเสีย',
  return_to_supplier: 'คืน Supplier',
  transfer: 'ย้ายที่เก็บ'
};

export const referenceTypes = ['manual', 'pos_sale', 'order', 'event', 'cost_calculator', 'supplier_purchase', 'waste', 'adjustment'];

export const wasteReasons = {
  expired: 'หมดอายุ',
  wilted: 'เหี่ยว',
  damaged_transport: 'เสียหายระหว่างขนส่ง',
  damaged_storage: 'เก็บรักษาไม่ดี',
  over_ordered: 'สั่งเกิน',
  customer_cancelled: 'ลูกค้ายกเลิก',
  production_error: 'จัดผิด/ใช้งานผิดพลาด',
  other: 'อื่น ๆ'
};

export const defaultInventorySettings = {
  allowNegativeStock: false,
  useSoonWarningDays: 1,
  expiryWarningDays: 3,
  autoDeductPOS: true,
  autoDeductOrders: true,
  autoFinanceExpenseStockIn: false,
  targetWasteRate: 8,
  defaultMinimumStockByCategory: {
    fresh_flower: 20,
    greenery: 10,
    wrapping: 8,
    ribbon: 5,
    container: 4,
    card: 20,
    decor: 5,
    event_equipment: 2,
    tool: 1,
    other: 3
  }
};

const itemRows = [
  ['INV-FL-001', 'กุหลาบชมพู', 'fresh_flower', 'rose', 'ก้าน', 120, 25, 180, 18, 'sup-001', 'Phuket Flower Market', 1, 3, 'fresh', 'ตู้เย็น A1', true],
  ['INV-FL-002', 'กุหลาบแดง', 'fresh_flower', 'rose', 'ก้าน', 86, 30, 160, 22, 'sup-001', 'Phuket Flower Market', 1, 3, 'fresh', 'ตู้เย็น A1', true],
  ['INV-FL-003', 'ลิลลี่ขาว', 'fresh_flower', 'lily', 'ก้าน', 28, 12, 70, 55, 'sup-002', 'Andaman Floral Supply', -1, 1, 'use_soon', 'ตู้เย็น A2', true],
  ['INV-FL-004', 'คาร์เนชั่น', 'fresh_flower', 'carnation', 'ก้าน', 64, 20, 120, 16, 'sup-001', 'Phuket Flower Market', 0, 2, 'good', 'ตู้เย็น A2', true],
  ['INV-FL-005', 'ทิวลิป', 'fresh_flower', 'tulip', 'ก้าน', 18, 15, 60, 42, 'sup-003', 'Premium Bloom Import', 0, 1, 'use_soon', 'ตู้เย็น B1', true],
  ['INV-FL-006', 'ไฮเดรนเยีย', 'fresh_flower', 'hydrangea', 'ก้าน', 22, 10, 45, 75, 'sup-003', 'Premium Bloom Import', 2, 4, 'fresh', 'ตู้เย็น B1', true],
  ['INV-FL-007', 'เยอบีร่า', 'fresh_flower', 'gerbera', 'ก้าน', 44, 18, 90, 20, 'sup-002', 'Andaman Floral Supply', 1, 3, 'good', 'ตู้เย็น A3', true],
  ['INV-GR-001', 'ยิปโซ', 'greenery', 'filler', 'กำ', 6, 10, 40, 65, 'sup-002', 'Andaman Floral Supply', -1, 0, 'use_soon', 'ตู้เย็น C1', true],
  ['INV-GR-002', 'ใบยูคาลิปตัส', 'greenery', 'leaf', 'กำ', 32, 10, 50, 38, 'sup-004', 'Local Greenery Farm', 3, 6, 'fresh', 'ตู้เย็น C1', true],
  ['INV-GR-003', 'ใบเฟิร์น', 'greenery', 'leaf', 'กำ', 26, 10, 45, 28, 'sup-004', 'Local Greenery Farm', 2, 5, 'good', 'ตู้เย็น C2', true],
  ['INV-GR-004', 'ใบมอนสเตอร่า', 'greenery', 'leaf', 'ใบ', 18, 8, 40, 24, 'sup-004', 'Local Greenery Farm', 3, 7, 'fresh', 'ตู้เย็น C2', true],
  ['INV-WR-001', 'กระดาษห่อพรีเมียม', 'wrapping', 'paper', 'แผ่น', 80, 20, 150, 35, 'sup-005', 'Wrap & Ribbon Co.', -20, '', 'good', 'ชั้นวัสดุ W1', false],
  ['INV-WR-002', 'กระดาษไข', 'wrapping', 'paper', 'แผ่น', 140, 30, 200, 12, 'sup-005', 'Wrap & Ribbon Co.', -20, '', 'good', 'ชั้นวัสดุ W1', false],
  ['INV-RB-001', 'ริบบิ้นซาติน', 'ribbon', 'ribbon', 'ม้วน', 18, 8, 35, 120, 'sup-005', 'Wrap & Ribbon Co.', -15, '', 'good', 'ชั้นวัสดุ R1', false],
  ['INV-CD-001', 'การ์ดข้อความ', 'card', 'card', 'ใบ', 220, 50, 350, 8, 'sup-006', 'Paper Studio', -10, '', 'good', 'ลิ้นชัก C', false],
  ['INV-CT-001', 'กล่องดอกไม้', 'container', 'box', 'ใบ', 24, 8, 50, 70, 'sup-006', 'Paper Studio', -7, '', 'good', 'ชั้นกล่อง B', false],
  ['INV-CT-002', 'แจกันแก้ว', 'container', 'vase', 'ใบ', 12, 6, 30, 180, 'sup-007', 'Glass Decor Phuket', -6, '', 'good', 'ชั้นภาชนะ V', false],
  ['INV-CT-003', 'ตะกร้าหวาย', 'container', 'basket', 'ใบ', 9, 6, 25, 95, 'sup-008', 'Craft Basket House', -8, '', 'good', 'ชั้นภาชนะ K', false],
  ['INV-DC-001', 'โฟมโอเอซิส', 'decor', 'foam', 'ก้อน', 42, 12, 80, 24, 'sup-009', 'Florist Tools Center', -4, '', 'good', 'ชั้นอุปกรณ์ D', false],
  ['INV-TL-001', 'ลวดจัดดอกไม้', 'tool', 'wire', 'ม้วน', 11, 3, 20, 90, 'sup-009', 'Florist Tools Center', -12, '', 'good', 'ชั้นเครื่องมือ T', false]
];

export const mockInventoryItems = itemRows.map((row, index) => ({
  id: `inventory-${index + 1}`,
  itemCode: row[0],
  itemName: row[1],
  category: row[2],
  subCategory: row[3],
  unit: row[4],
  quantityOnHand: row[5],
  minimumStock: row[6],
  maximumStock: row[7],
  costPerUnit: row[8],
  averageCost: row[8],
  supplierId: row[9],
  supplierName: row[10],
  receivedDate: dateOf(-2),
  expiryDate: row[15] ? dateOf(row[11]) : '',
  useByDate: row[15] ? dateOf(row[12]) : '',
  qualityStatus: row[13],
  storageLocation: row[14],
  stockTracking: true,
  isPerishable: row[15],
  note: '',
  createdAt: dateOf(-14),
  updatedAt: new Date().toISOString()
}));

export const mockStockMovements = Array.from({ length: 20 }, (_, index) => {
  const item = mockInventoryItems[index % mockInventoryItems.length];
  const type = index % 5 === 0 ? 'waste' : index % 3 === 0 ? 'stock_out' : 'stock_in';
  const qty = type === 'stock_in' ? 24 + index : 2 + (index % 8);
  return {
    id: `stock-movement-${index + 1}`,
    movementNo: `SM-202607-${String(index + 1).padStart(3, '0')}`,
    itemId: item.id,
    itemName: item.itemName,
    movementType: type,
    quantity: qty,
    unit: item.unit,
    unitCost: item.averageCost,
    totalCost: qty * item.averageCost,
    referenceType: type === 'stock_in' ? 'supplier_purchase' : type === 'waste' ? 'waste' : 'manual',
    referenceId: `REF-${index + 1}`,
    supplierId: item.supplierId,
    supplierName: item.supplierName,
    reason: type === 'stock_in' ? 'รับเข้า demo' : 'ใช้งาน/ปรับยอด demo',
    movementDate: dateOf(-(index % 12)),
    createdBy: 'Owner',
    note: '',
    createdAt: new Date(now.getFullYear(), now.getMonth(), Math.max(1, now.getDate() - (index % 12))).toISOString()
  };
});

export const mockWasteItems = Array.from({ length: 8 }, (_, index) => {
  const item = mockInventoryItems[index % 8];
  const reasons = Object.keys(wasteReasons);
  const quantity = 2 + index;
  return {
    id: `waste-${index + 1}`,
    wasteNo: `WS-202607-${String(index + 1).padStart(3, '0')}`,
    itemId: item.id,
    itemName: item.itemName,
    category: item.category,
    quantity,
    unit: item.unit,
    unitCost: item.averageCost,
    totalWasteCost: quantity * item.averageCost,
    reason: reasons[index % reasons.length],
    qualityStatusBeforeWaste: item.qualityStatus,
    wasteDate: dateOf(-(index + 1)),
    photoPlaceholder: 'waste-photo-placeholder',
    note: 'mock waste',
    createdAt: new Date(now.getFullYear(), now.getMonth(), Math.max(1, now.getDate() - index)).toISOString()
  };
});
