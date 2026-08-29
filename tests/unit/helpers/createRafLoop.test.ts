import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import createRafLoop from "@morphing-scroll/src/helpers/createRafLoop";

describe("createRafLoop", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("runs a task each frame until it returns false", () => {
    const loop = createRafLoop();
    let ticks = 0;
    loop.start(() => {
      ticks++;
      return ticks < 3; // continue for 3 frames
    });

    vi.advanceTimersToNextFrame(); // tick 1
    vi.advanceTimersToNextFrame(); // tick 2
    vi.advanceTimersToNextFrame(); // tick 3 -> returns false
    vi.advanceTimersToNextFrame(); // should not run again

    expect(ticks).toBe(3);
    expect(loop.isRunning()).toBe(false);
  });

  it("removes a one-shot task and reports isRunning correctly", () => {
    const loop = createRafLoop();
    const id = loop.start(() => false, "one-shot");
    expect(loop.isRunning("one-shot")).toBe(true);

    vi.advanceTimersToNextFrame();

    expect(loop.isRunning(id)).toBe(false);
  });

  it("replaces a task registered with the same custom id", () => {
    const loop = createRafLoop();
    const a = vi.fn(() => false);
    const b = vi.fn(() => false);

    loop.start(a, "dup");
    loop.start(b, "dup"); // replaces a
    vi.advanceTimersToNextFrame();

    expect(a).not.toHaveBeenCalled();
    expect(b).toHaveBeenCalledTimes(1);
  });

  it("stop(id) cancels a specific task", () => {
    const loop = createRafLoop();
    const fn = vi.fn(() => true);
    loop.start(fn, "keep-going");

    loop.stop("keep-going");
    vi.advanceTimersToNextFrame();

    expect(fn).not.toHaveBeenCalled();
    expect(loop.isRunning()).toBe(false);
  });

  it("stop() with no id clears every task", () => {
    const loop = createRafLoop();
    loop.start(() => true, "a");
    loop.start(() => true, "b");

    loop.stop();

    expect(loop.isRunning()).toBe(false);
  });
});
