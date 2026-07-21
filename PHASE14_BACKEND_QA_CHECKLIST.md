# Phase 14 Backend/API Readiness QA Checklist

## 1. Backend Settings

- [ ] Settings > Backend / Sync เปิดได้
- [ ] Backend Mode เลือก `local_placeholder`, `REST API`, `Supabase`, `Custom Backend` ได้
- [ ] API Base URL บันทึกใน `budsarin_backend_settings`
- [ ] Sync Enabled บันทึกได้
- [ ] Conflict Strategy บันทึกได้
- [ ] Health Check Placeholder อัปเดต last status/last check

## 2. API Contracts

- [ ] API contracts แสดง endpoints หลัก
- [ ] มี `/sync/offline-queue`
- [ ] มี `/sync/status`
- [ ] มี `/sync/conflicts/:id/resolve`
- [ ] มี QR/payment/printer/LINE endpoint blueprint
- [ ] contracts ถูก seed ใน `budsarin_api_contracts`

## 3. Conflict Resolver

- [ ] ปุ่มสร้างตัวอย่าง Conflict ทำงาน
- [ ] conflict ถูกบันทึกใน `budsarin_sync_conflicts`
- [ ] ปุ่ม Keep local เปลี่ยน status เป็น resolved
- [ ] ปุ่ม Use remote เปลี่ยน status เป็น resolved
- [ ] ปุ่ม Merge เปลี่ยน status เป็น resolved
- [ ] summary Open/Resolved/Total อัปเดต

## 4. Audit Log

- [ ] Test Audit เขียน log ได้
- [ ] Offline queue enqueue เขียน audit log
- [ ] Offline queue process เขียน audit log
- [ ] audit log ถูกบันทึกใน `budsarin_audit_logs`
- [ ] log sanitize token/secret/password/PIN

## 5. Database Blueprint

- [ ] แสดง `offline_queue`
- [ ] แสดง `sync_conflicts`
- [ ] แสดง `qr_codes`
- [ ] แสดง `payment_qr_placeholders`
- [ ] แสดง `printer_settings`
- [ ] แสดง `line_settings`
- [ ] แสดง `line_message_templates`
- [ ] แสดง `notification_logs`
- [ ] แสดง `device_sessions`
- [ ] แสดง `audit_logs`

## 6. Phase 15 Compatibility

- [ ] Offline queue ยังใช้งานได้หลังเพิ่ม audit log
- [ ] Phase 15 sync status อ่าน conflict summary ได้ในอนาคต
- [ ] ไม่มี secret ถูกเก็บใน backend settings
- [ ] Demo seed รวม Phase 14 keys
