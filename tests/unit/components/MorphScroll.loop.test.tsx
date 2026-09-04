import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render } from "@testing-library/react";

import { MorphScroll } from "@morphing-scroll/src";

const items = (count = 6) =>
  Array.from({ length: count }, (_, i) => <div key={`i-${i}`}>{i}</div>);

let error: ReturnType<typeof vi.spyOn>;

const said = (part: string) =>
  error.mock.calls.some((call) => String(call[0]).includes(part));

beforeEach(() => {
  error = vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => error.mockRestore());

describe("loop", () => {
  /*
   * Измеряемый размер круг тоже умеет: он просто ждёт, пока измерят всех, —
   * до тех пор это обычная прокрутка, и ругаться тут не на что.
   */
  it("молчит на измеряемый размер: круг просто ждёт замера", () => {
    render(
      <MorphScroll
        size={[200, 300]}
        loop
        render={{ mode: "virtual" }}
        objects={{ size: "each" }}
      >
        {items()}
      </MorphScroll>,
    );

    expect(error).not.toHaveBeenCalled();
  });

  it("молчит на hybrid: там круг идёт по обеим осям", () => {
    render(
      <MorphScroll
        size={[200, 300]}
        direction="hybrid"
        loop
        render={{ mode: "virtual" }}
        objects={{ size: [90, 60] }}
      >
        {items()}
      </MorphScroll>,
    );

    expect(error).not.toHaveBeenCalled();
  });

  it("молчит на страницы: их в круге столько, сколько в обороте", () => {
    render(
      <MorphScroll
        size={[200, 300]}
        mode="slider"
        loop
        render={{ mode: "virtual" }}
        objects={{ size: [180, 60] }}
      >
        {items()}
      </MorphScroll>,
    );

    expect(error).not.toHaveBeenCalled();
  });

  /*
   * Круг ставит копии по координате сам, и виртуализация ему для этого не
   * нужна: без неё он просто рисует все копии, а не окно из них.
   */
  it("молчит без render.mode: круг ставит копии сам", () => {
    render(
      <MorphScroll size={[200, 300]} loop objects={{ size: [180, 60] }}>
        {items()}
      </MorphScroll>,
    );

    expect(error).not.toHaveBeenCalled();
  });

  it("ругается на stickToEnd: конца у круга нет", () => {
    render(
      <MorphScroll
        size={[200, 300]}
        loop
        stickToEnd
        render={{ mode: "virtual" }}
        objects={{ size: [180, 60] }}
      >
        {items()}
      </MorphScroll>,
    );

    expect(said("the circle does not have")).toBe(true);
  });

  /*
   * Свой бегунок браузер рисует по настоящей прокрутке, а она в круге — лента
   * из копий. Переписать его нам нечем, значит остаётся отговорить.
   */
  it("отговаривает от нативного бегунка: он показывает ленту, а не оборот", () => {
    render(
      <MorphScroll
        size={[200, 300]}
        loop
        render={{ mode: "virtual" }}
        objects={{ size: [180, 60] }}
        controls={{ bar: true }}
      >
        {items()}
      </MorphScroll>,
    );

    expect(said("a fraction of a turn")).toBe(true);
  });

  it("на свой узел в баре не ругается", () => {
    render(
      <MorphScroll
        size={[200, 300]}
        loop
        render={{ mode: "virtual" }}
        objects={{ size: [180, 60] }}
        controls={{ bar: <i /> }}
      >
        {items()}
      </MorphScroll>,
    );

    expect(error).not.toHaveBeenCalled();
  });

  it("молчит, когда всё сходится", () => {
    render(
      <MorphScroll
        size={[200, 300]}
        loop
        render={{ mode: "virtual" }}
        objects={{ size: [180, 60], gap: 10 }}
      >
        {items()}
      </MorphScroll>,
    );

    expect(error).not.toHaveBeenCalled();
  });

  /*
   * Осталось ровно две несовместимости, и обе про то, что периода не собрать.
   * Остальное круг умеет: и страницы, и отрисовку без виртуализации.
   */
  it("круг по обеим осям: обе стороны стали длиннее одного оборота", () => {
    const { container } = render(
      <MorphScroll
        size={[200, 300]}
        direction="hybrid"
        loop
        render={{ mode: "virtual" }}
        objects={{ size: [90, 60], gap: 10, crossCount: 2 }}
      >
        {items()}
      </MorphScroll>,
    );

    const wrap = container.querySelector<HTMLElement>(".ms-objects-wrapper")!;

    // два в ряд по 90 с зазором — оборот 200 при окне 200, три копии: 600
    expect(wrap.style.width).toBe("600px");
    // три ряда по 60 — оборот 210, а окно 300 длиннее его: копий четыре, 840
    expect(wrap.style.height).toBe("840px");
  });
});
