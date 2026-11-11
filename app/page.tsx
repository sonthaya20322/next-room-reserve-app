import Link from "next/link";
import { AppShell } from "@/components/AppShell";

export default function HomePage() {
  return (
    <AppShell currentPath="/">
      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm sm:p-8">
          <h2 className="font-display text-3xl text-accent-slate">
            จัดการห้องและตารางจองในที่เดียว
          </h2>
          <p className="mt-3 max-w-xl text-muted leading-7">
            หน้านี้เป็นเครื่องมือทดลอง API จริงของ Assignment08 — ค้นหาห้อง
            ตรวจช่วงว่าง และสร้างการจองโดยผ่านกฎความจุและเวลาทับซ้อนฝั่งเซิร์ฟเวอร์
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/rooms"
              className="rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
            >
              ดูรายการห้อง
            </Link>
            <Link
              href="/available"
              className="rounded-md border border-primary px-4 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-stripe"
            >
              ค้นหาห้องว่าง
            </Link>
          </div>
        </div>

        <aside className="grid gap-3">
          <div className="rounded-xl border border-border bg-surface p-5">
            <p className="text-xs font-semibold tracking-wide text-success uppercase">
              Ready
            </p>
            <p className="mt-2 text-sm text-muted leading-6">
              15 API พร้อมใช้ผ่าน `/api/rooms` และ `/api/bookings`
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-5">
            <p className="text-xs font-semibold tracking-wide text-warning uppercase">
              Validation
            </p>
            <p className="mt-2 text-sm text-muted leading-6">
              ตรวจข้อความว่าง ความจุ เวลาอนาคต และช่วงทับซ้อนก่อนบันทึก
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-5">
            <p className="text-xs font-semibold tracking-wide text-danger uppercase">
              Conflict
            </p>
            <p className="mt-2 text-sm text-muted leading-6">
              ลบห้องที่มีจอง / แก้จองที่เริ่มแล้ว จะได้ 409 ตามโจทย์
            </p>
          </div>
        </aside>
      </section>
    </AppShell>
  );
}
