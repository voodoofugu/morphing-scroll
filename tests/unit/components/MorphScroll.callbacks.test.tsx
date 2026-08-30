import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, fireEvent, act } from "@testing-library/react";
import MorphScroll from "@morphing-scroll/src/components/MorphScroll";
import CONST from "@morphing-scroll/src/constants";

const SIZE: [number, number] = [100, 300];
const OBJ = 100;

const items = (n: number) =>
  Array.from({ length: n }, (_, i) => <div key={`item-${i}`}>item {i}</div>);

const scrollElement = (c: HTMLElement) =>
  c.querySelector<HTMLElement>(".ms-viewport")!;

describe("MorphScroll — onScrollingChange", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("reports the start and the end of a scroll burst exactly once", () => {
    const onScrollingChange = vi.fn();
    const { container } = render(
      <MorphScroll objects={{ size: OBJ }} size={SIZE} onScrollingChange={onScrollingChange}>
        {items(20)}
      </MorphScroll>,
    );
    const el = scrollElement(container);
    onScrollingChange.mockClear();

    // one continuous gesture produces a stream of scroll events
    for (const top of [20, 40, 60, 80, 100])
      act(() => {
        fireEvent.scroll(el, { target: { scrollTop: top } });
      });

    expect(onScrollingChange.mock.calls).toEqual([[true]]);

    act(() => {
      vi.advanceTimersByTime(CONST.SCROLL_END_DELAY + 50);
    });

    expect(onScrollingChange.mock.calls).toEqual([[true], [false]]);
  });

  it("reports a fresh start after the previous burst ended", () => {
    const onScrollingChange = vi.fn();
    const { container } = render(
      <MorphScroll objects={{ size: OBJ }} size={SIZE} onScrollingChange={onScrollingChange}>
        {items(20)}
      </MorphScroll>,
    );
    const el = scrollElement(container);
    onScrollingChange.mockClear();

    const burst = (from: number) => {
      for (const step of [0, 20])
        act(() => {
          fireEvent.scroll(el, { target: { scrollTop: from + step } });
        });
      act(() => {
        vi.advanceTimersByTime(CONST.SCROLL_END_DELAY + 50);
      });
    };

    burst(20);
    burst(200);

    expect(onScrollingChange.mock.calls).toEqual([
      [true],
      [false],
      [true],
      [false],
    ]);
  });
});

describe("MorphScroll — onScrollPosition", () => {
  it("reports the current offsets on every scroll event", () => {
    const onScrollPosition = vi.fn();
    const { container } = render(
      <MorphScroll objects={{ size: OBJ }} size={SIZE} onScrollPosition={onScrollPosition}>
        {items(20)}
      </MorphScroll>,
    );
    const el = scrollElement(container);
    onScrollPosition.mockClear();

    fireEvent.scroll(el, { target: { scrollTop: 120 } });
    expect(onScrollPosition).toHaveBeenLastCalledWith(0, 120);

    fireEvent.scroll(el, { target: { scrollLeft: 45, scrollTop: 120 } });
    expect(onScrollPosition).toHaveBeenLastCalledWith(45, 120);
  });
});
