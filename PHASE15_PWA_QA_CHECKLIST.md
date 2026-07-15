# Phase 15 PWA / Offline / QR / Printer / LINE QA Checklist

## 1. Install PWA

- [ ] Manifest โหลดได้ใน browser
- [ ] Theme color เป็น `#D8A7B1`
- [ ] Install prompt แสดงเมื่อ browser รองรับ
- [ ] App เปิดแบบ standalone ได้หลัง install

## 2. Service Worker / Offline Page

- [ ] Service worker register สำเร็จบน local server/HTTPS
- [ ] App shell ถูก cache
- [ ] Offline fallback เปิด `offline.html`
- [ ] Update available banner แสดงเมื่อมี service worker ใหม่
- [ ] Refresh to update ทำงานผ่าน `SKIP_WAITING`

## 3. Offline POS Sale

- [ ] ปิด network แล้ว POS ยังอ่านข้อมูลจาก LocalStorage ได้
- [ ] Checkout sale offline บันทึกใน `budsarin_sales`
- [ ] Sale offline ถูกเพิ่มใน `budsarin_offline_queue`
- [ ] Idempotency key ไม่สร้างรายการซ้ำ

## 4. Offline Order Create

- [ ] สร้าง Order ตอน offline ได้
- [ ] Order บันทึกใน `budsarin_orders`
- [ ] Queue มี entityType `order`
- [ ] กลับ online แล้วกด Sync ได้

## 5. Offline Finance / Customer

- [ ] เพิ่มรายรับ offline แล้ว queue entityType `income`
- [ ] เพิ่มรายจ่าย offline แล้ว queue entityType `expense`
- [ ] เพิ่ม customer offline แล้ว queue entityType `customer`
- [ ] ข้อมูลไม่หายหลัง refresh

## 6. Sync Queue

- [ ] Offline banner แสดงสถานะ Online/Offline ถูกต้อง
- [ ] Sync badge แสดงจำนวน pending/failed/synced
- [ ] Retry failed มี feedback
- [ ] Clear synced ล้างเฉพาะ synced actions

## 7. Scanner

- [ ] Scanner modal เปิด/ปิดได้
- [ ] Camera permission ขอเมื่อกดเปิดกล้องเท่านั้น
- [ ] Permission denied แสดง error state
- [ ] Manual input fallback ใช้ได้
- [ ] `BF-ORDER-*`, `BF-RECEIPT-*`, `BF-CUSTOMER-*`, `BF-PRODUCT-*` parse ได้

## 8. QR Generation

- [ ] QR Preview modal เปิดได้
- [ ] Copy payload ได้
- [ ] Print QR เรียก browser print
- [ ] QR records เก็บใน `budsarin_qr_codes`

## 9. QR Payment Placeholder

- [ ] เปิด QR Payment modal ได้
- [ ] แสดงยอดเงิน, Ref No, ลูกค้า, วันหมดอายุ และ status
- [ ] ระบุว่าเป็นโหมดจำลองการชำระเงิน
- [ ] Mark as Paid เปลี่ยน status ได้
- [ ] Expire เปลี่ยน status ได้
- [ ] Copy Payment Ref ได้

## 10. Receipt Printer

- [ ] Settings > PWA / LINE / Printer เปิดได้
- [ ] Save Printer Settings บันทึก `budsarin_printer_settings`
- [ ] Print Test Receipt เปิด browser print
- [ ] Thermal 58mm/80mm layout ไม่ล้น
- [ ] WebUSB/Bluetooth แสดง placeholder toast ชัดเจน

## 11. LINE OA Structure

- [ ] Save LINE Settings ได้
- [ ] ไม่มี field สำหรับกรอก/เก็บ Channel Access Token ใน frontend
- [ ] LINE template list แสดงครบ 8 แบบ
- [ ] Preview template แทน variables ได้
- [ ] Copy message ได้
- [ ] Send Placeholder แสดง toast และเขียน notification log

## 12. Notification Log

- [ ] Log เก็บใน `budsarin_notification_logs`
- [ ] Settings แสดง log ล่าสุด
- [ ] Status draft/queued/sent/failed/cancelled รองรับใน object

## 13. Device Sessions

- [ ] Current device ถูกบันทึกใน `budsarin_device_sessions`
- [ ] แสดง device name, type, browser, last seen, sync status
- [ ] Remove device placeholder มี feedback

## 14. Mobile UX

- [ ] Floating quick action ใช้งานบน mobile
- [ ] Scanner/QR/payment modal fullscreen บน mobile
- [ ] POS checkout button sticky บน mobile
- [ ] Touch target อย่างน้อย 48px
- [ ] Table/report area ไม่ล้นจอ

## 15. Security / Privacy

- [ ] ไม่เก็บ LINE secret ใน LocalStorage
- [ ] Offline queue sanitize PIN/token
- [ ] Camera permission ขอเฉพาะตอนใช้ scanner
- [ ] LINE send placeholder เตือนเรื่อง production token

## 16. Known Limitations To Mention In Demo

- [ ] Scanner ยังไม่มี barcode decode library จริง
- [ ] LINE OA ยังไม่ส่ง API จริง
- [ ] Offline sync ยังเป็น local placeholder
- [ ] WebUSB/Bluetooth printer ยังเป็น capability placeholder
