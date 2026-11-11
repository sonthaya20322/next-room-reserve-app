"use client";

import { FormEvent, useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { apiFetch } from "@/lib/client/api";

type Room = {
  id: number;
  roomCode: string;
  roomName: string;
  capacity: number;
  location: string;
};

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [search, setSearch] = useState("");
  const [minCapacity, setMinCapacity] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState({
    roomCode: "",
    roomName: "",
    capacity: "10",
    location: "",
  });

  async function loadRooms() {
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (minCapacity.trim()) params.set("minCapacity", minCapacity.trim());
    const result = await apiFetch<{ data: Room[] }>(
      `/api/rooms?${params.toString()}`,
    );
    if (result.ok) setRooms(result.data.data);
    else setMessage(result.message);
  }

  useEffect(() => {
    void loadRooms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    const result = await apiFetch<Room>("/api/rooms", {
      method: "POST",
      body: JSON.stringify({
        roomCode: form.roomCode,
        roomName: form.roomName,
        capacity: Number(form.capacity),
        location: form.location,
      }),
    });
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    setForm({ roomCode: "", roomName: "", capacity: "10", location: "" });
    setMessage(`เพิ่มห้อง ${result.data.roomCode} สำเร็จ`);
    await loadRooms();
  }

  return (
    <AppShell currentPath="/rooms">
      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-xl border border-border bg-surface p-5 sm:p-6">
          <h2 className="font-display text-2xl text-accent-slate">เพิ่มห้อง</h2>
          <p className="mt-1 text-sm text-muted">ส่งต่อไปยัง POST /api/rooms</p>
          <form className="mt-5 grid gap-3" onSubmit={onCreate}>
            {(
              [
                ["roomCode", "รหัสห้อง"],
                ["roomName", "ชื่อห้อง"],
                ["capacity", "ความจุ"],
                ["location", "สถานที่"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="grid gap-1 text-sm">
                <span className="font-medium text-accent-slate">{label}</span>
                <input
                  className="rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-primary"
                  value={form[key]}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, [key]: e.target.value }))
                  }
                  required
                />
              </label>
            ))}
            <button
              type="submit"
              className="mt-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-hover"
            >
              บันทึกห้อง
            </button>
          </form>
          {message ? (
            <p className="mt-4 text-sm text-warning">{message}</p>
          ) : null}
        </section>

        <section className="rounded-xl border border-border bg-surface p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-display text-2xl text-accent-slate">
                รายการห้อง
              </h2>
              <p className="mt-1 text-sm text-muted">GET /api/rooms</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <input
                className="rounded-md border border-border bg-background px-3 py-2 text-sm"
                placeholder="ค้นหาชื่อ/สถานที่"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <input
                className="w-28 rounded-md border border-border bg-background px-3 py-2 text-sm"
                placeholder="ความจุขั้นต่ำ"
                value={minCapacity}
                onChange={(e) => setMinCapacity(e.target.value)}
              />
              <button
                type="button"
                onClick={() => void loadRooms()}
                className="rounded-md bg-accent-slate px-3 py-2 text-sm text-white"
              >
                ค้นหา
              </button>
            </div>
          </div>

          <ul className="mt-5 divide-y divide-border">
            {rooms.map((room) => (
              <li key={room.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-accent-slate">
                    {room.roomCode} · {room.roomName}
                  </p>
                  <p className="text-sm text-muted">
                    {room.location} · ความจุ {room.capacity}
                  </p>
                </div>
                <span className="text-xs font-medium tracking-wide text-primary uppercase">
                  ID {room.id}
                </span>
              </li>
            ))}
            {rooms.length === 0 ? (
              <li className="py-6 text-sm text-muted">ยังไม่มีห้องตามตัวกรอง</li>
            ) : null}
          </ul>
        </section>
      </div>
    </AppShell>
  );
}
