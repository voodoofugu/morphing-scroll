import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render } from "@testing-library/react";
import { MorphScroll } from "@morphing-scroll/src";

/**
 * Раскладку кладки проверяет браузер (tests/e2e/masonry.spec.ts) — здесь
 * только то, что видно без раскладки: предупреждения и разметка.
 */

const items = (n = 5) =>
  Array.from({ length: n }, (_, i) => <div key={`i-${i}`}>{i}</div>);

let error: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  error = vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  error.mockRestore();
});

const said = (part: string) =>
  error.mock.calls.some(([msg]) => String(msg).includes(part));

describe('objects.size: "each"', () => {
  it("ругается на слайдер: у страниц нет общего шага", () => {
    render(
      <MorphScroll size={[200, 300]} mode="slider" objects={{ size: [90, "each"] }}>
        {items()}
      </MorphScroll>,
    );

    expect(said("pages need one size for all")).toBe(true);
  });

  /*
   * У hybrid едут обе стороны: оборвать линию нечем, кроме счёта. Заполнением
   * это не подменить — ему нужна граница поперёк, а взять её можно только из
   * окна, и тогда вторая сторона перестанет ехать.
   */
  it("ругается на hybrid без crossCount: линию нечем оборвать", () => {
    render(
      <MorphScroll size={[200, 300]} direction="hybrid" objects={{ size: "each" }}>
        {items()}
      </MorphScroll>,
    );

    expect(said("needs objects.crossCount")).toBe(true);
  });

  it("с crossCount hybrid молчит", () => {
    render(
      <MorphScroll
        size={[200, 300]}
        direction="hybrid"
        objects={{ size: "each", crossCount: 3 }}
      >
        {items()}
      </MorphScroll>,
    );

    expect(error).not.toHaveBeenCalled();
  });

  /*
   * У hybrid нет стороны, которую можно "отдать" объектам, — обе и так
   * прокручиваются. objects.direction здесь остаётся единственным способом
   * сказать, что чем ограничено, поэтому "column" не ругается, а работает.
   */
  it("objects.direction для hybrid не ругается — там это единственный выбор оси", () => {
    render(
      <MorphScroll
        size={[200, 300]}
        direction="hybrid"
        objects={{ size: "each", crossCount: 3, direction: "column" }}
      >
        {items()}
      </MorphScroll>,
    );

    expect(error).not.toHaveBeenCalled();
  });

  it("молчит, когда each стоит поперёк прокрутки: это поток", () => {
    render(
      <MorphScroll size={[200, 300]} objects={{ size: ["each", 90] }}>
        {items()}
      </MorphScroll>,
    );

    expect(error).not.toHaveBeenCalled();
  });

  /*
   * "column" при вертикальной прокрутке — линии вдоль неё, то есть колонки, и
   * это ровно то, что кладка и делает. Просьба выполнима — ругаться не на что.
   */
  it("молчит на objects.direction вдоль прокрутки: это и есть кладка", () => {
    render(
      <MorphScroll
        size={[200, 300]}
        objects={{ size: [90, "each"], direction: "column" }}
      >
        {items()}
      </MorphScroll>,
    );

    expect(error).not.toHaveBeenCalled();
  });

  it("молчит на objects.direction поперёк прокрутки: это поток", () => {
    render(
      <MorphScroll
        size={[200, 300]}
        objects={{ size: [90, "each"], direction: "row" }}
      >
        {items()}
      </MorphScroll>,
    );

    expect(error).not.toHaveBeenCalled();
  });

  /*
   * Колонке нужна ширина, а эта сторона отдана объектам — раскладывать по
   * колонкам не по чему, и просьбу выполнить нечем.
   */
  it("ругается на колонки, когда ширины колонки нет", () => {
    render(
      <MorphScroll
        size={[200, 300]}
        objects={{ size: ["each", 90], direction: "column" }}
      >
        {items()}
      </MorphScroll>,
    );

    expect(said("lines along it are columns")).toBe(true);
  });

  /*
   * При горизонтальной прокрутке линии вдоль неё — строки, и не хватает им
   * высоты, а не ширины: то же правило, но названо своими словами.
   */
  it("ругается на строки при direction=x теми же словами, но про высоту", () => {
    render(
      <MorphScroll
        size={[200, 300]}
        direction="x"
        objects={{ size: "each", crossCount: 2, direction: "row" }}
      >
        {items()}
      </MorphScroll>,
    );

    expect(said("lines along it are rows")).toBe(true);
    expect(said("hands their height over")).toBe(true);
  });

  it("молчит на обычной кладке и не требует render", () => {
    render(
      <MorphScroll size={[200, 300]} objects={{ size: [90, "each"] }}>
        {items()}
      </MorphScroll>,
    );

    expect(error).not.toHaveBeenCalled();
  });

  it("не мешает render: размеры для него теперь есть", () => {
    render(
      <MorphScroll size={[200, 300]} render="virtual" objects={{ size: [90, "each"] }}>
        {items()}
      </MorphScroll>,
    );

    expect(said("needs a known objects.size")).toBe(false);
  });

  it("раскладывает объекты абсолютно и задаёт только заданную сторону", () => {
    const { container } = render(
      <MorphScroll size={[200, 300]} objects={{ size: [90, "each"] }}>
        {items(3)}
      </MorphScroll>,
    );

    const box = container.querySelector<HTMLElement>(".ms-object-box")!;
    expect(box.style.position).toBe("absolute");
    expect(box.style.width).toBe("90px");
    expect(box.style.height).toBe("");
  });

  it("в потоке объект выбирает обе стороны сам", () => {
    const { container } = render(
      <MorphScroll size={[200, 300]} objects={{ size: "each" }}>
        {items(3)}
      </MorphScroll>,
    );

    const box = container.querySelector<HTMLElement>(".ms-object-box")!;
    expect(box.style.position).toBe("absolute");
    expect(box.style.width).toBe("");
    expect(box.style.height).toBe("");
  });

  it("вдоль прокрутки сторону задаёт проп, поперёк — сам объект", () => {
    const { container } = render(
      <MorphScroll size={[200, 300]} objects={{ size: ["each", 60] }}>
        {items(3)}
      </MorphScroll>,
    );

    const box = container.querySelector<HTMLElement>(".ms-object-box")!;
    expect(box.style.width).toBe("");
    expect(box.style.height).toBe("60px");
  });

  it("рисует первую пачку, а не весь список", () => {
    const { container } = render(
      <MorphScroll size={[200, 300]} objects={{ size: [90, "each"] }}>
        {items(200)}
      </MorphScroll>,
    );

    // jsdom ничего не измерит, значит дальше первой пачки список не уедет
    expect(container.querySelectorAll(".ms-object-box").length).toBe(30);
  });
});
