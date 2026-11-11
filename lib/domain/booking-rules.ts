import { conflict, badRequest } from "@/lib/http/errors";
import { fitsCapacity } from "./capacity";
import { hasNotStarted, intervalsOverlap, isFutureStart } from "./time";

export function assertValidBookingWindow(
  startTime: Date,
  endTime: Date,
  now: Date = new Date(),
  options?: { requireFutureStart?: boolean },
) {
  if (!(startTime < endTime)) {
    throw badRequest("startTime ต้องน้อยกว่า endTime");
  }
  if (options?.requireFutureStart !== false && !isFutureStart(startTime, now)) {
    throw badRequest("startTime ต้องเป็นเวลาในอนาคต");
  }
}

export function assertFitsRoomCapacity(
  attendeeCount: number,
  capacity: number,
) {
  if (!fitsCapacity(attendeeCount, capacity)) {
    throw badRequest("attendeeCount ต้องไม่เกินความจุของห้อง", {
      attendeeCount,
      capacity,
    });
  }
}

export function assertNoOverlap(
  candidates: Array<{ id: number; startTime: Date; endTime: Date }>,
  startTime: Date,
  endTime: Date,
  excludeId?: number,
) {
  const hit = candidates.find(
    (item) =>
      item.id !== excludeId &&
      intervalsOverlap(startTime, endTime, item.startTime, item.endTime),
  );
  if (hit) {
    throw conflict("ช่วงเวลานี้ทับซ้อนกับการจองอื่น", {
      conflictingBookingId: hit.id,
    });
  }
}

export function assertBookingEditable(startTime: Date, now: Date = new Date()) {
  if (!hasNotStarted(startTime, now)) {
    throw conflict("ไม่สามารถแก้ไขหรือยกเลิกการจองที่เริ่มใช้งานแล้ว");
  }
}
