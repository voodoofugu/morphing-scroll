import { describe, it, expect } from "vitest";
import createScrollDirTracker from "@morphing-scroll/src/helpers/createScrollDirTracker";

describe("createScrollDirTracker", () => {
  it("starts with null directions", () => {
    const t = createScrollDirTracker();
    expect(t.get()).toEqual({ x: null, y: null });
  });

  it("detects rightward/downward motion past the threshold", () => {
    const t = createScrollDirTracker();
    t.update(10, 10);
    expect(t.get()).toEqual({ x: "right", y: "down" });
  });

  it("detects leftward/upward motion", () => {
    const t = createScrollDirTracker();
    t.update(100, 100); // establish position
    t.update(50, 50);
    expect(t.get()).toEqual({ x: "left", y: "up" });
  });

  it("ignores movement within the threshold", () => {
    const t = createScrollDirTracker(2);
    t.update(2, 2); // |delta| = 2, not > 2
    expect(t.get()).toEqual({ x: null, y: null });
  });

  it("respects a custom threshold", () => {
    const t = createScrollDirTracker(10);
    t.update(5, 5);
    expect(t.get()).toEqual({ x: null, y: null });
    t.update(20, 20);
    expect(t.get()).toEqual({ x: "right", y: "down" });
  });

  it("reset clears directions", () => {
    const t = createScrollDirTracker();
    t.update(10, 10);
    t.reset();
    expect(t.get()).toEqual({ x: null, y: null });
  });

  it("tracks axes independently", () => {
    const t = createScrollDirTracker();
    t.update(10, 0); // only x moves
    expect(t.get()).toEqual({ x: "right", y: null });
  });
});
