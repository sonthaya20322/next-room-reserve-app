import { afterAll, describe, expect, it } from "vitest";
import { PATCH as patchBooking } from "@/app/api/bookings/[id]/route";
import { POST as createBooking } from "@/app/api/bookings/route";
import { GET as getAvailable } from "@/app/api/rooms/available/route";
import { POST as createRoom } from "@/app/api/rooms/route";
import { prisma } from "@/lib/db/prisma";
import { futureIso, jsonRequest, readJson, uniqueCode } from "../helpers/http";

const roomIds: number[] = [];
const bookingIds: number[] = [];

async function makeRoom(capacity = 10) {
  const roomCode = uniqueCode("H");
  const res = await readJson(
    await createRoom(
      jsonRequest("http://localhost/api/rooms", "POST", {
        roomCode,
        roomName: `Hardening ${roomCode}`,
        capacity,
        location: "อาคารทดสอบ",
      }),
    ),
  );
  expect(res.status).toBe(201);
  roomIds.push(res.body.id);
  return res.body as { id: number };
}

describe("Phase 6 hardening", () => {
  afterAll(async () => {
    if (bookingIds.length) {
      await prisma.booking.deleteMany({ where: { id: { in: bookingIds } } });
    }
    if (roomIds.length) {
      await prisma.room.deleteMany({ where: { id: { in: roomIds } } });
    }
    await prisma.$disconnect();
  });

  it("rejects past windows on available and create booking", async () => {
    const pastStart = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const pastEnd = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const available = await readJson(
      await getAvailable(
        jsonRequest(
          `http://localhost/api/rooms/available?startTime=${encodeURIComponent(pastStart)}&endTime=${encodeURIComponent(pastEnd)}`,
          "GET",
        ),
      ),
    );
    expect(available.status).toBe(400);

    const room = await makeRoom();
    const created = await readJson(
      await createBooking(
        jsonRequest("http://localhost/api/bookings", "POST", {
          roomId: room.id,
          bookerName: "อดีต",
          purpose: "จองย้อนหลัง",
          attendeeCount: 2,
          startTime: pastStart,
          endTime: pastEnd,
        }),
      ),
    );
    expect(created.status).toBe(400);
  });

  it("allows touching edges and rejects max-length overflow", async () => {
    const room = await makeRoom();
    const first = futureIso(80, 1);
    const created = await readJson(
      await createBooking(
        jsonRequest("http://localhost/api/bookings", "POST", {
          roomId: room.id,
          bookerName: "ขอบชน",
          purpose: "ช่วงแรก",
          attendeeCount: 2,
          ...first,
        }),
      ),
    );
    expect(created.status).toBe(201);
    bookingIds.push(created.body.id);

    const touching = await readJson(
      await createBooking(
        jsonRequest("http://localhost/api/bookings", "POST", {
          roomId: room.id,
          bookerName: "ขอบชน2",
          purpose: "เริ่มตอนจบพอดี",
          attendeeCount: 2,
          startTime: first.endTime,
          endTime: new Date(
            new Date(first.endTime).getTime() + 60 * 60 * 1000,
          ).toISOString(),
        }),
      ),
    );
    expect(touching.status).toBe(201);
    bookingIds.push(touching.body.id);

    const tooLong = await readJson(
      await createRoom(
        jsonRequest("http://localhost/api/rooms", "POST", {
          roomCode: "X".repeat(65),
          roomName: "ยาวเกิน",
          capacity: 5,
          location: "ที่นี่",
        }),
      ),
    );
    expect(tooLong.status).toBe(400);
  });

  it("rejects PATCH null fields and allows self-exclude time move", async () => {
    const room = await makeRoom();
    const slot = futureIso(120, 1);
    const created = await readJson(
      await createBooking(
        jsonRequest("http://localhost/api/bookings", "POST", {
          roomId: room.id,
          bookerName: "ย้ายเวลา",
          purpose: "เดิม",
          attendeeCount: 2,
          ...slot,
        }),
      ),
    );
    expect(created.status).toBe(201);
    bookingIds.push(created.body.id);

    const nullPatch = await readJson(
      await patchBooking(
        jsonRequest(`http://localhost/api/bookings/${created.body.id}`, "PATCH", {
          purpose: null,
        }),
        { params: Promise.resolve({ id: String(created.body.id) }) },
      ),
    );
    expect(nullPatch.status).toBe(400);

    const moved = futureIso(130, 1);
    const okPatch = await readJson(
      await patchBooking(
        jsonRequest(`http://localhost/api/bookings/${created.body.id}`, "PATCH", {
          ...moved,
        }),
        { params: Promise.resolve({ id: String(created.body.id) }) },
      ),
    );
    expect(okPatch.status).toBe(200);
  });
});
