import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, fireEvent, act } from "@testing-library/react";
import MorphScroll from "@morphing-scroll/src/components/MorphScroll";
import type { MorphScroll as MorphScrollProps } from "@morphing-scroll/src/types/types";
import { getContainers } from "@morphing-scroll/src/helpers/autoScrollRegistry";

/**
 * Every prop has to actually do something.
 *
 * Each case renders the same scroll twice — once with a baseline value, once
 * with a changed one — and demands the rendered result differ. It is a blunt
 * check on purpose: it says nothing about *what* a prop does, only that the
 * component is listening. A prop that silently stopped being read shows up
 * here and nowhere else.
 */
const items = (n: number) =>
  Array.from({ length: n }, (_, i) => (
    <div key={`item-${i}`} className="cell">
      item {i}
    </div>
  ));

/** never resolves, so the Suspense boundary stays on its fallback */
const Suspends = (): React.ReactElement => {
  throw new Promise<void>(() => {});
};

const BASE: MorphScrollProps = {
  size: [300, 300],
  objectsSize: 100,
  children: items(12),
};

const markup = (props: Partial<MorphScrollProps>) => {
  const { container, unmount } = render(
    <MorphScroll {...BASE} {...(props as MorphScrollProps)} />,
  );
  const html = container.querySelector("[morph-scroll]")!.outerHTML;
  unmount();
  return html;
};

/** [name, baseline, changed] */
const cases: Array<[string, Partial<MorphScrollProps>, Partial<MorphScrollProps>]> = [
  ["className", {}, { className: "mine" }],
  ["children", {}, { children: items(3) }],
  ["mode", { progressTrigger: { bar: <i /> } }, { mode: "slider", objectsSize: 300, progressTrigger: { bar: <i /> } }],
  ["direction", {}, { direction: "x" }],
  ["size", {}, { size: [200, 150] }],
  ["objectsSize", {}, { objectsSize: 60 }],
  ["objectsSize: full", {}, { objectsSize: "full" }],
  ["crossCount", {}, { crossCount: 2 }],
  ["gap", {}, { gap: 20 }],
  ["gap pair", { gap: 20 }, { gap: [20, 5] }],
  ["wrapper.margin", {}, { wrapper: { margin: 15 } }],
  ["wrapper.minSize", {}, { wrapper: { minSize: 900 } }],
  ["wrapper.align", { size: [900, 900] }, { size: [900, 900], wrapper: { align: "center" } }],
  ["objectsAlign", {}, { objectsAlign: "center" }],
  ["objectsDirection", { crossCount: 2 }, { crossCount: 2, objectsDirection: "column" }],
  ["edge", {}, { edge: true }],
  ["edge node", { edge: true }, { edge: <u /> }],
  ["render", {}, { render: "virtual" }],
  ["render.rootMargin", { render: "virtual" }, { render: { mode: "virtual", rootMargin: 300 } }],
  ["render.trackVisibility", { render: "virtual" }, { render: { mode: "virtual", trackVisibility: true } }],
  // the placeholder only shows where something is missing
  ["fallback", { suspending: true, children: <Suspends key="a" /> },
    { suspending: true, fallback: <b className="mine" />, children: <Suspends key="a" /> }],

  // — progressTrigger —
  ["progressTrigger.wheel", { progressTrigger: { bar: true } }, { progressTrigger: { wheel: true, bar: true } }],
  ["progressTrigger.content", {}, { progressTrigger: { content: true } }],
  ["progressTrigger.arrows", {}, { progressTrigger: { arrows: true } }],
  ["arrows.element", { progressTrigger: { arrows: true } }, { progressTrigger: { arrows: { element: <b /> } } }],
  ["arrows.size", { progressTrigger: { arrows: { element: <b /> } } }, { progressTrigger: { arrows: { element: <b />, size: 80 } } }],
  ["arrows.reserveSpace", { progressTrigger: { arrows: { element: <b /> } } }, { progressTrigger: { arrows: { element: <b />, reserveSpace: false } } }],
  ["arrows.loop", { progressTrigger: { arrows: { element: <b /> } } }, { progressTrigger: { arrows: { element: <b />, loop: true } } }],

  // — progressTrigger.bar —
  ["bar", {}, { progressTrigger: { bar: <i /> } }],
  ["bar: true", {}, { progressTrigger: { bar: true } }],
  ["bar.element", { progressTrigger: { bar: <i /> } }, { progressTrigger: { bar: <u /> } }],
  ["bar.edgeGap", { progressTrigger: { bar: <i /> } }, { progressTrigger: { bar: { element: <i />, edgeGap: 12 } } }],
  ["bar.trackGap", { progressTrigger: { bar: <i /> } }, { progressTrigger: { bar: { element: <i />, trackGap: 20 } } }],
  ["bar.reverse", { progressTrigger: { bar: <i /> } }, { progressTrigger: { bar: { element: <i />, reverse: true } } }],
  ["bar.showOnHover", { progressTrigger: { bar: <i /> } }, { progressTrigger: { bar: { element: <i />, showOnHover: true } } }],
  // 12 items over 3 columns make a 400px wrapper, so the thumb is 225px
  // on its own — the floor has to be above that to bind
  ["bar.thumbMinSize", { progressTrigger: { bar: <i /> } }, { progressTrigger: { bar: { element: <i />, thumbMinSize: 280 } } }],
];

describe("MorphScroll — every prop is read", () => {
  for (const [name, base, changed] of cases)
    it(name, () => {
      expect(markup(changed)).not.toBe(markup(base));
    });
});

describe("MorphScroll — the x-axis bar settings need an x-axis bar", () => {
  // this is what makes them look broken in isolation: with direction="y"
  // there is no horizontal bar for the x half of the pair to act on
  const hybrid = (bar: Record<string, unknown>) =>
    markup({
      direction: "hybrid",
      crossCount: 4,
      progressTrigger: { bar: { element: <i />, ...bar } as never },
    });

  it("edgeGap x moves the horizontal bar", () => {
    expect(hybrid({ edgeGap: [30, 0] })).not.toBe(hybrid({ edgeGap: [0, 0] }));
  });

  it("trackGap x shortens the horizontal bar", () => {
    expect(hybrid({ trackGap: [30, 0] })).not.toBe(hybrid({ trackGap: [0, 0] }));
  });

  it("but does nothing on a single vertical axis", () => {
    const y = (bar: Record<string, unknown>) =>
      markup({ progressTrigger: { bar: { element: <i />, ...bar } as never } });

    expect(y({ edgeGap: [30, 0] })).toBe(y({ edgeGap: [0, 0] }));
  });
});

describe("MorphScroll — props with no visible markup", () => {
  it("autoScrollOnDrag registers the container", () => {
    const before = getContainers().size;
    const { unmount } = render(<MorphScroll {...BASE} autoScrollOnDrag />);
    expect(getContainers().size).toBe(before + 1);
    unmount();
    expect(getContainers().size).toBe(before);
  });

  it("scrollPosition reaches the scroll element", async () => {
    vi.useFakeTimers();
    const { container } = render(
      <MorphScroll {...BASE} crossCount={1} scrollPosition={200} />,
    );
    const el = container.querySelector<HTMLElement>(".ms-viewport")!;
    Object.defineProperty(el, "clientHeight", { value: 300, configurable: true });
    Object.defineProperty(el, "scrollHeight", { value: 1200, configurable: true });

    // the first-render path awaits a frame at a time, so microtasks have to
    // run between them
    for (let i = 0; i < 8; i++) {
      await act(async () => {
        vi.advanceTimersToNextFrame();
        await Promise.resolve();
      });
    }

    expect(el.scrollTop).toBe(200);
    vi.useRealTimers();
  });

  it("onScrollPosition, onScrollingChange and onRenderedKeysChange all fire", () => {
    const onScrollPosition = vi.fn();
    const onScrollingChange = vi.fn();
    const onRenderedKeysChange = vi.fn();

    const { container } = render(
      <MorphScroll
        {...BASE}
        onScrollPosition={onScrollPosition}
        onScrollingChange={onScrollingChange}
        onRenderedKeysChange={onRenderedKeysChange}
      />,
    );
    const el = container.querySelector<HTMLElement>(".ms-viewport")!;
    act(() => {
      fireEvent.scroll(el, { target: { scrollTop: 120 } });
    });

    expect(onScrollPosition).toHaveBeenCalled();
    expect(onScrollingChange).toHaveBeenCalledWith(true);
    expect(onRenderedKeysChange).toHaveBeenCalled();
  });

  it("emptyObjects removes an empty cell", async () => {
    const Empty = () => null;
    const { container } = render(
      <MorphScroll
        size={[300, 300]}
        objectsSize={100}
        render="virtual"
        emptyObjects="clear"
      >
        <div key="a">a</div>
        <Empty key="b" />
        <div key="c">c</div>
      </MorphScroll>,
    );
    await vi.waitFor(() =>
      expect(container.querySelectorAll(".ms-object-box")).toHaveLength(2),
    );
  });

  it("emptyObjects.clickTrigger marks the object it was clicked in", () => {
    vi.useFakeTimers();
    const { container } = render(
      <MorphScroll
        size={[300, 300]}
        objectsSize={100}
        render="virtual"
        emptyObjects={{
          mode: "clear",
          clickTrigger: { selector: ".kill", delay: 50 },
        }}
      >
        <div key="a">
          <button className="kill">x</button>
        </div>
        <div key="b">b</div>
      </MorphScroll>,
    );

    act(() => {
      fireEvent.click(container.querySelector<HTMLElement>(".kill")!);
    });
    expect(container.querySelector(".ms-object-box.ms-remove")).not.toBeNull();

    // класс живёт ровно до срока, потом запускается пересчёт пустых ключей
    act(() => {
      vi.advanceTimersByTime(60);
    });
    expect(container.querySelector(".ms-object-box.ms-remove")).toBeNull();
    vi.useRealTimers();
  });

  it("render.stopLoadOnScroll holds the content back while scrolling", async () => {
    const { container } = render(
      <MorphScroll
        size={[300, 300]}
        objectsSize={100}
        crossCount={1}
        render={{ mode: "virtual", stopLoadOnScroll: true }}
        fallback={<b className="held" />}
      >
        {items(20)}
      </MorphScroll>,
    );
    const el = container.querySelector<HTMLElement>(".ms-viewport")!;
    Object.defineProperty(el, "clientHeight", { value: 300, configurable: true });
    Object.defineProperty(el, "scrollHeight", { value: 2000, configurable: true });

    act(() => {
      fireEvent.scroll(el, { target: { scrollTop: 900 } });
    });

    await vi.waitFor(() =>
      expect(container.querySelector("b.held")).not.toBeNull(),
    );
  });

  it("suspending puts a boundary around the cells", () => {
    const { container } = render(
      <MorphScroll size={[300, 300]} objectsSize={100} suspending fallback={<b className="sk" />}>
        <Suspends key="a" />
      </MorphScroll>,
    );
    expect(container.querySelector(".sk")).not.toBeNull();
  });
});

describe("MorphScroll — size auto before anything is measured", () => {
  /*
   * `size="auto"` до первого измерения — ноль, а страниц слайдера ровно
   * столько, сколько окон помещается в контенте: деление на этот ноль
   * давало бесконечность, и бар пытался отрисовать бесконечный список точек.
   */
  it("renders a slider that does not know its viewport yet", () => {
    expect(() =>
      render(
        <MorphScroll
          size="auto"
          mode="slider"
          direction="hybrid"
          objectsSize={[155, 112]}
          crossCount={3}
          progressTrigger={{ wheel: true, bar: <i /> }}
        >
          {Array.from({ length: 12 }, (_, i) => (
            <div key={`item-${i}`}>item {i}</div>
          ))}
        </MorphScroll>,
      ),
    ).not.toThrow();
  });
});
