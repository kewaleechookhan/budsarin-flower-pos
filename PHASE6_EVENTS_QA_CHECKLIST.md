# Phase 6 Events QA Checklist

## Route / UI

- เปิดเมนู Events แล้วเห็น 7 tabs: ภาพรวม, รายการโปรเจกต์, ใบเสนอราคา, ตารางงาน, ต้นทุนและกำไร, Checklist ทีมงาน, ตั้งค่างาน
- Dashboard ใน Events แสดง KPI งานเดือนนี้, รอเสนอราคา, รับมัดจำ, มูลค่างาน, ยอดคงเหลือ และกำไรประมาณการ
- Search/filter รายการโปรเจกต์ทำงานและ layout ไม่แตกบน tablet/mobile

## Project / Quotation

- เพิ่มงานใหม่ต้อง validate ชื่อลูกค้า เบอร์โทร ชื่องาน ประเภทงาน วันที่จัดงาน และยอดเงินไม่ติดลบ
- มัดจำและยอดชำระแล้วต้องไม่มากกว่ายอดสุทธิ
- ปุ่ม “บันทึกและสร้างใบเสนอราคา” ต้องสร้าง quotation และเปิด preview ได้
- ปุ่มส่งใบเสนอราคาต้องเปลี่ยนสถานะ quotation เป็น sent
- ข้อตกลงเบื้องต้น preview/print ได้

## Payment / Cost / Profit

- รับมัดจำแล้ว payment schedule อัปเดต และ Finance มี income sourceType `event`
- เพิ่มต้นทุนจริงแล้ว Finance มี expense sourceType `event_cost`
- Profit tab คำนวณต้นทุนรวม กำไร และ margin จากข้อมูลจริง
- งาน margin ต่ำกว่า setting แสดงในภาพรวม

## Checklist / Timeline / Data

- Checklist แยกตาม section และ checkbox toggle แล้ว progress เปลี่ยน
- Timeline แสดง setup/event/teardown ของแต่ละงาน
- Reset demo data ต้อง seed event mock 6 งาน และ LocalStorage keys Phase 6 ครบ
- Refresh หน้าแล้วข้อมูล Events ยังอยู่ใน LocalStorage
