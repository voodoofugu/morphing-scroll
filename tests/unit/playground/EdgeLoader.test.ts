import React from "react";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import EdgeLoader from "../../../playground/src/custom/EdgeLoader";
import {
  activeEdgePull,
  edgePullProgress,
  PULL_RELOAD_THRESHOLD,
} from "../../../playground/src/custom/edgePull";

describe("playground edge pull loader", () => {
  it("maps the overscroll sign to the visual edge", () => {
    expect(edgePullProgress({ x: 20, y: -10 })).toEqual({
      top: 0,
      right: 0,
      bottom: 0.25,
      left: 0.5,
    });
  });

  it("fills at 40px and clamps beyond it", () => {
    expect(
      edgePullProgress({ x: 0, y: PULL_RELOAD_THRESHOLD * 2 }).top,
    ).toBe(1);
    expect(activeEdgePull({ x: 0, y: PULL_RELOAD_THRESHOLD })).toEqual({
      edge: "top",
      distance: PULL_RELOAD_THRESHOLD,
    });
  });

  it("has no active edge after returning to zero", () => {
    expect(activeEdgePull({ x: 0, y: 0 })).toBeNull();
  });

  it("marks only a full ring as active", () => {
    const { container, rerender } = render(
      React.createElement(EdgeLoader, {
        progress: edgePullProgress({ x: 39, y: 0 }),
      }),
    );

    expect(container.querySelector(".edge-pull-value.active")).toBeNull();

    rerender(
      React.createElement(EdgeLoader, {
        progress: edgePullProgress({ x: 40, y: 0 }),
      }),
    );

    expect(container.querySelectorAll(".edge-pull-value.active")).toHaveLength(
      1,
    );
    expect(
      container.querySelector(".edge-pull-value-left"),
    ).toHaveClass("active");
  });
});
