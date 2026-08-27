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
  root.querySelectorAll("*").forEach((el) =>
    el.classList.forEach((name) => found.add(name)),
  );
  return found;
};

const unprefixed = (root: HTMLElement) =>
  [...classesIn(root)].filter((name) => !name.startsWith("ms-")).sort();

describe("class names", () => {
  it("namespaces everything MorphScroll renders", () => {
    const { container } = render(
      <MorphScroll
        size={[300, 300]}
        objectsSize={100}
        direction="hybrid"
        mode="sliderMenu"
        edgeGradient
        scrollBarOnHover
        progressTrigger={{
          wheel: true,
          content: true,
          progressElement: <span />,
          arrows: { element: <span />, size: 40 },
        }}
        render="virtual"
        emptyElements="fallback"
      >
        {items(10)}
      </MorphScroll>,
    );

    expect(unprefixed(container)).toEqual([]);
  });

  it("namespaces the edges and arrows on every side", () => {
    const { container } = render(
      <MorphScroll
        size={[300, 300]}
        objectsSize={100}
        direction="hybrid"
        edgeGradient
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
