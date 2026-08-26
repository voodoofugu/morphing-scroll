import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, fireEvent, act } from "@testing-library/react";
import MorphScroll from "@morphing-scroll/src/components/MorphScroll";
import CONST from "@morphing-scroll/src/constants";

const OBJ = 100;
const VIEW = 300;

const items = (n: number) =>
  Array.from({ length: n }, (_, i) => <div key={`item-${i}`}>item {i}</div>);

const withBar = (count: number) => (
  <MorphScroll
    size={[100, VIEW]}
    objectsSize={OBJ}
    progressTrigger={{ wheel: true, progressElement: <div className="knob" /> }}
  >
    {items(count)}
  </MorphScroll>
);

describe("ScrollBar — wheel over the bar", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  const settle = (frames = 60) => {
    for (let i = 0; i < frames; i++) vi.advanceTimersToNextFrame();
  };

  it("scrolls the content when the wheel is used over the bar", () => {
    const { container } = render(withBar(20));
    const bar = container.querySelector<HTMLElement>(".ms-bar")!;
    const el = container.querySelector<HTMLElement>(".ms-element")!;

    fireEvent.wheel(bar, { deltaY: 200 });
    settle();

    expect(el.scrollTop).toBe(200);
  });

  it("follows the new scroll range after the child count changes", () => {
    // 5 items -> max scroll 200; 20 items -> max scroll 1700
    const { container, rerender } = render(withBar(5));
    const bar = container.querySelector<HTMLElement>(".ms-bar")!;
    const el = container.querySelector<HTMLElement>(".ms-element")!;

    rerender(withBar(20));

    fireEvent.wheel(bar, { deltaY: 5000 });
    settle();

    expect(el.scrollTop).toBe(20 * OBJ - VIEW);
  });
});

describe("ScrollBar — scrollBarOnHover", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  const onHover = (
    <MorphScroll
      size={[100, VIEW]}
      objectsSize={OBJ}
      scrollBarOnHover
      progressTrigger={{ wheel: true, progressElement: <div className="knob" /> }}
    >
      {items(20)}
    </MorphScroll>
  );

  const visibility = (bar: HTMLElement) =>
    bar.style.getPropertyValue("--ms-bar-visibility");

  it("reports visibility through a CSS variable, not inline opacity", () => {
    const { container } = render(onHover);
    const bar = container.querySelector<HTMLElement>(".ms-bar")!;

    expect(visibility(bar)).toBe("0");
    expect(bar.style.opacity).toBe("");
  });

  it("sets no variable when the prop is off", () => {
    const { container } = render(withBar(20));
    const bar = container.querySelector<HTMLElement>(".ms-bar")!;

    expect(visibility(bar)).toBe("");
    expect(bar.style.opacity).toBe("");
  });

  it("moves the variable and the state classes across a scroll", () => {
    const { container } = render(onHover);
    const bar = container.querySelector<HTMLElement>(".ms-bar")!;
    const el = container.querySelector<HTMLElement>(".ms-element")!;

    act(() => {
      fireEvent.scroll(el, { target: { scrollTop: 100 } });
    });

    expect(visibility(bar)).toBe("1");
    expect(bar).toHaveClass("ms-hover");

    // scroll-end delay, then the extra pause before the bar hides
    act(() => {
      vi.advanceTimersByTime(CONST.SCROLL_END_DELAY + 1050);
    });

    expect(visibility(bar)).toBe("0");
    expect(bar).toHaveClass("ms-leave");

    // ms-leave is a transition marker and clears itself
    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(bar).not.toHaveClass("ms-leave");
    expect(bar).not.toHaveClass("ms-hover");
  });

  it("never uses the unprefixed hover/leave classes", () => {
    const { container } = render(onHover);
    const el = container.querySelector<HTMLElement>(".ms-element")!;

    act(() => {
      fireEvent.scroll(el, { target: { scrollTop: 100 } });
    });

    expect(container.querySelector(".ms-bar.hover")).toBeNull();
    expect(container.querySelector(".ms-bar.leave")).toBeNull();
  });
});
