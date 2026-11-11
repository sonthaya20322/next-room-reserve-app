import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { AppShell } from "@/components/AppShell";
import { addDays } from "@/lib/domain/time";
import { prisma } from "@/lib/db/prisma";

async function HomeStats() {
  await connection();
  const now = new Date();
  const weekLater = addDays(now, 7);

  const [roomCount, upcomingCount, todayCount] = await Promise.all([
    prisma.room.count(),
    prisma.booking.count({
      where: { startTime: { gte: now, lte: weekLater } },
    }),
    prisma.booking.count({
      where: {
        startTime: { lte: now },
        endTime: { gt: now },
      },
    }),
  ]);

  return (
    <aside className="grid gap-3">
      <div className="rounded-xl border border-border bg-surface p-5">
        <p className="text-xs font-semibold tracking-wide text-success uppercase">
          ห้องทั้งหมด
        </p>
        <p className="mt-2 font-display text-3xl text-accent-slate">
          {roomCount}
        </p>
        <p className="mt-1 text-sm text-muted">พร้อมให้จองในระบบ</p>
      </div>
      <div className="rounded-xl border border-border bg-surface p-5">
        <p className="text-xs font-semibold tracking-wide text-warning uppercase">
          กำลังใช้งานอยู่
        </p>
        <p className="mt-2 font-display text-3xl text-accent-slate">
          {todayCount}
        </p>
        <p className="mt-1 text-sm text-muted">รายการที่กำลังประชุมตอนนี้</p>
      </div>
      <div className="rounded-xl border border-border bg-surface p-5">
        <p className="text-xs font-semibold tracking-wide text-primary uppercase">
          ใกล้ถึงกำหนด
        </p>
        <p className="mt-2 font-display text-3xl text-accent-slate">
          {upcomingCount}
        </p>
        <p className="mt-1 text-sm text-muted">การจองในอีก 7 วัน</p>
      </div>
    </aside>
  );
}

function StatsFallback() {
  return (
    <aside className="grid gap-3">
      {[1, 2, 3].map((item) => (
        <div
          key={item}
          className="h-28 animate-pulse rounded-xl border border-border bg-stripe"
        />
      ))}
    </aside>
  );
}

export default function HomePage() {
  return (
    <AppShell currentPath="/">
      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm sm:p-8">
          <h2 className="font-display text-3xl text-accent-slate">
            จองห้องประชุมได้สะดวกในไม่กี่ขั้นตอน
          </h2>
          <p className="mt-3 max-w-xl text-muted leading-7">
            เลือกห้อง ตรวจเวลาว่าง แล้วบันทึกการจองได้ทันที
            ระบบช่วยเช็คความจุและช่วงเวลาที่ทับกันให้อัตโนมัติ
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/available"
              className="rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
            >
              จองห้องเลย
            </Link>
            <Link
              href="/bookings"
              className="rounded-md border border-primary px-4 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-stripe"
            >
              ดูตารางจอง
            </Link>
          </div>
        </div>

        <Suspense fallback={<StatsFallback />}>
          <HomeStats />
        </Suspense>
      </section>
    </AppShell>
  );
}
