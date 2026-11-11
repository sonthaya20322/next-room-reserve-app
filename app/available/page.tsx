"use client";

import { FormEvent, useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import {
  apiFetch,
  assertFutureBookingWindow,
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

type SearchSnapshot = {
  startTime: string;
  endTime: string;
  attendeeCount: string;
};

export default function AvailablePage() {
  const [query, setQuery] = useState<QueryState>({
    startTime: "",
    endTime: "",
    attendeeCount: "6",
  });
  const [minDateTime, setMinDateTime] = useState("");
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [snapshot, setSnapshot] = useState<SearchSnapshot | null>(null);
  const [bookerName, setBookerName] = useState("");
  const [purpose, setPurpose] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<"ok" | "warn">("warn");
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const refreshMin = () => setMinDateTime(toLocalInputValue(new Date()));
    refreshMin();
    const timer = window.setInterval(refreshMin, 30_000);

    const start = new Date(Date.now() + 2 * 60 * 60 * 1000);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    setQuery({
      startTime: toLocalInputValue(start),
      endTime: toLocalInputValue(end),
      attendeeCount: "6",
    });

    return () => window.clearInterval(timer);
  }, []);

  function updateQuery(patch: Partial<QueryState>) {
    setQuery((prev) => ({ ...prev, ...patch }));
    setRooms([]);
    setSelectedRoomId(null);
    setSnapshot(null);
    setSearched(false);
  }

  async function searchAvailable() {
    setMessage(null);
    const windowCheck = assertFutureBookingWindow(
      query.startTime,
      query.endTime,
    );
    if ("error" in windowCheck) {
      setMessageTone("warn");
      setMessage(windowCheck.error);
      setRooms([]);
      setSelectedRoomId(null);
      setSnapshot(null);
      setSearched(false);
      return;
    }

    let startIso: string;
    let endIso: string;
    try {
      startIso = localInputToIso(query.startTime);
      endIso = localInputToIso(query.endTime);
    } catch {
      setMessageTone("warn");
      setMessage("วันเวลาไม่ถูกต้อง ลองเลือกใหม่อีกครั้ง");
      return;
    }

    const params = new URLSearchParams({
      startTime: startIso,
      endTime: endIso,
    });
    if (query.attendeeCount.trim()) {
      params.set("attendeeCount", query.attendeeCount.trim());
    }
    const result = await apiFetch<{ data: Room[] }>(
      `/api/rooms/available?${params.toString()}`,
    );
    setSearched(true);
    if (!result.ok) {
      setMessageTone("warn");
      setMessage(result.message);
      setRooms([]);
      setSelectedRoomId(null);
      setSnapshot(null);
      return;
    }
    const nextSnapshot: SearchSnapshot = {
      startTime: query.startTime,
      endTime: query.endTime,
      attendeeCount: query.attendeeCount.trim() || "1",
    };
    setSnapshot(nextSnapshot);
    setRooms(result.data.data);
    setSelectedRoomId(result.data.data[0]?.id ?? null);
  }

  async function onSearch(event: FormEvent) {
    event.preventDefault();
    await searchAvailable();
  }

  async function onBook(event: FormEvent) {
    event.preventDefault();
    if (!selectedRoomId || !snapshot) {
      setMessageTone("warn");
      setMessage("ค้นหาห้องว่างและเลือกห้องก่อนยืนยันการจอง");
      return;
    }

    const stillSameWindow =
      snapshot.startTime === query.startTime &&
      snapshot.endTime === query.endTime &&
      snapshot.attendeeCount === (query.attendeeCount.trim() || "1");
    if (!stillSameWindow) {
      setMessageTone("warn");
      setMessage("คุณเปลี่ยนวันเวลาหรือจำนวนคนแล้ว กรุณาค้นหาห้องว่างใหม่ก่อนจอง");
      setRooms([]);
      setSelectedRoomId(null);
      setSnapshot(null);
      setSearched(false);
      return;
    }

    const windowCheck = assertFutureBookingWindow(
      snapshot.startTime,
      snapshot.endTime,
    );
    if ("error" in windowCheck) {
      setMessageTone("warn");
      setMessage(windowCheck.error);
      return;
    }

    let startIso: string;
    let endIso: string;
    try {
      startIso = localInputToIso(snapshot.startTime);
      endIso = localInputToIso(snapshot.endTime);
    } catch {
      setMessageTone("warn");
      setMessage("วันเวลาไม่ถูกต้อง ลองเลือกใหม่อีกครั้ง");
      return;
    }

    const result = await apiFetch<{ id: number; room: { roomName: string } }>(
      "/api/bookings",
      {
        method: "POST",
        body: JSON.stringify({
          roomId: selectedRoomId,
          bookerName,
          purpose,
          attendeeCount: Number(snapshot.attendeeCount),
          startTime: startIso,
          endTime: endIso,
        }),
      },
    );
    if (!result.ok) {
      setMessageTone("warn");
      setMessage(result.message);
      return;
    }
    setMessageTone("ok");
    setMessage(`จอง${result.data.room.roomName} สำเร็จแล้ว`);
    setBookerName("");
    setPurpose("");
    await searchAvailable();
  }

  return (
    <AppShell currentPath="/available">
      {message ? (
        <div
          className={`mb-6 rounded-xl border px-4 py-3 text-sm ${
            messageTone === "ok"
              ? "border-success/30 bg-success/10 text-success"
              : "border-warning/30 bg-warning/10 text-warning"
          }`}
        >
          {message}
        </div>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-surface p-5 sm:p-6">
          <h2 className="font-display text-2xl text-accent-slate">
            หาห้องว่าง
          </h2>
          <p className="mt-1 text-sm text-muted">
            เลือกได้เฉพาะช่วงเวลาในอนาคต ระบบจะแสดงห้องที่ว่างและที่นั่งพอ
          </p>
          <form className="mt-5 grid gap-3" onSubmit={onSearch}>
            <label className="grid gap-1 text-sm">
              <span className="font-medium">เริ่มใช้ห้อง</span>
              <input
                type="datetime-local"
                className="rounded-md border border-border bg-background px-3 py-2"
                value={query.startTime}
                min={minDateTime || undefined}
                onChange={(e) => updateQuery({ startTime: e.target.value })}
                required
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium">เลิกใช้ห้อง</span>
              <input
                type="datetime-local"
                className="rounded-md border border-border bg-background px-3 py-2"
                value={query.endTime}
                min={query.startTime || minDateTime || undefined}
                onChange={(e) => updateQuery({ endTime: e.target.value })}
                required
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium">จำนวนผู้เข้าร่วม</span>
              <input
                className="rounded-md border border-border bg-background px-3 py-2"
                value={query.attendeeCount}
                onChange={(e) => updateQuery({ attendeeCount: e.target.value })}
                required
              />
            </label>
            <button
              type="submit"
              className="rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-hover"
            >
              ค้นหาห้องว่าง
            </button>
          </form>
        </section>

        <section className="rounded-xl border border-border bg-surface p-5 sm:p-6">
          <h2 className="font-display text-2xl text-accent-slate">
            ยืนยันการจอง
          </h2>
          <p className="mt-1 text-sm text-muted">
            เลือกห้องจากผลค้นหา แล้วกรอกชื่อผู้จองกับวัตถุประสงค์
          </p>
          {snapshot ? (
            <p className="mt-3 rounded-md bg-stripe px-3 py-2 text-sm text-muted">
              ช่วงที่ค้นไว้: {snapshot.startTime.replace("T", " ")} –{" "}
              {snapshot.endTime.replace("T", " ")} · {snapshot.attendeeCount} คน
            </p>
          ) : null}

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
                    {room.location} · นั่งได้ {room.capacity} คน
                  </span>
                </button>
              </li>
            ))}
            {!searched ? (
              <li className="text-sm text-muted">
                ยังไม่ได้ค้นหา — กดค้นหาห้องว่างเพื่อดูตัวเลือก
              </li>
            ) : null}
            {searched && rooms.length === 0 ? (
              <li className="text-sm text-muted">
                ไม่มีห้องว่างในช่วงเวลานี้ ลองเปลี่ยนเวลาหรือจำนวนคน
              </li>
            ) : null}
          </ul>

          <form className="mt-5 grid gap-3" onSubmit={onBook}>
            <label className="grid gap-1 text-sm">
              <span className="font-medium">ชื่อผู้จอง</span>
              <input
                className="rounded-md border border-border bg-background px-3 py-2"
                value={bookerName}
                placeholder="เช่น สมชาย ใจดี"
                onChange={(e) => setBookerName(e.target.value)}
                required
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium">วัตถุประสงค์</span>
              <input
                className="rounded-md border border-border bg-background px-3 py-2"
                value={purpose}
                placeholder="เช่น ประชุมทีมรายสัปดาห์"
                onChange={(e) => setPurpose(e.target.value)}
                required
              />
            </label>
            <button
              type="submit"
              className="rounded-md bg-success px-4 py-2.5 text-sm font-medium text-white"
            >
              ยืนยันจอง
            </button>
          </form>
        </section>
      </div>
    </AppShell>
  );
}
