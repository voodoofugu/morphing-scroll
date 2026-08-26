import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  overscrollBackAnim,
  stopOverscrollBackAnim,
} from "@morphing-scroll/src/helpers/overscrollBackAnim";
import CONST from "@morphing-scroll/src/constants";

describe("overscrollBackAnim", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    stopOverscrollBackAnim();
    vi.useRealTimers();
  });

  const advance = (frames: number) => {
    for (let i = 0; i < frames; i++) vi.advanceTimersToNextFrame();
  };

  it("relaxes the overscroll value back to 0 and notifies via updater", () => {
    const ref = { current: { x: 100, y: 0 } };
    const updater = vi.fn();

    overscrollBackAnim(ref as any, "x", updater);
    // OVERSCROLL_BACK_DURATION ms worth of frames, plus slack
    advance(Math.ceil(CONST.OVERSCROLL_BACK_DURATION / 16) + 5);

    expect(ref.current.x).toBe(0);
    expect(updater).toHaveBeenCalled();
  });

  it("eases toward 0 (partway value is between start and 0)", () => {
    const ref = { current: { x: 100, y: 0 } };
    const updater = vi.fn();

    overscrollBackAnim(ref as any, "x", updater);
    advance(2); // a couple of frames in

    expect(ref.current.x).toBeGreaterThan(0);
    expect(ref.current.x).toBeLessThan(100);
  });

  it("stopOverscrollBackAnim halts the animation", () => {
    const ref = { current: { x: 100, y: 0 } };
    const updater = vi.fn();

    overscrollBackAnim(ref as any, "x", updater);
    advance(1);
    stopOverscrollBackAnim();
    const frozen = ref.current.x;
    updater.mockClear();

    advance(10);

    expect(ref.current.x).toBe(frozen); // no further change
    expect(updater).not.toHaveBeenCalled();
  });

  it("animates the y axis independently", () => {
    const ref = { current: { x: 0, y: -80 } };
    const updater = vi.fn();

    overscrollBackAnim(ref as any, "y", updater);
    advance(Math.ceil(CONST.OVERSCROLL_BACK_DURATION / 16) + 5);

    expect(ref.current.y).toBe(0);
  });
});
