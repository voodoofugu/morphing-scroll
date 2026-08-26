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
    const tagged = Array.from(container.querySelectorAll("[wrap-id]")).map((n) =>
      n.getAttribute("wrap-id"),
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
