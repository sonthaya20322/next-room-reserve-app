import { afterAll, describe, expect, it } from "vitest";
import {
  DELETE as deleteBooking,
  GET as getBooking,
  PATCH as patchBooking,
} from "@/app/api/bookings/[id]/route";
import { DELETE as deleteExpired } from "@/app/api/bookings/expired/route";
import { GET as getStats } from "@/app/api/bookings/stats/route";
import { GET as getUpcoming } from "@/app/api/bookings/upcoming/route";
import {
  GET as listBookings,
  POST as createBooking,
} from "@/app/api/bookings/route";
import { POST as createRoom } from "@/app/api/rooms/route";
import { prisma } from "@/lib/db/prisma";
import { futureIso, jsonRequest, readJson, uniqueCode } from "../helpers/http";

const roomIds: number[] = [];
const bookingIds: number[] = [];

async function makeRoom(capacity = 10) {
  const roomCode = uniqueCode("B");
  const res = await readJson(
    await createRoom(
      jsonRequest("http://localhost/api/rooms", "POST", {
        roomCode,
        roomName: `Booking Room ${roomCode}`,
        capacity,
        location: "โซนจอง",
      }),
    ),
  );
  expect(res.status).toBe(201);
  roomIds.push(res.body.id);
  return res.body as { id: number; capacity: number };
}

describe("Bookings API", () => {
  afterAll(async () => {
    if (bookingIds.length) {
      await prisma.booking.deleteMany({ where: { id: { in: bookingIds } } });
    }
    if (roomIds.length) {
      await prisma.room.deleteMany({ where: { id: { in: roomIds } } });
    }
    await prisma.$disconnect();
  });

  it("creates booking, rejects overlap/capacity, lists with pagination", async () => {
    const room = await makeRoom(8);
    const slot = futureIso(24, 2);

    const created = await readJson(
      await createBooking(
        jsonRequest("http://localhost/api/bookings", "POST", {
          roomId: room.id,
          bookerName: "สมชาย",
          purpose: "ประชุมทีม",
          attendeeCount: 6,
          ...slot,
        }),
      ),
    );
    expect(created.status).toBe(201);
    bookingIds.push(created.body.id);
    expect(created.body.room.roomCode).toBeTruthy();

    const overlap = await readJson(
      await createBooking(
        jsonRequest("http://localhost/api/bookings", "POST", {
          roomId: room.id,
          bookerName: "สมหญิง",
          purpose: "ทับเวลา",
          attendeeCount: 2,
          ...slot,
        }),
      ),
    );
    expect(overlap.status).toBe(409);

    const overCap = await readJson(
      await createBooking(
        jsonRequest("http://localhost/api/bookings", "POST", {
          roomId: room.id,
          bookerName: "คนเยอะ",
          purpose: "เกินความจุ",
          attendeeCount: 20,
          ...futureIso(30, 1),
        }),
      ),
    );
    expect(overCap.status).toBe(400);

    const listed = await readJson(
      await listBookings(
        jsonRequest(
          `http://localhost/api/bookings?search=${encodeURIComponent("สมชาย")}&roomId=${room.id}&page=1&pageSize=10`,
          "GET",
        ),
      ),
    );
    expect(listed.status).toBe(200);
    expect(listed.body.meta.total).toBeGreaterThanOrEqual(1);
    expect(listed.body.data[0].room).toBeTruthy();

    const one = await readJson(
      await getBooking(
        jsonRequest(`http://localhost/api/bookings/${created.body.id}`, "GET"),
        { params: Promise.resolve({ id: String(created.body.id) }) },
      ),
    );
    expect(one.status).toBe(200);
  });

  it("patches movable booking and blocks started ones", async () => {
    const room = await makeRoom(12);
    const slot = futureIso(40, 1);
    const created = await readJson(
      await createBooking(
        jsonRequest("http://localhost/api/bookings", "POST", {
          roomId: room.id,
          bookerName: "Editable",
          purpose: "แก้ไขได้",
          attendeeCount: 3,
          ...slot,
        }),
      ),
    );
    expect(created.status).toBe(201);
    bookingIds.push(created.body.id);

    const newSlot = futureIso(50, 1);
    const patched = await readJson(
      await patchBooking(
        jsonRequest(`http://localhost/api/bookings/${created.body.id}`, "PATCH", {
          purpose: "เปลี่ยนวัตถุประสงค์",
          ...newSlot,
        }),
        { params: Promise.resolve({ id: String(created.body.id) }) },
      ),
    );
    expect(patched.status).toBe(200);
    expect(patched.body.purpose).toBe("เปลี่ยนวัตถุประสงค์");

    const past = await prisma.booking.create({
      data: {
        roomId: room.id,
        bookerName: "Past",
        purpose: "เริ่มแล้ว",
        attendeeCount: 2,
        startTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
        endTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
      },
    });
    bookingIds.push(past.id);

    const blockedPatch = await readJson(
      await patchBooking(
        jsonRequest(`http://localhost/api/bookings/${past.id}`, "PATCH", {
          purpose: "ไม่ควรได้",
        }),
        { params: Promise.resolve({ id: String(past.id) }) },
      ),
    );
    expect(blockedPatch.status).toBe(409);

    const blockedDelete = await readJson(
      await deleteBooking(
        jsonRequest(`http://localhost/api/bookings/${past.id}`, "DELETE"),
        { params: Promise.resolve({ id: String(past.id) }) },
      ),
    );
    expect(blockedDelete.status).toBe(409);

    const deleted = await readJson(
      await deleteBooking(
        jsonRequest(`http://localhost/api/bookings/${created.body.id}`, "DELETE"),
        { params: Promise.resolve({ id: String(created.body.id) }) },
      ),
    );
    expect(deleted.status).toBe(200);
    expect(deleted.body.deleted).toBe(1);
  });

  it("supports upcoming, stats, and expired cleanup", async () => {
    const room = await makeRoom(10);
    const upcomingSlot = futureIso(5, 2);
    const upcoming = await readJson(
      await createBooking(
        jsonRequest("http://localhost/api/bookings", "POST", {
          roomId: room.id,
          bookerName: "Soon",
          purpose: "เร็วๆ นี้",
          attendeeCount: 4,
          ...upcomingSlot,
        }),
      ),
    );
    expect(upcoming.status).toBe(201);
    bookingIds.push(upcoming.body.id);

    const upcomingList = await readJson(
      await getUpcoming(
        jsonRequest(
          `http://localhost/api/bookings/upcoming?days=7&roomId=${room.id}`,
          "GET",
        ),
      ),
    );
    expect(upcomingList.status).toBe(200);
    expect(
      upcomingList.body.data.some(
        (item: { id: number }) => item.id === upcoming.body.id,
      ),
    ).toBe(true);

    const from = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const to = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString();
    const stats = await readJson(
      await getStats(
        jsonRequest(
          `http://localhost/api/bookings/stats?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&roomId=${room.id}`,
          "GET",
        ),
      ),
    );
    expect(stats.status).toBe(200);
    expect(stats.body.totalBookings).toBeGreaterThanOrEqual(1);
    expect(stats.body.rooms[0].totalHours).toBeGreaterThan(0);

    const old = await prisma.booking.create({
      data: {
        roomId: room.id,
        bookerName: "Old",
        purpose: "หมดอายุ",
        attendeeCount: 2,
        startTime: new Date("2020-01-01T10:00:00.000Z"),
        endTime: new Date("2020-01-01T12:00:00.000Z"),
      },
    });
    bookingIds.push(old.id);

    const before = new Date().toISOString();
    const expired = await readJson(
      await deleteExpired(
        jsonRequest(
          `http://localhost/api/bookings/expired?roomId=${room.id}&before=${encodeURIComponent(before)}`,
          "DELETE",
        ),
      ),
    );
    expect(expired.status).toBe(200);
    expect(expired.body.deleted).toBeGreaterThanOrEqual(1);

    const futureBefore = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const badBefore = await readJson(
      await deleteExpired(
        jsonRequest(
          `http://localhost/api/bookings/expired?roomId=${room.id}&before=${encodeURIComponent(futureBefore)}`,
          "DELETE",
        ),
      ),
    );
    expect(badBefore.status).toBe(400);
  });
});
