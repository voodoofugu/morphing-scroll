import { describe, it, expect, vi, afterEach } from "vitest";
import startInertiaScroll from "@morphing-scroll/src/helpers/startInertiaScroll";

type FakeEl = {
  scrollTop: number;
  scrollLeft: number;
  scrollHeight: number;
  clientHeight: number;
  scrollWidth: number;
  clientWidth: number;
};

const makeEl = (over: Partial<FakeEl> = {}): FakeEl => ({
  scrollTop: 0,
  scrollLeft: 0,
  scrollHeight: 1000,
  clientHeight: 300,
  scrollWidth: 1000,
  clientWidth: 300,
  ...over,
});

// Drive the rAF-based integrator with a controllable clock.
const run = (
  el: FakeEl,
  axis: "x" | "y",
  velocity: number,
  frameMs = 16,
  maxIter = 2000,
) => {
  let now = 0;
  const nowSpy = vi.spyOn(performance, "now").mockImplementation(() => now);
  let scheduled: (() => void) | null = null;
  const rafSchedule = (_key: string, fn: () => void) => {
    scheduled = fn;
  };

  startInertiaScroll({
    el: el as unknown as HTMLDivElement,
    axis,
    velocity,
    rafSchedule,
  });

  let iterations = 0;
  while (scheduled && iterations < maxIter) {
    const fn = scheduled;
    scheduled = null;
    now += frameMs;
    fn();
    iterations++;
  }
  nowSpy.mockRestore();
  return iterations;
};

afterEach(() => vi.restoreAllMocks());

describe("startInertiaScroll", () => {
  it("glides the scroll position in the direction of a positive velocity", () => {
    const el = makeEl({ scrollTop: 0 });
    run(el, "y", 1);
    expect(el.scrollTop).toBeGreaterThan(0);
  });

  it("glides upward for a negative velocity", () => {
    const el = makeEl({ scrollTop: 700 });
    run(el, "y", -1);
    expect(el.scrollTop).toBeLessThan(700);
  });

  it("never exceeds the max scroll bound", () => {
    const el = makeEl({ scrollTop: 0 });
    run(el, "y", 5); // large velocity
    expect(el.scrollTop).toBeLessThanOrEqual(700); // scrollHeight - clientHeight
    expect(el.scrollTop).toBeGreaterThanOrEqual(0);
  });

  it("terminates (velocity decays below the stop threshold)", () => {
    const el = makeEl({ scrollTop: 0 });
    const iterations = run(el, "y", 1);
    expect(iterations).toBeGreaterThan(0);
    expect(iterations).toBeLessThan(2000);
  });

  it("does not move when there is no scrollable range", () => {
    const el = makeEl({ scrollTop: 0, scrollHeight: 300, clientHeight: 300 });
    const iterations = run(el, "y", 2);
    expect(el.scrollTop).toBe(0);
    expect(iterations).toBeLessThan(2000); // still terminates
  });

  it("operates on scrollLeft for the x axis", () => {
    const el = makeEl({ scrollLeft: 0 });
    run(el, "x", 1);
    expect(el.scrollLeft).toBeGreaterThan(0);
    expect(el.scrollTop).toBe(0);
  });
});
