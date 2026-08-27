import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, act } from "@testing-library/react";
import IntersectionTracker from "@morphing-scroll/src/components/IntersectionTracker";
import { intersectionObservers } from "../../setup";

describe("IntersectionTracker", () => {
  it("renders children right away", () => {
    const { container } = render(
      <IntersectionTracker>
        <span>always</span>
      </IntersectionTracker>,
    );
    expect(container).toHaveTextContent("always");
  });

  /*
   * Прятать по видимости — работа `MorphScroll render`, и он делает это по
   * позициям, без наблюдателя на каждый элемент. Трекер только сообщает.
   */
  it("keeps them there whatever the observer says", () => {
    const { container } = render(
      <IntersectionTracker>
        <span>toggle</span>
      </IntersectionTracker>,
    );

    act(() => intersectionObservers[0].emit({ isIntersecting: true }));
    expect(container).toHaveTextContent("toggle");

    act(() => intersectionObservers[0].emit({ isIntersecting: false }));
    expect(container).toHaveTextContent("toggle");
  });

  it("does not re-render its children when visibility flips", () => {
    let renders = 0;
    const Counted = () => {
      renders += 1;
      return <span>counted</span>;
    };

    render(
      <IntersectionTracker>
        <Counted />
      </IntersectionTracker>,
    );
    const afterMount = renders;

    act(() => intersectionObservers[0].emit({ isIntersecting: true }));
    act(() => intersectionObservers[0].emit({ isIntersecting: false }));

    expect(renders).toBe(afterMount);
  });

  it("forwards a normalized entry to onIntersection", () => {
    const onIntersection = vi.fn();
    render(
      <IntersectionTracker onIntersection={onIntersection}>
        <span>x</span>
      </IntersectionTracker>,
    );

    act(() =>
      intersectionObservers[0].emit({
        isIntersecting: true,
        intersectionRatio: 0.5,
        time: 123,
      }),
    );

    expect(onIntersection).toHaveBeenCalledWith(
      expect.objectContaining({ isIntersecting: true, intersectionRatio: 0.5 }),
    );
  });

  it("formats rootMargin from a numeric shorthand", () => {
    render(
      <IntersectionTracker rootMargin={10}>
        <span>x</span>
      </IntersectionTracker>,
    );
    // number 10 -> argsFormatter -> [10,10,10,10] -> "10px 10px 10px 10px"
    expect(intersectionObservers[0].options?.rootMargin).toBe(
      "10px 10px 10px 10px",
    );
  });

  it("passes root and threshold through to the observer", () => {
    render(
      <IntersectionTracker threshold={[0, 0.5, 1]}>
        <span>x</span>
      </IntersectionTracker>,
    );
    expect(intersectionObservers[0].options?.threshold).toEqual([0, 0.5, 1]);
  });

  it("disconnects on unmount", () => {
    const { unmount } = render(
      <IntersectionTracker>
        <span>x</span>
      </IntersectionTracker>,
    );
    const observer = intersectionObservers[0];
    unmount();
    expect(observer.disconnect).toHaveBeenCalled();
  });
});
