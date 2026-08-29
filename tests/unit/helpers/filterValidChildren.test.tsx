import React from "react";
import { describe, it, expect } from "vitest";
import filterValidChildren from "@morphing-scroll/src/helpers/filterValidChildren";

describe("filterValidChildren", () => {
  it("drops null and undefined", () => {
    expect(filterValidChildren(null)).toEqual([]);
    expect(filterValidChildren(undefined)).toEqual([]);
  });

  it("keeps a valid element as a single-item array", () => {
    const el = <div key="a" />;
    const result = filterValidChildren(el);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(el);
  });

  it("flattens a fragment into its children", () => {
    const frag = (
      <>
        <div key="a" />
        <div key="b" />
      </>
    );
    const result = filterValidChildren(frag);
    expect(result).toHaveLength(2);
  });

  it("recursively flattens nested fragments", () => {
    const frag = (
      <>
        <div key="a" />
        <>
          <div key="b" />
          <div key="c" />
        </>
      </>
    );
    expect(filterValidChildren(frag)).toHaveLength(3);
  });

  it("keeps primitive (non-element) nodes", () => {
    expect(filterValidChildren("text")).toEqual(["text"]);
    expect(filterValidChildren(42)).toEqual([42]);
  });
});
