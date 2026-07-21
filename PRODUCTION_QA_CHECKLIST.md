# Production QA Checklist

## Backend / Database

- `npm start` เปิด server ได้
- เปิด `http://<LAN-IP>:8080` จาก iPad ได้
- `POST /api/auth/pin-login` login สำเร็จด้วย owner PIN
- กด “ย้ายข้อมูล LocalStorage เข้า Backend” แล้ว `backend/data/budsarin-db.json` มีข้อมูล sales/orders/events/inventory
- สร้าง backup แล้วมีไฟล์ใน `backend/backups`

## Login / Permission

- owner เห็นทุกเมนู
- cashier ใช้ POS ได้ แต่ไม่ควรแก้ settings สำคัญ
- florist เปิด Orders/Events/Inventory ได้
- logout แล้ว session ถูกล้าง

## Inventory BOM

- บันทึก recipe/BOM ผ่าน `/api/inventory/recipes`
- POS checkout สินค้าที่มี recipe แล้ว `/api/inventory/consume-recipe` สร้าง stock movement
- ถ้าสต็อกไม่พอ backend ต้อง reject และไม่ตัดยอดผิด

## LINE / QR / Printer

- LINE ไม่มี token ต้องขึ้นสถานะ `missing_token`
- ใส่ `LINE_CHANNEL_ACCESS_TOKEN` แล้วส่งข้อความ test เข้าบัญชีทดสอบได้
- QR ไม่มี `PROMPTPAY_ID` ต้องขึ้นสถานะ missing config
- ใส่ `PROMPTPAY_ID` แล้ว backend สร้าง payment payload
- Printer ไม่มี adapter ยัง browser print ได้
- ใส่ `PRINTER_ADAPTER_URL` แล้วสร้าง printer job ได้

## Multi-iPad

- iPad อย่างน้อย 2 เครื่อง login พร้อมกันได้
- เครื่องหนึ่งทำ sale อีกเครื่อง refresh แล้วเห็นข้อมูลจาก backend หลัง import/sync
- Wi-Fi หลุดแล้ว frontend ยังใช้ offline/local fallback ได้
- กลับ online แล้ว sync queue ไม่เกิด duplicate จาก source id
