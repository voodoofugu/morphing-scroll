import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, fireEvent, act } from "@testing-library/react";
import MorphScroll from "@morphing-scroll/src/components/MorphScroll";

const items = (n: number, prefix: string) =>
  Array.from({ length: n }, (_, i) => (
    <div key={`${prefix}-${i}`}>item {i}</div>
  ));

/** an outer scroll whose content holds a second, smaller one */
const nested = (
  <MorphScroll objects={{ size: 200 }} size={[200, 400]}>
    <div key="head">head</div>
    <MorphScroll objects={{ size: 100 }} key="inner" size={[200, 200]}>
      {items(20, "inner")}
    </MorphScroll>
    {items(10, "outer")}
  </MorphScroll>
);

const mount = () => {
  const utils = render(nested);
  const [outer, inner] = Array.from(
    utils.container.querySelectorAll<HTMLElement>(".ms-viewport"),
  );
  const roots = Array.from(
    utils.container.querySelectorAll<HTMLElement>("[morph-scroll]"),
  );
  return { ...utils, outer, inner, outerRoot: roots[0] };
};

const wheel = (el: HTMLElement, deltaY: number) => {
  act(() => {
    fireEvent.wheel(el, { deltaY });
  });
  act(() => {
    for (let i = 0; i < 40; i++) vi.advanceTimersToNextFrame();
  });
};

describe("MorphScroll — nested scrolls", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("gives the wheel to the innermost scroll only", () => {
    const { outer, inner } = mount();

    wheel(inner, 200);

    expect(inner.scrollTop).toBeGreaterThan(0);
    expect(outer.scrollTop).toBe(0);
  });

  it("still scrolls the outer one when the pointer is over its own content", () => {
    const { outer, inner } = mount();

    wheel(outer, 200);

    expect(outer.scrollTop).toBeGreaterThan(0);
    expect(inner.scrollTop).toBe(0);
  });

  it("lets a running outer scroll keep the wheel", () => {
    // flicking through a page should not get caught by a list on the way past
    const { outer, inner, outerRoot } = mount();

    outerRoot.setAttribute("ms-scrolling", "");
    wheel(inner, 200);

    expect(inner.scrollTop).toBe(0);
    expect(outer.scrollTop).toBeGreaterThan(0);
  });

  it("marks the root while a scroll is running", () => {
    const { outer, outerRoot } = mount();

    act(() => {
      fireEvent.scroll(outer, { target: { scrollTop: 50 } });
    });
    expect(outerRoot.hasAttribute("ms-scrolling")).toBe(true);

    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(outerRoot.hasAttribute("ms-scrolling")).toBe(false);
  });
});
