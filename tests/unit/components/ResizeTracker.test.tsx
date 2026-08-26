import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, act } from "@testing-library/react";
import ResizeTracker from "@morphing-scroll/src/components/ResizeTracker";
import { resizeObservers } from "../../setup";

describe("ResizeTracker", () => {
  it("renders children inside a resize-tracker element", () => {
    const { container } = render(
      <ResizeTracker>
        <span>content</span>
      </ResizeTracker>,
    );
    const root = container.querySelector("[resize-tracker]");
    expect(root).toBeInTheDocument();
    expect(root).toHaveTextContent("content");
  });

  it("applies className and custom style", () => {
    const { container } = render(
      <ResizeTracker className="my-tracker" style={{ opacity: 0.5 }}>
        <span>x</span>
      </ResizeTracker>,
    );
    const root = container.querySelector("[resize-tracker]") as HTMLElement;
    expect(root).toHaveClass("my-tracker");
    expect(root.style.opacity).toBe("0.5");
  });

  it("uses max-content sizing for the default 'inner' measure", () => {
    const { container } = render(
      <ResizeTracker>
        <span>x</span>
      </ResizeTracker>,
    );
    const root = container.querySelector("[resize-tracker]") as HTMLElement;
    expect(root.style.width).toBe("max-content");
    expect(root.style.height).toBe("max-content");
  });

  it("uses 100% sizing for the 'outer' measure", () => {
    const { container } = render(
      <ResizeTracker measure="outer">
        <span>x</span>
      </ResizeTracker>,
    );
    const root = container.querySelector("[resize-tracker]") as HTMLElement;
    expect(root.style.width).toBe("100%");
    expect(root.style.height).toBe("100%");
  });

  it("observes the container element", () => {
    render(
      <ResizeTracker>
        <span>x</span>
      </ResizeTracker>,
    );
    expect(resizeObservers).toHaveLength(1);
    expect(resizeObservers[0].observe).toHaveBeenCalledTimes(1);
  });

  it("forwards contentRect to onResize", () => {
    const onResize = vi.fn();
    render(
      <ResizeTracker onResize={onResize}>
        <span>x</span>
      </ResizeTracker>,
    );

    act(() => {
      resizeObservers[0].emit({ width: 120, height: 80 });
    });

    expect(onResize).toHaveBeenCalledWith(
      expect.objectContaining({ width: 120, height: 80 }),
    );
  });

  it("disconnects the observer on unmount", () => {
    const { unmount } = render(
      <ResizeTracker>
        <span>x</span>
      </ResizeTracker>,
    );
    const observer = resizeObservers[0];
    unmount();
    expect(observer.disconnect).toHaveBeenCalled();
  });
});
