# GitHub Pages Upload Fix

ถ้าเปิด GitHub Pages แล้วเป็นหน้าขาว ตัวหนังสือดำ หรือเมนูไม่ครบ แปลว่า GitHub Pages โหลดไฟล์ `css/` หรือ `js/` ไม่ครบ หรือ Pages source ไม่ได้ชี้มาที่ root ที่มี `index.html`

ให้อัปโหลดไฟล์ชุด static เท่านั้น:

```text
.nojekyll
index.html
offline.html
manifest.webmanifest
service-worker.js
css/
js/
icons/
assets/
```

ห้ามอัปโหลดไฟล์ลับหรือ server:

```text
.env
backend/
node_modules/
backend/data/
backend/backups/
```

ตั้งค่า GitHub Pages:

```text
Settings > Pages > Source: Deploy from a branch
Branch: main
Folder: / (root)
Save
```

หลัง deploy แล้วให้เปิดลิงก์แบบมี `/` ปิดท้าย:

```text
https://YOUR_USERNAME.github.io/YOUR_REPO/
```

ถ้าเคยเปิดเวอร์ชันผิด ให้เติม:

```text
?reset-cache=1
```
