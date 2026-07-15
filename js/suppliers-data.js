export const supplierTypes = {
  fresh_flower_wholesale: 'ร้านส่งดอกไม้สด',
  packaging: 'วัสดุห่อ/ริบบิ้น',
  container: 'แจกัน/กล่อง/ตะกร้า',
  event_equipment: 'อุปกรณ์จัดสถานที่',
  printing: 'สิ่งพิมพ์/ป้าย',
  delivery: 'ขนส่ง',
  general: 'ทั่วไป'
};

export const supplierStatuses = {
  active: { label: 'ใช้งานอยู่', tone: 'success' },
  inactive: { label: 'ปิดใช้งาน', tone: 'warning' },
  preferred: { label: 'แนะนำ', tone: 'gold' },
  blacklisted: { label: 'ห้ามใช้', tone: 'danger' }
};

export const poStatuses = {
  draft: { label: 'แบบร่าง', tone: 'info' },
  ordered: { label: 'สั่งซื้อแล้ว', tone: 'warning' },
  partially_received: { label: 'รับบางส่วน', tone: 'pink' },
  received: { label: 'รับครบแล้ว', tone: 'success' },
  cancelled: { label: 'ยกเลิก', tone: 'danger' }
};

export const supplierPaymentStatuses = {
  unpaid: { label: 'ยังไม่จ่าย', tone: 'warning' },
  partial: { label: 'จ่ายบางส่วน', tone: 'info' },
  paid: { label: 'จ่ายแล้ว', tone: 'success' },
  overdue: { label: 'เกินกำหนด', tone: 'danger' },
  cancelled: { label: 'ยกเลิก', tone: 'danger' }
};

export const qualityStatuses = ['ดี', 'พอใช้', 'เสียหายบางส่วน', 'ตีกลับ'];

const now = new Date();
const dateOf = day => new Date(now.getFullYear(), now.getMonth(), day).toISOString().slice(0, 10);

export const mockSuppliers = [
  ['SUP-001', 'ตลาดดอกไม้ปากคลอง Supplier', 'fresh_flower_wholesale', 'คุณพร', '081-111-2222', '@pakflower', 'กรุงเทพฯ', 7, 50000, 30, 'กุหลาบ, ยิปโซ, ใบยูคา', 4.6, 'preferred'],
  ['SUP-002', 'Rose Premium Wholesale', 'fresh_flower_wholesale', 'คุณโรส', '082-222-3333', '@rosepremium', 'นครปฐม', 15, 80000, 30, 'กุหลาบพรีเมียม, คาร์เนชั่น', 4.8, 'preferred'],
  ['SUP-003', 'Lily Garden Supply', 'fresh_flower_wholesale', 'คุณลิลลี่', '083-333-4444', '@lilygarden', 'นนทบุรี', 14, 45000, 20, 'ลิลลี่, ทิวลิป, ดอกไม้สดนำเข้า', 4.3, 'active'],
  ['SUP-004', 'Packaging Floral House', 'packaging', 'คุณแพร', '084-444-5555', '@packfloral', 'กรุงเทพฯ', 30, 30000, 15, 'กระดาษห่อ, กล่อง, การ์ด', 4.4, 'active'],
  ['SUP-005', 'Ribbon & Wrap Studio', 'packaging', 'คุณริบบิ้น', '085-555-6666', '@ribbonwrap', 'สมุทรปราการ', 30, 25000, 15, 'ริบบิ้น, ผ้า, วัสดุห่อ', 4.2, 'active'],
  ['SUP-006', 'Glass Vase Center', 'container', 'คุณแก้ว', '086-666-7777', '@glassvase', 'ปทุมธานี', 20, 40000, 20, 'แจกันแก้ว, กล่องอะคริลิก', 4.1, 'active'],
  ['SUP-007', 'Event Props Rental', 'event_equipment', 'คุณอีเวนต์', '087-777-8888', '@eventprops', 'กรุงเทพฯ', 10, 60000, 30, 'ฉาก, โต๊ะ, อุปกรณ์จัดสถานที่', 4.0, 'active'],
  ['SUP-008', 'Local Flower Farm', 'fresh_flower_wholesale', 'คุณสวน', '088-888-9999', '@localfarm', 'เชียงใหม่', 5, 35000, 10, 'ดอกไม้สดตามฤดูกาล', 4.5, 'active']
].map((row, index) => ({
  id: `supplier-${index + 1}`,
  supplierCode: row[0],
  supplierName: row[1],
  supplierType: row[2],
  contactPerson: row[3],
  phone: row[4],
  lineId: row[5],
  facebook: row[5].replace('@', 'fb/'),
  email: `supplier${index + 1}@budsarin.local`,
  address: `${row[1]} ${row[6]}`,
  province: row[6],
  taxId: `01055${String(index + 1).padStart(8, '0')}`,
  paymentTerms: `เครดิต ${row[9]} วัน`,
  creditLimit: row[8],
  creditDays: row[9],
  bankName: 'ธนาคารตัวอย่าง',
  bankAccountName: row[1],
  bankAccountNo: `123-${index + 1}-45678-9`,
  preferredPaymentMethod: index % 2 ? 'transfer' : 'qr',
  mainProducts: row[10],
  rating: row[11],
  status: row[12],
  note: '',
  createdAt: now.toISOString(),
  updatedAt: now.toISOString()
}));

const poItems = [
  ['กุหลาบชมพู', 'ดอกไม้สด', 100, 'ดอก', 18],
  ['กุหลาบแดง', 'ดอกไม้สด', 80, 'ดอก', 22],
  ['ลิลลี่ขาว', 'ดอกไม้สด', 40, 'ดอก', 55],
  ['ยิปโซ', 'ดอกไม้สด', 20, 'กำ', 65],
  ['ใบยูคา', 'ใบไม้ / Greenery', 30, 'กำ', 70],
  ['กระดาษห่อพรีเมียม', 'วัสดุห่อ', 20, 'แผ่น', 35],
  ['ริบบิ้นซาติน', 'ริบบิ้น', 12, 'ม้วน', 120],
  ['แจกันแก้ว', 'กล่อง / แจกัน / ตะกร้า', 18, 'ใบ', 180]
];

export const mockPurchaseOrders = mockSuppliers.slice(0, 8).map((supplier, index) => {
  const base = poItems[index];
  const subtotal = base[2] * base[4];
  const shippingFee = index % 3 === 0 ? 250 : 0;
  const paidAmount = index % 4 === 0 ? subtotal + shippingFee : index % 2 === 0 ? Math.round((subtotal + shippingFee) * 0.5) : 0;
  const totalAmount = subtotal + shippingFee;
  return {
    id: `po-mock-${index + 1}`,
    poNo: `PO-${dateOf(index + 1).replaceAll('-', '')}-${String(index + 1).padStart(3, '0')}`,
    supplierId: supplier.id,
    supplierName: supplier.supplierName,
    orderDate: dateOf(index + 1),
    expectedReceiveDate: dateOf(index + 3),
    receivedDate: index % 3 === 0 ? dateOf(index + 3) : '',
    items: [{
      id: `po-item-${index + 1}`,
      inventoryItemId: `inv-${index + 1}`,
      itemName: base[0],
      category: base[1],
      quantity: base[2],
      unit: base[3],
      unitCost: base[4],
      totalCost: subtotal,
      receivedQuantity: index % 3 === 0 ? base[2] : 0,
      qualityStatus: 'ดี',
      expiryDate: supplier.supplierType === 'fresh_flower_wholesale' ? dateOf(index + 8) : '',
      useByDate: supplier.supplierType === 'fresh_flower_wholesale' ? dateOf(index + 6) : '',
      note: ''
    }],
    subtotal,
    discountAmount: 0,
    shippingFee,
    taxAmount: 0,
    totalAmount,
    paidAmount,
    balanceAmount: Math.max(totalAmount - paidAmount, 0),
    paymentMethod: supplier.preferredPaymentMethod,
    paymentStatus: paidAmount >= totalAmount ? 'paid' : paidAmount > 0 ? 'partial' : 'unpaid',
    poStatus: index % 3 === 0 ? 'received' : 'ordered',
    note: '',
    createdAt: now.toISOString(),
    updatedAt: now.toISOString()
  };
});

export const mockPriceHistory = Array.from({ length: 20 }, (_, index) => {
  const supplier = mockSuppliers[index % mockSuppliers.length];
  const item = poItems[index % poItems.length];
  const price = Math.round(item[4] * (0.86 + (index % 6) * 0.06));
  return {
    id: `price-${index + 1}`,
    supplierId: supplier.id,
    supplierName: supplier.supplierName,
    inventoryItemId: `inv-${(index % poItems.length) + 1}`,
    itemName: item[0],
    category: item[1],
    unit: item[3],
    unitCost: price,
    purchaseDate: dateOf(Math.min(index + 1, 27)),
    poId: `po-mock-${(index % 8) + 1}`,
    note: '',
    createdAt: now.toISOString()
  };
});

export const mockSupplierPayables = mockPurchaseOrders.map((po, index) => ({
  id: `sup-pay-${index + 1}`,
  supplierId: po.supplierId,
  supplierName: po.supplierName,
  referenceType: 'purchase_order',
  referenceId: po.id,
  description: po.poNo,
  amount: po.totalAmount,
  paidAmount: po.paidAmount,
  balanceAmount: po.balanceAmount,
  dueDate: dateOf(Math.min(index + 10, 28)),
  status: po.balanceAmount <= 0 ? 'paid' : index % 3 === 0 ? 'due_soon' : 'normal',
  createdAt: now.toISOString(),
  updatedAt: now.toISOString()
}));
