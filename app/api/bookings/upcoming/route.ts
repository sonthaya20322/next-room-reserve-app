import { addDays } from "@/lib/domain/time";
import { prisma } from "@/lib/db/prisma";
import { jsonError, jsonOk } from "@/lib/http/response";
import {
  optionalPositiveInt,
  parseDaysParam,
} from "@/lib/validation/parse";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseDaysParam(searchParams.get("days"));
    const roomId = optionalPositiveInt(searchParams.get("roomId"), "roomId");
    const now = new Date();
    const until = addDays(now, days);

    const data = await prisma.booking.findMany({
      where: {
        startTime: { gte: now, lte: until },
        ...(roomId !== undefined ? { roomId } : {}),
      },
      include: { room: true },
      orderBy: { startTime: "asc" },
    });

    return jsonOk({ data, meta: { days, from: now, to: until } });
  } catch (error) {
    return jsonError(error);
  }
}
