import { describe, expect, it } from "vitest";
import { assertFutureBookingWindow, toLocalInputValue } from "@/lib/client/api";

describe("client booking window guards", () => {
  it("rejects past starts", () => {
    const past = toLocalInputValue(new Date(Date.now() - 60 * 60 * 1000));
    const end = toLocalInputValue(new Date(Date.now() + 60 * 60 * 1000));
    const result = assertFutureBookingWindow(past, end);
    expect("error" in result).toBe(true);
  });

  it("accepts future windows", () => {
    const start = toLocalInputValue(new Date(Date.now() + 2 * 60 * 60 * 1000));
    const end = toLocalInputValue(new Date(Date.now() + 3 * 60 * 60 * 1000));
    const result = assertFutureBookingWindow(start, end);
    expect("error" in result).toBe(false);
  });
});
