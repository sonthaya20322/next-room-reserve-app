import type { Prisma } from "@prisma/client";

/** Bookings that overlap [start, end) using start < otherEnd && otherStart < end */
export function overlapWhere(
  start: Date,
  end: Date,
): Prisma.BookingWhereInput {
  return {
    startTime: { lt: end },
    endTime: { gt: start },
  };
}
