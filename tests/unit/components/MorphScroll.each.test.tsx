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

describe('objects.size: "auto"', () => {
  it("ругается на слайдер: у страниц нет общего шага", () => {
    render(
      <MorphScroll size={[200, 300]} mode="slider" objects={{ size: [90, "auto"] }}>
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
  it("ругается на hybrid без lines: линию нечем оборвать", () => {
    render(
      <MorphScroll size={[200, 300]} direction="hybrid" objects={{ size: "auto" }}>
        {items()}
      </MorphScroll>,
    );

    expect(said("needs objects.lines")).toBe(true);
  });

  it("с lines hybrid молчит", () => {
    render(
      <MorphScroll
        size={[200, 300]}
        direction="hybrid"
        objects={{ size: "auto", lines: 3 }}
      >
        {items()}
      </MorphScroll>,
    );

    expect(error).not.toHaveBeenCalled();
  });

  /*
   * У hybrid нет стороны, которую можно "отдать" объектам, — обе и так
   * прокручиваются. objects.order здесь остаётся единственным способом
   * сказать, что чем ограничено, поэтому "column" не ругается, а работает.
   */
  it("objects.order для hybrid не ругается — там это единственный выбор оси", () => {
    render(
      <MorphScroll
        size={[200, 300]}
        direction="hybrid"
        objects={{ size: "auto", lines: 3, order: "column" }}
      >
        {items()}
      </MorphScroll>,
    );

    expect(error).not.toHaveBeenCalled();
  });

  it("молчит, когда each стоит поперёк прокрутки: это поток", () => {
    render(
      <MorphScroll size={[200, 300]} objects={{ size: ["auto", 90] }}>
        {items()}
      </MorphScroll>,
    );

    expect(error).not.toHaveBeenCalled();
  });

  /*
   * Кладка всегда знает, сколько у неё колонок, поэтому порядок по столбцам
   * ей выполним — что при названном счёте, что при посчитанном по месту.
   */
  it("молчит на column в кладке: число колонок ей известно всегда", () => {
    render(
      <MorphScroll
        size={[200, 300]}
        objects={{ size: [90, "auto"], order: "column" }}
      >
        {items()}
      </MorphScroll>,
    );

    expect(error).not.toHaveBeenCalled();
  });

  it("молчит на column в потоке, когда счёт назван", () => {
    render(
      <MorphScroll
        size={[200, 300]}
        objects={{ size: ["auto", 90], lines: 2, order: "column" }}
      >
        {items()}
      </MorphScroll>,
    );

    expect(error).not.toHaveBeenCalled();
  });

  /*
   * Без счёта строки в потоке обрывает место, и сколько их будет, заранее не
   * сказать — а порядку по столбцам это число и нужно.
   */
  it("ругается на column в потоке без счёта: линий не сосчитать", () => {
    render(
      <MorphScroll
        size={[200, 300]}
        objects={{ size: ["auto", 90], order: "column" }}
      >
        {items()}
      </MorphScroll>,
    );

    expect(said("how many lines there will be")).toBe(true);
  });

  /*
   * У заполнения линий нет вовсе: оно отдаёт порядок ради посадки, и просить
   * у него порядок — просить отменить его же смысл.
   */
  it("ругается на column в заполнении: порядок там отдан за посадку", () => {
    render(
      <MorphScroll size={[200, 300]} objects={{ size: "auto", order: "column" }}>
        {items()}
      </MorphScroll>,
    );

    expect(said("gives the order up for the fit")).toBe(true);
  });

  it("молчит на row: это порядок по умолчанию, и он выполним всегда", () => {
    render(
      <MorphScroll size={[200, 300]} objects={{ size: "auto", order: "row" }}>
        {items()}
      </MorphScroll>,
    );

    expect(error).not.toHaveBeenCalled();
  });

  it("молчит на обычной кладке и не требует render", () => {
    render(
      <MorphScroll size={[200, 300]} objects={{ size: [90, "auto"] }}>
        {items()}
      </MorphScroll>,
    );

    expect(error).not.toHaveBeenCalled();
  });

  it("не мешает render: размеры для него теперь есть", () => {
    render(
      <MorphScroll size={[200, 300]} render="virtual" objects={{ size: [90, "auto"] }}>
        {items()}
      </MorphScroll>,
    );

    expect(said("needs a known objects.size")).toBe(false);
  });

  it("раскладывает объекты абсолютно и задаёт только заданную сторону", () => {
    const { container } = render(
      <MorphScroll size={[200, 300]} objects={{ size: [90, "auto"] }}>
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
      <MorphScroll size={[200, 300]} objects={{ size: "auto" }}>
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
      <MorphScroll size={[200, 300]} objects={{ size: ["auto", 60] }}>
        {items(3)}
      </MorphScroll>,
    );

    const box = container.querySelector<HTMLElement>(".ms-object-box")!;
    expect(box.style.width).toBe("");
    expect(box.style.height).toBe("60px");
  });

  it("рисует первую пачку, а не весь список", () => {
    const { container } = render(
      <MorphScroll size={[200, 300]} objects={{ size: [90, "auto"] }}>
        {items(200)}
      </MorphScroll>,
    );

    // jsdom ничего не измерит, значит дальше первой пачки список не уедет
    expect(container.querySelectorAll(".ms-object-box").length).toBe(30);
  });
});
