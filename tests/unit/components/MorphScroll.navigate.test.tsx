import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, act, fireEvent } from "@testing-library/react";
import MorphScroll from "@morphing-scroll/src/components/MorphScroll";
import { stubLayout } from "../../helpers/dom";

/*
 * `onNavigate` — дискретная половина скролла: страница сменилась, и известно,
 * кто её сменил. Непрерывное движение сообщает `onScrollPosition`, поэтому
 * здесь не должно быть ни одного события «просто поехали».
 */

const items = (n: number) =>
  Array.from({ length: n }, (_, i) => <div key={`item-${i}`}>item {i}</div>);

const SIZE: [number, number] = [300, 300];

/*
 * Слайдер раскладывается кадром позже монтирования, и до этого он ещё не знает
 * текущей страницы. Переход с «не знаю» на первую страницу — не переход,
 * поэтому перед проверками даём ему осмотреться.
 */
const settled = async (container: HTMLElement) =>
  vi.waitFor(() =>
    expect(container.querySelector(".ms-slider-item.ms-active")).not.toBeNull(),
  );

const mount = (props: Record<string, unknown>, count = 12) => {
  const utils = render(
    <MorphScroll objects={{ size: 300, crossCount: 1 }} size={SIZE} {...props}>
      {items(count)}
    </MorphScroll>,
  );
  const el = utils.container.querySelector<HTMLElement>(".ms-viewport")!;
  stubLayout(el, { clientHeight: 300, scrollHeight: 300 * count });
  return { ...utils, el };
};

describe("MorphScroll — onNavigate", () => {
  it("reports the page an arrow moved to, at the click", async () => {
    const onNavigate = vi.fn();
    const { container, el } = mount({
      onNavigate,
      controls: { arrows: { element: <b /> } },
    });

    const down = container.querySelector<HTMLElement>(".ms-arrow-box.ms-bottom")!;
    act(() => {
      fireEvent.click(down);
    });

    // о нажатии известно всё сразу — ждать конца полёта незачем
    expect(onNavigate).toHaveBeenCalledWith({
      reason: "arrows",
      axis: "y",
      from: 0,
      to: 1,
    });

    // jsdom не шлёт scroll на программную прокрутку — доводим сами
    act(() => {
      fireEvent.scroll(el, { target: { scrollTop: 300 } });
    });

    // и остановка не отчитывается вторым разом о том же переходе
    await new Promise((r) => setTimeout(r, 400));
    expect(onNavigate).toHaveBeenCalledTimes(1);
  });

  /*
   * То, ради чего отчёт уехал в момент нажатия: три быстрых нажатия доезжают
   * одним движением, и по остановке они были бы неотличимы от одного.
   */
  it("counts every click of a burst, not the ride they share", async () => {
    const onNavigate = vi.fn();
    const { container } = mount({
      onNavigate,
      controls: { arrows: { element: <b /> } },
    });

    // пока диапазон не измерен, позиция ставится сразу и лететь неоткуда
    await act(async () => {
      await new Promise((r) => requestAnimationFrame(() => r(null)));
    });

    const down = container.querySelector<HTMLElement>(".ms-arrow-box.ms-bottom")!;
    act(() => {
      fireEvent.click(down);
      fireEvent.click(down);
      fireEvent.click(down);
    });

    expect(onNavigate.mock.calls.map(([e]) => [e.from, e.to])).toEqual([
      [0, 1],
      [1, 2],
      [2, 3],
    ]);
  });

  it("stays quiet when the arrow has nowhere to go", () => {
    const onNavigate = vi.fn();
    const { container } = mount({
      onNavigate,
      controls: { arrows: { element: <b /> } },
    });

    // вверх с нулевой позиции и без loop — движения нет
    const up = container.querySelector<HTMLElement>(".ms-arrow-box.ms-top")!;
    act(() => {
      fireEvent.click(up);
    });

    expect(onNavigate).not.toHaveBeenCalled();
  });

  it("stays quiet while the content is merely scrolled", () => {
    const onNavigate = vi.fn();
    const { el } = mount({ onNavigate });

    act(() => {
      fireEvent.scroll(el, { target: { scrollTop: 150 } });
    });

    expect(onNavigate).not.toHaveBeenCalled();
  });

  it("does not fire on the first layout of a slider", async () => {
    const onNavigate = vi.fn();
    const { container } = mount({
      onNavigate,
      mode: "slider",
      controls: { bar: <i /> },
    });

    await settled(container);
    expect(onNavigate).not.toHaveBeenCalled();
  });

  it("reports a slider page reached by scrolling as `scroll`", async () => {
    const onNavigate = vi.fn();
    const { container, el } = mount({
      onNavigate,
      mode: "slider",
      controls: { bar: <i /> },
    });
    await settled(container);

    act(() => {
      fireEvent.scroll(el, { target: { scrollTop: 300 } });
    });

    // слайдер осматривается по кадру, поэтому ждём его, а не микрозадачу
    await vi.waitFor(() =>
      expect(onNavigate).toHaveBeenCalledWith(
        expect.objectContaining({ reason: "scroll", axis: "y", to: 1 }),
      ),
    );
  });

  /*
   * Причину "bar" проверяет e2e: клик по точке запускает анимацию, а jsdom
   * не крутит кадры, так что страница здесь так и не доезжает.
   */
});
