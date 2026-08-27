import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, act } from "@testing-library/react";
import MorphScroll from "@morphing-scroll/src/components/MorphScroll";
import type { MorphScrollHandle } from "@morphing-scroll/src/types/types";

import { stubLayout } from "../../helpers/dom";

const OBJ = 100;
const VIEW = 300;
const COUNT = 20;
const MAX = COUNT * OBJ - VIEW; // 1700

const items = () =>
  Array.from({ length: COUNT }, (_, i) => <div key={`item-${i}`}>item {i}</div>);

const mount = (props: Record<string, unknown> = {}) => {
  const ref = React.createRef<MorphScrollHandle>();
  const utils = render(
    <MorphScroll ref={ref} size={[100, VIEW]} objectsSize={OBJ} {...props}>
      {items()}
    </MorphScroll>,
  );
  const el = utils.container.querySelector<HTMLElement>(".ms-element")!;
  stubLayout(el, {
    clientWidth: 100,
    clientHeight: VIEW,
    scrollWidth: 100,
    scrollHeight: COUNT * OBJ,
  });
  return { ...utils, ref, el };
};

/** run enough time for a scroll animation to finish */
const settle = (ms = 600) =>
  act(() => {
    vi.advanceTimersByTime(ms);
  });

describe("MorphScroll — scrollPosition (declarative)", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("applies a new value when it changes", () => {
    const { el, rerender } = mount({ scrollPosition: 0 });
    settle();

    rerender(
      <MorphScroll size={[100, VIEW]} objectsSize={OBJ} scrollPosition={400}>
        {items()}
      </MorphScroll>,
    );
    settle();

    expect(el.scrollTop).toBe(400);
  });

  it("leaves the user alone when the same value is re-rendered", () => {
    const scroll = (
      <MorphScroll size={[100, VIEW]} objectsSize={OBJ} scrollPosition={400}>
        {items()}
      </MorphScroll>
    );
    const { container, rerender } = render(scroll);
    const el = container.querySelector<HTMLElement>(".ms-element")!;
    stubLayout(el, {
      clientWidth: 100,
      clientHeight: VIEW,
      scrollWidth: 100,
      scrollHeight: COUNT * OBJ,
    });
    settle();

    // the user scrolls somewhere else
    el.scrollTop = 900;

    rerender(scroll);
    settle();

    expect(el.scrollTop).toBe(900);
  });

  it("accepts the object form without an updater flag", () => {
    const { el, rerender } = mount({ scrollPosition: { value: 0 } });
    settle();

    rerender(
      <MorphScroll
        size={[100, VIEW]}
        objectsSize={OBJ}
        scrollPosition={{ value: 600, duration: 100 }}
      >
        {items()}
      </MorphScroll>,
    );
    settle();

    expect(el.scrollTop).toBe(600);
  });
});

describe("MorphScroll — scrollTo (imperative)", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("scrolls to a number", () => {
    const { ref, el } = mount();
    settle(50);

    act(() => ref.current!.scrollTo(500));
    settle();

    expect(el.scrollTop).toBe(500);
  });

  it("runs again for the very same target — the point of the method", () => {
    const { ref, el } = mount();
    settle(50);

    act(() => ref.current!.scrollTo(0));
    settle();

    // the user scrolls away, then asks for the same place again
    el.scrollTop = 800;
    act(() => ref.current!.scrollTo(0));
    settle();

    expect(el.scrollTop).toBe(0);
  });

  it("scrolls to the end", () => {
    const { ref, el } = mount();
    settle(50);

    act(() => ref.current!.scrollTo("end"));
    settle();

    expect(el.scrollTop).toBe(MAX);
  });

  it("reaches the end even after the user scrolled up", () => {
    // the declarative "end" backs off in this case; an explicit command must not
    const { ref, el } = mount();
    settle(50);

    act(() => ref.current!.scrollTo("end"));
    settle();
    el.scrollTop = MAX - 400; // user scrolls up
    act(() => ref.current!.scrollTo("end"));
    settle();

    expect(el.scrollTop).toBe(MAX);
  });

  it("jumps without animating when duration is 0", () => {
    const { ref, el } = mount();
    settle(50);

    act(() => ref.current!.scrollTo(300, { duration: 0 }));
    // one frame to batch the command, one to run the (instant) animation
    act(() => {
      vi.advanceTimersToNextFrame();
      vi.advanceTimersToNextFrame();
    });

    expect(el.scrollTop).toBe(300);
  });

  it("clamps beyond the end", () => {
    const { ref, el } = mount();
    settle(50);

    act(() => ref.current!.scrollTo(99999));
    settle();

    expect(el.scrollTop).toBe(MAX);
  });
});
