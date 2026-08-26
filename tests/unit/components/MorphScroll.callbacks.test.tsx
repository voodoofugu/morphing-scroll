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
  c.querySelector<HTMLElement>(".ms-element")!;

describe("MorphScroll — isScrolling", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("reports the start and the end of a scroll burst exactly once", () => {
    const isScrolling = vi.fn();
    const { container } = render(
      <MorphScroll size={SIZE} objectsSize={OBJ} isScrolling={isScrolling}>
        {items(20)}
      </MorphScroll>,
    );
    const el = scrollElement(container);
    isScrolling.mockClear();

    // one continuous gesture produces a stream of scroll events
    for (const top of [20, 40, 60, 80, 100])
      act(() => {
        fireEvent.scroll(el, { target: { scrollTop: top } });
      });

    expect(isScrolling.mock.calls).toEqual([[true]]);

    act(() => {
      vi.advanceTimersByTime(CONST.SCROLL_END_DELAY + 50);
    });

    expect(isScrolling.mock.calls).toEqual([[true], [false]]);
  });

  it("reports a fresh start after the previous burst ended", () => {
    const isScrolling = vi.fn();
    const { container } = render(
      <MorphScroll size={SIZE} objectsSize={OBJ} isScrolling={isScrolling}>
        {items(20)}
      </MorphScroll>,
    );
    const el = scrollElement(container);
    isScrolling.mockClear();

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

    expect(isScrolling.mock.calls).toEqual([
      [true],
      [false],
      [true],
      [false],
    ]);
  });
});

describe("MorphScroll — onScrollValue", () => {
  it("reports the current offsets on every scroll event", () => {
    const onScrollValue = vi.fn();
    const { container } = render(
      <MorphScroll size={SIZE} objectsSize={OBJ} onScrollValue={onScrollValue}>
        {items(20)}
      </MorphScroll>,
    );
    const el = scrollElement(container);
    onScrollValue.mockClear();

    fireEvent.scroll(el, { target: { scrollTop: 120 } });
    expect(onScrollValue).toHaveBeenLastCalledWith(0, 120);

    fireEvent.scroll(el, { target: { scrollLeft: 45, scrollTop: 120 } });
    expect(onScrollValue).toHaveBeenLastCalledWith(45, 120);
  });
});
