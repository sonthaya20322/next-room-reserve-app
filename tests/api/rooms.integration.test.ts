import { afterAll, describe, expect, it } from "vitest";
import { DELETE as deleteRoom, GET as getRoom, PATCH as patchRoom } from "@/app/api/rooms/[id]/route";
import { GET as getRoomBookings } from "@/app/api/rooms/[id]/bookings/route";
import { GET as getAvailable } from "@/app/api/rooms/available/route";
import { GET as listRooms, POST as createRoom } from "@/app/api/rooms/route";
import { POST as createBooking } from "@/app/api/bookings/route";
import { prisma } from "@/lib/db/prisma";
import { futureIso, jsonRequest, readJson, uniqueCode } from "../helpers/http";

const createdRoomIds: number[] = [];
const createdBookingIds: number[] = [];

async function makeRoom(overrides?: Partial<{ capacity: number; location: string }>) {
  const roomCode = uniqueCode("R");
  const res = await createRoom(
    jsonRequest("http://localhost/api/rooms", "POST", {
      roomCode,
      roomName: `Room ${roomCode}`,
      capacity: overrides?.capacity ?? 10,
      location: overrides?.location ?? "อาคารทดสอบ",
    }),
  );
  const payload = await readJson(res);
  expect(payload.status).toBe(201);
  createdRoomIds.push(payload.body.id);
  return payload.body as {
    id: number;
    roomCode: string;
    capacity: number;
  };
}

describe("Rooms API", () => {
  afterAll(async () => {
    if (createdBookingIds.length) {
      await prisma.booking.deleteMany({ where: { id: { in: createdBookingIds } } });
    }
    if (createdRoomIds.length) {
      await prisma.room.deleteMany({ where: { id: { in: createdRoomIds } } });
    }
    await prisma.$disconnect();
  });

  it("creates, lists, gets, patches, and rejects duplicate roomCode", async () => {
    const room = await makeRoom({ location: "โซนเหนือ" });

    const list = await readJson(
      await listRooms(
        jsonRequest("http://localhost/api/rooms?search=โซนเหนือ&minCapacity=5", "GET"),
      ),
    );
    expect(list.status).toBe(200);
    expect(list.body.data.some((item: { id: number }) => item.id === room.id)).toBe(
      true,
    );

    const one = await readJson(
      await getRoom(jsonRequest(`http://localhost/api/rooms/${room.id}`, "GET"), {
        params: Promise.resolve({ id: String(room.id) }),
      }),
    );
    expect(one.status).toBe(200);
    expect(one.body.roomCode).toBe(room.roomCode);

    const patched = await readJson(
      await patchRoom(
        jsonRequest(`http://localhost/api/rooms/${room.id}`, "PATCH", {
          roomName: "ชื่อใหม่",
        }),
        { params: Promise.resolve({ id: String(room.id) }) },
      ),
    );
    expect(patched.status).toBe(200);
    expect(patched.body.roomName).toBe("ชื่อใหม่");

    const dup = await readJson(
      await createRoom(
        jsonRequest("http://localhost/api/rooms", "POST", {
          roomCode: room.roomCode,
          roomName: "ซ้ำ",
          capacity: 5,
          location: "x",
        }),
      ),
    );
    expect(dup.status).toBe(409);
  });

  it("blocks capacity reduction below active attendees and delete with bookings", async () => {
    const room = await makeRoom({ capacity: 20 });
    const slot = futureIso(48, 2);
    const bookingRes = await readJson(
      await createBooking(
        jsonRequest("http://localhost/api/bookings", "POST", {
          roomId: room.id,
          bookerName: "Tester",
          purpose: "ประชุม",
          attendeeCount: 12,
          ...slot,
        }),
      ),
    );
    expect(bookingRes.status).toBe(201);
    createdBookingIds.push(bookingRes.body.id);

    const badCap = await readJson(
      await patchRoom(
        jsonRequest(`http://localhost/api/rooms/${room.id}`, "PATCH", {
          capacity: 10,
        }),
        { params: Promise.resolve({ id: String(room.id) }) },
      ),
    );
    expect(badCap.status).toBe(409);

    const del = await readJson(
      await deleteRoom(
        jsonRequest(`http://localhost/api/rooms/${room.id}`, "DELETE"),
        { params: Promise.resolve({ id: String(room.id) }) },
      ),
    );
    expect(del.status).toBe(409);
  });

  it("lists room bookings with range and finds available rooms", async () => {
    const room = await makeRoom({ capacity: 15 });
    const slot = futureIso(72, 1);
    const bookingRes = await readJson(
      await createBooking(
        jsonRequest("http://localhost/api/bookings", "POST", {
          roomId: room.id,
          bookerName: "Avail",
          purpose: "ทดสอบว่าง",
          attendeeCount: 5,
          ...slot,
        }),
      ),
    );
    expect(bookingRes.status).toBe(201);
    createdBookingIds.push(bookingRes.body.id);

    const bookings = await readJson(
      await getRoomBookings(
        jsonRequest(
          `http://localhost/api/rooms/${room.id}/bookings?from=${encodeURIComponent(slot.startTime)}&to=${encodeURIComponent(slot.endTime)}`,
          "GET",
        ),
        { params: Promise.resolve({ id: String(room.id) }) },
      ),
    );
    expect(bookings.status).toBe(200);
    expect(bookings.body.data.length).toBeGreaterThanOrEqual(1);

    const busy = await readJson(
      await getAvailable(
        jsonRequest(
          `http://localhost/api/rooms/available?startTime=${encodeURIComponent(slot.startTime)}&endTime=${encodeURIComponent(slot.endTime)}&attendeeCount=5`,
          "GET",
        ),
      ),
    );
    expect(busy.status).toBe(200);
    expect(
      busy.body.data.some((item: { id: number }) => item.id === room.id),
    ).toBe(false);

    const freeSlot = futureIso(96, 1);
    const free = await readJson(
      await getAvailable(
        jsonRequest(
          `http://localhost/api/rooms/available?startTime=${encodeURIComponent(freeSlot.startTime)}&endTime=${encodeURIComponent(freeSlot.endTime)}&attendeeCount=5`,
          "GET",
        ),
      ),
    );
    expect(free.status).toBe(200);
    expect(
      free.body.data.some((item: { id: number }) => item.id === room.id),
    ).toBe(true);
  });

  it("returns 404 for missing room", async () => {
    const res = await readJson(
      await getRoom(jsonRequest("http://localhost/api/rooms/999999", "GET"), {
        params: Promise.resolve({ id: "999999" }),
      }),
    );
    expect(res.status).toBe(404);
  });
});
