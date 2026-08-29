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
        progressTrigger={{ wheel: true, bar: <span /> }}
      >
        {items(6)}
      </MorphScroll>,
    );
    expect(container.querySelectorAll(".ms-slider-item").length).toBeGreaterThan(1);
    expect(container.querySelector(".ms-slider-item.active")).toBeNull();
  });
});

describe("arrow and edge layout", () => {
  const hybrid = (
    <MorphScroll
      size={[300, 300]}
      objectsSize={100}
      direction="hybrid"
      edge={<i className="fade" />}
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

  it("hangs the arrows off the component root, with no wrapper in between", () => {
    const { container } = render(hybrid);
    const root = container.querySelector<HTMLElement>("[morph-scroll]")!;

    const boxes = root.querySelectorAll(":scope > .ms-arrow-box");
    expect(boxes).toHaveLength(4);
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

    // and the wrapper does nothing but turn it — the icon sizes itself
    const inner = container.querySelector<HTMLElement>(".ms-arrow")!;
    expect(inner.style.width).toBe("");
    expect(inner.style.height).toBe("");
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

describe("Arrow — sizing and cursor", () => {
  const withArrows = (extra: Record<string, unknown> = {}) => (
    <MorphScroll
      size={SIZE}
      objectsSize={OBJ}
      progressTrigger={{ arrows: { element: <i />, size: 40, ...extra } }}
    >
      {items(20)}
    </MorphScroll>
  );

  it("sizes only the clickable strip, never the icon", () => {
    const { container } = render(withArrows());
    const box = container.querySelector<HTMLElement>(".ms-arrow-box.ms-bottom")!;
    const arrow = container.querySelector<HTMLElement>(".ms-arrow-box.ms-bottom .ms-arrow")!;

    expect(box.style.height).toBe("40px");
    expect(box.style.width).toBe("100%");

    // how big the icon is, is the icon's business
    expect(arrow.style.width).toBe("");
    expect(arrow.style.height).toBe("");
  });

  it("drops the pointer cursor on a dead end", () => {
    const { container } = render(withArrows());

    expect(
      container.querySelector<HTMLElement>(".ms-arrow-box.ms-top")!.style.cursor,
    ).toBe("");
    expect(
      container.querySelector<HTMLElement>(".ms-arrow-box.ms-bottom")!.style
        .cursor,
    ).toBe("pointer");
  });

  it("keeps the cursor on every arrow when loop is on", () => {
    const { container } = render(withArrows({ loop: true }));

    for (const side of ["top", "bottom"])
      expect(
        container.querySelector<HTMLElement>(`.ms-arrow-box.ms-${side}`)!.style
          .cursor,
      ).toBe("pointer");
  });
});

describe("Arrow — cursor", () => {
  it("offers the pointer only where there is somewhere to go", () => {
    const { container } = render(arrows());

    expect(
      container.querySelector<HTMLElement>(".ms-arrow-box.ms-bottom")!.style.cursor,
    ).toBe("pointer");
    // nothing is forced on the dead end, so CSS decides what it looks like
    expect(
      container.querySelector<HTMLElement>(".ms-arrow-box.ms-top")!.style.cursor,
    ).toBe("");
  });

  it("keeps the pointer on every arrow when loop is on", () => {
    const { container } = render(arrows({ loop: true }));

    for (const side of ["top", "bottom"])
      expect(
        container.querySelector<HTMLElement>(`.ms-arrow-box.ms-${side}`)!.style
          .cursor,
      ).toBe("pointer");
  });
});

describe("a changed element reaches the DOM", () => {
  const withArrow = (label: string) => (
    <MorphScroll
      size={SIZE}
      objectsSize={OBJ}
      edge={<u>{label}</u>}
      progressTrigger={{ arrows: { element: <i>{label}</i>, size: 40 } }}
    >
      {items(20)}
    </MorphScroll>
  );

  it("updates the arrow icon", () => {
    const { container, rerender } = render(withArrow("A"));
    expect(container.querySelector(".ms-arrow")).toHaveTextContent("A");

    rerender(withArrow("B"));
    expect(container.querySelector(".ms-arrow")).toHaveTextContent("B");
  });

  it("updates the edge content", () => {
    const { container, rerender } = render(withArrow("A"));
    expect(container.querySelector(".ms-edge-inner")).toHaveTextContent("A");

    rerender(withArrow("B"));
    expect(container.querySelector(".ms-edge-inner")).toHaveTextContent("B");
  });

  it("keeps the edges as they are when nothing actually changed", () => {
    const { container, rerender } = render(withArrow("A"));
    const first = container.querySelector(".ms-edge");

    rerender(withArrow("A"));

    expect(container.querySelector(".ms-edge")).toBe(first);
  });
});
