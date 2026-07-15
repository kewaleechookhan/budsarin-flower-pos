import { orderTypes } from './orders-data.js';
import { currency, thaiDate } from './utils.js';
import { loadStoreProfile } from './settings-service.js';

export function renderWorkOrder(order) {
  const profile = loadStoreProfile();
  const checklist = ['เตรียมดอกไม้หลัก', 'เตรียมดอกไม้เสริม', 'เตรียมใบไม้', 'เตรียมกระดาษ/ริบบิ้น', 'เขียนการ์ด', 'ถ่ายรูปก่อนส่ง', 'ตรวจสอบความเรียบร้อย', 'ส่งมอบ/จัดส่ง'];
  return `
    <div class="work-paper">
      <header><h3>${profile.storeNameEn}</h3><p>ใบงานทีมจัดดอกไม้ ${order.orderNo}</p></header>
      <section class="work-grid">
        <div><span>ลูกค้า</span><strong>${order.customerName}</strong></div>
        <div><span>ประเภทงาน</span><strong>${orderTypes[order.orderType] || order.orderType}</strong></div>
        <div><span>ชื่องาน</span><strong>${order.title}</strong></div>
        <div><span>โทนสี</span><strong>${order.colorTheme || '-'}</strong></div>
        <div><span>สไตล์</span><strong>${order.flowerStyle || '-'}</strong></div>
        <div><span>วันเวลา</span><strong>${thaiDate(order.dueDate)} ${order.dueTime}</strong></div>
        <div><span>วิธีรับ</span><strong>${order.pickupMethod === 'delivery' ? 'จัดส่ง' : 'รับเอง'}</strong></div>
        <div><span>สถานที่จัดส่ง</span><strong>${order.deliveryAddress || '-'}</strong></div>
        <div><span>ราคา</span><strong>${currency(order.totalAmount)}</strong></div>
        <div><span>ข้อความบนการ์ด</span><strong>${order.cardMessage || '-'}</strong></div>
      </section>
      <section><h4>รายละเอียดงาน</h4><p>${order.description || '-'}</p><h4>หมายเหตุภายใน</h4><p>${order.internalNote || '-'}</p></section>
      <section class="work-checklist"><h4>Checklist ทีมงาน</h4>${checklist.map(item => `<label><input type="checkbox"> ${item}</label>`).join('')}</section>
    </div>
  `;
}
