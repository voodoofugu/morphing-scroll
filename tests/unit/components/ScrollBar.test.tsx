import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, fireEvent, act } from "@testing-library/react";
import MorphScroll from "@morphing-scroll/src/components/MorphScroll";
import CONST from "@morphing-scroll/src/constants";

const OBJ = 100;
const VIEW = 300;

const items = (n: number) =>
  Array.from({ length: n }, (_, i) => <div key={`item-${i}`}>item {i}</div>);

const withBar = (count: number) => (
  <MorphScroll objects={{ size: OBJ }}
    size={[100, VIEW]}
    progressTrigger={{ wheel: true, bar: <div className="knob" /> }}
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
    const el = container.querySelector<HTMLElement>(".ms-viewport")!;

    fireEvent.wheel(bar, { deltaY: 200 });
    settle();

    expect(el.scrollTop).toBe(200);
  });

  /*
   * stopPropagation молчит только для слушателей — браузер всё равно катит
   * ближайшего прокручиваемого предка. Поэтому колесо над баром двигало и
   * содержимое скролла, и страницу под ним.
   */
  it("keeps the page out of it", () => {
    const { container } = render(withBar(20));
    const bar = container.querySelector<HTMLElement>(".ms-bar")!;

    const event = new WheelEvent("wheel", {
      deltaY: 200,
      bubbles: true,
      cancelable: true,
    });
    bar.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
  });

  it("follows the new scroll range after the child count changes", () => {
    // 5 items -> max scroll 200; 20 items -> max scroll 1700
    const { container, rerender } = render(withBar(5));
    const bar = container.querySelector<HTMLElement>(".ms-bar")!;
    const el = container.querySelector<HTMLElement>(".ms-viewport")!;

    rerender(withBar(20));

    fireEvent.wheel(bar, { deltaY: 5000 });
    settle();

    expect(el.scrollTop).toBe(20 * OBJ - VIEW);
  });
});

describe("ScrollBar — showOnHover", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  const onHover = (
    <MorphScroll objects={{ size: OBJ }}
      size={[100, VIEW]}
      progressTrigger={{
        wheel: true,
        bar: { element: <div className="knob" />, showOnHover: true },
      }}
    >
      {items(20)}
    </MorphScroll>
  );

  const visibility = (bar: HTMLElement) =>
    bar.style.getPropertyValue("--ms-bar-visibility");

  it("reports visibility through a CSS variable, not inline opacity", () => {
    const { container } = render(onHover);
    const bar = container.querySelector<HTMLElement>(".ms-bar")!;

    expect(visibility(bar)).toBe("0");
    expect(bar.style.opacity).toBe("");
  });

  it("sets no variable when the prop is off", () => {
    const { container } = render(withBar(20));
    const bar = container.querySelector<HTMLElement>(".ms-bar")!;

    expect(visibility(bar)).toBe("");
    expect(bar.style.opacity).toBe("");
  });

  it("moves the variable and the state classes across a scroll", () => {
    const { container } = render(onHover);
    const bar = container.querySelector<HTMLElement>(".ms-bar")!;
    const el = container.querySelector<HTMLElement>(".ms-viewport")!;

    act(() => {
      fireEvent.scroll(el, { target: { scrollTop: 100 } });
    });

    expect(visibility(bar)).toBe("1");
    expect(bar).toHaveClass("ms-hover");

    // scroll-end delay, then the extra pause before the bar hides
    act(() => {
      vi.advanceTimersByTime(CONST.SCROLL_END_DELAY + 1050);
    });

    expect(visibility(bar)).toBe("0");
    expect(bar).toHaveClass("ms-leave");

    // ms-leave is a transition marker and clears itself
    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(bar).not.toHaveClass("ms-leave");
    expect(bar).not.toHaveClass("ms-hover");
  });

  it("never uses the unprefixed hover/leave classes", () => {
    const { container } = render(onHover);
    const el = container.querySelector<HTMLElement>(".ms-viewport")!;

    act(() => {
      fireEvent.scroll(el, { target: { scrollTop: 100 } });
    });

    expect(container.querySelector(".ms-bar.hover")).toBeNull();
    expect(container.querySelector(".ms-bar.leave")).toBeNull();
  });
});

describe("ScrollBar — a changed progressElement", () => {
  const withThumb = (label: string) => (
    <MorphScroll objects={{ size: OBJ }}
      size={[100, VIEW]}
      progressTrigger={{ wheel: true, bar: <b>{label}</b> }}
    >
      {items(20)}
    </MorphScroll>
  );

  const withDots = (label: string) => (
    <MorphScroll objects={{ size: VIEW }}
      size={[100, VIEW]}
      mode="sliderMenu"
      progressTrigger={{ wheel: true, bar: <b>{label}</b> }}
    >
      {items(9)}
    </MorphScroll>
  );

  it("reaches the thumb", () => {
    const { container, rerender } = render(withThumb("A"));
    expect(container.querySelector(".ms-thumb")).toHaveTextContent("A");

    rerender(withThumb("B"));
    expect(container.querySelector(".ms-thumb")).toHaveTextContent("B");
  });

  it("reaches the slider elements", () => {
    const { container, rerender } = render(withDots("A"));
    expect(container.querySelector(".ms-slider-item")).toHaveTextContent("A");

    rerender(withDots("B"));
    expect(container.querySelector(".ms-slider-item")).toHaveTextContent("B");
  });

  it("does not rebuild the slider when the element is merely re-created", () => {
    const { container, rerender } = render(withDots("A"));
    const first = container.querySelector(".ms-slider-item");

    rerender(withDots("A"));

    // same content, so the memoized list is kept as it was
    expect(container.querySelector(".ms-slider-item")).toBe(first);
  });
});

describe("ScrollBar — edgeGap", () => {
  const bar = (config: unknown) =>
    render(
      <MorphScroll objects={{ size: OBJ }}
        size={[100, VIEW]}
        progressTrigger={{ wheel: true, bar: config as never }}
      >
        {items(20)}
      </MorphScroll>,
    ).container.querySelector<HTMLElement>(".ms-bar")!;

  it("sits flush against its side by default", () => {
    expect(bar(<i />).style.right).toBe("0px");
  });

  it("pushes the bar inward for a positive value", () => {
    expect(bar({ element: <i />, edgeGap: 12 }).style.right).toBe("12px");
  });

  it("pushes the bar past the edge for a negative value", () => {
    expect(bar({ element: <i />, edgeGap: -20 }).style.right).toBe("-20px");
  });

  it("moves to the other side together with reverse", () => {
    const el = bar({ element: <i />, edgeGap: 8, reverse: true });
    expect(el.style.left).toBe("8px");
    expect(el.style.right).toBe("");
  });

  it("still renders the element passed in the object form", () => {
    const el = bar({ element: <i className="knob" /> });
    expect(el.querySelector(".knob")).not.toBeNull();
  });

  it("takes the axis pair for a hybrid scroll", () => {
    const { container } = render(
      <MorphScroll objects={{ size: 100, crossCount: 4 }}
        size={[300, 300]}
        direction="hybrid"
        progressTrigger={{
          wheel: true,
          bar: { element: <i />, edgeGap: [4, 16] },
        }}
      >
        {items(20)}
      </MorphScroll>,
    );
    const bars = Array.from(container.querySelectorAll<HTMLElement>(".ms-bar"));
    const axis = (b: HTMLElement) => b.getAttribute("ms-direction");
    const vertical = bars.find((b) => axis(b) === "y")!;
    const horizontal = bars.find((b) => axis(b) === "x")!;

    expect(vertical.style.right).toBe("16px");
    /*
     * Горизонтальный бар до поворота — столбик длиной во всю ширину скролла,
     * поэтому его нельзя цеплять за `bottom`: оно отсчитывает по этой длине и
     * уносит бар выше скролла. Якорь — нижний край, отсюда `calc`.
     */
    expect(horizontal.style.bottom).toBe("");
    expect(horizontal.style.top).toBe("calc(100% - 4px)");
  });

  it("gives a single horizontal scroll the x half of the pair", () => {
    const { container } = render(
      <MorphScroll objects={{ size: 100 }}
        size={[300, 300]}
        direction="x"
        progressTrigger={{
          wheel: true,
          bar: { element: <i />, edgeGap: [4, 16], reverse: [true, false] },
        }}
      >
        {items(20)}
      </MorphScroll>,
    );
    const el = container.querySelector<HTMLElement>(".ms-bar")!;

    // единственный бар здесь горизонтальный, и настройки берёт по своей оси
    expect(el.getAttribute("ms-direction")).toBe("x");
    expect(el.style.top).toBe("4px"); // reverse[0] === true — бар наверху
  });
});
