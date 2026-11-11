import { hoursBetween } from "@/lib/domain/time";
import { prisma } from "@/lib/db/prisma";
import { jsonError, jsonOk } from "@/lib/http/response";
import {
  optionalPositiveInt,
  parsePairDateRange,
} from "@/lib/validation/parse";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const range = parsePairDateRange(
      searchParams.get("from"),
      searchParams.get("to"),
      { required: true },
    );
    if (!range) throw new Error("unreachable");

    const roomId = optionalPositiveInt(searchParams.get("roomId"), "roomId");

    const bookings = await prisma.booking.findMany({
      where: {
        startTime: { gte: range.from, lt: range.to },
        ...(roomId !== undefined ? { roomId } : {}),
      },
      include: { room: true },
    });

    const byRoom = new Map<
      number,
      {
        roomId: number;
        roomCode: string;
        roomName: string;
        bookingCount: number;
        totalHours: number;
      }
    >();

    for (const booking of bookings) {
      const current = byRoom.get(booking.roomId) ?? {
        roomId: booking.roomId,
        roomCode: booking.room.roomCode,
        roomName: booking.room.roomName,
        bookingCount: 0,
        totalHours: 0,
      };
      current.bookingCount += 1;
      current.totalHours += hoursBetween(booking.startTime, booking.endTime);
      byRoom.set(booking.roomId, current);
    }

    const rooms = Array.from(byRoom.values()).map((item) => ({
      ...item,
      totalHours: Number(item.totalHours.toFixed(2)),
    }));

    return jsonOk({
      from: range.from,
      to: range.to,
      totalBookings: bookings.length,
      rooms,
    });
  } catch (error) {
    return jsonError(error);
  }
}
