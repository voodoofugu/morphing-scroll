import { describe, it, expect } from "vitest";
import {
  getStyleAlign,
  getWrapperMinSizeStyle,
  getWrapperAlignStyle,
} from "@morphing-scroll/src/helpers/addFunctions";

describe("getStyleAlign", () => {
  it("maps align keywords to flexbox values", () => {
    expect(getStyleAlign("start")).toBe("flex-start");
    expect(getStyleAlign("center")).toBe("center");
    expect(getStyleAlign("end")).toBe("flex-end");
  });

  it("returns undefined when no align given", () => {
    expect(getStyleAlign(undefined)).toBeUndefined();
  });
});

describe("getWrapperMinSizeStyle", () => {
  it("sets minHeight for vertical direction with a numeric value", () => {
    expect(getWrapperMinSizeStyle(100, "y", [200, 300], 10, 20)).toEqual({
      minHeight: "100px",
    });
  });

  it("sets minWidth for horizontal direction with a numeric value", () => {
    expect(getWrapperMinSizeStyle(100, "x", [200, 300], 10, 20)).toEqual({
      minWidth: "100px",
    });
  });

  it("resolves 'full' to size minus margin on the y axis", () => {
    // sizeLocal[1] (300) - mLocalY (20) = 280
    expect(getWrapperMinSizeStyle("full", "y", [200, 300], 10, 20)).toEqual({
      minHeight: "280px",
    });
  });

  it("resolves 'full' to size minus margin on the x axis", () => {
    // sizeLocal[0] (200) - mLocalX (10) = 190
    expect(getWrapperMinSizeStyle("full", "x", [200, 300], 10, 20)).toEqual({
      minWidth: "190px",
    });
  });

  it("handles a hybrid array with mixed number/'full'", () => {
    expect(
      getWrapperMinSizeStyle([100, "full"], "hybrid", [200, 300], 10, 20),
    ).toEqual({ minWidth: "100px", minHeight: "280px" });
  });

  it("applies a single value to both axes in hybrid", () => {
    expect(getWrapperMinSizeStyle(50, "hybrid", [200, 300], 10, 20)).toEqual({
      minWidth: "50px",
      minHeight: "50px",
    });
  });
});

describe("getWrapperAlignStyle", () => {
  it("always sets display:flex", () => {
    expect(getWrapperAlignStyle("center", [50, 50], 100, 100)).toEqual({
      display: "flex",
    });
  });

  it("aligns on both axes when the viewport exceeds the content", () => {
    // Note: the first align token drives justifyContent, the second alignItems.
    expect(getWrapperAlignStyle("center", [300, 300], 100, 100)).toEqual({
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
    });
  });

  it("supports a per-axis [main, cross] tuple", () => {
    expect(getWrapperAlignStyle(["start", "end"], [300, 300], 100, 100)).toEqual(
      {
        display: "flex",
        justifyContent: "flex-start",
        alignItems: "flex-end",
      },
    );
  });

  it("only aligns the axis whose viewport exceeds content", () => {
    // width 300 > wrapW 100 -> justifyContent; height 50 < wrapH 100 -> no alignItems
    expect(getWrapperAlignStyle("end", [300, 50], 100, 100)).toEqual({
      display: "flex",
      justifyContent: "flex-end",
    });
  });
});
