import React from "react";
import { describe, it, expect } from "vitest";
import stabilize from "@morphing-scroll/src/helpers/stabilize";

describe("stabilize", () => {
  it("returns one hash per argument", () => {
    expect(stabilize(1, "a", true)).toHaveLength(3);
  });

  it("hashes primitives to fixed sentinels", () => {
    // null=1, true=2, false=3, undefined=4
    expect(stabilize(null)[0]).toBe(1);
    expect(stabilize(true)[0]).toBe(2);
    expect(stabilize(false)[0]).toBe(3);
    expect(stabilize(undefined)[0]).toBe(4);
  });

  it("hashes all functions to the same sentinel (ref pattern)", () => {
    const a = () => 1;
    const b = (x: number) => x * 2;
    // Functions are deliberately treated as stable so callback props do not
    // invalidate memoization; they must be passed through refs instead.
    expect(stabilize(a)[0]).toBe(5);
    expect(stabilize(b)[0]).toBe(5);
  });

  it("hashes all React elements to the same sentinel", () => {
    expect(stabilize(<div />)[0]).toBe(6);
    expect(stabilize(<span key="x">hi</span>)[0]).toBe(6);
  });

  it("produces equal hashes for equal numbers and strings", () => {
    expect(stabilize(123)).toEqual(stabilize(123));
    expect(stabilize("hello")).toEqual(stabilize("hello"));
  });

  it("is independent of object key order", () => {
    expect(stabilize({ a: 1, b: 2 })).toEqual(stabilize({ b: 2, a: 1 }));
  });

  it("is independent of Set insertion order", () => {
    expect(stabilize(new Set([1, 2, 3]))).toEqual(
      stabilize(new Set([3, 1, 2])),
    );
  });

  it("distinguishes different arrays", () => {
    expect(stabilize([1, 2, 3])[0]).not.toBe(stabilize([3, 2, 1])[0]);
  });

  it("hashes nested structures deterministically", () => {
    const a = stabilize({ list: [1, 2], flag: true });
    const b = stabilize({ flag: true, list: [1, 2] });
    expect(a).toEqual(b);
  });
});
