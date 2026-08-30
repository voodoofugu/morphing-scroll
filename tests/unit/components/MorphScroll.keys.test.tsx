import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, act, fireEvent } from "@testing-library/react";
import MorphScroll from "@morphing-scroll/src/components/MorphScroll";
import { stubLayout } from "../../helpers/dom";

/*
 * Стрелки клавиатуры — такой же способ двигать скролл, как колесо или бар,
 * поэтому живут в `progressTrigger`. Что именно они делают, решает `mode`:
 * листают страницу или подвигают контент.
 */

const items = (n: number) =>
  Array.from({ length: n }, (_, i) => <div key={`item-${i}`}>item {i}</div>);

const mount = (props: Record<string, unknown>, count = 12) => {
  const utils = render(
    <MorphScroll objects={{ size: 300, crossCount: 1 }} size={[300, 300]} {...props}>
      {items(count)}
    </MorphScroll>,
  );
  const el = utils.container.querySelector<HTMLElement>(".ms-viewport")!;
  stubLayout(el, { clientHeight: 300, scrollHeight: 300 * count });
  return { ...utils, el };
};

const press = (el: HTMLElement, key: string, target?: HTMLElement) =>
  act(() => {
    fireEvent.keyDown(target ?? el, { key, bubbles: true });
  });

describe("MorphScroll — progressTrigger.keys", () => {
  // прокрутка доезжает за несколько кадров, поэтому ждём, а не читаем сразу
  const landsOn = (el: HTMLElement, value: number) =>
    vi.waitFor(() => expect(el.scrollTop).toBe(value));

  it("does nothing at all when it is off", () => {
    const { el } = mount({ progressTrigger: { wheel: true } });
    press(el, "ArrowDown");
    expect(el.scrollTop).toBe(0);
  });

  it("nudges the content in pan mode", async () => {
    const { el } = mount({ progressTrigger: { keys: { mode: "pan" } } });

    press(el, "ArrowDown");
    await landsOn(el, 40); // это шаг, а не страница
  });

  it("takes the step size from the config", async () => {
    const { el } = mount({
      progressTrigger: { keys: { mode: "pan", step: 120 } },
    });

    press(el, "ArrowDown");
    await landsOn(el, 120);
  });

  it("turns a whole page in step mode", async () => {
    const { el } = mount({ progressTrigger: { keys: { mode: "step" } } });

    press(el, "ArrowDown");
    await landsOn(el, 300);
  });

  it("reports a step through onNavigate as `keys`", async () => {
    const onNavigate = vi.fn();
    const { el } = mount({
      onNavigate,
      progressTrigger: { keys: { mode: "step" } },
    });

    press(el, "ArrowDown");
    // jsdom не шлёт scroll на программную прокрутку — доводим сами
    act(() => {
      fireEvent.scroll(el, { target: { scrollTop: 300 } });
    });

    await vi.waitFor(() =>
      expect(onNavigate).toHaveBeenCalledWith({
        reason: "keys",
        axis: "y",
        from: 0,
        to: 1,
      }),
    );
  });

  it("ignores the keys of the other axis", () => {
    const { el } = mount({ progressTrigger: { keys: { mode: "pan" } } });

    press(el, "ArrowRight");
    expect(el.scrollTop).toBe(0);
    expect(el.scrollLeft).toBe(0);
  });

  it("leaves the arrows to a text field inside the scroll", async () => {
    const { container } = render(
      <MorphScroll objects={{ size: 300, crossCount: 1 }}
        size={[300, 300]}
        progressTrigger={{ keys: { mode: "pan" } }}
      >
        <input key="field" defaultValue="text" />
        {items(6)}
      </MorphScroll>,
    );
    const el = container.querySelector<HTMLElement>(".ms-viewport")!;
    stubLayout(el, { clientHeight: 300, scrollHeight: 2100 });

    const field = container.querySelector<HTMLInputElement>("input")!;
    expect(field).not.toBeNull();

    press(el, "ArrowDown", field);
    await new Promise((resolve) => setTimeout(resolve, 60));
    expect(el.scrollTop).toBe(0);

    // а мимо поля та же клавиша скролл двигает
    press(el, "ArrowDown");
    await landsOn(el, 40);
  });

  it("defaults to paging in a slider and to nudging in a scroll", async () => {
    const slider = mount({
      mode: "slider",
      progressTrigger: { keys: true, bar: <i /> },
    });
    press(slider.el, "ArrowDown");
    await landsOn(slider.el, 300);

    const plain = mount({ progressTrigger: { keys: true } });
    press(plain.el, "ArrowDown");
    await landsOn(plain.el, 40);
  });

  it("takes the shorthand name too", async () => {
    const { el } = mount({ progressTrigger: ["wheel", "keys"] });

    press(el, "ArrowDown");
    await landsOn(el, 40);
  });
});
