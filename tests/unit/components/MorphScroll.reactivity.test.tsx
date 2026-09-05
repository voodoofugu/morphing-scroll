import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import MorphScroll from "@morphing-scroll/src/components/MorphScroll";

/*
 * Пропс, поменянный после монтирования, обязан примениться сразу. Ни один из
 * них не должен ждать перемонтирования: между «поставил значение» и «увидел
 * результат» не может быть перезагрузки страницы.
 *
 * Исключение ровно одно и оно по смыслу: `initialPosition` — позиция открытия,
 * и она применяется один раз. Про это есть свой тест.
 */

const items = (n = 24) =>
  Array.from({ length: n }, (_, i) => (
    <div key={`item-${i}`} className="cell">
      item {i}
    </div>
  ));

type Props = Record<string, unknown>;

const Empty = () => null;

const wrapper = (c: HTMLElement) =>
  c.querySelector<HTMLElement>(".ms-objects-wrapper")!;
const viewport = (c: HTMLElement) => c.querySelector<HTMLElement>(".ms-viewport")!;
const root = (c: HTMLElement) => c.querySelector<HTMLElement>("[morph-scroll]")!;

/** снимок того, что видно снаружи: разметка плюс стили ключевых узлов */
const shot = (c: HTMLElement) =>
  [
    root(c)?.className,
    root(c)?.getAttribute("style"),
    viewport(c)?.getAttribute("style"),
    wrapper(c)?.getAttribute("style"),
    c.querySelectorAll(".ms-object-box").length,
    c.querySelectorAll(".ms-bar").length,
    c.querySelectorAll(".ms-slider").length,
    c.querySelectorAll(".ms-slider-item").length,
    c.querySelectorAll(".ms-arrow-box").length,
    c.querySelectorAll(".ms-edge").length,
    c.querySelector(".ms-object-box")?.getAttribute("style"),
  ].join("|");

/** проп меняется — снимок обязан измениться */
const reacts = (
  name: string,
  before: Props,
  after: Props,
  children: React.ReactNode = items(),
) => {
  it(name, async () => {
    const view = (props: Props) => (
      <MorphScroll objects={{ size: 100 }} size={[300, 300]} {...props}>
        {children}
      </MorphScroll>
    );

    const { container, rerender } = render(view(before));
    const first = shot(container);

    rerender(view(after));

    // часть работы идёт кадром позже — ждём, но недолго
    await vi.waitFor(
      () =>
        expect(
          shot(container),
          `${name} не применился без перемонтирования`,
        ).not.toBe(first),
      { timeout: 500 },
    );
  });
};

describe("MorphScroll — пропсы применяются сразу", () => {
  reacts("className", {}, { className: "next" });
  reacts("mode", { controls: { bar: <i /> } }, { mode: "slider", controls: { bar: <i /> } });
  reacts("direction", {}, { direction: "x" });
  reacts("size", { size: [300, 300] }, { size: [300, 500] });
  reacts("objects.size", {}, { objects: { size: 40 } });
  reacts("objects.lines", { objects: { size: 100, lines: 1 } }, { objects: { size: 100, lines: 3 } });
  reacts("objects.gap числом", { objects: { size: 100, gap: 10 } }, { objects: { size: 100, gap: 80 } });
  reacts("objects.gap парой", { objects: { size: 100, gap: [10, 20] } }, { objects: { size: 100, gap: [10, 60] } });
  reacts("wrapper.margin", { wrapper: { margin: 10 } }, { wrapper: { margin: 50 } });
  // выравнивание видно только когда контент меньше окна
  reacts(
    "wrapper.align",
    { wrapper: { align: "start" } },
    { wrapper: { align: "center" } },
    items(2),
  );
  reacts("wrapper.minSize", {}, { wrapper: { minSize: "full" } });
  reacts("objects.align", { objects: { size: 100, lines: 3 } }, { objects: { size: 100, lines: 3, align: "center" } });
  reacts("objects.order", { objects: { size: 100, lines: 3 } }, { objects: { size: 100, lines: 3, order: "column" } });
  reacts("controls.bar", {}, { controls: { bar: <i className="thumb" /> } });
  reacts(
    "controls.arrows",
    {},
    { controls: { wheel: true, arrows: { element: <i /> } } },
  );
  reacts("edge", {}, { edge: <i className="fade" /> });
  reacts("render", {}, { render: "lazy" });
  // «пустым» считается объект, у которого в разметке ничего нет
  reacts(
    "objects.empty",
    { render: "virtual" },
    { render: "virtual", objects: { size: 100, empty: "clear" } },
    [<div key="item-0">item</div>, <Empty key="item-1" />, <div key="item-2">item</div>],
  );
});

/*
 * Обратная сторона того же: объекты и массивы пишут прямо в пропсы, без
 * `useMemo`. Значит свежий объект с тем же содержимым обязан быть бесплатным —
 * иначе каждый ре-рендер родителя пересобирал бы подписки и вычисления.
 */
describe("MorphScroll — свежий объект с тем же содержимым ничего не пересобирает", () => {
  const wheelListeners = (spy: ReturnType<typeof vi.spyOn>) =>
    spy.mock.calls.filter(([type]) => type === "wheel").length;

  it("подписки не перевешиваются, пока содержимое пропсов то же", () => {
    const spy = vi.spyOn(HTMLElement.prototype, "addEventListener");

    const view = () => (
      <MorphScroll objects={{ size: 100, gap: [10, 20] }}
        size={[300, 300]}
        wrapper={{ margin: 8 }}
        controls={{ wheel: true, bar: <i /> }}
      >
        {items(6)}
      </MorphScroll>
    );

    const { rerender } = render(view());
    const afterMount = wheelListeners(spy);
    expect(afterMount).toBeGreaterThan(0); // подписка вообще случилась

    // пять ре-рендеров, каждый со свежими объектами того же содержания
    for (let i = 0; i < 5; i++) rerender(view());

    expect(wheelListeners(spy)).toBe(afterMount);

    // а вот изменившееся содержимое подписку пересобрать обязано
    rerender(
      <MorphScroll objects={{ size: 100, gap: [10, 20] }}
        size={[300, 300]}
        wrapper={{ margin: 8 }}
        controls={{
          wheel: { changeDirectionBtn: "KeyZ" },
          bar: <i />,
        }}
      >
        {items(6)}
      </MorphScroll>,
    );

    expect(wheelListeners(spy)).not.toBe(afterMount);
    spy.mockRestore();
  });
});
