import { describe, it, expect, afterEach } from "vitest";
import { sliderCheck } from "@morphing-scroll/src/helpers/addFunctions";

const build = (pages: number) => {
  const scrollEl = document.createElement("div");
  Object.defineProperty(scrollEl, "clientHeight", { value: 300, configurable: true });
  Object.defineProperty(scrollEl, "clientWidth", { value: 300, configurable: true });

  const bar = document.createElement("div");
  bar.setAttribute("ms-direction", "y");
  for (let i = 0; i < pages; i++) {
    const el = document.createElement("div");
    el.className = "ms-slider-element";
    bar.appendChild(el);
  }
  document.body.append(scrollEl, bar);

  return {
    scrollEl,
    bars: new Set([bar]),
    marked: () =>
      Array.from(bar.children).findIndex((el) =>
        el.classList.contains("ms-active"),
      ),
  };
};

describe("sliderCheck", () => {
  // elements are appended straight to the body here
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("marks the page the viewport is currently on", () => {
    const { scrollEl, bars, marked } = build(4);

    sliderCheck(scrollEl as HTMLDivElement, bars, "y", [1, 4]);
    expect(marked()).toBe(0);

    scrollEl.scrollTop = 300;
    sliderCheck(scrollEl as HTMLDivElement, bars, "y", [1, 4]);
    expect(marked()).toBe(1);
  });

  it("switches the mark instead of accumulating it", () => {
    const { scrollEl, bars, marked } = build(4);

    sliderCheck(scrollEl as HTMLDivElement, bars, "y", [1, 4]);
    scrollEl.scrollTop = 900;
    sliderCheck(scrollEl as HTMLDivElement, bars, "y", [1, 4]);

    expect(marked()).toBe(3);
    expect(document.querySelectorAll(".ms-active")).toHaveLength(1);
  });

  it("rounds to the nearest page at the halfway point", () => {
    const { scrollEl, bars, marked } = build(4);

    scrollEl.scrollTop = 149; // still mostly page 0
    sliderCheck(scrollEl as HTMLDivElement, bars, "y", [1, 4]);
    expect(marked()).toBe(0);

    scrollEl.scrollTop = 151; // past the middle -> page 1
    sliderCheck(scrollEl as HTMLDivElement, bars, "y", [1, 4]);
    expect(marked()).toBe(1);
  });

  it("uses the prefixed class only", () => {
    const { scrollEl, bars } = build(4);
    sliderCheck(scrollEl as HTMLDivElement, bars, "y", [1, 4]);

    expect(document.querySelector(".ms-slider-element.active")).toBeNull();
  });
});
