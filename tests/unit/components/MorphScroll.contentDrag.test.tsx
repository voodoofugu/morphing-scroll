import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render } from "@testing-library/react";
import MorphScroll from "@morphing-scroll/src/components/MorphScroll";

import { stubLayout, pointer, drag } from "../../helpers/dom";

const VIEW = 300;
const OBJ = 100;
const COUNT = 20;

const links = () =>
  Array.from({ length: COUNT }, (_, i) => (
    <a key={`item-${i}`} href={`#${i}`}>
      item {i}
    </a>
  ));

const plain = () =>
  Array.from({ length: COUNT }, (_, i) => <div key={`item-${i}`}>item {i}</div>);

const setTouchDevice = (coarse: boolean) =>
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      matches: coarse && query.includes("coarse"),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  );

const mount = (props: Record<string, unknown>, children = plain()) => {
  const utils = render(
    <MorphScroll objects={{ size: OBJ }} size={[100, VIEW]} {...props}>
      {children}
    </MorphScroll>,
  );
  const el = utils.container.querySelector<HTMLElement>(".ms-viewport")!;
  stubLayout(el, {
    clientWidth: 100,
    clientHeight: VIEW,
    scrollWidth: 100,
    scrollHeight: COUNT * OBJ,
  });
  return { ...utils, el };
};

/** drag the content up by 100px */
const dragUp = (el: HTMLElement) => {
  drag(el, [
    [50, 250],
    [50, 240],
    [50, 150],
  ]);
  pointer("pointerup", 50, 150, document);
};

describe("MorphScroll — content drag", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("drags the content", () => {
    const { el } = mount({ progressTrigger: { content: true } });
    dragUp(el);
    expect(el.scrollTop).toBeGreaterThan(0);
  });

  it("still drags when the native scrollbar is in use", () => {
    // bar: true means "use the browser's own scrollbar" — it says
    // nothing about whether the content can be grabbed
    const { el } = mount({
      progressTrigger: { content: true, bar: true },
    });
    dragUp(el);
    expect(el.scrollTop).toBeGreaterThan(0);
  });

  it("still drags when a custom thumb is in use", () => {
    const { el } = mount({
      progressTrigger: { content: true, bar: <i /> },
    });
    dragUp(el);
    expect(el.scrollTop).toBeGreaterThan(0);
  });
});

describe("MorphScroll — a menu built out of buttons", () => {
  afterEach(() => vi.unstubAllGlobals());

  const buttons = () =>
    Array.from({ length: COUNT }, (_, i) => (
      <button key={`item-${i}`} type="button">
        item {i}
      </button>
    ));

  it("drags from a button with a mouse", () => {
    setTouchDevice(false);
    const { el, container } = mount(
      { progressTrigger: { content: true } },
      buttons(),
    );

    const button = container.querySelector<HTMLElement>("button")!;
    drag(button, [
      [50, 250],
      [50, 240],
      [50, 150],
    ]);
    pointer("pointerup", 50, 150, document);

    expect(el.scrollTop).toBeGreaterThan(0);
  });

  it("lets a press that went nowhere stay a press", () => {
    // тап по пункту меню обязан остаться тапом: до 2px это ещё не прокрутка
    setTouchDevice(false);
    const { el, container } = mount(
      { progressTrigger: { content: true } },
      buttons(),
    );

    const button = container.querySelector<HTMLElement>("button")!;
    drag(button, [
      [50, 250],
      [50, 249],
    ]);
    pointer("pointerup", 50, 249, document);

    expect(el.scrollTop).toBe(0);
  });
});

describe("MorphScroll — a menu built out of links", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("scrolls with a finger even though every item is an anchor", () => {
    setTouchDevice(true);
    const { el, container } = mount({ progressTrigger: { content: true } }, links());

    const anchor = container.querySelector<HTMLElement>("a")!;
    drag(anchor, [
      [50, 250],
      [50, 240],
      [50, 150],
    ]);
    pointer("pointerup", 50, 150, document);

    expect(el.scrollTop).toBeGreaterThan(0);
  });

  it("scrolls with a mouse from an anchor too", () => {
    // мышь была исключением, и меню из кнопок просто не таскалось
    setTouchDevice(false);
    const { el, container } = mount({ progressTrigger: { content: true } }, links());

    const anchor = container.querySelector<HTMLElement>("a")!;
    drag(anchor, [
      [50, 250],
      [50, 240],
      [50, 150],
    ]);
    pointer("pointerup", 50, 150, document);

    expect(el.scrollTop).toBeGreaterThan(0);
  });

  it("keeps the browser from carrying the link away mid-gesture", () => {
    setTouchDevice(false);
    const { container } = mount({ progressTrigger: { content: true } }, links());

    const anchor = container.querySelector<HTMLElement>("a")!;
    drag(anchor, [
      [50, 250],
      [50, 240],
    ]);

    const dragStart = new Event("dragstart", {
      bubbles: true,
      cancelable: true,
    });
    anchor.dispatchEvent(dragStart);
    pointer("pointerup", 50, 240, document);

    expect(dragStart.defaultPrevented).toBe(true);
  });
});

describe("MorphScroll — the native scrollbar gutter", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("does not turn a press on the native bar into a content drag", () => {
    const { el } = mount({
      progressTrigger: { content: true, bar: true },
    });
    // the element is 100 wide including a 15px native bar
    stubLayout(el, {
      clientWidth: 85,
      clientHeight: VIEW,
      scrollWidth: 85,
      scrollHeight: COUNT * OBJ,
    });
    Object.defineProperty(el, "getBoundingClientRect", {
      value: () =>
        ({ width: 100, height: VIEW, top: 0, left: 0, right: 100, bottom: VIEW, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect,
      configurable: true,
    });

    // x = 92 lands past clientWidth, i.e. on the scrollbar
    drag(el, [
      [92, 250],
      [92, 240],
      [92, 150],
    ]);
    pointer("pointerup", 92, 150, document);

    expect(el.scrollTop).toBe(0);
  });
});
