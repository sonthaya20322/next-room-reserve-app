import type { Prisma } from "@prisma/client";
import {
  assertFitsRoomCapacity,
  assertNoOverlap,
  assertValidBookingWindow,
} from "@/lib/domain/booking-rules";
import { overlapWhere } from "@/lib/domain/overlap-query";
import { lockRoomForUpdate } from "@/lib/db/lock-room";
import { prisma } from "@/lib/db/prisma";
import { notFound } from "@/lib/http/errors";
import { getSearchParams } from "@/lib/http/request";
import { jsonCreated, jsonError, jsonOk } from "@/lib/http/response";
import {
  asRecord,
  optionalPositiveInt,
  parsePairDateRange,
  parsePagination,
  readJsonBody,
  requireDateTime,
  requireNonEmptyString,
  requirePositiveInt,
} from "@/lib/validation/parse";
import { FIELD_LIMITS } from "@/lib/validation/limits";

export async function GET(request: Request) {
  const searchParams = getSearchParams(request);
  try {
    const search = searchParams.get("search")?.trim() || undefined;
    const roomId = optionalPositiveInt(searchParams.get("roomId"), "roomId");
    const range = parsePairDateRange(
      searchParams.get("from"),
      searchParams.get("to"),
    );
    const { page, pageSize } = parsePagination(
      searchParams.get("page"),
      searchParams.get("pageSize"),
    );

    const where: Prisma.BookingWhereInput = {};
    if (search) {
      where.OR = [
        { bookerName: { contains: search } },
        { purpose: { contains: search } },
      ];
    }
    if (roomId !== undefined) where.roomId = roomId;
    if (range) Object.assign(where, overlapWhere(range.from, range.to));

    const [total, data] = await prisma.$transaction([
      prisma.booking.count({ where }),
      prisma.booking.findMany({
        where,
        include: { room: true },
        orderBy: { startTime: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return jsonOk({
      data,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = asRecord(await readJsonBody(request));
    const roomId = requirePositiveInt(body.roomId, "roomId");
    const bookerName = requireNonEmptyString(
      body.bookerName,
      "bookerName",
      FIELD_LIMITS.bookerName,
    );
    const purpose = requireNonEmptyString(
      body.purpose,
      "purpose",
      FIELD_LIMITS.purpose,
    );
    const startTime = requireDateTime(body.startTime, "startTime");
    const endTime = requireDateTime(body.endTime, "endTime");
    const attendeeCount = requirePositiveInt(
      body.attendeeCount,
      "attendeeCount",
    );

    assertValidBookingWindow(startTime, endTime);

    const booking = await prisma.$transaction(async (tx) => {
      await lockRoomForUpdate(tx, roomId);
      const room = await tx.room.findUnique({ where: { id: roomId } });
      if (!room) throw notFound("ไม่พบห้องประชุม", { roomId });

      assertFitsRoomCapacity(attendeeCount, room.capacity);

      const candidates = await tx.booking.findMany({
        where: { roomId, ...overlapWhere(startTime, endTime) },
        select: { id: true, startTime: true, endTime: true },
      });
      assertNoOverlap(candidates, startTime, endTime);

      return tx.booking.create({
        data: {
          roomId,
          bookerName,
          purpose,
          startTime,
          endTime,
          attendeeCount,
        },
        include: { room: true },
      });
    });

    return jsonCreated(booking);
  } catch (error) {
    return jsonError(error);
  }
}
