"use client";

import { FormEvent, useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import {
  apiFetch,
  localInputToIso,
  toLocalInputValue,
} from "@/lib/client/api";

type Room = {
  id: number;
  roomCode: string;
  roomName: string;
  capacity: number;
  location: string;
};

type QueryState = {
  startTime: string;
  endTime: string;
  attendeeCount: string;
};

export default function AvailablePage() {
  const [query, setQuery] = useState<QueryState>({
    startTime: "",
    endTime: "",
    attendeeCount: "4",
  });
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [bookerName, setBookerName] = useState("");
  const [purpose, setPurpose] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const start = new Date(Date.now() + 2 * 60 * 60 * 1000);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    setQuery({
      startTime: toLocalInputValue(start),
      endTime: toLocalInputValue(end),
      attendeeCount: "4",
    });
  }, []);

  async function searchAvailable() {
    setMessage(null);
    const params = new URLSearchParams({
      startTime: localInputToIso(query.startTime),
      endTime: localInputToIso(query.endTime),
    });
    if (query.attendeeCount.trim()) {
      params.set("attendeeCount", query.attendeeCount.trim());
    }
    const result = await apiFetch<{ data: Room[] }>(
      `/api/rooms/available?${params.toString()}`,
    );
    if (!result.ok) {
      setMessage(result.message);
      setRooms([]);
      return;
    }
    setRooms(result.data.data);
    setSelectedRoomId(result.data.data[0]?.id ?? null);
  }

  async function onSearch(event: FormEvent) {
    event.preventDefault();
    await searchAvailable();
  }

  async function onBook(event: FormEvent) {
    event.preventDefault();
    if (!selectedRoomId) {
      setMessage("เลือกห้องก่อนจอง");
      return;
    }
    const result = await apiFetch<{ id: number }>("/api/bookings", {
      method: "POST",
      body: JSON.stringify({
        roomId: selectedRoomId,
        bookerName,
        purpose,
        attendeeCount: Number(query.attendeeCount || "1"),
        startTime: localInputToIso(query.startTime),
        endTime: localInputToIso(query.endTime),
      }),
    });
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    setMessage(`จองสำเร็จ หมายเลข ${result.data.id}`);
    setBookerName("");
    setPurpose("");
    await searchAvailable();
  }

  return (
    <AppShell currentPath="/available">
      <div className="grid gap-8 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-surface p-5 sm:p-6">
          <h2 className="font-display text-2xl text-accent-slate">
            ค้นหาห้องว่าง
          </h2>
          <p className="mt-1 text-sm text-muted">GET /api/rooms/available</p>
          <form className="mt-5 grid gap-3" onSubmit={onSearch}>
            <label className="grid gap-1 text-sm">
              <span className="font-medium">เริ่ม</span>
              <input
                type="datetime-local"
                className="rounded-md border border-border bg-background px-3 py-2"
                value={query.startTime}
                onChange={(e) =>
                  setQuery((prev) => ({ ...prev, startTime: e.target.value }))
                }
                required
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium">สิ้นสุด</span>
              <input
                type="datetime-local"
                className="rounded-md border border-border bg-background px-3 py-2"
                value={query.endTime}
                onChange={(e) =>
                  setQuery((prev) => ({ ...prev, endTime: e.target.value }))
                }
                required
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium">จำนวนผู้เข้าร่วม</span>
              <input
                className="rounded-md border border-border bg-background px-3 py-2"
                value={query.attendeeCount}
                onChange={(e) =>
                  setQuery((prev) => ({
                    ...prev,
                    attendeeCount: e.target.value,
                  }))
                }
              />
            </label>
            <button
              type="submit"
              className="rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-hover"
            >
              ค้นหา
            </button>
          </form>
        </section>

        <section className="rounded-xl border border-border bg-surface p-5 sm:p-6">
          <h2 className="font-display text-2xl text-accent-slate">จองห้อง</h2>
          <p className="mt-1 text-sm text-muted">POST /api/bookings</p>

          <ul className="mt-4 max-h-48 space-y-2 overflow-auto">
            {rooms.map((room) => (
              <li key={room.id}>
                <button
                  type="button"
                  onClick={() => setSelectedRoomId(room.id)}
                  className={`w-full rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                    selectedRoomId === room.id
                      ? "border-success bg-success/10"
                      : "border-border hover:bg-stripe"
                  }`}
                >
                  <span className="font-medium">
                    {room.roomCode} · {room.roomName}
                  </span>
                  <span className="mt-1 block text-muted">
                    {room.location} · ความจุ {room.capacity}
                  </span>
                </button>
              </li>
            ))}
            {rooms.length === 0 ? (
              <li className="text-sm text-muted">ยังไม่มีผลลัพธ์การค้นหา</li>
            ) : null}
          </ul>

          <form className="mt-5 grid gap-3" onSubmit={onBook}>
            <label className="grid gap-1 text-sm">
              <span className="font-medium">ชื่อผู้จอง</span>
              <input
                className="rounded-md border border-border bg-background px-3 py-2"
                value={bookerName}
                onChange={(e) => setBookerName(e.target.value)}
                required
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium">วัตถุประสงค์</span>
              <input
                className="rounded-md border border-border bg-background px-3 py-2"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                required
              />
            </label>
            <button
              type="submit"
              className="rounded-md bg-success px-4 py-2.5 text-sm font-medium text-white"
            >
              ยืนยันการจอง
            </button>
          </form>
          {message ? (
            <p className="mt-4 text-sm text-warning">{message}</p>
          ) : null}
        </section>
      </div>
    </AppShell>
  );
}
