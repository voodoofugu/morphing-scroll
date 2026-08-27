import React from "react";
import { describe, it, expect } from "vitest";
import { render, waitFor } from "@testing-library/react";
import MorphScroll from "@morphing-scroll/src/components/MorphScroll";

const SIZE: [number, number] = [100, 300];
const OBJ = 100;

// item-1 renders nothing -> an "empty" box that emptyElements should act on.
const Empty = () => null;

const mixed = () => [
  <div key="item-0">item 0</div>,
  <Empty key="item-1" />,
  <div key="item-2">item 2</div>,
];

const boxes = (c: HTMLElement) => c.querySelectorAll(".ms-object-box");

describe("MorphScroll — emptyElements", () => {
  it("fallback: replaces an empty box with the empty-element placeholder", async () => {
    const { container } = render(
      <MorphScroll size={SIZE} objectsSize={OBJ} render="virtual" emptyElements="fallback">
        {mixed()}
      </MorphScroll>,
    );

    await waitFor(() => {
      expect(container.querySelector(".ms-empty-element")).toBeInTheDocument();
    });
    // all three boxes stay mounted under "fallback"
    expect(boxes(container)).toHaveLength(3);
  });

  it("clear: drops the empty box from the tree", async () => {
    const { container } = render(
      <MorphScroll size={SIZE} objectsSize={OBJ} render="virtual" emptyElements="clear">
        {mixed()}
      </MorphScroll>,
    );

    await waitFor(() => {
      expect(boxes(container)).toHaveLength(2);
    });
    const tagged = Array.from(container.querySelectorAll("[ms-wrap-id]")).map((n) =>
      n.getAttribute("ms-wrap-id"),
    );
    expect(tagged).toEqual([".$item-0", ".$item-2"]);
  });
});

describe("MorphScroll — suspending", () => {
  it("wraps children in a Suspense boundary and shows the fallback", () => {
    const Suspends = (): React.ReactElement => {
      throw new Promise<void>(() => {}); // never resolves -> stays suspended
    };

    const { container } = render(
      <MorphScroll
        size={SIZE}
        objectsSize={OBJ}
        suspending
        fallback={<div className="susp-fallback">loading…</div>}
      >
        <Suspends key="item-0" />
      </MorphScroll>,
    );

    expect(container.querySelector(".susp-fallback")).toBeInTheDocument();
  });
});

describe("MorphScroll — render.rootMargin", () => {
  const many = (n: number) =>
    Array.from({ length: n }, (_, i) => <div key={`item-${i}`}>item {i}</div>);

  const rendered = (c: HTMLElement) =>
    Array.from(c.querySelectorAll("[ms-wrap-id]")).map((n) =>
      n.getAttribute("ms-wrap-id"),
    );

  // rootMargin is documented as [top, right, bottom, left]. Like the CSS
  // property it mirrors, a margin on one side must preload in that direction:
  // `bottom` reaches further down, `right` further to the right.
  const virtualScroll = (
    direction: "x" | "y",
    rootMargin: [number, number, number, number],
  ) => (
    <MorphScroll
      size={direction === "x" ? [300, 100] : [100, 300]}
      objectsSize={100}
      direction={direction}
      render={{ mode: "virtual", rootMargin }}
    >
      {many(20)}
    </MorphScroll>
  );

  describe("vertical", () => {
    it("bottom margin preloads the items below the viewport", () => {
      const { container } = render(virtualScroll("y", [0, 0, 200, 0]));
      expect(rendered(container)).toHaveLength(5); // 3 visible + 2 preloaded
    });

    it("top margin preloads nothing at the very top", () => {
      const { container } = render(virtualScroll("y", [200, 0, 0, 0]));
      expect(rendered(container)).toHaveLength(3);
    });
  });

  describe("horizontal", () => {
    it("right margin preloads the items past the right edge", () => {
      const { container } = render(virtualScroll("x", [0, 200, 0, 0]));
      expect(rendered(container)).toHaveLength(5);
    });

    it("left margin preloads nothing at the very start", () => {
      const { container } = render(virtualScroll("x", [0, 0, 0, 200]));
      expect(rendered(container)).toHaveLength(3);
    });
  });

  it("a scalar margin preloads on both axes alike", () => {
    const y = render(virtualScroll("y", [200, 200, 200, 200]));
    expect(rendered(y.container)).toHaveLength(5);
    y.unmount();

    const x = render(virtualScroll("x", [200, 200, 200, 200]));
    expect(rendered(x.container)).toHaveLength(5);
  });
});
