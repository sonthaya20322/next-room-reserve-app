import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { overlapWhere } from "@/lib/domain/overlap-query";
import { notFound } from "@/lib/http/errors";
import { jsonError, jsonOk } from "@/lib/http/response";
import { parsePairDateRange, requireIdParam } from "@/lib/validation/parse";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const id = requireIdParam((await context.params).id);
    const room = await prisma.room.findUnique({ where: { id } });
    if (!room) throw notFound("ไม่พบห้องประชุม", { id });

    const { searchParams } = new URL(request.url);
    const range = parsePairDateRange(
      searchParams.get("from"),
      searchParams.get("to"),
    );

    const where: Prisma.BookingWhereInput = { roomId: id };
    if (range) {
      Object.assign(where, overlapWhere(range.from, range.to));
    }

    const bookings = await prisma.booking.findMany({
      where,
      orderBy: { startTime: "asc" },
    });
    return jsonOk({ data: bookings });
  } catch (error) {
    return jsonError(error);
  }
}
