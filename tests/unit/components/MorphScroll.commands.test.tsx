import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, act, fireEvent } from "@testing-library/react";
import MorphScroll from "@morphing-scroll/src/components/MorphScroll";
import type { MorphScrollHandle } from "@morphing-scroll/src/types/types";
import { stubLayout } from "../../helpers/dom";

/*
 * `step` и `pan` — те же два действия, что библиотека делает по своим
 * триггерам, только названные наружу. Через них к скроллу подключается любое
 * устройство, о котором она не знает: опрос — на стороне приложения, а
 * `reason` довозит его имя до `onNavigate`.
 */

const items = (n: number) =>
  Array.from({ length: n }, (_, i) => <div key={`item-${i}`}>item {i}</div>);

const mount = (props: Record<string, unknown> = {}, count = 12) => {
  const ref = React.createRef<MorphScrollHandle>();
  const utils = render(
    <MorphScroll
      ref={ref}
      size={[300, 300]}
      objectsSize={300}
      crossCount={1}
      {...props}
    >
      {items(count)}
    </MorphScroll>,
  );
  const el = utils.container.querySelector<HTMLElement>(".ms-viewport")!;
  stubLayout(el, { clientHeight: 300, scrollHeight: 300 * count });
  return { ...utils, el, ref };
};

const landsOn = (el: HTMLElement, value: number) =>
  vi.waitFor(() => expect(el.scrollTop).toBe(value));

describe("MorphScroll — step and pan", () => {
  it("step turns a page", async () => {
    const { el, ref } = mount();

    act(() => ref.current!.step("bottom"));
    await landsOn(el, 300);
  });

  /*
   * Зазор задаётся парой по осям, а внутри лежит в порядке CSS — сначала
   * между рядами. Шаг страницы читал его как есть и брал по x вертикальный
   * зазор, по y — горизонтальный: с одинаковым зазором незаметно, с разным
   * страница проматывалась не туда.
   */
  it("a page step counts the gap of its own axis", async () => {
    const across = mount({ direction: "x", gap: [40, 0] });
    stubLayout(across.el, {
      clientWidth: 300,
      clientHeight: 300,
      scrollWidth: 300 * 12,
      scrollHeight: 300,
    });

    act(() => across.ref.current!.step("right"));
    await vi.waitFor(() => expect(across.el.scrollLeft).toBe(340));

    const down = mount({ gap: [0, 40] });

    act(() => down.ref.current!.step("bottom"));
    await vi.waitFor(() => expect(down.el.scrollTop).toBe(340));
  });

  it("step does nothing at the end of the run", async () => {
    const { el, ref } = mount();

    act(() => ref.current!.step("top"));
    await new Promise((resolve) => setTimeout(resolve, 60));
    expect(el.scrollTop).toBe(0);
  });

  it("pan nudges by the given delta", async () => {
    const { el, ref } = mount();

    act(() => ref.current!.pan({ y: 75 }));
    await landsOn(el, 75);
  });

  it("carries a reason of its own through to onNavigate", async () => {
    const onNavigate = vi.fn();
    const { el, ref } = mount({ onNavigate });

    act(() => ref.current!.step("bottom", { reason: "gamepad" }));
    // jsdom не шлёт scroll на программную прокрутку — доводим сами
    act(() => {
      fireEvent.scroll(el, { target: { scrollTop: 300 } });
    });

    await vi.waitFor(() =>
      expect(onNavigate).toHaveBeenCalledWith({
        reason: "gamepad",
        axis: "y",
        from: 0,
        to: 1,
      }),
    );
  });

  it("says `arrows` when the caller does not name one", async () => {
    const onNavigate = vi.fn();
    const { el, ref } = mount({ onNavigate });

    act(() => ref.current!.step("bottom"));
    act(() => {
      fireEvent.scroll(el, { target: { scrollTop: 300 } });
    });

    await vi.waitFor(() =>
      expect(onNavigate).toHaveBeenCalledWith(
        expect.objectContaining({ reason: "arrows" }),
      ),
    );
  });

  it("keeps pan out of onNavigate in a plain scroll", async () => {
    const onNavigate = vi.fn();
    const { el, ref } = mount({ onNavigate });

    act(() => ref.current!.pan({ y: 40 }));
    act(() => {
      fireEvent.scroll(el, { target: { scrollTop: 40 } });
    });
    await new Promise((resolve) => setTimeout(resolve, 300));

    expect(onNavigate).not.toHaveBeenCalled();
  });
});

describe("MorphScroll — pan as a stick sends it", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  /*
   * Стик опрашивают каждый кадр и двигают на маленькую долю, а не на
   * страницу: `duration: 0` значит «поставь сюда сейчас», без анимации.
   */
  const stick = (ref: React.RefObject<MorphScrollHandle | null>, frames: number) => {
    act(() => vi.advanceTimersToNextFrame()); // кадр после монтирования

    for (let i = 0; i < frames; i++) {
      act(() => ref.current!.pan({ y: 14 }, { duration: 0 }));
      act(() => vi.advanceTimersToNextFrame());
    }
  };

  /*
   * `duration` — скорость всех движений скролла, а не только команд: раньше
   * она пряталась внутри позиции, где её никто не искал. Ноль значит «сейчас»:
   * шаг обязан встать в том же кадре, а не ехать двести миллисекунд.
   */
  it("takes its animation length from the duration prop", () => {
    const instant = mount({ duration: 0 });
    act(() => vi.advanceTimersToNextFrame()); // кадр после монтирования

    act(() => instant.ref.current!.step("bottom"));
    act(() => vi.advanceTimersToNextFrame());

    expect(instant.el.scrollTop).toBe(300);

    const slow = mount({ duration: 400 });
    act(() => vi.advanceTimersToNextFrame());

    act(() => slow.ref.current!.step("bottom"));
    act(() => vi.advanceTimersToNextFrame());

    expect(slow.el.scrollTop).toBeGreaterThan(0);
    expect(slow.el.scrollTop).toBeLessThan(60); // кадр из четырёхсот миллисекунд
  });

  it("adds up frame after frame", () => {
    const { el, ref } = mount();

    stick(ref, 20);

    expect(el.scrollTop).toBeGreaterThan(250);
  });

  it("moves in the same frame it was asked", () => {
    // кадр задержки на каждом опросе и есть дёрганье вместо движения
    const { el, ref } = mount();
    act(() => vi.advanceTimersToNextFrame());

    act(() => ref.current!.pan({ y: 14 }, { duration: 0 }));

    expect(el.scrollTop).toBe(14);
  });
});
