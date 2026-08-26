import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import handleWheel from "@morphing-scroll/src/helpers/handleWheel";
import type { ScrollStateRefT } from "@morphing-scroll/src/helpers/handleWheel";
import type { Vec2 } from "@morphing-scroll/src/types/types";

const MAX: Vec2 = [1000, 1000];

const makeState = (): ScrollStateRefT => ({
  targetScrollY: 0,
  targetScrollX: 0,
  animating: false,
  animationFrameId: null,
});

const makeScrollEl = () => {
  const el = document.createElement("div");
  el.tabIndex = 0; // .ms-element carries tabIndex for the key handlers
  document.body.appendChild(el);
  return el;
};

const wheel = (deltaY: number) =>
  new WheelEvent("wheel", { deltaY, bubbles: true });

describe("handleWheel", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = "";
  });

  const settle = (frames = 40) => {
    for (let i = 0; i < frames; i++) vi.advanceTimersToNextFrame();
  };

  it("scrolls the vertical axis by the wheel delta", () => {
    const el = makeScrollEl();
    const state = makeState();

    handleWheel(wheel(120), el, MAX, state, "y");
    settle();

    expect(state.targetScrollY).toBe(120);
    expect(el.scrollTop).toBe(120);
  });

  it("routes the delta to the horizontal axis when direction is x", () => {
    const el = makeScrollEl();
    const state = makeState();

    handleWheel(wheel(120), el, MAX, state, "x");
    settle();

    expect(el.scrollLeft).toBe(120);
    expect(el.scrollTop).toBe(0);
  });

  it("accumulates repeated ticks while the animation runs", () => {
    const el = makeScrollEl();
    const state = makeState();

    handleWheel(wheel(100), el, MAX, state, "y");
    handleWheel(wheel(100), el, MAX, state, "y");
    settle();

    expect(el.scrollTop).toBe(200);
  });

  it("clamps to maxScrollSize", () => {
    const el = makeScrollEl();
    const state = makeState();

    handleWheel(wheel(99999), el, MAX, state, "y");
    settle();

    expect(el.scrollTop).toBe(MAX[1]);
  });

  describe("focus", () => {
    it("focuses the scroll element for keyboard navigation", () => {
      const el = makeScrollEl();
      handleWheel(wheel(10), el, MAX, makeState(), "y");

      expect(document.activeElement).toBe(el);
    });

    it("does not steal focus from a field the user is typing in", () => {
      const input = document.createElement("input");
      document.body.appendChild(input);
      const el = makeScrollEl();

      input.focus();
      expect(document.activeElement).toBe(input);

      handleWheel(wheel(10), el, MAX, makeState(), "y");

      expect(document.activeElement).toBe(input);
    });

    it("does not steal focus from a contenteditable region", () => {
      const editor = document.createElement("div");
      editor.setAttribute("contenteditable", "true");
      editor.tabIndex = 0;
      document.body.appendChild(editor);
      const el = makeScrollEl();

      editor.focus();
      handleWheel(wheel(10), el, MAX, makeState(), "y");

      expect(document.activeElement).toBe(editor);
    });

    it("still scrolls while another field keeps the focus", () => {
      const input = document.createElement("input");
      document.body.appendChild(input);
      const el = makeScrollEl();
      input.focus();

      handleWheel(wheel(120), el, MAX, makeState(), "y");
      settle();

      expect(el.scrollTop).toBe(120);
    });
  });
});
