import {
  assertBookingEditable,
  assertFitsRoomCapacity,
  assertNoOverlap,
  assertValidBookingWindow,
} from "@/lib/domain/booking-rules";
import { overlapWhere } from "@/lib/domain/overlap-query";
import { lockRoomForUpdate } from "@/lib/db/lock-room";
import { prisma } from "@/lib/db/prisma";
import { notFound } from "@/lib/http/errors";
import { jsonError, jsonOk } from "@/lib/http/response";
import { FIELD_LIMITS } from "@/lib/validation/limits";
import {
  asRecord,
  optionalBodyDateTime,
  optionalBodyPositiveInt,
  optionalBodyString,
  readJsonBody,
  requireIdParam,
} from "@/lib/validation/parse";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const id = requireIdParam((await context.params).id);
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { room: true },
    });
    if (!booking) throw notFound("ไม่พบรายการจอง", { id });
    return jsonOk(booking);
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const id = requireIdParam((await context.params).id);
    const body = asRecord(await readJsonBody(request));

    const updated = await prisma.$transaction(async (tx) => {
      const existing = await tx.booking.findUnique({
        where: { id },
        include: { room: true },
      });
      if (!existing) throw notFound("ไม่พบรายการจอง", { id });

      const now = new Date();
      assertBookingEditable(existing.startTime, now);

      const bookerName = optionalBodyString(
        body,
        "bookerName",
        FIELD_LIMITS.bookerName,
      );
      const purpose = optionalBodyString(body, "purpose", FIELD_LIMITS.purpose);
      const startTime = optionalBodyDateTime(body, "startTime");
      const endTime = optionalBodyDateTime(body, "endTime");
      const attendeeCount = optionalBodyPositiveInt(body, "attendeeCount");
      const roomId = optionalBodyPositiveInt(body, "roomId");

      const next = {
        bookerName: bookerName ?? existing.bookerName,
        purpose: purpose ?? existing.purpose,
        startTime: startTime ?? existing.startTime,
        endTime: endTime ?? existing.endTime,
        attendeeCount: attendeeCount ?? existing.attendeeCount,
        roomId: roomId ?? existing.roomId,
      };

      assertValidBookingWindow(next.startTime, next.endTime, now);

      await lockRoomForUpdate(tx, next.roomId);
      if (next.roomId !== existing.roomId) {
        await lockRoomForUpdate(tx, existing.roomId);
      }

      const room = await tx.room.findUnique({ where: { id: next.roomId } });
      if (!room) throw notFound("ไม่พบห้องประชุม", { roomId: next.roomId });

      assertFitsRoomCapacity(next.attendeeCount, room.capacity);

      const candidates = await tx.booking.findMany({
        where: {
          roomId: next.roomId,
          ...overlapWhere(next.startTime, next.endTime),
        },
        select: { id: true, startTime: true, endTime: true },
      });
      assertNoOverlap(candidates, next.startTime, next.endTime, id);

      return tx.booking.update({
        where: { id },
        data: next,
        include: { room: true },
      });
    });

    return jsonOk(updated);
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const id = requireIdParam((await context.params).id);
    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) throw notFound("ไม่พบรายการจอง", { id });

    assertBookingEditable(booking.startTime);
    await prisma.booking.delete({ where: { id } });
    return jsonOk({ deleted: 1, id });
  } catch (error) {
    return jsonError(error);
  }
}
