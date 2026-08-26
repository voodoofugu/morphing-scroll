import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import createSchedulerRAF from "@morphing-scroll/src/helpers/createSchedulerRAF";

describe("createSchedulerRAF", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("batches multiple keyed tasks into a single frame", () => {
    const raf = createSchedulerRAF();
    const a = vi.fn();
    const b = vi.fn();

    raf.schedule("a", a);
    raf.schedule("b", b);
    expect(a).not.toHaveBeenCalled();

    vi.advanceTimersToNextFrame();

    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);
  });

  it("dedupes by key, keeping only the latest task", () => {
    const raf = createSchedulerRAF();
    const first = vi.fn();
    const second = vi.fn();

    raf.schedule("same", first);
    raf.schedule("same", second);
    vi.advanceTimersToNextFrame();

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it("cancel prevents queued tasks from running", () => {
    const raf = createSchedulerRAF();
    const fn = vi.fn();

    raf.schedule("x", fn);
    raf.cancel();
    vi.advanceTimersToNextFrame();

    expect(fn).not.toHaveBeenCalled();
  });

  it("re-arms for a new frame after flushing", () => {
    const raf = createSchedulerRAF();
    const fn = vi.fn();

    raf.schedule("x", fn);
    vi.advanceTimersToNextFrame();
    raf.schedule("x", fn);
    vi.advanceTimersToNextFrame();

    expect(fn).toHaveBeenCalledTimes(2);
  });
});
