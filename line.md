# คู่มือการติดตั้งและใช้งานระบบจองรถผ่าน LINE (Implementation Guide)

คู่มือนี้สรุปขั้นตอนการนำไฟล์ที่ออกแบบไว้ไปใช้งานจริง ตั้งแต่การตั้งค่าใน LINE Developers Console ไปจนถึงการเชื่อมต่อระบบหลังบ้าน (Admin) และหน้าบ้าน (LIFF)

---

## 1. การตั้งค่า LINE Developers Console

### 1.1 Messaging API Channel
1. เข้าไปที่ [LINE Developers Console](https://developers.line.biz/)
2. สร้าง **Provider** และ **Messaging API Channel**
3. คัดลอก `Channel Access Token` และ `Channel Secret` ไปใส่ในไฟล์ `.env` ของ Backend

### 1.2 LIFF App (หน้าจองรถสำหรับลูกค้า)
1. ใน Messaging API Channel ที่สร้างไว้ ไปที่แท็บ **LIFF**
2. กด **Add** เพื่อเพิ่ม LIFF App ใหม่:
   - **Size**: Tall (แนะนำ) หรือ Full
   - **Endpoint URL**: URL ที่คุณ Deploy ไฟล์ Frontend (เช่น Vercel, Firebase Hosting)
   - **Scopes**: `profile`, `openid`
3. คัดลอก **LIFF ID** (เช่น `2001234567-AbCdEfGh`) ไปใช้ในไฟล์ JavaScript ของหน้าบ้าน เพื่อเรียกใช้ `liff.init()`

---

## 2. การติดตั้ง Backend & Database (Node.js + PostgreSQL)

ใช้โค้ดจากไฟล์ `{{DATA:DOCUMENT:DOCUMENT_10}}` เป็นพื้นฐาน

### 2.1 การเตรียม Database
รันคำสั่ง SQL จากไฟล์ `{{DATA:DOCUMENT:DOCUMENT_11}}` ใน PostgreSQL เพื่อสร้างตาราง:
- `users`: เก็บโปรไฟล์ลูกค้า
- `vehicles`: รายชื่อรถ
- `bookings`: รายการจอง
- **เพิ่มเติม**: สร้างตาราง `booking_rules` และ `system_settings` ตามที่ระบุในแผนงานล่าสุด

### 2.2 การ Deploy Backend
1. อัปโหลดโค้ดขึ้น Server (เช่น Heroku, Render, DigitalOcean)
2. ตั้งค่า **Environment Variables**:
   ```env
   DATABASE_URL=postgres://user:pass@host:5432/db
   LINE_ACCESS_TOKEN=your_access_token
   PORT=3000
   ```

---

## 3. การเชื่อมต่อหน้าบ้าน (LIFF Booking Form)

ใช้ดีไซน์จาก `{{DATA:SCREEN:SCREEN_8}}`

1. **ดึงข้อมูลความพร้อม**: เมื่อเปิดหน้า LIFF ให้เรียก `GET /api/availability` เพื่อดึงวันที่เต็มแล้วมาปิด (Disable) ในปฏิทิน
2. **ส่งข้อมูลการจอง**: เมื่อกดปุ่ม "ส่งการจอง":
   - รวบรวมข้อมูลจาก Form
   - เรียก `POST /api/bookings`
   - เมื่อสำเร็จ ให้ใช้ `liff.closeWindow()` เพื่อปิดหน้าจอและกลับเข้าหน้าแชท LINE

---

## 4. การจัดการระบบหลังบ้าน (Admin Dashboard)

ใช้ดีไซน์จากหน้าจอ `{{DATA:SCREEN:SCREEN_7}}`, `{{DATA:SCREEN:SCREEN_6}}`, `{{DATA:SCREEN:SCREEN_5}}`, `{{DATA:SCREEN:SCREEN_3}}`

1. **Dashboard URL**: ควรตั้ง URL แยกต่างหากและมีการป้องกันด้วย Password (Login)
2. **การทำงาน**:
   - **Calendar**: เชื่อมต่อกับ API เพื่อดึงข้อมูล `bookings` มาแสดงสีตามสถานะ
   - **Base Rates & Rules**: เมื่อ Admin แก้ไขราคา ค่าเหล่านี้ต้องถูกบันทึกลงตาราง `system_settings` เพื่อให้หน้าจองรถ (LIFF) ดึงไปคำนวณราคาสุทธิให้ลูกค้า

---

## 5. การตั้งค่า LINE Rich Menu (6 ปุ่ม)

ใช้รูปภาพ Rich Menu ที่คุณมี และตั้งค่าการกระทำ (Action) ดังนี้:
- **ปุ่ม 1 (ปฏิทิน)**: Action Type = `Link` -> ใส่ LIFF URL (`https://liff.line.me/YOUR_LIFF_ID`)
- **ปุ่ม 2 (Transfer)**: Action Type = `Postback` -> Data = `action=transfer`
- **ปุ่ม 3 (Charter)**: Action Type = `Message` หรือ `Postback` เพื่อส่ง Flex Message ย่อย
- **ปุ่มอื่นๆ**: สามารถตั้งให้เปิดหน้า LIFF เดียวกันแต่เลื่อนไปยัง Section นั้นๆ (Anchor Link)

---

## สรุปโครงสร้างไฟล์
- **Frontend (LIFF)**: `index.html` (UI), `script.js` (LIFF SDK + Calendar logic)
- **Backend**: `server.js` (Express), `db.js` (PostgreSQL Connection)
- **Admin**: แผงควบคุมสำหรับจัดการราคาและสถานะงาน
