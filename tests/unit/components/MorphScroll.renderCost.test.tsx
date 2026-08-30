import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, fireEvent, act } from "@testing-library/react";
import MorphScroll from "@morphing-scroll/src/components/MorphScroll";

/**
 * Scroll position drives render here: a scroll event schedules one batched
 * rAF update. That is cheap only as long as it stays batched — one commit per
 * animation frame, nothing while idle, and no re-render of the user's own
 * children. These pin that; losing any of them turns scrolling into a render
 * storm without any test going red otherwise.
 */

let childRenders = 0;
const Child = ({ i }: { i: number }) => {
  childRenders++;
  return <div>item {i}</div>;
};

const items = (n: number) =>
  Array.from({ length: n }, (_, i) => <Child key={`item-${i}`} i={i} />);

const tree = (
  <MorphScroll objects={{ size: 100 }}
    size={[100, 300]}
    render="virtual"
    progressTrigger={{ wheel: true, bar: <div /> }}
  >
    {items(50)}
  </MorphScroll>
);

const mount = () => {
  let commits = 0;
  const utils = render(
    <React.Profiler id="ms" onRender={() => commits++}>
      {tree}
    </React.Profiler>,
  );
  return {
    ...utils,
    el: utils.container.querySelector<HTMLElement>(".ms-viewport")!,
    commits: () => commits,
    reset: () => {
      commits = 0;
      childRenders = 0;
    },
  };
};

const scrollTo = (el: HTMLElement, top: number) =>
  act(() => {
    fireEvent.scroll(el, { target: { scrollTop: top } });
  });

const frame = () =>
  act(() => {
    vi.advanceTimersToNextFrame();
  });

describe("MorphScroll — render cost", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    childRenders = 0;
  });
  afterEach(() => vi.useRealTimers());

  it("batches every scroll event within a frame into one commit", () => {
    const s = mount();
    s.reset();

    for (let i = 1; i <= 8; i++) scrollTo(s.el, i * 10);
    expect(s.commits()).toBe(0); // nothing until the frame runs

    frame();
    expect(s.commits()).toBe(1);
  });

  it("commits once per frame over a scroll burst", () => {
    const s = mount();
    s.reset();

    for (let i = 1; i <= 10; i++) {
      scrollTo(s.el, i * 10);
      frame();
    }

    expect(s.commits()).toBe(10);
  });

  it("goes quiet once scrolling stops", () => {
    const s = mount();
    scrollTo(s.el, 100);
    frame();
    s.reset();

    act(() => {
      for (let i = 0; i < 30; i++) vi.advanceTimersToNextFrame();
    });
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    // only the scroll-end task, nothing per-frame
    expect(s.commits()).toBeLessThanOrEqual(1);
  });

  it("does not re-render children that stay in view", () => {
    const s = mount();
    // a fourth item peeks in once 5% of it is on screen; settle that first so
    // the window is stable for the rest of the burst
    scrollTo(s.el, 5);
    frame();
    s.reset();

    for (let i = 6; i <= 14; i++) {
      scrollTo(s.el, i);
      frame();
    }

    expect(childRenders).toBe(0);
  });

  it("renders each newly visible child exactly once", () => {
    const s = mount();
    s.reset();

    scrollTo(s.el, 400); // window moves off items 0..2 onto 4..6
    frame();

    const firstPass = childRenders;
    expect(firstPass).toBeGreaterThan(0);

    // staying put must not re-render them
    frame();
    frame();
    expect(childRenders).toBe(firstPass);
  });
});
