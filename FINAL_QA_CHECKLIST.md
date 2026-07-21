# Budsarin Flower POS & Studio Manager - Final QA Checklist

ใช้ checklist นี้ก่อน demo local prototype หลัง Phase 13

## 1. Dashboard QA

- [ ] เปิดจาก sidebar ได้และ active state ถูกต้อง
- [ ] KPI, break-even, sales chart, today schedule, stock alerts และ finance snapshot แสดงผล
- [ ] เปลี่ยน period chart แล้วไม่มี console error
- [ ] schedule filter แสดง empty state เมื่อไม่พบข้อมูล
- [ ] Dashboard ใช้ Calendar schedule ก่อน และ fallback เป็น mock data ได้

## 2. POS QA

- [ ] ค้นหาสินค้าและเปลี่ยนหมวดได้
- [ ] เพิ่ม/ลด/ลบสินค้าใน cart ได้
- [ ] discount บาท/เปอร์เซ็นต์ไม่ทำยอดติดลบ
- [ ] hold/restore bill มี toast feedback
- [ ] checkout บันทึก `budsarin_sales` และ sync legacy POS state
- [ ] receipt preview และ print ทำงาน

## 3. Orders QA

- [ ] เปิดรายการและ detail panel ได้
- [ ] filter/search ใช้งานได้
- [ ] create/edit/save draft/change status/cancel มี confirm หรือ toast
- [ ] work order preview/print อ่านง่าย
- [ ] order data บันทึก `budsarin_orders` และ timeline บันทึก `budsarin_order_timelines`

## 4. Cost Calculator QA

- [ ] คำนวณ total cost, gross profit, margin และ markup ได้
- [ ] รับค่า null/string/empty โดยไม่เกิด NaN บน UI
- [ ] บันทึก template/history ได้
- [ ] link cost กลับ order ได้
- [ ] empty state แสดงเมื่อไม่มี history/template

## 5. Finance QA

- [ ] Income/expense CRUD มี validation และ toast
- [ ] POS/Orders sync ไม่สร้าง transaction ซ้ำ
- [ ] Cash flow, AR/AP, break-even และ payback รับ divide by zero ได้
- [ ] localStorage keys หลักถูกต้อง
- [ ] print/export ไม่พิมพ์ sidebar/header

## 6. Events QA

- [ ] Event mock fallback แสดงใน Dashboard/Reports/Calendar
- [ ] quotation/payment/cost/checklist/timeline keys ถูก backup/restore
- [ ] Reports event profit ไม่แสดง NaN
- [ ] Calendar event source type แยกสี/ประเภทถูกต้อง

## 7. Inventory QA

- [ ] Inventory/waste mock fallback แสดงใน Dashboard/Reports/Calendar
- [ ] stock movement จาก PO ไม่ทำให้หน้าอื่นพัง
- [ ] waste rate รับ empty array ได้
- [ ] low stock/use soon alert มี empty state

## 8. Suppliers QA

- [ ] Supplier list/search/detail เปิดได้
- [ ] Purchase order create/receive มี feedback
- [ ] supplier payable sync finance ได้
- [ ] price history key รองรับทั้ง `budsarin_price_history` และ legacy `budsarin_supplier_price_history`
- [ ] dashboard supplier alerts ไม่มี console error

## 9. Customers QA

- [ ] Customer list/search/detail เปิดได้
- [ ] important dates และ follow-ups แสดงสถานะครบ
- [ ] POS/Orders sync customer profile ได้
- [ ] CLV/segments รับข้อมูลว่างได้
- [ ] message template copy มี feedback

## 10. Reports QA

- [ ] ทุก tab เปิดได้
- [ ] filters apply/reset ใช้งานได้
- [ ] report presets save/load/delete ได้
- [ ] CSV export สร้างข้อมูลถูกต้อง
- [ ] print report ซ่อน navigation

## 11. Settings QA

- [ ] Store profile/brand/finance/users/permissions บันทึกได้
- [ ] Notification/module settings มี feedback
- [ ] Backup JSON download/import/restore validate file
- [ ] Seed demo data ไม่ทับข้อมูลเดิม
- [ ] Reset demo data สำรองก่อนทับข้อมูล
- [ ] Clear all data มี confirm และกู้คืน backup ล่าสุดได้
- [ ] Data health run/repair/export ได้

## 12. Calendar QA

- [ ] Today/Week/Month/Queue/Reminders/Manual/Settings เปิดได้
- [ ] syncAllCalendarEvents รวม Orders, Events, Customers, Finance, Suppliers, Inventory
- [ ] reminder dismiss/snooze/done มี feedback
- [ ] manual task create/complete/reschedule/delete ได้
- [ ] Dashboard schedule อ่านจาก Calendar service ได้

## 13. Responsive QA

- [ ] Desktop >= 1200px layout ไม่ล้น
- [ ] Tablet landscape 900-1199px เป็น priority และ sidebar/content ไม่แน่น
- [ ] Tablet portrait 600-899px form/table/chart ไม่ล้น
- [ ] Mobile < 600px bottom navigation ใช้งานได้
- [ ] ปุ่มสำคัญ touch target อย่างน้อย 48px

## 14. LocalStorage QA

- [ ] Registry `STORAGE_KEYS` ครอบคลุม key ใน Phase 1-13
- [ ] Broken JSON fallback ไม่ทำให้ app crash
- [ ] Backup export รวมข้อมูลทุกโมดูล
- [ ] Restore ไม่รับ invalid backup
- [ ] Legacy POS/dashboard key ยังอ่านได้

## 15. Print / Export QA

- [ ] POS receipt print อ่านง่าย
- [ ] Order work order print อ่านง่าย
- [ ] Report print ไม่มี sidebar/header
- [ ] CSV export เปิดใน spreadsheet ได้
- [ ] Backup JSON export/import round-trip ได้

## 16. Accessibility QA

- [ ] Icon buttons มี aria-label/title
- [ ] Inputs มี label หรือ aria-label
- [ ] Focus visible มองเห็น
- [ ] Escape ปิด modal/floating panel
- [ ] Status ไม่พึ่งสีอย่างเดียว มี label ประกอบ

## 17. Performance QA

- [ ] View switching ไม่ render หน้าอื่นซ้ำหนักเกินจำเป็น
- [ ] Search/filter ไม่มี lag ใน demo data
- [ ] Report cache ไม่ทำให้ข้อมูลเก่าค้างหลัง reset
- [ ] Calendar sync จำนวน event demo ไม่ทำให้ UI ช้า
- [ ] ไม่มี repeated LocalStorage parse error ใน console

## 18. Known Issues

- [ ] Events UI เต็มยังไม่ใช่ production board
- [ ] Inventory UI เต็มยังไม่ใช่ production stock control
- [ ] Calendar ยังไม่มี drag and drop reschedule
- [ ] Auth/permission ยังเป็น simulation
- [ ] LocalStorage ยังไม่เหมาะกับ multi-user production

## 19. Ready For Demo Checklist

- [ ] เปิดผ่าน local server สำเร็จ
- [ ] กด Settings > Backup / Restore > เติมข้อมูลตัวอย่าง
- [ ] Refresh หน้าแล้วข้อมูลยังอยู่
- [ ] เปิดครบทุกเมนูหลัก
- [ ] ทดสอบ POS checkout หนึ่งรายการ
- [ ] ทดสอบสร้าง manual task ใน Calendar
- [ ] Export backup JSON ได้
- [ ] ไม่มี console error ขณะ demo flow หลัก
