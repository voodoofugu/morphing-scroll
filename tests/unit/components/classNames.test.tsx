import React from "react";
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import MorphScroll from "@morphing-scroll/src/components/MorphScroll";
import ResizeTracker from "@morphing-scroll/src/components/ResizeTracker";
import IntersectionTracker from "@morphing-scroll/src/components/IntersectionTracker";

/**
 * Every class the library puts on the page has to be namespaced, or it
 * collides with the consumer's stylesheet. This walks the rendered tree of a
 * fully-configured scroll — no user classes anywhere — so anything unprefixed
 * that shows up is the library's.
 */
const items = (n: number) =>
  Array.from({ length: n }, (_, i) => <div key={`item-${i}`}>item {i}</div>);

const classesIn = (root: HTMLElement) => {
  const found = new Set<string>();
  root
    .querySelectorAll("*")
    .forEach((el) => el.classList.forEach((name) => found.add(name)));
  return found;
};

const unprefixed = (root: HTMLElement) =>
  [...classesIn(root)].filter((name) => !name.startsWith("ms-")).sort();

/*
 * Классы — не единственное, что библиотека оставляет на странице: есть ещё
 * атрибуты и css-переменные, и как раз переменная однажды уехала без
 * префикса. Стандартные атрибуты разметки пропускаем, остальное — наше.
 */
const STANDARD_ATTRS = new Set(["class", "style", "tabindex", "role"]);
// маркер корня носит полное имя библиотеки — столкнуться с ним не с чем
const OWN_ATTRS = new Set(["morph-scroll"]);

const attributesIn = (root: HTMLElement) => {
  const found = new Set<string>();
  root.querySelectorAll("*").forEach((el) => {
    for (const attr of el.attributes) found.add(attr.name);
  });
  return [...found]
    .filter(
      (name) =>
        !STANDARD_ATTRS.has(name) &&
        !OWN_ATTRS.has(name) &&
        !name.startsWith("ms-"),
    )
    .sort();
};

const customPropsIn = (root: HTMLElement) => {
  const found = new Set<string>();
  root.querySelectorAll<HTMLElement>("[style]").forEach((el) => {
    const style = el.getAttribute("style") ?? "";
    for (const [, name] of style.matchAll(/(--[\w-]+)\s*:/g)) found.add(name);
  });
  return [...found].filter((name) => !name.startsWith("--ms-")).sort();
};

describe("class names", () => {
  it("namespaces everything MorphScroll renders", () => {
    const { container } = render(
      <MorphScroll
        size={[300, 300]}
        objectsSize={100}
        direction="hybrid"
        mode="sliderMenu"
        edge
        progressTrigger={{
          wheel: true,
          content: true,
          bar: { element: <span />, showOnHover: true },
          arrows: { element: <span />, size: 40 },
        }}
        render="virtual"
        emptyObjects="fallback"
      >
        {items(10)}
      </MorphScroll>,
    );

    expect(unprefixed(container)).toEqual([]);
    expect(attributesIn(container)).toEqual([]);
    expect(customPropsIn(container)).toEqual([]);
  });

  it("namespaces the edges and arrows on every side", () => {
    const { container } = render(
      <MorphScroll
        size={[300, 300]}
        objectsSize={100}
        direction="hybrid"
        edge
        progressTrigger={{ arrows: { element: <span />, size: 40 } }}
      >
        {items(10)}
      </MorphScroll>,
    );

    for (const side of ["top", "right", "bottom", "left"]) {
      expect(container.querySelector(`.ms-edge.ms-${side}`)).not.toBeNull();
      // the bare side name must not be used on its own
      expect(container.querySelector(`.ms-edge.${side}`)).toBeNull();
    }
  });

  it("namespaces the trackers", () => {
    const { container } = render(
      <ResizeTracker>
        <IntersectionTracker visibleContent>
          <div />
        </IntersectionTracker>
      </ResizeTracker>,
    );

    expect(unprefixed(container)).toEqual([]);
  });

  it("keeps the consumer's own className untouched", () => {
    const { container } = render(
      <MorphScroll size={300} objectsSize={100} className="my-scroll">
        {items(3)}
      </MorphScroll>,
    );

    expect(container.querySelector(".my-scroll")).not.toBeNull();
  });
});
