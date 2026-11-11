# next-room-reserve-app

ระบบจองห้องประชุมด้วย Next.js, Prisma และ MySQL

## เริ่มใช้งาน (ท้องถิ่น)

1. ติดตั้ง dependency: `npm install`
2. สร้างไฟล์ `.env` เอง (อย่า commit) แล้วใส่ `DATABASE_URL` ของ MySQL ท้องถิ่น
3. สร้าง/อัปเดตตาราง: `npx prisma migrate dev`
4. ใส่ข้อมูลตัวอย่าง (ถ้าต้องการ): `npm run db:seed`
5. รันแอป: `npm run dev`

## สคริปต์สำคัญ

- `npm test` — รันเทส
- `npm run build` — 빌드โปรดักชัน
