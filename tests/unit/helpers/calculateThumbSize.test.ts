import { describe, it, expect } from "vitest";
import {
  calculateThumbSize,
  calculateThumbSpace,
} from "@morphing-scroll/src/helpers/calculateThumbSize";

describe("calculateThumbSize", () => {
  it("returns 0 when the wrapper size is 0", () => {
    expect(calculateThumbSize(100, 0, 30)).toBe(0);
  });

  it("scales the thumb proportionally to the viewport/content ratio", () => {
    // round(100/200 * 100) = 50, clamped to [30, 100]
    expect(calculateThumbSize(100, 200, 30)).toBe(50);
  });

  it("never shrinks below thumbMinSize", () => {
    // round(100/1000 * 100) = 10 -> clamped up to min 30
    expect(calculateThumbSize(100, 1000, 30)).toBe(30);
  });

  it("never grows past the viewport size", () => {
    // content smaller than viewport -> ratio > 1 -> clamped to size
    expect(calculateThumbSize(100, 100, 30)).toBe(100);
  });
});

describe("calculateThumbSpace", () => {
  it("returns 0 when the wrapper size is 0", () => {
    expect(calculateThumbSpace(50, 0, 100, 50)).toBe(0);
  });

  it("maps scroll offset to thumb travel", () => {
    // (100/200) * (100 - 50) = 25, clamped to [0, 50]
    expect(calculateThumbSpace(100, 200, 100, 50)).toBe(25);
  });

  it("clamps to the maximum travel (size - thumbSize)", () => {
    // (400/200) * 50 = 100 -> clamped to 50
    expect(calculateThumbSpace(400, 200, 100, 50)).toBe(50);
  });

  it("clamps negative scroll to 0", () => {
    expect(calculateThumbSpace(-10, 200, 100, 50)).toBe(0);
  });
});
