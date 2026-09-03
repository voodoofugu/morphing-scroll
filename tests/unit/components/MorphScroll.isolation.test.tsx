import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, fireEvent, act } from "@testing-library/react";
import MorphScroll from "@morphing-scroll/src/components/MorphScroll";

import CONST from "@morphing-scroll/src/constants";
import { stubLayout, pointer, drag, cursorLock } from "../../helpers/dom";

/**
 * Tier 2: instance isolation.
 *
 * Everything here fails when per-instance runtime state (task keys, gesture
 * accumulators, rAF schedulers, the document-level cursor lock) is kept in
 * module scope: a second MorphScroll on the page silently corrupts the first.
 */

const SIZE: [number, number] = [100, 300];
const OBJ = 100;

const items = (n: number, prefix: string) =>
  Array.from({ length: n }, (_, i) => (
    <div key={`${prefix}-${i}`}>item {i}</div>
  ));

const elements = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLElement>(".ms-viewport"));

// the library reports bar visibility through a CSS variable, not opacity
const visibility = (bars: HTMLElement[]) =>
  bars.map((bar) => bar.style.getPropertyValue("--ms-bar-visibility"));

/** two independent scrolls, both with a usable layout */
const renderPair = (props: Record<string, unknown> = {}) => {
  const utils = render(
    <>
      <MorphScroll objects={{ size: OBJ }} size={SIZE} {...props}>
        {items(20, "a")}
      </MorphScroll>
      <MorphScroll objects={{ size: OBJ }} size={SIZE} {...props}>
        {items(20, "b")}
      </MorphScroll>
    </>,
  );

  const [a, b] = elements(utils.container);
  for (const el of [a, b])
    stubLayout(el, {
      clientWidth: 100,
      clientHeight: 300,
      scrollWidth: 100,
      scrollHeight: 2000,
    });

  return { ...utils, a, b };
};

describe("MorphScroll isolation — scheduled tasks", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("delivers onScrollingChange(false) to an instance even when another one scrolls", () => {
    const aScrolling = vi.fn();
    const bScrolling = vi.fn();

    const { container } = render(
      <>
        <MorphScroll objects={{ size: OBJ }} size={SIZE} onScrollingChange={aScrolling}>
          {items(20, "a")}
        </MorphScroll>
        <MorphScroll objects={{ size: OBJ }} size={SIZE} onScrollingChange={bScrolling}>
          {items(20, "b")}
        </MorphScroll>
      </>,
    );
    const [a, b] = elements(container);

    aScrolling.mockClear();
    bScrolling.mockClear();

    // A starts scrolling, then B scrolls before A's scroll-end delay elapses.
    act(() => {
      fireEvent.scroll(a, { target: { scrollTop: 50 } });
    });
    act(() => {
      vi.advanceTimersByTime(50);
    });
    act(() => {
      fireEvent.scroll(b, { target: { scrollTop: 50 } });
    });
    act(() => {
      vi.advanceTimersByTime(500);
    });

    // A's scroll-end must not be swallowed by B's.
    expect(aScrolling.mock.calls).toEqual([[true], [false]]);
    expect(bScrolling.mock.calls).toEqual([[true], [false]]);
  });

  it("hides both scrollbars after scrolling, one instance after another", () => {
    // showOnHover reports the bar as active while scrolling and idle once the
    // scroll-end task fires. That task shares its key across instances, so a
    // second scroll used to leave the first bar visible forever.
    const { container } = render(
      <>
        <MorphScroll objects={{ size: OBJ }}
          size={SIZE}
          controls={{ wheel: true, bar: { element: <div />, showOnHover: true } }}
        >
          {items(20, "a")}
        </MorphScroll>
        <MorphScroll objects={{ size: OBJ }}
          size={SIZE}
          controls={{ wheel: true, bar: { element: <div />, showOnHover: true } }}
        >
          {items(20, "b")}
        </MorphScroll>
      </>,
    );
    const [a, b] = elements(container);
    const bars = Array.from(container.querySelectorAll<HTMLElement>(".ms-bar"));
    expect(bars).toHaveLength(2);

    act(() => {
      fireEvent.scroll(a, { target: { scrollTop: 50 } });
    });
    act(() => {
      vi.advanceTimersByTime(50);
    });
    act(() => {
      fireEvent.scroll(b, { target: { scrollTop: 50 } });
    });

    // both were revealed by their own scroll
    expect(visibility(bars)).toEqual(["1", "1"]);

    // scroll-end delay + the extra hide delay
    act(() => {
      vi.advanceTimersByTime(CONST.SCROLL_END_DELAY + 1500);
    });

    expect(visibility(bars)).toEqual(["0", "0"]);
  });
});

describe("MorphScroll isolation — pointer gestures", () => {
  // a failing assertion must not leave a gesture open for the next test
  afterEach(() => {
    pointer("pointerup", 0, 0, document);
    pointer("pointerup", 0, 0, document, 2);
  });

  it("does not cancel an in-flight drag when another instance starts one", () => {
    const { a, b } = renderPair({ controls: { drag: true } });

    // A starts dragging and moves.
    drag(a, [
      [50, 250],
      [50, 240],
    ]);
    // B starts its own drag with a second pointer.
    pointer("pointerdown", 50, 250, b, 2);

    // A keeps moving — its listeners must still be alive.
    pointer("pointermove", 50, 140, document);
    expect(a.scrollTop).toBeGreaterThan(0);

    pointer("pointerup", 50, 140, document);
    pointer("pointerup", 50, 250, document, 2);
  });

  it("keeps gesture accumulators separate per instance", () => {
    const { a, b } = renderPair({ controls: { drag: true } });

    // A drags 100px worth of content.
    drag(a, [
      [50, 250],
      [50, 240],
      [50, 150],
    ]);
    pointer("pointerup", 50, 150, document);

    // B performs the exact same gesture and must land on the same offset.
    drag(b, [
      [50, 250],
      [50, 240],
      [50, 150],
    ]);
    pointer("pointerup", 50, 150, document);

    expect(b.scrollTop).toBe(a.scrollTop);
    expect(a.scrollTop).toBeGreaterThan(0);
  });
});

describe("MorphScroll isolation — concurrent pointers", () => {
  afterEach(() => {
    pointer("pointerup", 0, 0, document, 1);
    pointer("pointerup", 0, 0, document, 2);
  });

  it("keeps two simultaneous drags independent", () => {
    const { a, b } = renderPair({ controls: { drag: true } });

    // two fingers, one on each list, moving different distances
    pointer("pointerdown", 50, 250, a, 1);
    pointer("pointerdown", 50, 250, b, 2);
    pointer("pointermove", 50, 240, document, 1);
    pointer("pointermove", 50, 240, document, 2);
    pointer("pointermove", 50, 150, document, 1); // A travels 90
    pointer("pointermove", 50, 200, document, 2); // B travels 40

    expect(a.scrollTop).toBe(90);
    expect(b.scrollTop).toBe(40);
  });

  it("lifting one finger does not end the other gesture", () => {
    const { a, b } = renderPair({ controls: { drag: true } });

    pointer("pointerdown", 50, 250, a, 1);
    pointer("pointerdown", 50, 250, b, 2);
    pointer("pointermove", 50, 240, document, 1);
    pointer("pointermove", 50, 240, document, 2);

    pointer("pointerup", 50, 240, document, 1); // A lets go
    pointer("pointermove", 50, 140, document, 2); // B keeps dragging

    expect(b.scrollTop).toBe(100);
  });

  it("ignores pointermove from a pointer that never pressed down", () => {
    const { a } = renderPair({ controls: { drag: true } });

    pointer("pointerdown", 50, 250, a, 1);
    pointer("pointermove", 50, 240, document, 1);
    pointer("pointermove", 50, 100, document, 7); // stray pointer

    expect(a.scrollTop).toBe(0);
  });
});

describe("MorphScroll isolation — document cursor lock", () => {
  afterEach(() => cursorLock()?.remove());

  it("releases the cursor lock when the scroll unmounts mid-drag", () => {
    const { container, unmount } = render(
      <MorphScroll objects={{ size: OBJ }} size={SIZE} controls={{ drag: true }}>
        {items(20, "a")}
      </MorphScroll>,
    );
    const [a] = elements(container);
    stubLayout(a, {
      clientWidth: 100,
      clientHeight: 300,
      scrollWidth: 100,
      scrollHeight: 2000,
    });

    pointer("pointerdown", 50, 250, a);
    expect(cursorLock()).not.toBeNull();

    unmount();
    expect(cursorLock()).toBeNull();
  });

  it("keeps the cursor lock while another instance is still dragging", () => {
    const { a, b } = renderPair({ controls: { drag: true } });

    pointer("pointerdown", 50, 250, a, 1);
    pointer("pointerdown", 50, 250, b, 2);
    expect(cursorLock()).not.toBeNull();

    pointer("pointerup", 50, 250, document, 1); // A finishes, B holds on
    expect(cursorLock()).not.toBeNull();

    pointer("pointerup", 50, 250, document, 2);
    expect(cursorLock()).toBeNull();
  });

  it("does not release another instance's cursor lock when an idle one unmounts", () => {
    const Idle = ({ show }: { show: boolean }) => (
      <>
        <MorphScroll objects={{ size: OBJ }}
          size={SIZE}
          controls={{ drag: true }}
        >
          {items(20, "a")}
        </MorphScroll>
        {show ? (
          <MorphScroll objects={{ size: OBJ }}
            size={SIZE}
            controls={{ drag: true }}
          >
            {items(20, "b")}
          </MorphScroll>
        ) : null}
      </>
    );

    const { container, rerender } = render(<Idle show />);
    const [a] = elements(container);
    stubLayout(a, {
      clientWidth: 100,
      clientHeight: 300,
      scrollWidth: 100,
      scrollHeight: 2000,
    });

    // A is dragging; B never started a gesture.
    pointer("pointerdown", 50, 250, a);
    expect(cursorLock()).not.toBeNull();

    rerender(<Idle show={false} />);
    expect(cursorLock()).not.toBeNull();

    pointer("pointerup", 50, 250, document);
    expect(cursorLock()).toBeNull();
  });
});
