import React from "react";
import { describe, it, expect, vi } from "vitest";
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
