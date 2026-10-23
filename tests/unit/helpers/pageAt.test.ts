import { describe, expect, it } from "vitest";
import pageAt, { pageCount } from "@morphing-scroll/src/helpers/pageAt";

describe("pageCount", () => {
  it("keeps exact pages exact", () => {
    expect(pageCount(100, 100, 0)).toBe(1);
    expect(pageCount(300, 100, 0)).toBe(3);
    expect(pageCount(320, 100, 10)).toBe(3);
  });

  it("gives a partial tail its own page", () => {
    expect(pageCount(101, 100, 0)).toBe(2);
    expect(pageCount(250, 100, 0)).toBe(3);
    expect(pageCount(321, 100, 10)).toBe(4);
  });

  it("says one while a size is unavailable", () => {
    expect(pageCount(900, 0, 0)).toBe(1);
    expect(pageCount(900, Number.NaN, 0)).toBe(1);
    expect(pageCount(0, 100, 0)).toBe(1);
  });
});

describe("pageAt", () => {
  it("uses the clamped end for the last partial page", () => {
    const bounds = { end: 608, count: 3 };

    expect(pageAt(432, 420, 12, bounds)).toBe(1);
    expect(pageAt(608, 420, 12, bounds)).toBe(2);
  });
});
