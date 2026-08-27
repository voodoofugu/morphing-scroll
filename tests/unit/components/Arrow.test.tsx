import React from "react";
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import MorphScroll from "@morphing-scroll/src/components/MorphScroll";

const SIZE: [number, number] = [100, 300];
const OBJ = 100;

const items = (n: number) =>
  Array.from({ length: n }, (_, i) => <div key={`item-${i}`}>item {i}</div>);

const arrows = (extra: Record<string, unknown> = {}) => (
  <MorphScroll
    size={SIZE}
    objectsSize={OBJ}
    progressTrigger={{ arrows: { element: <i />, size: 40, ...extra } }}
  >
    {items(20)}
  </MorphScroll>
);

const arrow = (c: HTMLElement, side: string) =>
  c.querySelector<HTMLElement>(`.ms-arrow-box.ms-${side}`)!;

describe("Arrow — disabled state", () => {
  it("marks the arrow that has nowhere to scroll", () => {
    const { container } = render(arrows());

    // sitting at the top: back is a dead end, forward is not
    expect(arrow(container, "top")).toHaveClass("ms-disabled");
    expect(arrow(container, "bottom")).not.toHaveClass("ms-disabled");
  });

  it("never marks an arrow when loop is on", () => {
    const { container } = render(arrows({ loop: true }));

    // with loop even the top arrow wraps around, so nothing is a dead end
    expect(arrow(container, "top")).not.toHaveClass("ms-disabled");
    expect(arrow(container, "bottom")).not.toHaveClass("ms-disabled");
  });

  it("does not use the unprefixed active class", () => {
    const { container } = render(arrows());
    expect(container.querySelector(".ms-arrow-box.active")).toBeNull();
  });
});

describe("slider elements", () => {
  it("never uses the unprefixed active class", () => {
    const { container } = render(
      <MorphScroll
        size={SIZE}
        objectsSize={300}
        mode="sliderMenu"
        progressTrigger={{ wheel: true, progressElement: <span /> }}
      >
        {items(6)}
      </MorphScroll>,
    );
    expect(container.querySelectorAll(".ms-slider-element").length).toBeGreaterThan(1);
    expect(container.querySelector(".ms-slider-element.active")).toBeNull();
  });
});
