import { describe, expect, it } from "vitest";
import {
  addDays,
  hoursBetween,
  intervalsOverlap,
  isActiveBooking,
  isFutureStart,
} from "@/lib/domain/time";

describe("intervalsOverlap", () => {
  const aStart = new Date("2026-12-01T10:00:00.000Z");
  const aEnd = new Date("2026-12-01T12:00:00.000Z");

  it("detects overlap", () => {
    expect(
      intervalsOverlap(
        aStart,
        aEnd,
        new Date("2026-12-01T11:00:00.000Z"),
        new Date("2026-12-01T13:00:00.000Z"),
      ),
    ).toBe(true);
  });

  it("allows touching edges", () => {
    expect(
      intervalsOverlap(
        aStart,
        aEnd,
        new Date("2026-12-01T12:00:00.000Z"),
        new Date("2026-12-01T14:00:00.000Z"),
      ),
    ).toBe(false);
  });
});

describe("time helpers", () => {
  const now = new Date("2026-11-11T08:00:00.000Z");

  it("future start", () => {
    expect(isFutureStart(new Date("2026-11-11T08:00:01.000Z"), now)).toBe(true);
    expect(isFutureStart(now, now)).toBe(false);
  });

  it("active booking by endTime", () => {
    expect(isActiveBooking(new Date("2026-11-11T09:00:00.000Z"), now)).toBe(
      true,
    );
    expect(isActiveBooking(now, now)).toBe(false);
  });

  it("hours and addDays", () => {
    expect(
      hoursBetween(
        new Date("2026-12-01T10:00:00.000Z"),
        new Date("2026-12-01T12:30:00.000Z"),
      ),
    ).toBe(2.5);
    expect(addDays(now, 7).toISOString()).toBe("2026-11-18T08:00:00.000Z");
  });
});
