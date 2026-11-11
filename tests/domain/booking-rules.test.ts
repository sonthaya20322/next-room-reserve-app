import { describe, expect, it } from "vitest";
import {
  assertBookingEditable,
  assertNoOverlap,
  assertValidBookingWindow,
} from "@/lib/domain/booking-rules";
import { AppError } from "@/lib/http/errors";

describe("booking rules", () => {
  const now = new Date("2026-11-11T10:00:00.000Z");

  it("requires future window", () => {
    expect(() =>
      assertValidBookingWindow(
        new Date("2026-11-11T09:00:00.000Z"),
        new Date("2026-11-11T11:00:00.000Z"),
        now,
      ),
    ).toThrow(AppError);
  });

  it("detects overlap excluding self", () => {
    const candidates = [
      {
        id: 1,
        startTime: new Date("2026-12-01T10:00:00.000Z"),
        endTime: new Date("2026-12-01T12:00:00.000Z"),
      },
    ];
    expect(() =>
      assertNoOverlap(
        candidates,
        new Date("2026-12-01T11:00:00.000Z"),
        new Date("2026-12-01T13:00:00.000Z"),
      ),
    ).toThrow(AppError);

    expect(() =>
      assertNoOverlap(
        candidates,
        new Date("2026-12-01T10:00:00.000Z"),
        new Date("2026-12-01T12:00:00.000Z"),
        1,
      ),
    ).not.toThrow();
  });

  it("blocks edits after start", () => {
    expect(() =>
      assertBookingEditable(new Date("2026-11-11T09:00:00.000Z"), now),
    ).toThrow(AppError);
  });
});
