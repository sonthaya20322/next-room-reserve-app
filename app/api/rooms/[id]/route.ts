import { Prisma } from "@prisma/client";
import {
  canReduceCapacity,
  maxAttendeesOfActiveBookings,
} from "@/lib/domain/capacity";
import { prisma } from "@/lib/db/prisma";
import { conflict, notFound } from "@/lib/http/errors";
import { jsonError, jsonOk } from "@/lib/http/response";
import {
  asRecord,
  optionalNonEmptyString,
  optionalPositiveInt,
  readJsonBody,
  requireIdParam,
} from "@/lib/validation/parse";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const id = requireIdParam((await context.params).id);
    const room = await prisma.room.findUnique({ where: { id } });
    if (!room) throw notFound("ไม่พบห้องประชุม", { id });
    return jsonOk(room);
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const id = requireIdParam((await context.params).id);
    const room = await prisma.room.findUnique({ where: { id } });
    if (!room) throw notFound("ไม่พบห้องประชุม", { id });

    const body = asRecord(await readJsonBody(request));
    const roomCode = optionalNonEmptyString(body.roomCode, "roomCode");
    const roomName = optionalNonEmptyString(body.roomName, "roomName");
    const location = optionalNonEmptyString(body.location, "location");
    const capacity = optionalPositiveInt(body.capacity, "capacity");

    if (
      roomCode === undefined &&
      roomName === undefined &&
      location === undefined &&
      capacity === undefined
    ) {
      return jsonOk(room);
    }

    if (roomCode !== undefined && roomCode !== room.roomCode) {
      const duplicate = await prisma.room.findUnique({ where: { roomCode } });
      if (duplicate) throw conflict("รหัสห้องซ้ำ", { roomCode });
    }

    if (capacity !== undefined && capacity < room.capacity) {
      const activeBookings = await prisma.booking.findMany({
        where: { roomId: id, endTime: { gt: new Date() } },
        select: { attendeeCount: true, endTime: true },
      });
      const maxAttendees = maxAttendeesOfActiveBookings(activeBookings);
      if (!canReduceCapacity(capacity, maxAttendees)) {
        throw conflict(
          "ห้ามลดความจุให้ต่ำกว่าจำนวนผู้เข้าร่วมของการจองที่ยังไม่สิ้นสุด",
          { capacity, maxAttendees },
        );
      }
    }

    const updated = await prisma.room.update({
      where: { id },
      data: {
        ...(roomCode !== undefined ? { roomCode } : {}),
        ...(roomName !== undefined ? { roomName } : {}),
        ...(location !== undefined ? { location } : {}),
        ...(capacity !== undefined ? { capacity } : {}),
      },
    });
    return jsonOk(updated);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return jsonError(conflict("รหัสห้องซ้ำ"));
    }
    return jsonError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const id = requireIdParam((await context.params).id);
    const room = await prisma.room.findUnique({
      where: { id },
      include: { _count: { select: { bookings: true } } },
    });
    if (!room) throw notFound("ไม่พบห้องประชุม", { id });
    if (room._count.bookings > 0) {
      throw conflict("ลบห้องไม่ได้เนื่องจากมีรายการจองอยู่", {
        bookingCount: room._count.bookings,
      });
    }

    await prisma.room.delete({ where: { id } });
    return jsonOk({ deleted: 1, id });
  } catch (error) {
    return jsonError(error);
  }
}
