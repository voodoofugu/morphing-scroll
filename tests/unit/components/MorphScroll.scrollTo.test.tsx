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
  const el = utils.container.querySelector<HTMLElement>(".ms-viewport")!;
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

/*
 * `initialPosition` — позиция открытия и ничего больше: применяется один раз и
 * никогда не возвращается. Отсюда и весь смысл разделения — проп не может
 * отменить ни движение человека, ни команду.
 */
describe("MorphScroll — initialPosition", () => {
  it("opens where it was asked to", async () => {
    const { el } = mount({ initialPosition: 400 });

    await vi.waitFor(() => expect(el.scrollTop).toBe(400));
  });

  it("is never applied a second time", async () => {
    const { el, rerender } = mount({ initialPosition: 400 });
    await vi.waitFor(() => expect(el.scrollTop).toBe(400));

    el.scrollTop = 900; // человек уехал сам

    rerender(
      <MorphScroll size={[100, VIEW]} objectsSize={OBJ} initialPosition={100}>
        {items()}
      </MorphScroll>,
    );
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(el.scrollTop).toBe(900);
  });
});

describe("MorphScroll — initialPosition against everything else", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  const growing = (count: number, props: Record<string, unknown> = {}) => (
    <MorphScroll size={[100, VIEW]} objectsSize={OBJ} initialPosition={100} {...props}>
      {Array.from({ length: count }, (_, i) => (
        <div key={`item-${i}`}>item {i}</div>
      ))}
    </MorphScroll>
  );

  const mountGrowing = (props: Record<string, unknown> = {}) => {
    const utils = render(growing(COUNT, props));
    const el = utils.container.querySelector<HTMLElement>(".ms-viewport")!;
    stubLayout(el, {
      clientWidth: 100,
      clientHeight: VIEW,
      scrollWidth: 100,
      scrollHeight: COUNT * OBJ,
    });
    return { ...utils, el };
  };

  it("does not pull the scroll back when the list grows", () => {
    const { el, rerender } = mountGrowing();
    settle();

    el.scrollTop = 900; // человек уехал сам
    act(() => rerender(growing(COUNT + 8)));
    settle();

    expect(el.scrollTop).toBe(900);
  });

  it("does not undo a command when the list grows", () => {
    const ref = React.createRef<MorphScrollHandle>();
    const { el, rerender } = mountGrowing({ ref });
    settle();

    act(() => ref.current!.scrollTo(500));
    settle();
    expect(el.scrollTop).toBe(500);

    act(() => rerender(growing(COUNT + 8, { ref })));
    settle();

    expect(el.scrollTop).toBe(500);
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

describe("MorphScroll — scrollTo on both axes at once", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  /*
   * В `hybrid` цель ставится обеим осям одним вызовом, и обе анимации живут в
   * одной кадровой очереди. Пока ключ в ней был общим, вторая ось затирала
   * первую — доезжала только одна.
   */
  it("animates x and y together", () => {
    const ref = React.createRef<MorphScrollHandle>();
    const { container } = render(
      <MorphScroll
        ref={ref}
        size={[300, 300]}
        objectsSize={100}
        crossCount={12}
        direction="hybrid"
      >
        {Array.from({ length: 144 }, (_, i) => (
          <div key={`item-${i}`}>item {i}</div>
        ))}
      </MorphScroll>,
    );
    const el = container.querySelector<HTMLElement>(".ms-viewport")!;
    stubLayout(el, {
      clientWidth: 300,
      clientHeight: 300,
      scrollWidth: 1200,
      scrollHeight: 1200,
    });
    settle(50);

    act(() => ref.current!.scrollTo(600));
    settle();

    expect([el.scrollLeft, el.scrollTop]).toEqual([600, 600]);
  });
});
