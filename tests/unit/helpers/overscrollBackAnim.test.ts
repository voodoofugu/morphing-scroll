import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  overscrollBackAnim,
  overscrollLimit,
  overscrollMomentumAnim,
  stopOverscrollBackAnim,
} from "@morphing-scroll/src/helpers/overscrollBackAnim";
import createRafLoop from "@morphing-scroll/src/helpers/createRafLoop";
import CONST from "@morphing-scroll/src/constants";

describe("overscrollBackAnim", () => {
  // петля создаётся на инстанс скролла, поэтому и в тестах она своя
  let loop: ReturnType<typeof createRafLoop>;

  beforeEach(() => {
    loop = createRafLoop();
    vi.useFakeTimers();
  });
  afterEach(() => {
    stopOverscrollBackAnim(loop);
    vi.useRealTimers();
  });

  const advance = (frames: number) => {
    for (let i = 0; i < frames; i++) vi.advanceTimersToNextFrame();
  };

  it("relaxes the overscroll value back to 0 and notifies via updater", () => {
    const updater = vi.fn();

    overscrollBackAnim(loop, "x", 100, updater);
    // OVERSCROLL_BACK_DURATION ms worth of frames, plus slack
    advance(Math.ceil(CONST.OVERSCROLL_BACK_DURATION / 16) + 5);

    expect(updater).toHaveBeenLastCalledWith(0);
    expect(updater).toHaveBeenCalled();
  });

  it("returns quickly, then eases into 0 instead of moving linearly", () => {
    const updater = vi.fn();

    overscrollBackAnim(loop, "x", 100, updater);
    advance(Math.floor(CONST.OVERSCROLL_BACK_DURATION / 16 / 2));

    const value = updater.mock.lastCall![0];
    expect(value).toBeGreaterThan(0);
    // halfway through, linear motion would still be close to 50
    expect(value).toBeLessThan(30);
  });

  it("stopOverscrollBackAnim halts the animation", () => {
    const updater = vi.fn();

    overscrollBackAnim(loop, "x", 100, updater);
    advance(1);
    stopOverscrollBackAnim(loop);
    const frozen = updater.mock.lastCall![0];
    updater.mockClear();

    advance(10);

    expect(frozen).toBeLessThan(100);
    expect(updater).not.toHaveBeenCalled();
  });

  it("animates the y axis independently", () => {
    const updater = vi.fn();

    overscrollBackAnim(loop, "y", -80, updater);
    advance(Math.ceil(CONST.OVERSCROLL_BACK_DURATION / 16) + 5);

    expect(updater).toHaveBeenLastCalledWith(0);
  });

  it("turns edge momentum into one outward pull and returns to zero", () => {
    const updater = vi.fn();

    overscrollMomentumAnim(loop, "y", -4, -1.2, 180, updater);
    advance(120);

    const values = updater.mock.calls.map(([value]) => value as number);
    expect(Math.min(...values)).toBeLessThan(-4);
    expect(Math.max(...values)).toBe(0);
    expect(values.length).toBeGreaterThan(2);
    expect(updater).toHaveBeenLastCalledWith(0);
    expect(values.every((value) => value <= 0)).toBe(true);
  });

  it("scales the limit with the viewport but keeps safe bounds", () => {
    expect(overscrollLimit(200)).toBe(CONST.BOUNCE_MIN_OVERSCROLL);
    expect(overscrollLimit(780)).toBeCloseTo(187.2);
    expect(overscrollLimit(2000)).toBe(CONST.BOUNCE_MAX_OVERSCROLL);
  });
});
