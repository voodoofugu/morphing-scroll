import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { smoothScroll } from "@morphing-scroll/src/helpers/addFunctions";
import createTasks from "@morphing-scroll/src/helpers/createTasks";
import createSchedulerRAF from "@morphing-scroll/src/helpers/createSchedulerRAF";
import type { Vec2 } from "@morphing-scroll/src/types/types";

const MAX: Vec2 = [1000, 1000];

const makeEl = (scrollable = true) => {
  const el = document.createElement("div");
  document.body.appendChild(el);
  Object.defineProperty(el, "clientHeight", { value: 300, configurable: true });
  Object.defineProperty(el, "clientWidth", { value: 300, configurable: true });
  Object.defineProperty(el, "scrollHeight", {
    value: scrollable ? 2000 : 300,
    configurable: true,
  });
  Object.defineProperty(el, "scrollWidth", {
    value: scrollable ? 2000 : 300,
    configurable: true,
  });
  return el;
};

describe("smoothScroll", () => {
  let tasks: ReturnType<typeof createTasks>;
  let raf: ReturnType<typeof createSchedulerRAF>;

  beforeEach(() => {
    vi.useFakeTimers();
    tasks = createTasks();
    raf = createSchedulerRAF();
  });
  afterEach(() => {
    tasks.clear();
    raf.cancel();
    vi.useRealTimers();
    document.body.innerHTML = "";
  });

  /** advance frames while letting queued microtasks run */
  const runFrames = async (frames: number) => {
    for (let i = 0; i < frames; i++) {
      vi.advanceTimersToNextFrame();
      await Promise.resolve();
    }
  };

  it("jumps straight to the target when duration is null (first render)", async () => {
    const el = makeEl();
    const done = smoothScroll("y", el, null, 400, raf.schedule, MAX, tasks);
    await runFrames(3);
    await done;

    expect(el.scrollTop).toBe(400);
  });

  it("gives up waiting when the content never becomes scrollable", async () => {
    // jsdom-like case: props say there is room to scroll, the DOM disagrees.
    // The wait must be bounded instead of burning a rAF forever.
    const el = makeEl(false);
    let settled = false;
    smoothScroll("y", el, null, 400, raf.schedule, MAX, tasks).then(() => {
      settled = true;
    });

    await runFrames(90);

    expect(settled).toBe(true);
  });

  it("animates toward the target over the given duration", async () => {
    const el = makeEl();
    smoothScroll("y", el, 200, 500, raf.schedule, MAX, tasks);

    await runFrames(4);
    const partway = el.scrollTop;
    expect(partway).toBeGreaterThan(0);
    expect(partway).toBeLessThan(500);

    await runFrames(40);
    expect(el.scrollTop).toBe(500);
  });

  it("clamps the target to maxScrollSize", async () => {
    const el = makeEl();
    smoothScroll("y", el, 100, 99999, raf.schedule, MAX, tasks);
    await runFrames(40);

    expect(el.scrollTop).toBe(MAX[1]);
  });

  it("does nothing when already at the target", async () => {
    const el = makeEl();
    el.scrollTop = 250;
    smoothScroll("y", el, 100, 250, raf.schedule, MAX, tasks);
    await runFrames(10);

    expect(el.scrollTop).toBe(250);
  });

  it("drives the horizontal axis through scrollLeft", async () => {
    const el = makeEl();
    smoothScroll("x", el, 100, 300, raf.schedule, MAX, tasks);
    await runFrames(40);

    expect(el.scrollLeft).toBe(300);
    expect(el.scrollTop).toBe(0);
  });
});
