# Phase 7 Inventory QA Checklist

## Navigation / UI

- เปิดเมนู Inventory แล้วเห็น 8 tabs ครบ
- Overview แสดง KPI, chart มูลค่าตามหมวด, Waste, Stock In/Out และ Alerts
- รายการสต็อกค้นหาและ filter ตามหมวด คุณภาพ Supplier ได้

## Stock Operations

- Stock In เพิ่ม quantity, คำนวณ average cost และสร้าง stock movement type `stock_in`
- Stock Out quantity ต้องมากกว่า 0 และห้ามเกินคงเหลือถ้าไม่เปิด negative stock
- Waste ตัด quantity, สร้าง waste record และสร้าง movement type `waste`
- Settings บันทึก allow negative stock, use soon, expiry, auto deduct และ auto finance expense ได้

## Integration

- Stock In แบบ sync expense สร้างรายจ่ายใน Finance
- POS checkout เรียก inventory auto-deduct hook เมื่อ product name ตรงกับ inventory item
- Orders preparing/completed เรียก inventory auto-deduct hook แบบปลอดภัย
- Cost Calculator quick item แสดงรายการจาก Inventory และดึง average cost
- Dashboard stock alerts เปลี่ยนหลังรับเข้า/ตัดออก/Waste

## Persistence

- Reset demo data ต้อง seed inventory 20 รายการ, movement 20 รายการ และ waste 8 รายการ
- Refresh หน้าแล้วข้อมูลอยู่ครบใน LocalStorage keys `budsarin_inventory_items`, `budsarin_stock_movements`, `budsarin_waste_items`, `budsarin_inventory_settings`
