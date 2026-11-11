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
  const [messageTone, setMessageTone] = useState<"ok" | "warn">("warn");
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
    if (result.ok) {
      setRooms(result.data.data);
      setMessage(null);
    } else {
      setMessageTone("warn");
      setMessage(result.message);
    }
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
      setMessageTone("warn");
      setMessage(result.message);
      return;
    }
    setForm({ roomCode: "", roomName: "", capacity: "10", location: "" });
    setMessageTone("ok");
    setMessage(`เพิ่มห้อง ${result.data.roomName} เรียบร้อยแล้ว`);
    await loadRooms();
  }

  return (
    <AppShell currentPath="/rooms">
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

      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-xl border border-border bg-surface p-5 sm:p-6">
          <h2 className="font-display text-2xl text-accent-slate">เพิ่มห้องใหม่</h2>
          <p className="mt-1 text-sm text-muted">
            กรอกข้อมูลห้องเพื่อเปิดให้พนักงานจองได้
          </p>
          <form className="mt-5 grid gap-3" onSubmit={onCreate}>
            {(
              [
                ["roomCode", "รหัสห้อง", "เช่น A101"],
                ["roomName", "ชื่อห้อง", "เช่น ห้องประชุมใหญ่"],
                ["capacity", "จำนวนที่นั่ง", "เช่น 20"],
                ["location", "สถานที่", "เช่น อาคาร A ชั้น 1"],
              ] as const
            ).map(([key, label, placeholder]) => (
              <label key={key} className="grid gap-1 text-sm">
                <span className="font-medium text-accent-slate">{label}</span>
                <input
                  className="rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-primary"
                  value={form[key]}
                  placeholder={placeholder}
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
        </section>

        <section className="rounded-xl border border-border bg-surface p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-display text-2xl text-accent-slate">
                ห้องทั้งหมด
              </h2>
              <p className="mt-1 text-sm text-muted">
                ค้นหาจากชื่อห้องหรือสถานที่ และกรองตามจำนวนที่นั่ง
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <input
                className="rounded-md border border-border bg-background px-3 py-2 text-sm"
                placeholder="ค้นหาชื่อหรือสถานที่"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <input
                className="w-32 rounded-md border border-border bg-background px-3 py-2 text-sm"
                placeholder="ที่นั่งขั้นต่ำ"
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
              <li key={room.id} className="py-3">
                <p className="font-medium text-accent-slate">
                  {room.roomCode} · {room.roomName}
                </p>
                <p className="text-sm text-muted">
                  {room.location} · นั่งได้ {room.capacity} คน
                </p>
              </li>
            ))}
            {rooms.length === 0 ? (
              <li className="py-6 text-sm text-muted">
                ยังไม่พบห้องตามเงื่อนไขที่ค้นหา
              </li>
            ) : null}
          </ul>
        </section>
      </div>
    </AppShell>
  );
}
