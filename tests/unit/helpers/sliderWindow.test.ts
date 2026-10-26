import { describe, expect, it } from "vitest";

import {
  shiftSliderWindow,
  sliderWindowLimit,
  sliderWindowPages,
} from "@morphing-scroll/src/helpers/sliderWindow";

describe("sliderWindow", () => {
  it("normalizes the requested maximum", () => {
    expect(sliderWindowLimit(undefined, 8)).toBe(8);
    expect(sliderWindowLimit(4.8, 8)).toBe(4);
    expect(sliderWindowLimit(1, 8)).toBe(2);
    expect(sliderWindowLimit(0, 8)).toBe(2);
    expect(sliderWindowLimit(-4, 8)).toBe(2);
    expect(sliderWindowLimit(20, 8)).toBe(8);
    expect(sliderWindowLimit(1, 1)).toBe(1);
    expect(sliderWindowLimit(Number.NaN, 8)).toBe(8);
    expect(sliderWindowLimit(Number.POSITIVE_INFINITY, 8)).toBe(8);
  });

  it("moves forward only when the active page reaches the last item", () => {
    expect(
      shiftSliderWindow({
        active: 3,
        previous: 2,
        start: 0,
        total: 10,
        limit: 5,
        loop: false,
      }),
    ).toBe(0);
    expect(
      shiftSliderWindow({
        active: 4,
        previous: 3,
        start: 0,
        total: 10,
        limit: 5,
        loop: false,
      }),
    ).toBe(1);
  });

  it("moves back symmetrically and keeps one previous page", () => {
    expect(
      shiftSliderWindow({
        active: 1,
        previous: 2,
        start: 1,
        total: 10,
        limit: 5,
        loop: false,
      }),
    ).toBe(0);
  });

  it("places a direct jump with one page ahead", () => {
    expect(
      shiftSliderWindow({
        active: 8,
        previous: 1,
        start: 0,
        total: 12,
        limit: 5,
        loop: false,
      }),
    ).toBe(5);
    expect(sliderWindowPages(5, 12, 5, false)).toEqual([5, 6, 7, 8, 9]);
  });

  it("wraps a loop window without duplicating pages", () => {
    expect(sliderWindowPages(8, 10, 5, true)).toEqual([8, 9, 0, 1, 2]);
    expect(
      shiftSliderWindow({
        active: 0,
        previous: 9,
        start: 6,
        total: 10,
        limit: 5,
        loop: true,
      }),
    ).toBe(7);
  });
});
