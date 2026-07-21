# วิธีอัปเดต GitHub Pages เวอร์ชัน 20260717b

ให้อัปไฟล์ทั้งหมดในโฟลเดอร์นี้ขึ้น GitHub ทับของเดิม:

`github-pages-upload-20260715`

## ไฟล์สำคัญที่ต้องอัปทับ

- `index.html`
- `service-worker.js`
- `manifest.webmanifest`
- `offline.html`
- `.nojekyll`
- โฟลเดอร์ `js`
- โฟลเดอร์ `css`
- โฟลเดอร์ `icons`
- โฟลเดอร์ `assets`

## ถ้าต้องการอัปเฉพาะไฟล์ที่แก้รอบล่าสุด

- `index.html`
- `service-worker.js`
- `js/app.js`
- `js/dashboard.js`
- `js/pos.js`
- `js/products.js`
- `js/products-service.js`
- `js/events.js`
- `js/events-service.js`
- `js/suppliers.js`
- `js/suppliers-service.js`
- `js/sync-status.js`
- `js/pwa.js`
- `css/styles.css`
- `css/pos.css`
- `css/products.css`
- `css/pwa.css`
- `css/suppliers.css`
- `css/events.css`
- `css/production.css`
- `css/mobile-polish.css`
- `css/responsive.css`

## หลังอัปเสร็จ

เปิดลิงก์นี้ 1 ครั้งเพื่อล้าง cache:

https://kewaleechookhan.github.io/budsarin-flower-pos/?v=20260717b&reset-cache=1

จากนั้นถ้าหน้าโหลดเสร็จ ให้เปิดลิงก์ปกติ:

https://kewaleechookhan.github.io/budsarin-flower-pos/?v=20260717b

## จุดที่ควรทดสอบหลังอัป

1. หน้า `ขายหน้าร้าน` เห็นรูปสินค้าที่อัปในเมนูสินค้า
2. หน้า `สินค้าและบริการ` กดเพิ่ม/แก้ไขสินค้าแล้วอัปโหลดรูปได้
3. หน้า `งานจัดสถานที่` กรอกข้อมูลแล้วบันทึกได้ และรายการไปแสดงในภาพรวม
4. หน้า `ซัพพลายเออร์` เพิ่ม/แก้ไข/ลบ/สร้าง PO ได้
5. แถบ sync ด้านบนไม่บังหัวโปรแกรม
6. ภาพปกร้านแสดงบนหัวด้านบนหลังอัปโหลดใน `ตั้งค่าร้าน`
