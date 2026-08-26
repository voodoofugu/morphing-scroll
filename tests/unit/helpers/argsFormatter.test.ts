import { describe, it, expect } from "vitest";
import argsFormatter from "@morphing-scroll/src/helpers/argsFormatter";

describe("argsFormatter", () => {
  describe("scalar input", () => {
    it("expands a number to four identical edges", () => {
      expect(argsFormatter(5)).toEqual([5, 5, 5, 5]);
    });
  });

  describe("2-tuple input [a, b]", () => {
    // A 2-tuple is treated as [vertical, horizontal] and expanded to
    // [top, right, bottom, left] = [b, a, b, a].
    it("maps [a, b] to [b, a, b, a]", () => {
      expect(argsFormatter([10, 20])).toEqual([20, 10, 20, 10]);
    });
  });

  describe("4-tuple input", () => {
    it("passes a 4-tuple through unchanged", () => {
      expect(argsFormatter([1, 2, 3, 4])).toEqual([1, 2, 3, 4]);
    });
  });

  describe("reverse flag", () => {
    it("swaps to [arr[1], arr[0], arr[3], arr[2]]", () => {
      // [10,20] -> [20,10,20,10] -> reversed -> [10,20,10,20]
      expect(argsFormatter([10, 20], true)).toEqual([10, 20, 10, 20]);
    });

    it("is a no-op for symmetric scalar input", () => {
      expect(argsFormatter(7, true)).toEqual([7, 7, 7, 7]);
    });
  });

  describe("itemsCount", () => {
    it("repeats edges modulo 4", () => {
      expect(argsFormatter([1, 2, 3, 4], false, 6)).toEqual([1, 2, 3, 4, 1, 2]);
    });

    it("truncates to fewer than 4 items", () => {
      expect(argsFormatter(5, false, 2)).toEqual([5, 5]);
    });
  });

  it("supports string values", () => {
    expect(argsFormatter("a")).toEqual(["a", "a", "a", "a"]);
  });
});
