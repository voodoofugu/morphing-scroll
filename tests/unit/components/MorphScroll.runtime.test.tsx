import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";

/**
 * The rAF schedulers used to be built inside the render body, so every render
 * produced a fresh queue and a fresh rafId. Key-based deduplication then only
 * worked within a single render pass, and cleanup cancelled just the last
 * instance — animations started by earlier renders kept writing to scrollTop
 * in parallel with the new ones. They must be created once per component.
 */
const { schedulerSpy, loopSpy, tasksSpy } = vi.hoisted(() => ({
  schedulerSpy: vi.fn(),
  loopSpy: vi.fn(),
  tasksSpy: vi.fn(),
}));

vi.mock("@morphing-scroll/src/helpers/createSchedulerRAF", async (orig) => {
  const actual =
    await orig<typeof import("@morphing-scroll/src/helpers/createSchedulerRAF")>();
  return {
    default: () => {
      schedulerSpy();
      return actual.default();
    },
  };
});

vi.mock("@morphing-scroll/src/helpers/createRafLoop", async (orig) => {
  const actual =
    await orig<typeof import("@morphing-scroll/src/helpers/createRafLoop")>();
  return {
    default: () => {
      loopSpy();
      return actual.default();
    },
  };
});

vi.mock("@morphing-scroll/src/helpers/createTasks", async (orig) => {
  const actual =
    await orig<typeof import("@morphing-scroll/src/helpers/createTasks")>();
  return {
    default: () => {
      tasksSpy();
      return actual.default();
    },
  };
});

// imported after the mocks so MorphScroll picks them up
const MorphScroll = (
  await import("@morphing-scroll/src/components/MorphScroll")
).default;

const SIZE: [number, number] = [100, 300];

const items = (n: number) =>
  Array.from({ length: n }, (_, i) => <div key={`item-${i}`}>item {i}</div>);

const scroll = (height: number) => (
  <MorphScroll size={[100, height]} objectsSize={100}>
    {items(20)}
  </MorphScroll>
);

describe("MorphScroll runtime — created once per instance", () => {
  beforeEach(() => {
    schedulerSpy.mockClear();
    loopSpy.mockClear();
    tasksSpy.mockClear();
  });

  it("builds exactly one runtime per mount", () => {
    render(scroll(SIZE[1]));

    // triggerUpdate batching + scroll animation
    expect(schedulerSpy).toHaveBeenCalledTimes(2);
    expect(tasksSpy).toHaveBeenCalledTimes(1);
    expect(loopSpy).toHaveBeenCalledTimes(1); // overscroll back animation
  });

  it("does not rebuild the runtime on re-render", () => {
    const { rerender } = render(scroll(300));
    schedulerSpy.mockClear();
    loopSpy.mockClear();
    tasksSpy.mockClear();

    rerender(scroll(320));
    rerender(scroll(340));
    rerender(scroll(360));

    expect(schedulerSpy).not.toHaveBeenCalled();
    expect(tasksSpy).not.toHaveBeenCalled();
    expect(loopSpy).not.toHaveBeenCalled();
  });

  it("gives every instance its own runtime", () => {
    render(
      <>
        {scroll(300)}
        {scroll(300)}
      </>,
    );

    expect(schedulerSpy).toHaveBeenCalledTimes(4);
    expect(tasksSpy).toHaveBeenCalledTimes(2);
    expect(loopSpy).toHaveBeenCalledTimes(2);
  });
});
