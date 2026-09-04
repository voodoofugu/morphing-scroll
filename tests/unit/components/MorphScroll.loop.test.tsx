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
   * Круг водит окно подменой позиции на период, а период — это расстояние,
   * через которое контент повторяется. Всё, что мешает его назвать, круг и
   * отменяет — но молча отменять нельзя, иначе проп просто «не работает».
   */
  it("ругается на измеряемый размер: периода из него не выходит", () => {
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

    expect(said("never settles into one")).toBe(true);
  });

  it("ругается на hybrid: круг один, а осей две", () => {
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

    expect(said("there is no single way around")).toBe(true);
  });

  it("ругается на страницы: у круга их нет", () => {
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

    expect(said("a circle has none to count")).toBe(true);
  });

  /*
   * Копии ставятся по координате, а координаты появляются только вместе с
   * render.mode: без него объекты раскладывает поток, которому про круг
   * ничего не известно.
   */
  it("ругается без render.mode: копии некуда поставить", () => {
    render(
      <MorphScroll size={[200, 300]} loop objects={{ size: [180, 60] }}>
        {items()}
      </MorphScroll>,
    );

    expect(said("laid out by the flow")).toBe(true);
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

  it("без loop ни на что из этого не ругается", () => {
    render(
      <MorphScroll
        size={[200, 300]}
        mode="slider"
        render={{ mode: "virtual" }}
        objects={{ size: [180, 60] }}
      >
        {items()}
      </MorphScroll>,
    );

    expect(error).not.toHaveBeenCalled();
  });
});
