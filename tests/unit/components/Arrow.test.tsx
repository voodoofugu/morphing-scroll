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

describe("arrow and edge layout", () => {
  const hybrid = (
    <MorphScroll
      size={[300, 300]}
      objectsSize={100}
      direction="hybrid"
      edgeGradient={<i className="fade" />}
      progressTrigger={{ arrows: { element: <b className="tip" />, size: 40 } }}
    >
      {items(20)}
    </MorphScroll>
  );

  it("positions arrows inside the component, not some ancestor", () => {
    const { container } = render(hybrid);
    const root = container.querySelector<HTMLElement>("[morph-scroll]")!;

    // without this the absolutely positioned arrows resolve against whatever
    // happens to be positioned further up the page
    expect(root.style.position).toBe("relative");
  });

  it("collects the arrows under one parent that does not eat clicks", () => {
    const { container } = render(hybrid);
    const parent = container.querySelector<HTMLElement>(".ms-arrows")!;

    expect(parent).not.toBeNull();
    expect(parent.querySelectorAll(".ms-arrow-box")).toHaveLength(4);
    expect(parent.style.pointerEvents).toBe("none");
    expect(
      container.querySelector<HTMLElement>(".ms-arrow-box")!.style.pointerEvents,
    ).toBe("auto");
  });

  it("keeps the slot free of transforms and orients the icon instead", () => {
    const { container } = render(hybrid);

    for (const side of ["top", "right", "bottom", "left"]) {
      const box = container.querySelector<HTMLElement>(`.ms-arrow-box.ms-${side}`)!;
      expect(box.style.transform).toBe("");
    }

    const orientation = (side: string) =>
      container.querySelector<HTMLElement>(`.ms-arrow-box.ms-${side} .ms-arrow`)!
        .style.transform;

    // one icon, authored pointing right, serves all four sides
    expect(container.querySelectorAll(".ms-arrow .tip")).toHaveLength(4);
    expect(orientation("right")).toBe("");
    expect(orientation("left")).toBe("scaleX(-1)");
    expect(orientation("bottom")).toBe("rotate(90deg)");
    expect(orientation("top")).toBe("rotate(-90deg)");
  });

  it("mirrors one edge node across both ends of an axis", () => {
    const { container } = render(hybrid);

    const inner = (side: string) =>
      container.querySelector<HTMLElement>(`.ms-edge.ms-${side} .ms-edge-inner`)!
        .style.transform;

    expect(container.querySelectorAll(".ms-edge-inner .fade")).toHaveLength(4);
    expect(inner("top")).toBe("");
    expect(inner("bottom")).toBe("scaleY(-1)");
    expect(inner("right")).toBe("");
    expect(inner("left")).toBe("scaleX(-1)");

    // the slot itself stays untransformed so CSS can place it predictably
    expect(
      container.querySelector<HTMLElement>(".ms-edge.ms-bottom")!.style.transform,
    ).toBe("");
  });
});
