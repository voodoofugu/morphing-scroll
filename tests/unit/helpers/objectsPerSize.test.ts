import { describe, it, expect } from "vitest";
import { objectsPerSize } from "@morphing-scroll/src/helpers/addFunctions";

describe("objectsPerSize", () => {
  it("returns 1 when available <= object size", () => {
    expect(objectsPerSize(50, 100)).toBe(1);
    expect(objectsPerSize(100, 100)).toBe(1);
  });

  it("returns the floored count that fits", () => {
    expect(objectsPerSize(250, 100)).toBe(2);
    expect(objectsPerSize(300, 100)).toBe(3);
  });

  it("floors partial fits", () => {
    expect(objectsPerSize(299, 100)).toBe(2);
  });

  it("says one while the size is still unknown", () => {
    // size="auto" до первого измерения — ноль, и делить на него нельзя
    expect(objectsPerSize(900, 0)).toBe(1);
    expect(objectsPerSize(900, NaN)).toBe(1);
    expect(objectsPerSize(900, -10)).toBe(1);
  });
});
