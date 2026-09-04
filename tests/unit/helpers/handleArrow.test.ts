import { describe, it, expect, vi } from "vitest";
import handleArrow from "@morphing-scroll/src/helpers/handleArrow";

type FakeEl = {
  scrollTop: number;
  scrollLeft: number;
  clientWidth: number;
  clientHeight: number;
};

const setup = (over: Partial<FakeEl> = {}) => {
  const scrollElement: FakeEl = {
    scrollTop: 0,
    scrollLeft: 0,
    clientWidth: 300,
    clientHeight: 300,
    ...over,
  };
  const smoothScroll = vi.fn();
  const base = {
    scrollElement: scrollElement as unknown as Element,
    wrapSize: [700, 700],
    scrollSize: [300, 300],
    smoothScroll,
    duration: 200,
    gap: [0, 0],
  };
  return { scrollElement, smoothScroll, base };
};

describe("handleArrow", () => {
  it("bottom: pages one viewport down", () => {
    const { smoothScroll, base } = setup({ scrollTop: 0 });
    handleArrow({ ...base, arrowType: "bottom" });
    // step = clientHeight(300) + gap(0); page 0 -> next page 1 -> 300
    expect(smoothScroll).toHaveBeenCalledWith(300, "y", 200);
  });

  it("top: pages one viewport up from a scrolled position", () => {
    const { smoothScroll, base } = setup({ scrollTop: 350 });
    handleArrow({ ...base, arrowType: "top" });
    // page = floor(350/300)=1 -> next 0 -> 0
    expect(smoothScroll).toHaveBeenCalledWith(0, "y", 200);
  });

  it("top: does nothing at the start", () => {
    const { smoothScroll, base } = setup({ scrollTop: 0 });
    handleArrow({ ...base, arrowType: "top" });
    expect(smoothScroll).not.toHaveBeenCalled();
  });


  it("right: pages one viewport along x", () => {
    const { smoothScroll, base } = setup({ scrollLeft: 0 });
    handleArrow({ ...base, arrowType: "right" });
    expect(smoothScroll).toHaveBeenCalledWith(300, "x", 200);
  });


  it("accounts for gap in the page step", () => {
    const { smoothScroll, base } = setup({ scrollTop: 0 });
    handleArrow({ ...base, arrowType: "bottom", gap: [10, 20] });
    // step = clientHeight(300) + gap[1](20) = 320
    expect(smoothScroll).toHaveBeenCalledWith(320, "y", 200);
  });
});
