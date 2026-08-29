import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, act, fireEvent } from "@testing-library/react";
import MorphScroll from "@morphing-scroll/src/components/MorphScroll";
import { stubLayout } from "../../helpers/dom";

/*
 * `stickToEnd` — это «держись низа», и держаться он должен, пока
 * пользователь внизу. Раньше библиотека решала это по направлению последнего
 * движения, а направление стирается через SCROLL_END_DELAY после остановки:
 * при медленной прокрутке вверх пауза успевала стереть его раньше, чем
 * дорастал контент, и человека выбрасывало обратно вниз. Положение паузы не
 * боится.
 */

const OBJ = 100;
const VIEW = 300;

const items = (n: number) =>
  Array.from({ length: n }, (_, i) => <div key={`item-${i}`}>item {i}</div>);

const Chat = ({ count, duration = 0 }: { count: number; duration?: number }) => (
  <MorphScroll
    size={[200, VIEW]}
    objectsSize={OBJ}
    crossCount={1}
    stickToEnd
    duration={duration}
  >
    {items(count)}
  </MorphScroll>
);

const mount = (count: number, duration = 0) => {
  const utils = render(<Chat count={count} duration={duration} />);
  const el = utils.container.querySelector<HTMLElement>(".ms-viewport")!;
  stubLayout(el, { clientHeight: VIEW, scrollHeight: count * OBJ });
  return { ...utils, el };
};

const settle = () => new Promise((resolve) => setTimeout(resolve, 60));

/** прокрутка пользователя: позиция плюс событие, как в браузере */
const userScrollTo = (el: HTMLElement, top: number) =>
  act(() => {
    fireEvent.scroll(el, { target: { scrollTop: top } });
  });

const grow = (
  rerender: (ui: React.ReactElement) => void,
  el: HTMLElement,
  count: number,
  duration = 0,
) =>
  act(() => {
    rerender(<Chat count={count} duration={duration} />);
    stubLayout(el, { clientHeight: VIEW, scrollHeight: count * OBJ });
  });

describe("MorphScroll — stickToEnd", () => {
  it("follows new content while the user is at the bottom", async () => {
    const { el, rerender } = mount(10);

    await vi.waitFor(() => expect(el.scrollTop).toBe(10 * OBJ - VIEW));
    userScrollTo(el, 10 * OBJ - VIEW);

    grow(rerender, el, 14);
    await vi.waitFor(() => expect(el.scrollTop).toBe(14 * OBJ - VIEW));
  });

  it("stays put when the user has scrolled away to read", async () => {
    const { el, rerender } = mount(10);

    await vi.waitFor(() => expect(el.scrollTop).toBe(10 * OBJ - VIEW));
    userScrollTo(el, 0); // ушли наверх

    grow(rerender, el, 14);
    await settle();
    expect(el.scrollTop).toBe(0);
  });

  it("still stays put once the pause has outlived the movement", async () => {
    const { el, rerender } = mount(10);

    await vi.waitFor(() => expect(el.scrollTop).toBe(10 * OBJ - VIEW));
    userScrollTo(el, 0);

    // медленная прокрутка — это прокрутка с паузами; ждём дольше, чем
    // держалось направление, и только потом подгружаем
    await new Promise((resolve) => setTimeout(resolve, 320));

    grow(rerender, el, 14);
    await settle();
    expect(el.scrollTop).toBe(0);
  });

  it("picks the bottom back up when the user returns to it", async () => {
    const { el, rerender } = mount(10);

    await vi.waitFor(() => expect(el.scrollTop).toBe(10 * OBJ - VIEW));
    userScrollTo(el, 0);
    grow(rerender, el, 14);
    await settle();
    expect(el.scrollTop).toBe(0);

    // вернулись вниз — снова липнем
    userScrollTo(el, 14 * OBJ - VIEW);
    grow(rerender, el, 18);
    await vi.waitFor(() => expect(el.scrollTop).toBe(18 * OBJ - VIEW));
  });

  it("re-aims at the new end when more content lands mid-flight", async () => {
    // сообщения приходят пачками: вторая успевает, пока едет анимация к первой
    const { el, rerender } = mount(10, 200);
    await vi.waitFor(() => expect(el.scrollTop).toBe(10 * OBJ - VIEW));

    grow(rerender, el, 14, 200);
    await new Promise((resolve) => setTimeout(resolve, 60));
    grow(rerender, el, 18, 200);

    await vi.waitFor(() => expect(el.scrollTop).toBe(18 * OBJ - VIEW), {
      timeout: 2000,
    });
  });

  it("counts a few pixels short of the bottom as the bottom", async () => {
    const { el, rerender } = mount(10);

    await vi.waitFor(() => expect(el.scrollTop).toBe(10 * OBJ - VIEW));
    // анимация останавливается с допуском, так что «внизу» не значит «ровно»
    userScrollTo(el, 10 * OBJ - VIEW - 8);

    grow(rerender, el, 14);
    await vi.waitFor(() => expect(el.scrollTop).toBe(14 * OBJ - VIEW));
  });
});
