import { describe, expect, it } from "vitest";
import { AppError } from "@/lib/http/errors";
import {
  parseDaysParam,
  parsePairDateRange,
  parsePagination,
  requireNonEmptyString,
  requirePositiveInt,
} from "@/lib/validation/parse";

describe("validation parse", () => {
  it("trims and rejects empty strings", () => {
    expect(requireNonEmptyString("  A101  ", "roomCode")).toBe("A101");
    expect(() => requireNonEmptyString("   ", "roomCode")).toThrow(AppError);
  });

  it("requires positive integers", () => {
    expect(requirePositiveInt("3", "capacity")).toBe(3);
    expect(() => requirePositiveInt(0, "capacity")).toThrow(AppError);
    expect(() => requirePositiveInt(1.5, "capacity")).toThrow(AppError);
  });

  it("requires pair date ranges together", () => {
    expect(parsePairDateRange(null, null)).toBeNull();
    expect(() =>
      parsePairDateRange("2026-12-01T00:00:00.000Z", null),
    ).toThrow(AppError);
    const range = parsePairDateRange(
      "2026-12-01T00:00:00.000Z",
      "2026-12-02T00:00:00.000Z",
    );
    expect(range?.from.toISOString()).toBe("2026-12-01T00:00:00.000Z");
  });

  it("parses pagination and days", () => {
    expect(parsePagination(null, null)).toEqual({ page: 1, pageSize: 10 });
    expect(() => parsePagination("1", "51")).toThrow(AppError);
    expect(parseDaysParam(null)).toBe(7);
    expect(() => parseDaysParam("31")).toThrow(AppError);
  });
});
