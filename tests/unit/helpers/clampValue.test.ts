import { describe, it, expect } from "vitest";
import clampValue from "@morphing-scroll/src/helpers/clampValue";

describe("clampValue", () => {
  it("returns the value unchanged when inside range", () => {
    expect(clampValue(5, 0, 10)).toBe(5);
  });

  it("clamps to min", () => {
    expect(clampValue(-3, 0, 10)).toBe(0);
  });

  it("clamps to max", () => {
    expect(clampValue(42, 0, 10)).toBe(10);
  });

  it("rounds by default", () => {
    expect(clampValue(5.4)).toBe(5);
    expect(clampValue(5.6)).toBe(6);
  });

  it("keeps decimals when round=false", () => {
    expect(clampValue(5.4, 0, 10, false)).toBe(5.4);
  });

  it("defaults min=0 and max=Infinity", () => {
    expect(clampValue(-100)).toBe(0);
    expect(clampValue(1e9)).toBe(1e9);
  });

  it("min wins when min > max (Math.max applied last)", () => {
    // Math.max(min, Math.min(value, max)) => min beats max
    expect(clampValue(5, 20, 10)).toBe(20);
  });
});
