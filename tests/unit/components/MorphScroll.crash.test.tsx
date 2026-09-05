import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, fireEvent, act } from "@testing-library/react";
import MorphScroll from "@morphing-scroll/src/components/MorphScroll";
import type {
  MorphScroll as MorphScrollProps,
  MorphScrollHandle,
} from "@morphing-scroll/src/types/types";
import { stubLayout, drag, pointer } from "../../helpers/dom";
import ResizeTracker from "@morphing-scroll/src/components/ResizeTracker";
import IntersectionTracker from "@morphing-scroll/src/components/IntersectionTracker";
import startInertiaScroll from "@morphing-scroll/src/helpers/startInertiaScroll";
import { resizeObservers, intersectionObservers } from "../../setup";
import createSchedulerRAF from "@morphing-scroll/src/helpers/createSchedulerRAF";

/**
 * jsdom keeps scrollTop at 0 no matter what is assigned, and stubbing an
 * element after it is mounted throws away whatever its own effects wrote.
 * Backing the two properties on the prototype lets a mount that positions
 * itself — an opening position, the middle copy of a circle — be observed.
 */
const scrollStore = new WeakMap<Element, { top: number; left: number }>();
const of = (el: Element) => {
  let at = scrollStore.get(el);
  if (!at) scrollStore.set(el, (at = { top: 0, left: 0 }));
  return at;
};

const realScroll = {
  top: Object.getOwnPropertyDescriptor(Element.prototype, "scrollTop"),
  left: Object.getOwnPropertyDescriptor(Element.prototype, "scrollLeft"),
};

const holdScroll = () => {
  Object.defineProperty(Element.prototype, "scrollTop", {
    configurable: true,
    get(this: Element) {
      return of(this).top;
    },
    set(this: Element, value: number) {
      of(this).top = value;
    },
  });
  Object.defineProperty(Element.prototype, "scrollLeft", {
    configurable: true,
    get(this: Element) {
      return of(this).left;
    },
    set(this: Element, value: number) {
      of(this).left = value;
    },
  });
};

/**
 * Sizes only. `stubLayout` also takes over scrollTop, which throws away
 * whatever the component wrote to it while mounting — the opening position,
 * or the middle copy of a circle. Here the position stays on the prototype.
 */
const stubBox = (
  el: HTMLElement,
  m: { clientWidth: number; clientHeight: number; scrollWidth: number; scrollHeight: number },
) => {
  for (const key of ["clientWidth", "clientHeight", "scrollWidth", "scrollHeight"] as const)
    Object.defineProperty(el, key, { value: m[key], configurable: true });

  el.getBoundingClientRect = () =>
    ({
      width: m.clientWidth,
      height: m.clientHeight,
      top: 0,
      left: 0,
      right: m.clientWidth,
      bottom: m.clientHeight,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    }) as DOMRect;
};

const releaseScroll = () => {
  if (realScroll.top)
    Object.defineProperty(Element.prototype, "scrollTop", realScroll.top);
  if (realScroll.left)
    Object.defineProperty(Element.prototype, "scrollLeft", realScroll.left);
};

/**
 * A crash pass over the public API before the release freezes it.
 *
 * Two halves. The first throws every prop at the component in combination and
 * demands it survive without throwing and without complaining about a
 * combination that is legal. The second probes the specific places where
 * reading the code suggested something is wrong; each of those is written to
 * describe the behaviour a user would expect, so a red one is a finding
 * rather than a broken test.
 */

const items = (n: number, prefix = "item") =>
  Array.from({ length: n }, (_, i) => (
    <div key={`${prefix}-${i}`} className="cell">
      {prefix} {i}
    </div>
  ));

const quiet = () => vi.spyOn(console, "error").mockImplementation(() => {});

const errorsOf = (spy: ReturnType<typeof quiet>) =>
  spy.mock.calls.map((c) => String(c[0]));

/** the values each prop is exercised with */
const AXES: Record<string, unknown[]> = {
  mode: ["scroll", "slider", "sliderMenu"],
  direction: ["x", "y", "hybrid"],
  size: [300, [240, 180], "auto"],
  objects: [
    { size: 100 },
    { size: [80, 60], gap: [10, 4], lines: 2 },
    { size: "full" },
    { size: "firstChild" },
    { size: "auto" },
    { size: [90, "auto"], gap: 8 },
    { size: ["auto", 40], lines: 3, align: "center" },
    { size: 100, empty: "clear" },
    { size: 100, empty: { mode: "fallback", clickTrigger: ".x" } },
    { size: 100, direction: "column", lines: 2 },
  ],
  controls: [
    "wheel",
    ["wheel", "drag", "keys"],
    { wheel: { changeDirection: true, changeDirectionBtn: "KeyZ" } },
    { wheel: true, bar: true },
    { wheel: true, bar: <i className="thumb" /> },
    { wheel: true, bar: { element: <i />, edgeGap: -4, trackGap: 6, reverse: true, showOnHover: true, thumbMinSize: 12 } },
    { wheel: true, arrows: { element: <i />, size: 24, reserveSpace: true } },
    { wheel: true, keys: { mode: "focus" } },
    { wheel: true, keys: { mode: "pan", step: 80 } },
  ],
  wrapper: [
    undefined,
    { margin: 12 },
    { margin: [4, 8, 12, 16], minSize: "full", align: "center" },
    { minSize: [200, "full"], align: ["end", "start"] },
  ],
  render: [
    undefined,
    "lazy",
    "virtual",
    { mode: "virtual", rootMargin: [10, 20], deferLoadOnScroll: true },
    { trackVisibility: true },
  ],
  loop: [false, true],
  stickToEnd: [false, true, [true, false]],
  initialPosition: [undefined, 0, 120, "end", [40, 90]],
  edge: [undefined, true, <i key="e" />, { element: <i />, size: 20 }],
  duration: [0, 200],
  suspending: [false, true],
  autoScrollOnDrag: [false, true],
};

const BASE: MorphScrollProps = {
  size: 300,
  objects: { size: 100 },
  children: items(9),
};

/**
 * One axis at a time against a fixed base, then a set of deliberately awkward
 * pairs. A full cross product would be millions of renders; these are the
 * combinations where two props actually have to agree about something.
 */
const combos = (): Array<[string, Partial<MorphScrollProps>]> => {
  const out: Array<[string, Partial<MorphScrollProps>]> = [];

  for (const [prop, values] of Object.entries(AXES))
    values.forEach((value, i) =>
      out.push([`${prop}[${i}]`, { [prop]: value } as Partial<MorphScrollProps>]),
    );

  const pairs: Array<[string, Partial<MorphScrollProps>]> = [
    ["hybrid+each+lines", { direction: "hybrid", objects: { size: "auto", lines: 2 } }],
    ["hybrid+virtual+arrows", { direction: "hybrid", render: "virtual", controls: { wheel: true, arrows: { element: <i />, reserveSpace: true } } }],
    ["slider+loop+bar", { mode: "slider", loop: true, controls: { wheel: true, bar: <i /> } }],
    ["sliderMenu+loop+gap", { mode: "sliderMenu", loop: true, objects: { size: 100, gap: 20 }, controls: { wheel: true, bar: [<i key="a" />, <i key="b" />] } }],
    ["loop+hybrid+virtual", { direction: "hybrid", loop: true, render: "virtual", objects: { size: 100, lines: 2 } }],
    ["loop+each", { loop: true, objects: { size: [90, "auto"] } }],
    ["auto+each+align", { size: "auto", objects: { size: "auto", align: "end" } }],
    ["firstChild+virtual", { objects: { size: "firstChild" }, render: "virtual" }],
    ["empty+virtual+fallback", { objects: { size: 100, empty: "clear" }, render: "virtual", fallback: <i /> }],
    ["stickToEnd+virtual+x", { direction: "x", stickToEnd: true, render: "virtual" }],
    ["margin+minSize+each", { wrapper: { margin: 10, minSize: "full" }, objects: { size: "auto" } }],
    ["no children", { children: [] }],
    ["one child", { children: items(1) }],
    ["null children", { children: [null, undefined, false, ...items(2)] as React.ReactNode }],
    ["fragment children", { children: <><div key="a" /><div key="b" /></> }],
    ["nested fragment", { children: <><React.Fragment key="f"><div key="c" /></React.Fragment></> }],
    ["text child", { children: ["plain text", ...items(2)] as React.ReactNode }],
    ["duplicate keys", { children: [<div key="same" />, <div key="same" />] as React.ReactNode }],
    ["weird keys", { children: [<div key="a:b=c" />, <div key=".$x" />] as React.ReactNode }],
    ["negative gap", { objects: { size: 100, gap: -20 } }],
    ["zero-ish objects", { objects: { size: 0 } }],
    ["huge lines", { objects: { size: 100, lines: 9999 } }],
    ["fractional sizes", { size: [300.5, 180.25], objects: { size: [33.3, 33.3], gap: 3.5 } }],
    ["big list virtual", { render: "virtual", children: items(500) }],
  ];

  return [...out, ...pairs];
};

/** a combination the library is entitled to complain about */
const EXPECTED_COMPLAINT =
  /needs a known objects\.size|pages need one size|needs objects\.lines|pull against each other|prop "controls"|objects\.direction|two children with the same key/;

describe("MorphScroll — crash pass over the prop surface", () => {
  it("survives every prop value and awkward pair", () => {
    const failures: string[] = [];

    for (const [name, props] of combos()) {
      const spy = quiet();
      try {
        const { unmount, container } = render(
          <MorphScroll {...BASE} {...(props as MorphScrollProps)} />,
        );
        expect(container.querySelector("[morph-scroll]")).toBeTruthy();
        unmount();

        const unexpected = errorsOf(spy).filter(
          (m) => !EXPECTED_COMPLAINT.test(m),
        );
        if (unexpected.length) failures.push(`${name}: ${unexpected[0]}`);
      } catch (error) {
        failures.push(`${name}: threw ${(error as Error).message}`);
      } finally {
        spy.mockRestore();
      }
    }

    expect(failures).toEqual([]);
  });

  it("survives every prop being swapped on a live instance", () => {
    const spy = quiet();
    const list = combos();

    const { rerender, unmount } = render(<MorphScroll {...BASE} />);

    const failures: string[] = [];
    for (const [name, props] of list) {
      try {
        rerender(<MorphScroll {...BASE} {...(props as MorphScrollProps)} />);
        rerender(<MorphScroll {...BASE} />);
      } catch (error) {
        failures.push(`${name}: threw ${(error as Error).message}`);
      }
    }

    unmount();
    spy.mockRestore();
    expect(failures).toEqual([]);
  });
});

describe("MorphScroll — findings", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    holdScroll();
  });
  afterEach(() => {
    releaseScroll();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  /** one object per row, so there is always somewhere to scroll */
  const COLUMN: MorphScrollProps = {
    size: [100, 300],
    objects: { size: 100 },
    children: items(9),
  };

  const mount = (props: Partial<MorphScrollProps>) => {
    const utils = render(
      <MorphScroll {...COLUMN} {...(props as MorphScrollProps)} />,
    );
    const el = utils.container.querySelector<HTMLElement>(".ms-viewport")!;
    stubBox(el, {
      clientWidth: 100,
      clientHeight: 300,
      scrollWidth: 100,
      scrollHeight: 900,
    });
    return { ...utils, el };
  };

  /** long enough for a scroll animation to finish */
  const frames = (ms = 1000) =>
    act(() => {
      vi.advanceTimersByTime(ms);
    });

  it("a wheel notch in line units moves as far as one in pixels", () => {
    // Firefox reports deltaMode 1 (lines) for a mouse wheel: deltaY is ~3,
    // not ~100. Without normalising by deltaMode the same notch moves the
    // content by three pixels there and a hundred here.
    const spy = quiet();

    const px = mount({ controls: { wheel: true } });
    fireEvent.wheel(px.el, { deltaY: 100, deltaMode: 0 });
    frames();
    const byPixels = px.el.scrollTop;
    px.unmount();

    const lines = mount({ controls: { wheel: true } });
    fireEvent.wheel(lines.el, { deltaY: 3, deltaMode: 1 });
    frames();
    const byLines = lines.el.scrollTop;
    lines.unmount();
    spy.mockRestore();

    expect(byPixels).toBeGreaterThan(0);
    expect(byLines).toBeGreaterThan(byPixels / 2);
  });

  it("a horizontal wheel gesture scrolls a horizontal list", () => {
    // A trackpad reports a sideways swipe as deltaX. Only deltaY is read, so
    // the gesture the content is actually laid out for does nothing.
    const spy = quiet();
    const s = render(
      <MorphScroll size={[300, 100]} direction="x" objects={{ size: 100 }}>
        {items(9)}
      </MorphScroll>,
    );
    const el = s.container.querySelector<HTMLElement>(".ms-viewport")!;
    stubBox(el, {
      clientWidth: 300,
      clientHeight: 100,
      scrollWidth: 900,
      scrollHeight: 100,
    });

    fireEvent.wheel(el, { deltaX: 120, deltaY: 0 });
    frames();
    const moved = el.scrollLeft;
    s.unmount();
    spy.mockRestore();

    expect(moved).toBeGreaterThan(0);
  });

  it("a gap does not desynchronise a sliderMenu jump from its page", () => {
    // The menu jumps to viewport * index; every other page calculation in
    // the library steps by viewport + gap. With a gap they disagree, and the
    // drift grows by one gap with every page.
    const spy = quiet();
    const s = mount({
      mode: "sliderMenu",
      objects: { size: 100, gap: 20 },
      controls: { wheel: true, bar: <i /> },
    });
    frames(100); // let the first frame pass

    const dots = s.container.querySelectorAll<HTMLElement>(".ms-slider-item");
    expect(dots.length).toBeGreaterThan(1);

    act(() => {
      dots[2].click();
    });
    frames();

    const at = s.el.scrollTop;
    s.unmount();
    spy.mockRestore();

    expect(at).toBe(640); // two pages of viewport + gap
  });

  it("a slider dot works on the very first frame", () => {
    // Until the opening frame has passed, a move is placed rather than
    // animated — and a menu click in that window lands nowhere.
    const spy = quiet();
    const s = mount({
      mode: "sliderMenu",
      objects: { size: 100 },
      controls: { wheel: true, bar: <i /> },
    });

    const dots = s.container.querySelectorAll<HTMLElement>(".ms-slider-item");
    act(() => {
      dots[1].click();
    });
    frames();

    const at = s.el.scrollTop;
    s.unmount();
    spy.mockRestore();

    expect(at).toBeGreaterThan(0);
  });

  it("loop opens in the middle copy, with room to scroll back", () => {
    // The circle is a few copies of the content and the window has to sit in
    // the middle one: from the start of the strip there is nothing behind it,
    // and the first scroll upward hits a wall instead of turning.
    const spy = quiet();
    const s = mount({ loop: true });
    frames();

    const at = s.el.scrollTop;
    s.unmount();
    spy.mockRestore();

    expect(at).toBe(900); // one period in — nine objects of 100
  });

  it("loop refuses stickToEnd rather than driving to the end of the strip", () => {
    const spy = quiet();
    const s = render(
      <MorphScroll {...COLUMN} loop stickToEnd />,
    );
    const el = s.container.querySelector<HTMLElement>(".ms-viewport")!;
    // the strip is three copies of a 900px turn
    stubBox(el, {
      clientWidth: 100,
      clientHeight: 300,
      scrollWidth: 100,
      scrollHeight: 2700,
    });
    act(() => vi.advanceTimersByTime(1000));

    const at = el.scrollTop;
    s.unmount();
    spy.mockRestore();

    // 2400 is the far end of the strip — an end the circle is not supposed
    // to have, and the docs say the combination is refused
    expect(at).not.toBe(2400);
  });

  it("a bar on its own still leaves the content scrollable", () => {
    // controls replaces the default rather than merging into it, so naming
    // the bar quietly switches the wheel off.
    const spy = quiet();
    const s = mount({ controls: { bar: <i className="thumb" /> } });

    fireEvent.wheel(s.el, { deltaY: 200 });
    frames();

    const moved = s.el.scrollTop;
    s.unmount();
    spy.mockRestore();

    expect(moved).toBeGreaterThan(0);
  });

  it("the native bar can actually scroll when it is the only control", () => {
    const spy = quiet();
    const s = mount({ controls: { bar: true } });
    const style = s.el.getAttribute("style") ?? "";
    s.unmount();
    spy.mockRestore();

    expect(style).not.toMatch(/overflow:\s*hidden;/);
  });

  it("complains about a bad combination once, not on every render", () => {
    const spy = quiet();
    const { rerender } = render(
      <MorphScroll {...COLUMN} objects={{ size: "none" }} render="virtual" />,
    );
    for (let i = 0; i < 20; i++)
      rerender(
        <MorphScroll
          {...COLUMN}
          objects={{ size: "none" }}
          render="virtual"
          className={`n${i}`}
        />,
      );

    const complaints = errorsOf(spy).filter((m) =>
      /needs a known objects\.size/.test(m),
    );
    spy.mockRestore();

    expect(complaints.length).toBe(1);
  });

  it("keeps a lazy scroll's memory of loaded keys bounded by the list", () => {
    const spy = quiet();
    const { rerender, container, unmount } = render(
      <MorphScroll {...COLUMN} render="lazy">
        {items(6, "gen0")}
      </MorphScroll>,
    );
    const el = container.querySelector<HTMLElement>(".ms-viewport")!;
    stubLayout(el, {
      clientWidth: 100,
      clientHeight: 300,
      scrollWidth: 100,
      scrollHeight: 600,
    });

    for (let gen = 1; gen < 40; gen++) {
      rerender(
        <MorphScroll {...COLUMN} render="lazy">
          {items(6, `gen${gen}`)}
        </MorphScroll>,
      );
      act(() => {
        fireEvent.scroll(el, { target: { scrollTop: gen } });
        vi.advanceTimersByTime(300);
      });
    }

    const boxes = container.querySelectorAll(".ms-object-box").length;
    unmount();
    spy.mockRestore();

    expect(boxes).toBeLessThanOrEqual(6);
  });

  it("throws a two-axis flick in both directions, not just one", () => {
    // Both axes hand their step to the same frame scheduler under the key
    // "step", and the scheduler keeps one job per key. In `direction="hybrid"`
    // a finger let go diagonally should carry the content both ways.
    const el = document.createElement("div");
    document.body.appendChild(el);
    stubLayout(el, {
      clientWidth: 300,
      clientHeight: 300,
      scrollWidth: 3000,
      scrollHeight: 3000,
    });

    const raf = createSchedulerRAF();

    startInertiaScroll({ el, axis: "x", velocity: 2, rafSchedule: raf.schedule });
    startInertiaScroll({ el, axis: "y", velocity: 2, rafSchedule: raf.schedule });

    act(() => {
      for (let i = 0; i < 30; i++) vi.advanceTimersToNextFrame();
    });

    const moved = { x: el.scrollLeft, y: el.scrollTop };
    el.remove();

    expect(moved.x).toBeGreaterThan(0);
    expect(moved.y).toBeGreaterThan(0);
  });

  it("does not throw when a gesture outlives the component", () => {
    const spy = quiet();
    const s = mount({ controls: { drag: true } });

    drag(s.el, [
      [10, 200],
      [10, 150],
    ]);
    s.unmount();

    expect(() => {
      pointer("pointermove", 10, 100, document);
      pointer("pointerup", 10, 100, document);
    }).not.toThrow();
    spy.mockRestore();
  });

  it("a ref command works before anything has been measured", () => {
    const spy = quiet();
    const ref = React.createRef<MorphScrollHandle>();
    const s = render(<MorphScroll {...COLUMN} ref={ref} size="auto" />);
    const el = s.container.querySelector<HTMLElement>(".ms-viewport")!;
    stubLayout(el, {
      clientWidth: 100,
      clientHeight: 300,
      scrollWidth: 100,
      scrollHeight: 900,
    });

    expect(() => {
      ref.current?.scrollTo(100);
      ref.current?.step("bottom");
      ref.current?.pan({ y: 50 });
      ref.current?.moveFocus("bottom");
    }).not.toThrow();

    s.unmount();
    spy.mockRestore();
  });
});

/**
 * The README promises that callbacks are held through refs and never
 * invalidate anything. That holds for `onRenderedKeysChange`; these two ask
 * the same of the trackers, where a live observer is what is at stake.
 */
describe("trackers — callbacks written straight into the props", () => {
  it("ResizeTracker keeps one observer across renders", () => {
    const { rerender } = render(
      <ResizeTracker onResize={() => {}}>
        <div />
      </ResizeTracker>,
    );
    const start = resizeObservers.length;

    for (let i = 0; i < 5; i++)
      rerender(
        <ResizeTracker onResize={() => {}}>
          <div />
        </ResizeTracker>,
      );

    expect(resizeObservers.length - start).toBe(0);
  });

  it("IntersectionTracker keeps one observer across renders", () => {
    const { rerender } = render(
      <IntersectionTracker threshold={[0, 0.5, 1]} onIntersection={() => {}}>
        <div />
      </IntersectionTracker>,
    );
    const start = intersectionObservers.length;

    for (let i = 0; i < 5; i++)
      rerender(
        <IntersectionTracker threshold={[0, 0.5, 1]} onIntersection={() => {}}>
          <div />
        </IntersectionTracker>,
      );

    expect(intersectionObservers.length - start).toBe(0);
  });
});

/**
 * Virtual rendering now asks only the objects that can possibly be in view,
 * instead of asking all of them. The window is a pre-filter and nothing more,
 * so what ends up on screen has to be exactly what a full scan would produce.
 */
describe("virtual rendering — the window matches a full scan", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  const PER_LINE = 3;
  const OBJ = 100;
  const VIEW = 300;
  const COUNT = 400;

  const expected = (scrollTop: number) => {
    const out: string[] = [];

    for (let i = 0; i < COUNT; i++) {
      const top = Math.floor(i / PER_LINE) * OBJ;
      const bottom = top + OBJ;
      const visible =
        Math.min(bottom, scrollTop + VIEW) - Math.max(top, scrollTop);

      if (visible > 0) out.push(`item-${i}`);
    }

    return out.sort();
  };

  it("renders the same objects at every position", () => {
    const spy = quiet();
    const { container, unmount } = render(
      <MorphScroll size={[VIEW, VIEW]} objects={{ size: OBJ }} render="virtual">
        {items(COUNT)}
      </MorphScroll>,
    );
    const el = container.querySelector<HTMLElement>(".ms-viewport")!;
    stubLayout(el, {
      clientWidth: VIEW,
      clientHeight: VIEW,
      scrollWidth: VIEW,
      scrollHeight: (COUNT / PER_LINE) * OBJ,
    });

    for (const top of [0, 37, 100, 999, 4321, 13000]) {
      act(() => {
        fireEvent.scroll(el, { target: { scrollTop: top } });
        vi.advanceTimersByTime(32);
      });

      const rendered = Array.from(
        container.querySelectorAll("[ms-wrap-id]"),
      )
        .map((node) => node.getAttribute("ms-wrap-id")!)
        .sort();

      expect(rendered).toEqual(expected(el.scrollTop));
    }

    unmount();
    spy.mockRestore();
  });
});

/**
 * A browser keeps your place when something loads in above you; this one has
 * to do it itself, because the objects are placed by coordinate and have no
 * scrolling of their own to anchor.
 */
describe("MorphScroll — content arriving above the reader", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  const messages = (from: number, to: number) =>
    Array.from({ length: to - from }, (_, i) => (
      <div key={`msg-${from + i}`}>message {from + i}</div>
    ));

  const view = (children: React.ReactNode) => (
    <MorphScroll size={[100, 300]} objects={{ size: 100 }}>
      {children}
    </MorphScroll>
  );

  it("keeps the reader on the same message when history loads", () => {
    const spy = quiet();
    const u = render(view(messages(10, 30)));
    const el = u.container.querySelector<HTMLElement>(".ms-viewport")!;
    stubLayout(el, {
      clientWidth: 100,
      clientHeight: 300,
      scrollWidth: 100,
      scrollHeight: 3000,
    });

    act(() => {
      fireEvent.scroll(el, { target: { scrollTop: 800 } });
      vi.advanceTimersByTime(400);
    });

    // message 18 is the top one in view
    expect(el.scrollTop).toBe(800);

    act(() => {
      u.rerender(view(messages(0, 30))); // ten older ones arrive
      vi.advanceTimersByTime(400);
    });

    u.unmount();
    spy.mockRestore();

    // the same message has to stay under the same edge, a thousand lower
    expect(el.scrollTop).toBe(1800);
  });

  it("leaves the position alone when the list grows at the end", () => {
    const spy = quiet();
    const u = render(view(messages(0, 20)));
    const el = u.container.querySelector<HTMLElement>(".ms-viewport")!;
    stubLayout(el, {
      clientWidth: 100,
      clientHeight: 300,
      scrollWidth: 100,
      scrollHeight: 3000,
    });

    act(() => {
      fireEvent.scroll(el, { target: { scrollTop: 800 } });
      vi.advanceTimersByTime(400);
    });

    act(() => {
      u.rerender(view(messages(0, 30)));
      vi.advanceTimersByTime(400);
    });

    const at = el.scrollTop;
    u.unmount();
    spy.mockRestore();

    expect(at).toBe(800);
  });
});

/**
 * A place in the list is the one a caller can name: with `render` the object
 * is not in the document, and with a measured size only the library knows
 * where it landed.
 */
describe("MorphScroll — scrollToObject", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  const grouped = () => [
    ...Array.from({ length: 5 }, (_, i) => (
      <div key={`a-${i}[intro]`}>intro {i}</div>
    )),
    ...Array.from({ length: 5 }, (_, i) => (
      <div key={`b-${i}[news]`}>news {i}</div>
    )),
  ];

  const mount = (children: React.ReactNode) => {
    const u = render(
      <MorphScroll size={[100, 300]} objects={{ size: 100 }} ref={ref}>
        {children}
      </MorphScroll>,
    );
    const el = u.container.querySelector<HTMLElement>(".ms-viewport")!;
    stubLayout(el, {
      clientWidth: 100,
      clientHeight: 300,
      scrollWidth: 100,
      scrollHeight: 1000,
    });
    return { ...u, el };
  };

  let ref: React.RefObject<MorphScrollHandle | null>;
  beforeEach(() => {
    ref = React.createRef<MorphScrollHandle>();
  });

  const settle = () =>
    act(() => {
      vi.advanceTimersByTime(600);
    });

  it("goes to an object by its place in the list", () => {
    const spy = quiet();
    const s = mount(items(10));
    settle();

    act(() => ref.current?.scrollToObject(6));
    settle();

    const at = s.el.scrollTop;
    s.unmount();
    spy.mockRestore();

    expect(at).toBe(600);
  });

  it("goes to an object by its key", () => {
    const spy = quiet();
    const s = mount(items(10));
    settle();

    act(() => ref.current?.scrollToObject("item-4"));
    settle();

    const at = s.el.scrollTop;
    s.unmount();
    spy.mockRestore();

    expect(at).toBe(400);
  });

  it("goes to the first object of a group named in the keys", () => {
    const spy = quiet();
    const s = mount(grouped());
    settle();

    act(() => ref.current?.scrollToObject("news"));
    settle();

    const at = s.el.scrollTop;
    s.unmount();
    spy.mockRestore();

    expect(at).toBe(500);
  });

  it("aligns the object in the window when asked", () => {
    const spy = quiet();
    const s = mount(items(10));
    settle();

    act(() => ref.current?.scrollToObject(5, { align: "center" }));
    settle();

    const at = s.el.scrollTop;
    s.unmount();
    spy.mockRestore();

    // a 100px object centred in a 300px window sits 100px in
    expect(at).toBe(400);
  });

  it("does nothing for a name that is neither a key nor a group", () => {
    const spy = quiet();
    const s = mount(items(10));
    settle();

    act(() => ref.current?.scrollToObject("nowhere"));
    settle();

    const at = s.el.scrollTop;
    s.unmount();
    spy.mockRestore();

    expect(at).toBe(0);
  });
});

/**
 * How far the end is, is the thing a caller cannot work out alone: with
 * `render` the content is not in the document, and with a measured size only
 * the library knows its length.
 */
describe("MorphScroll — onScrollPosition reports the end", () => {
  it("hands over how far each axis can go", () => {
    const spy = quiet();
    const seen: { x: number; y: number }[] = [];

    const { container, unmount } = render(
      <MorphScroll
        size={[100, 300]}
        objects={{ size: 100 }}
        render="virtual"
        onScrollPosition={(_left, _top, max) => seen.push(max)}
      >
        {items(20)}
      </MorphScroll>,
    );
    const el = container.querySelector<HTMLElement>(".ms-viewport")!;
    stubLayout(el, {
      clientWidth: 100,
      clientHeight: 300,
      scrollWidth: 100,
      scrollHeight: 2000,
    });

    fireEvent.scroll(el, { target: { scrollTop: 120 } });

    unmount();
    spy.mockRestore();

    // twenty objects of 100 in a 300 window
    expect(seen.at(-1)).toEqual({ x: 0, y: 1700 });
  });
});

/**
 * On an Arabic or Hebrew page `direction: rtl` is inherited, and a scrolling
 * box counts `scrollLeft` from the right — negative to the left. Every sum
 * here counts in pixels from the left, so the origin is pinned; the page's
 * own direction goes back onto the content.
 */
describe("MorphScroll — inside a right-to-left page", () => {
  it("pins the scroll origin and hands the direction to the content", () => {
    const spy = quiet();

    const host = document.createElement("div");
    host.setAttribute("dir", "rtl");
    host.style.direction = "rtl";
    document.body.appendChild(host);

    const { container, unmount } = render(
      <MorphScroll size={[300, 100]} direction="x" objects={{ size: 100 }}>
        {items(9)}
      </MorphScroll>,
      { container: host },
    );

    const viewport = container.querySelector<HTMLElement>(".ms-viewport")!;
    const wrapper = container.querySelector<HTMLElement>(".ms-objects-wrapper")!;

    const viewportDir = viewport.style.direction;
    const wrapperDir = wrapper.style.direction;

    unmount();
    host.remove();
    spy.mockRestore();

    expect(viewportDir).toBe("ltr");
    expect(wrapperDir).toBe("rtl");
  });

  it("leaves a left-to-right page exactly as it was", () => {
    const spy = quiet();
    const { container, unmount } = render(
      <MorphScroll size={[300, 100]} direction="x" objects={{ size: 100 }}>
        {items(9)}
      </MorphScroll>,
    );

    const wrapper = container.querySelector<HTMLElement>(".ms-objects-wrapper")!;
    const dir = wrapper.style.direction;

    unmount();
    spy.mockRestore();

    expect(dir).toBe("ltr");
  });
});

/**
 * Three things a reader does without thinking: tap the dot they want, scroll
 * a page that happens to have a list on it, and come back to a list that has
 * changed underneath them.
 */
describe("MorphScroll — second pass", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  const settle = (ms = 800) =>
    act(() => {
      vi.advanceTimersByTime(ms);
    });

  it("a dot answers a tap in both slider modes", () => {
    const spy = quiet();

    for (const mode of ["slider", "sliderMenu"] as const) {
      const u = render(
        <MorphScroll
          size={[100, 300]}
          mode={mode}
          objects={{ size: 300 }}
          controls={{ wheel: true, bar: <i /> }}
        >
          {items(6)}
        </MorphScroll>,
      );
      const el = u.container.querySelector<HTMLElement>(".ms-viewport")!;
      stubLayout(el, {
        clientWidth: 100,
        clientHeight: 300,
        scrollWidth: 100,
        scrollHeight: 1800,
      });
      settle(100);

      const dots = u.container.querySelectorAll<HTMLElement>(".ms-slider-item");

      act(() => {
        pointer("pointerdown", 5, 5, dots[2]);
        pointer("pointerup", 5, 5, document);
        dots[2].click();
      });
      settle();

      const at = el.scrollTop;
      u.unmount();

      expect(at, `${mode} did not answer the tap`).toBe(600);
    }

    spy.mockRestore();
  });

  it("hands the wheel outward once it has nowhere left to go", () => {
    const spy = quiet();
    const u = render(
      <MorphScroll size={[200, 300]} objects={{ size: 200 }}>
        <div key="head">head</div>
        <div key="nested">
          <MorphScroll size={[180, 200]} objects={{ size: 100 }}>
            {items(6, "inner")}
          </MorphScroll>
        </div>
        <div key="tail">tail</div>
      </MorphScroll>,
    );

    const views = u.container.querySelectorAll<HTMLElement>(".ms-viewport");
    const [outer, inner] = [views[0], views[1]];

    stubLayout(outer, {
      clientWidth: 200,
      clientHeight: 300,
      scrollWidth: 200,
      scrollHeight: 900,
    });
    stubLayout(inner, {
      clientWidth: 180,
      clientHeight: 200,
      scrollWidth: 180,
      scrollHeight: 600,
    });
    settle(100);

    // the inner one takes it first, and the outer stays where it is
    fireEvent.wheel(inner, { deltaY: 120 });
    settle();
    expect(inner.scrollTop).toBeGreaterThan(0);
    expect(outer.scrollTop).toBe(0);

    // at its end it stops taking, and the page under it moves instead
    act(() => {
      inner.scrollTop = 400;
    });
    settle();
    fireEvent.wheel(inner, { deltaY: 300 });
    settle();

    const outerAt = outer.scrollTop;
    u.unmount();
    spy.mockRestore();

    expect(outerAt).toBeGreaterThan(0);
  });

  it("brings an object into view on both axes at once", () => {
    const spy = quiet();
    const ref = React.createRef<MorphScrollHandle>();
    const u = render(
      <MorphScroll
        ref={ref}
        size={[200, 200]}
        direction="hybrid"
        objects={{ size: 100, lines: 3 }}
      >
        {items(12)}
      </MorphScroll>,
    );
    const el = u.container.querySelector<HTMLElement>(".ms-viewport")!;
    stubLayout(el, {
      clientWidth: 200,
      clientHeight: 200,
      scrollWidth: 400,
      scrollHeight: 400,
    });
    settle(100);

    act(() => ref.current?.scrollToObject(7));
    settle();

    const at = [el.scrollLeft, el.scrollTop];
    u.unmount();
    spy.mockRestore();

    // seven objects into a grid three wide: second row, second column
    expect(at).toEqual([100, 200]);
  });

  it("forgets the keys of objects that left the list", () => {
    const spy = quiet();

    const view = (gen: number) => (
      <MorphScroll size={[100, 300]} objects={{ size: 100 }} render="lazy">
        {items(6, `gen${gen}`)}
      </MorphScroll>
    );

    const u = render(view(0));
    const el = u.container.querySelector<HTMLElement>(".ms-viewport")!;
    stubLayout(el, {
      clientWidth: 100,
      clientHeight: 300,
      scrollWidth: 100,
      scrollHeight: 600,
    });

    for (let gen = 1; gen <= 30; gen++)
      act(() => {
        u.rerender(view(gen));
        fireEvent.scroll(el, { target: { scrollTop: gen } });
        vi.advanceTimersByTime(300);
      });

    // whatever is remembered, the tree only ever holds the current list
    const boxes = u.container.querySelectorAll(".ms-object-box").length;
    u.unmount();
    spy.mockRestore();

    expect(boxes).toBeLessThanOrEqual(6);
  });
});

/**
 * The layout and the sizes say the same thing from two ends. Handing a side
 * to the objects with `"auto"` says it in sizes; `objects.layout` says it in
 * words. Naming it has to land in exactly the same place.
 */
describe("MorphScroll — objects.layout", () => {
  const varied = (n: number) =>
    Array.from({ length: n }, (_, i) => (
      <div key={`card-${i}`} style={{ height: 40 + (i % 3) * 20 }}>
        card {i}
      </div>
    ));

  const boxes = (props: Partial<MorphScrollProps>) => {
    const { container, unmount } = render(
      <MorphScroll size={[300, 300]} {...(props as MorphScrollProps)}>
        {varied(9)}
      </MorphScroll>,
    );
    const out = Array.from(
      container.querySelectorAll<HTMLElement>(".ms-object-box"),
    ).map((el) => el.getAttribute("style"));
    unmount();
    return out;
  };

  it("naming the layout lands where the sizes would have", () => {
    const spy = quiet();

    const bySize = boxes({ objects: { size: [90, "auto"], gap: 10 } });
    const byName = boxes({
      objects: { layout: "masonry", size: [90, "auto"], gap: 10 },
    });

    spy.mockRestore();
    expect(byName).toEqual(bySize);
  });

  it("takes the side it measures, so one number is enough", () => {
    const spy = quiet();

    const long = boxes({ objects: { layout: "masonry", size: [90, "auto"], gap: 10 } });
    const short = boxes({ objects: { layout: "masonry", size: 90, gap: 10 } });

    spy.mockRestore();
    expect(short).toEqual(long);
  });

  it("flow takes the other side", () => {
    const spy = quiet();

    const long = boxes({ objects: { layout: "flow", size: ["auto", 40], gap: 10 } });
    const short = boxes({ objects: { layout: "flow", size: 40, gap: 10 } });

    spy.mockRestore();
    expect(short).toEqual(long);
  });

  it("fill needs no size at all", () => {
    const spy = quiet();

    const bySize = boxes({ objects: { size: "auto", gap: 10 } });
    const byName = boxes({ objects: { layout: "fill", gap: 10 } });

    spy.mockRestore();
    expect(byName).toEqual(bySize);
  });

  it("says so when a grid is asked to measure", () => {
    const spy = quiet();
    boxes({ objects: { layout: "grid", size: [90, "auto"] } });

    const said = errorsOf(spy).some((m) => /grid/.test(m));
    spy.mockRestore();

    expect(said).toBe(true);
  });

  it("leaves a plain grid alone", () => {
    const spy = quiet();
    const out = boxes({ objects: { size: 90, gap: 10, lines: 3 } });

    const complaints = errorsOf(spy);
    spy.mockRestore();

    expect(complaints).toEqual([]);
    expect(out.length).toBe(9);
  });
});

describe("MorphScroll — the bar on a right-to-left page", () => {
  const barStyle = (host?: HTMLElement) => {
    const { container, unmount } = render(
      <MorphScroll
        size={[100, 300]}
        objects={{ size: 100 }}
        controls={{ wheel: true, bar: <i /> }}
      >
        {items(9)}
      </MorphScroll>,
      host ? { container: host } : undefined,
    );
    const style =
      container.querySelector<HTMLElement>(".ms-bar")?.getAttribute("style") ??
      "";
    unmount();
    return style;
  };

  it("stands on the left, where the reading starts", () => {
    const spy = quiet();

    const host = document.createElement("div");
    host.style.direction = "rtl";
    document.body.appendChild(host);

    const rtl = barStyle(host);
    const ltr = barStyle();

    host.remove();
    spy.mockRestore();

    expect(ltr).toMatch(/right:/);
    expect(rtl).toMatch(/left:/);
  });
});

describe("MorphScroll — a gesture inside a nested scroll", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  const nest = (innerCount: number) => (
    <MorphScroll
      size={[200, 300]}
      objects={{ size: 200 }}
      controls={{ drag: true }}
    >
      <div key="head">head</div>
      <div key="nested">
        <MorphScroll
          size={[180, 200]}
          objects={{ size: 100 }}
          controls={{ drag: true }}
        >
          {items(innerCount, "inner")}
        </MorphScroll>
      </div>
      <div key="tail">tail</div>
    </MorphScroll>
  );

  it("moves the list under the finger, and only that one", () => {
    const spy = quiet();
    const u = render(
      <MorphScroll
        size={[200, 300]}
        objects={{ size: 200 }}
        controls={{ drag: true }}
      >
        <div key="head">head</div>
        <div key="nested">
          <MorphScroll
            size={[180, 200]}
            objects={{ size: 100 }}
            controls={{ drag: true }}
          >
            {items(6, "inner")}
          </MorphScroll>
        </div>
        <div key="tail">tail</div>
      </MorphScroll>,
    );

    const views = u.container.querySelectorAll<HTMLElement>(".ms-viewport");
    const [outer, inner] = [views[0], views[1]];

    stubLayout(outer, {
      clientWidth: 200,
      clientHeight: 300,
      scrollWidth: 200,
      scrollHeight: 900,
    });
    stubLayout(inner, {
      clientWidth: 180,
      clientHeight: 200,
      scrollWidth: 180,
      scrollHeight: 600,
      top: 100,
    });
    act(() => {
      vi.advanceTimersByTime(100);
    });

    drag(inner, [
      [50, 250],
      [50, 220],
      [50, 190],
      [50, 160],
    ]);
    act(() => {
      pointer("pointerup", 50, 160, document);
      vi.advanceTimersByTime(300);
    });

    const at = { inner: inner.scrollTop, outer: outer.scrollTop };
    u.unmount();
    spy.mockRestore();

    expect(at.inner).toBeGreaterThan(0);
    expect(at.outer).toBe(0);
  });

  it("passes the gesture outward when it has nothing to scroll", () => {
    // a short list inside a long one used to swallow the drag whole: the
    // finger rested on it and nothing moved anywhere
    const spy = quiet();
    const u = render(nest(1));

    const views = u.container.querySelectorAll<HTMLElement>(".ms-viewport");
    const [outer, inner] = [views[0], views[1]];

    stubLayout(outer, {
      clientWidth: 200,
      clientHeight: 300,
      scrollWidth: 200,
      scrollHeight: 900,
    });
    stubLayout(inner, {
      clientWidth: 180,
      clientHeight: 200,
      scrollWidth: 180,
      scrollHeight: 100,
      top: 100,
    });
    act(() => {
      vi.advanceTimersByTime(100);
    });

    drag(inner, [
      [50, 250],
      [50, 220],
      [50, 190],
      [50, 160],
    ]);
    act(() => {
      pointer("pointerup", 50, 160, document);
      vi.advanceTimersByTime(300);
    });

    const at = { inner: inner.scrollTop, outer: outer.scrollTop };
    u.unmount();
    spy.mockRestore();

    expect(at.inner).toBe(0);
    expect(at.outer).toBeGreaterThan(0);
  });
});

/**
 * With `render` only a window of the objects is in the document. A screen
 * reader announces what is there, so without a count it would report a list
 * of a dozen and give no way to tell where in the real list you are.
 */
describe("MorphScroll — objects.semantics", () => {
  const boxes = (props: Partial<MorphScrollProps>) => {
    const { container, unmount } = render(
      <MorphScroll
        size={[100, 300]}
        objects={{ size: 100 }}
        render="virtual"
        {...(props as MorphScrollProps)}
      >
        {items(40)}
      </MorphScroll>,
    );
    const wrapper = container.querySelector(".ms-objects-wrapper")!;
    const first = container.querySelector(".ms-object-box")!;
    const out = {
      wrapper: wrapper.getAttribute("role"),
      role: first.getAttribute("role"),
      size: first.getAttribute("aria-setsize"),
      at: first.getAttribute("aria-posinset"),
      drawn: container.querySelectorAll(".ms-object-box").length,
    };
    unmount();
    return out;
  };

  it("says how long the list really is, and where each object sits in it", () => {
    const spy = quiet();
    const out = boxes({ objects: { size: 100, semantics: "list" } });
    spy.mockRestore();

    expect(out.wrapper).toBe("list");
    expect(out.role).toBe("listitem");
    expect(out.at).toBe("1");
    // the count is the whole list, not the handful that is mounted
    expect(out.size).toBe("40");
    expect(out.drawn).toBeLessThan(40);
  });

  it("claims nothing when it was not asked to", () => {
    const spy = quiet();
    const out = boxes({});
    spy.mockRestore();

    expect(out.wrapper).toBeNull();
    expect(out.role).toBeNull();
    expect(out.size).toBeNull();
  });
});

/**
 * A group is named in the child's own key. Its first object is its heading,
 * and `groups: "sticky"` keeps that heading in view for as long as any of the
 * group is, so it always says which group you are looking at.
 */
describe("MorphScroll — sticky groups", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  const grouped = () =>
    ["a", "b", "c"].flatMap((name) =>
      Array.from({ length: 4 }, (_, i) => (
        <div key={`${name}-${i}[${name}]`}>
          {name} {i}
        </div>
      )),
    );

  const mount = (props: Partial<MorphScrollProps> = {}) => {
    const u = render(
      <MorphScroll
        size={[100, 300]}
        objects={{ size: 100, groups: "sticky" }}
        {...(props as MorphScrollProps)}
      >
        {grouped()}
      </MorphScroll>,
    );
    const el = u.container.querySelector<HTMLElement>(".ms-viewport")!;
    stubLayout(el, {
      clientWidth: 100,
      clientHeight: 300,
      scrollWidth: 100,
      scrollHeight: 1200,
    });
    return { ...u, el };
  };

  const at = (u: ReturnType<typeof mount>) => {
    const held = u.container.querySelector<HTMLElement>(".ms-sticky");
    if (!held) return null;

    const move = /translate\((-?[\d.]+)px,\s*(-?[\d.]+)px\)/.exec(
      held.style.transform,
    );

    return {
      key: held.getAttribute("ms-wrap-id"),
      top: move ? Number(move[2]) : null,
    };
  };

  const scroll = (u: ReturnType<typeof mount>, top: number) =>
    act(() => {
      fireEvent.scroll(u.el, { target: { scrollTop: top } });
      vi.advanceTimersByTime(60);
    });

  it("holds the heading of the group under the edge", () => {
    const spy = quiet();
    const u = mount();
    scroll(u, 250);

    const held = at(u);
    u.unmount();
    spy.mockRestore();

    // the first group runs 0..400, so its heading is still the one in charge
    expect(held?.key).toBe("a-0[a]");
    expect(held?.top).toBe(250);
  });

  it("hands over to the next group when it arrives", () => {
    const spy = quiet();
    const u = mount();
    scroll(u, 500);

    const held = at(u);
    u.unmount();
    spy.mockRestore();

    expect(held?.key).toBe("b-0[b]");
  });

  it("lets the arriving group push the one before it out", () => {
    const spy = quiet();
    const u = mount();
    // 100 short of the second group: the first heading is being pushed off
    scroll(u, 300);

    const held = at(u);
    u.unmount();
    spy.mockRestore();

    expect(held?.key).toBe("a-0[a]");
    expect(held?.top).toBe(300);
  });

  it("holds nothing when it was not asked to", () => {
    const spy = quiet();
    const u = mount({ objects: { size: 100 } });
    scroll(u, 250);

    const held = at(u);
    u.unmount();
    spy.mockRestore();

    expect(held).toBeNull();
  });
});
