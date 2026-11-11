import { prisma } from "@/lib/db/prisma";
import { overlapWhere } from "@/lib/domain/overlap-query";
import { assertValidBookingWindow } from "@/lib/domain/booking-rules";
import { getSearchParams } from "@/lib/http/request";
import { jsonError, jsonOk } from "@/lib/http/response";
import {
  optionalPositiveInt,
  parsePairDateRange,
} from "@/lib/validation/parse";

export async function GET(request: Request) {
  const searchParams = getSearchParams(request);
  try {
    const range = parsePairDateRange(
      searchParams.get("startTime"),
      searchParams.get("endTime"),
      {
        required: true,
        fromLabel: "startTime",
        toLabel: "endTime",
      },
    );
    if (!range) {
      throw new Error("unreachable");
    }

    assertValidBookingWindow(range.from, range.to, new Date(), {
      requireFutureStart: false,
    });

    const attendeeCount = optionalPositiveInt(
      searchParams.get("attendeeCount"),
      "attendeeCount",
    );

    const rooms = await prisma.room.findMany({
      where: {
        ...(attendeeCount !== undefined
          ? { capacity: { gte: attendeeCount } }
          : {}),
        bookings: {
          none: overlapWhere(range.from, range.to),
        },
      },
      orderBy: { id: "asc" },
    });

    return jsonOk({ data: rooms });
  } catch (error) {
    return jsonError(error);
  }
}
