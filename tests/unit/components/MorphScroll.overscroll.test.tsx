import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, act } from "@testing-library/react";
import MorphScroll from "@morphing-scroll/src/components/MorphScroll";

import { stubLayout, pointer, drag } from "../../helpers/dom";

const OBJ = 100;
const COUNT = 20;
const VIEW = 300;

const items = () =>
  Array.from({ length: COUNT }, (_, i) => <div key={`item-${i}`}>item {i}</div>);

/**
 * `maxScrollSize` is computed from props (objectsSize x count - size) while
 * the offset the element can actually reach comes from the DOM. They drift
 * apart on fractional sizes or when CSS squeezes the content, and then the
 * scroll saturates before the code thinks the edge was reached — the
 * rubber-band never engages.
 */
const mount = (realScrollWidth: number) => {
  const utils = render(
    <MorphScroll objects={{ size: OBJ }}
      size={[VIEW, 100]}
      direction="x"
      controls={{ drag: true }}
    >
      {items()}
    </MorphScroll>,
  );
  const el = utils.container.querySelector<HTMLElement>(".ms-viewport")!;
  stubLayout(el, {
    clientWidth: VIEW,
    clientHeight: 100,
    scrollWidth: realScrollWidth,
    scrollHeight: 100,
  });
  const wrapper = utils.container.querySelector<HTMLElement>(
    ".ms-objects-wrapper",
  )!;
  return { ...utils, el, wrapper };
};

/** sit at the far end, then keep dragging left */
const dragPastRightEdge = (el: HTMLElement) => {
  el.scrollLeft = 99999; // clamps to whatever the element can actually reach

  drag(el, [
    [280, 50],
    [270, 50],
    [200, 50],
    [120, 50],
    [40, 50],
  ]);

  // the overscroll offset reaches the DOM through a batched rAF update
  act(() => {
    vi.advanceTimersToNextFrame();
  });
};

const overscrollX = (wrapper: HTMLElement) => {
  const match = /translate\((-?[\d.]+)px/.exec(wrapper.style.transform);
  return match ? Number(match[1]) : 0;
};

describe("MorphScroll — rubber band at the horizontal end", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("engages when the props and the DOM agree on the maximum", () => {
    const { el, wrapper } = mount(COUNT * OBJ); // 2000, max 1700
    dragPastRightEdge(el);

    expect(el.scrollLeft).toBe(COUNT * OBJ - VIEW);
    expect(overscrollX(wrapper)).toBeLessThan(0);

    pointer("pointerup", 0, 50, document);
  });

  it("engages when the DOM stops short of the computed maximum", () => {
    // CSS squeezed the content: the element only reaches 1600, not 1700
    const { el, wrapper } = mount(1900);
    dragPastRightEdge(el);

    expect(el.scrollLeft).toBe(1900 - VIEW);
    expect(overscrollX(wrapper)).toBeLessThan(0);

    pointer("pointerup", 0, 50, document);
  });
});
