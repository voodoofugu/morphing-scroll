import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import MorphScroll from "@morphing-scroll/src/components/MorphScroll";

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
