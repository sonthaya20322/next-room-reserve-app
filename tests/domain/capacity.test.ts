import { describe, expect, it } from "vitest";
import {
  canReduceCapacity,
  fitsCapacity,
  maxAttendeesOfActiveBookings,
} from "@/lib/domain/capacity";

describe("capacity rules", () => {
  const now = new Date("2026-11-11T12:00:00.000Z");

  it("computes max attendees of active bookings", () => {
    const max = maxAttendeesOfActiveBookings(
      [
        { attendeeCount: 5, endTime: new Date("2026-11-11T11:00:00.000Z") },
        { attendeeCount: 12, endTime: new Date("2026-11-11T13:00:00.000Z") },
        { attendeeCount: 8, endTime: new Date("2026-11-12T00:00:00.000Z") },
      ],
      now,
    );
    expect(max).toBe(12);
  });

  it("guards capacity reduction", () => {
    expect(canReduceCapacity(12, 12)).toBe(true);
    expect(canReduceCapacity(11, 12)).toBe(false);
  });

  it("checks fit", () => {
    expect(fitsCapacity(10, 10)).toBe(true);
    expect(fitsCapacity(11, 10)).toBe(false);
  });
});
