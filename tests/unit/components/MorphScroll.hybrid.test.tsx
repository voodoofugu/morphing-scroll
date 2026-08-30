import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, fireEvent, act } from "@testing-library/react";
import MorphScroll from "@morphing-scroll/src/components/MorphScroll";

/*
 * `changeDirection` отдаёт колесо горизонтали. Но приоритет имеет смысл, пока
 * по этой оси есть что прокручивать: при неудачном `crossCount` ряд помещается
 * целиком, горизонтали нет, и скролл замирал полностью — колесо уходило на
 * ось, где двигаться некуда.
 */

const items = (n: number) =>
  Array.from({ length: n }, (_, i) => <div key={`item-${i}`}>item {i}</div>);

const wheel = (el: HTMLElement, deltaY: number) => {
  act(() => {
    fireEvent.wheel(el, { deltaY });
  });
  act(() => {
    for (let i = 0; i < 40; i++) vi.advanceTimersToNextFrame();
  });
};

const mount = (crossCount: number) => {
  const utils = render(
    <MorphScroll objects={{ size: 100, crossCount: crossCount }}
      size={[300, 300]}
      direction="hybrid"
      progressTrigger={{ wheel: { changeDirection: true } }}
    >
      {items(12)}
    </MorphScroll>,
  );
  const el = utils.container.querySelector<HTMLElement>(".ms-viewport")!;
  return { ...utils, el };
};

describe("MorphScroll — hybrid wheel priority", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("takes the horizontal axis when there is one", () => {
    // 12 объектов по 100 в 6 колонок — 600 в ширину при окне 300
    const { el } = mount(6);

    wheel(el, 200);
    expect(el.scrollLeft).toBeGreaterThan(0);
    expect(el.scrollTop).toBe(0);
  });

  it("falls back to the axis that can actually move", () => {
    // одна колонка: по горизонтали двигаться некуда, по вертикали — есть куда
    const { el } = mount(1);

    wheel(el, 200);
    expect(el.scrollLeft).toBe(0);
    expect(el.scrollTop).toBeGreaterThan(0);
  });
});
