import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import MorphScroll from "@morphing-scroll/src/components/MorphScroll";

/**
 * Tier 2: prop-logic tests.
 *
 * MorphScroll's layout math is driven by numeric `size`/`objectsSize` props
 * (not real measurements), so with explicit sizes the virtualization, edges,
 * arrows and scrollbar decisions are deterministic in jsdom. Physics that
 * needs a real layout engine (wheel/drag/inertia/snapping) lives in the
 * Playwright e2e suite instead.
 */

// A tall single-column setup: width 100 == objectsSize -> 1 per row,
// height 300 -> exactly 3 items fit in the viewport at scrollTop 0.
const SIZE: [number, number] = [100, 300];
const OBJ = 100;

const items = (n: number) =>
  Array.from({ length: n }, (_, i) => (
    <div key={`item-${i}`} data-testid={`item-${i}`}>
      item {i}
    </div>
  ));

const boxes = (container: HTMLElement) =>
  container.querySelectorAll(".ms-object-box");

describe("MorphScroll — mounting & children", () => {
  it("throws when the required size prop is missing", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    // size={0} is falsy -> the guard throws
    expect(() =>
      render(<MorphScroll size={0 as unknown as number}>{items(3)}</MorphScroll>),
    ).toThrow(/size/);
    spy.mockRestore();
  });

  it("renders every child when virtualization is off", () => {
    const { container } = render(
      <MorphScroll size={SIZE} objectsSize={OBJ}>
        {items(10)}
      </MorphScroll>,
    );
    expect(boxes(container)).toHaveLength(10);
  });

  it("wraps children in .ms-object-box and exposes the root attributes", () => {
    const { container } = render(
      <MorphScroll size={SIZE} objectsSize={OBJ} className="custom">
        {items(2)}
      </MorphScroll>,
    );
    const root = container.querySelector("[morph-scroll]");
    expect(root).toBeInTheDocument();
    expect(root).toHaveClass("custom");
    expect(container.querySelector(".ms-objects-wrapper")).toBeInTheDocument();
  });

  it("ignores null/undefined children", () => {
    const { container } = render(
      <MorphScroll size={SIZE} objectsSize={OBJ}>
        {null}
        <div key="a">a</div>
        {undefined}
        {false}
        <div key="b">b</div>
      </MorphScroll>,
    );
    expect(boxes(container)).toHaveLength(2);
  });
});

describe("MorphScroll — render: virtual / lazy", () => {
  it("virtual renders only the items visible in the viewport", () => {
    const { container } = render(
      <MorphScroll size={SIZE} objectsSize={OBJ} render="virtual">
        {items(10)}
      </MorphScroll>,
    );
    // viewport height 300 / objectsSize 100 => items 0,1,2 visible
    expect(boxes(container)).toHaveLength(3);
  });

  it("virtual tags rendered boxes with the wrap-id attribute", () => {
    const { container } = render(
      <MorphScroll size={SIZE} objectsSize={OBJ} render="virtual">
        {items(10)}
      </MorphScroll>,
    );
    const tagged = container.querySelectorAll("[wrap-id]");
    expect(tagged).toHaveLength(3);
    // NOTE: the attribute stores the raw React path ('.$key'); it is only
    // normalized to the clean key inside getRenderedKeysFromWrapper.
    expect(tagged[0].getAttribute("wrap-id")).toBe(".$item-0");
  });

  // Characterization: lazy marks visible items as "loaded" during the first
  // render but returns null for them that same pass (`if (!wasLoaded) return
  // null`). They only paint on the NEXT render tick. Flagged for review.
  it("lazy paints nothing on the first render, then the visible items", () => {
    const { container, rerender } = render(
      <MorphScroll size={SIZE} objectsSize={OBJ} render="lazy">
        {items(10)}
      </MorphScroll>,
    );
    expect(boxes(container)).toHaveLength(0);

    rerender(
      <MorphScroll size={SIZE} objectsSize={OBJ} render="lazy">
        {items(10)}
      </MorphScroll>,
    );
    expect(boxes(container)).toHaveLength(3);
  });

  it("logs an error when render is combined with objectsSize='none'", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <MorphScroll size={SIZE} objectsSize="none" render="virtual">
        {items(3)}
      </MorphScroll>,
    );
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining("objectsSize"),
    );
    spy.mockRestore();
  });
});

describe("MorphScroll — direction & crossCount", () => {
  it("virtualizes along the x axis for direction='x'", () => {
    const { container } = render(
      <MorphScroll size={[300, 100]} objectsSize={OBJ} direction="x" render="virtual">
        {items(10)}
      </MorphScroll>,
    );
    // viewport width 300 / objectsSize 100 => 3 columns visible
    expect(boxes(container)).toHaveLength(3);
  });

  it("limits columns with crossCount, shrinking the visible virtual set", () => {
    // width 300 fits 3 columns; crossCount=2 forces a 2-wide grid, so the
    // 300px-tall viewport shows 3 rows * 2 = 6 items instead of 8.
    const { container } = render(
      <MorphScroll size={300} objectsSize={OBJ} crossCount={2} render="virtual">
        {items(8)}
      </MorphScroll>,
    );
    expect(boxes(container)).toHaveLength(6);
  });
});

describe("MorphScroll — edgeGradient", () => {
  it("renders no edges by default", () => {
    const { container } = render(
      <MorphScroll size={SIZE} objectsSize={OBJ}>
        {items(10)}
      </MorphScroll>,
    );
    expect(container.querySelectorAll(".ms-edge")).toHaveLength(0);
  });

  it("renders two edges for a single-axis direction", () => {
    const { container } = render(
      <MorphScroll size={SIZE} objectsSize={OBJ} edgeGradient>
        {items(10)}
      </MorphScroll>,
    );
    expect(container.querySelectorAll(".ms-edge")).toHaveLength(2);
  });

  it("renders four edges in hybrid direction", () => {
    const { container } = render(
      <MorphScroll
        size={300}
        objectsSize={OBJ}
        direction="hybrid"
        edgeGradient
      >
        {items(10)}
      </MorphScroll>,
    );
    expect(container.querySelectorAll(".ms-edge")).toHaveLength(4);
  });
});

describe("MorphScroll — arrows", () => {
  it("renders arrow boxes when progressTrigger.arrows is set", () => {
    const { container } = render(
      <MorphScroll
        size={SIZE}
        objectsSize={OBJ}
        progressTrigger={{ arrows: true }}
      >
        {items(10)}
      </MorphScroll>,
    );
    expect(container.querySelectorAll(".ms-arrow-box")).toHaveLength(2);
  });

  it("renders a custom arrow element", () => {
    const { container } = render(
      <MorphScroll
        size={SIZE}
        objectsSize={OBJ}
        progressTrigger={{ arrows: <span className="my-arrow">→</span> }}
      >
        {items(10)}
      </MorphScroll>,
    );
    expect(container.querySelectorAll(".my-arrow").length).toBeGreaterThan(0);
  });
});

describe("MorphScroll — scrollbar (progressElement)", () => {
  it("renders a scroll bar + thumb when content overflows", () => {
    const { container } = render(
      <MorphScroll
        size={SIZE}
        objectsSize={OBJ}
        progressTrigger={{
          wheel: true,
          progressElement: <div className="my-thumb" />,
        }}
      >
        {items(10)}
      </MorphScroll>,
    );
    expect(container.querySelector(".ms-bar")).toBeInTheDocument();
    expect(container.querySelector(".ms-thumb")).toBeInTheDocument();
    expect(container.querySelector(".my-thumb")).toBeInTheDocument();
  });

  it("does not render a scroll bar when content fits the viewport", () => {
    const { container } = render(
      <MorphScroll
        size={SIZE}
        objectsSize={OBJ}
        progressTrigger={{
          wheel: true,
          progressElement: <div className="my-thumb" />,
        }}
      >
        {items(2)}
      </MorphScroll>,
    );
    expect(container.querySelector(".ms-bar")).not.toBeInTheDocument();
  });

  it("renders no scroll bar when progressElement is true (native bar)", () => {
    const { container } = render(
      <MorphScroll
        size={SIZE}
        objectsSize={OBJ}
        progressTrigger={{ wheel: true, progressElement: true }}
      >
        {items(10)}
      </MorphScroll>,
    );
    expect(container.querySelector(".ms-bar")).not.toBeInTheDocument();
  });
});

describe("MorphScroll — onRenderedKeysChange", () => {
  it("reports the visible keys under virtualization", async () => {
    const onRenderedKeysChange = vi.fn();
    render(
      <MorphScroll
        size={SIZE}
        objectsSize={OBJ}
        render="virtual"
        onRenderedKeysChange={onRenderedKeysChange}
      >
        {items(10)}
      </MorphScroll>,
    );

    await waitFor(() => {
      expect(onRenderedKeysChange).toHaveBeenCalledWith([
        "item-0",
        "item-1",
        "item-2",
      ]);
    });
  });
});
