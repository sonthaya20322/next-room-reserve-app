"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { apiFetch } from "@/lib/client/api";

type Booking = {
  id: number;
  bookerName: string;
  purpose: string;
  startTime: string;
  endTime: string;
  attendeeCount: number;
  room: {
    roomCode: string;
    roomName: string;
  };
};

function formatTime(value: string) {
  return new Date(value).toLocaleString("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [upcoming, setUpcoming] = useState<Booking[]>([]);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    setMessage(null);
    const params = new URLSearchParams({ page: "1", pageSize: "20" });
    if (search.trim()) params.set("search", search.trim());

    const [listResult, upcomingResult] = await Promise.all([
      apiFetch<{ data: Booking[] }>(`/api/bookings?${params.toString()}`),
      apiFetch<{ data: Booking[] }>("/api/bookings/upcoming?days=7"),
    ]);

    if (!listResult.ok) {
      setMessage(listResult.message);
      return;
    }
    if (!upcomingResult.ok) {
      setMessage(upcomingResult.message);
      return;
    }
    setBookings(listResult.data.data);
    setUpcoming(upcomingResult.data.data);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AppShell currentPath="/bookings">
      {message ? (
        <div className="mb-6 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
          {message}
        </div>
      ) : null}

      <div className="grid gap-8">
        <section className="rounded-xl border border-border bg-surface p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-display text-2xl text-accent-slate">
                ตารางจองทั้งหมด
              </h2>
              <p className="mt-1 text-sm text-muted">
                ค้นหาจากชื่อผู้จองหรือวัตถุประสงค์การใช้งาน
              </p>
            </div>
            <div className="flex gap-2">
              <input
                className="rounded-md border border-border bg-background px-3 py-2 text-sm"
                placeholder="ค้นหาชื่อหรือหัวข้อประชุม"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button
                type="button"
                onClick={() => void load()}
                className="rounded-md bg-primary px-3 py-2 text-sm text-white hover:bg-primary-hover"
              >
                ค้นหา
              </button>
            </div>
          </div>

          <ul className="mt-5 divide-y divide-border">
            {bookings.map((booking) => (
              <li key={booking.id} className="py-3">
                <p className="font-medium text-accent-slate">
                  {booking.bookerName} · {booking.room.roomCode}{" "}
                  {booking.room.roomName}
                </p>
                <p className="text-sm text-muted">
                  {booking.purpose} · ผู้เข้าร่วม {booking.attendeeCount} คน
                </p>
                <p className="mt-1 text-sm text-primary">
                  {formatTime(booking.startTime)} — {formatTime(booking.endTime)}
                </p>
              </li>
            ))}
            {bookings.length === 0 ? (
              <li className="py-6 text-sm text-muted">
                ยังไม่มีรายการจองในระบบ
              </li>
            ) : null}
          </ul>
        </section>

        <section className="rounded-xl border border-border bg-surface p-5 sm:p-6">
          <h2 className="font-display text-2xl text-accent-slate">
            ใกล้ถึงกำหนดใน 7 วัน
          </h2>
          <p className="mt-1 text-sm text-muted">
            รายการที่กำลังจะเริ่มเร็วๆ นี้ เรียงตามเวลาเริ่ม
          </p>
          <ul className="mt-5 divide-y divide-border">
            {upcoming.map((booking) => (
              <li
                key={booking.id}
                className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-accent-slate">
                    {booking.room.roomCode} · {booking.bookerName}
                  </p>
                  <p className="text-sm text-muted">{booking.purpose}</p>
                </div>
                <p className="text-sm text-success">
                  {formatTime(booking.startTime)}
                </p>
              </li>
            ))}
            {upcoming.length === 0 ? (
              <li className="py-6 text-sm text-muted">
                ยังไม่มีการจองในช่วง 7 วันข้างหน้า
              </li>
            ) : null}
          </ul>
        </section>
      </div>
    </AppShell>
  );
}
