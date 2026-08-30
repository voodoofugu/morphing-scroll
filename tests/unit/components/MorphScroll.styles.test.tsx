import React from "react";
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import MorphScroll from "@morphing-scroll/src/components/MorphScroll";

const items = (n: number) =>
  Array.from({ length: n }, (_, i) => <div key={`item-${i}`}>item {i}</div>);

const wrapperOf = (c: HTMLElement) =>
  c.querySelector(".ms-objects-wrapper") as HTMLElement;
const elementOf = (c: HTMLElement) =>
  c.querySelector(".ms-viewport") as HTMLElement;
const firstBox = (c: HTMLElement) =>
  c.querySelector(".ms-object-box") as HTMLElement;

describe("MorphScroll — layout styles on the objects wrapper", () => {
  it("applies gap between objects", () => {
    const { container } = render(
      <MorphScroll objects={{ size: 50, gap: 15 }} size={[100, 300]}>
        {items(6)}
      </MorphScroll>,
    );
    expect(wrapperOf(container).style.gap).toContain("15px");
  });

  it("applies wrapper.margin", () => {
    const { container } = render(
      <MorphScroll objects={{ size: 50 }} size={[100, 300]} wrapper={{ margin: 10 }}>
        {items(3)}
      </MorphScroll>,
    );
    expect(wrapperOf(container).style.margin).toContain("10px");
  });

  it("applies wrapper.minSize as minHeight for direction y", () => {
    const { container } = render(
      <MorphScroll objects={{ size: 50 }} size={[100, 300]} wrapper={{ minSize: 250 }}>
        {items(2)}
      </MorphScroll>,
    );
    expect(wrapperOf(container).style.minHeight).toBe("250px");
  });

  it("maps objectsAlign to justifyContent (flex layout)", () => {
    const { container } = render(
      <MorphScroll objects={{ size: 50, align: "center" }} size={[100, 300]}>
        {items(2)}
      </MorphScroll>,
    );
    expect(wrapperOf(container).style.justifyContent).toBe("center");
  });
});

describe("MorphScroll — objectsSize modes", () => {
  it("number: sets a fixed box width/height", () => {
    const { container } = render(
      <MorphScroll objects={{ size: 80 }} size={[100, 300]}>
        {items(2)}
      </MorphScroll>,
    );
    const box = firstBox(container);
    expect(box.style.width).toBe("80px");
    expect(box.style.height).toBe("80px");
  });

  it("pair [w, h]: sets distinct box width and height", () => {
    const { container } = render(
      <MorphScroll objects={{ size: [80, 120] }} size={[200, 300]}>
        {items(2)}
      </MorphScroll>,
    );
    const box = firstBox(container);
    expect(box.style.width).toBe("80px");
    expect(box.style.height).toBe("120px");
  });

  it("none: leaves box dimensions unset", () => {
    const { container } = render(
      <MorphScroll objects={{ size: "none" }} size={[100, 300]}>
        {items(2)}
      </MorphScroll>,
    );
    const box = firstBox(container);
    expect(box.style.width).toBe("");
    expect(box.style.height).toBe("");
  });
});

describe("MorphScroll — wrapper.align", () => {
  it("centers content smaller than the viewport", () => {
    const { container } = render(
      <MorphScroll objects={{ size: 100 }} size={300} wrapper={{ align: "center" }}>
        {items(1)}
      </MorphScroll>,
    );
    const el = elementOf(container);
    // content (100x100) smaller than viewport (300x300) on both axes
    expect(el.style.justifyContent).toBe("center");
    expect(el.style.alignItems).toBe("center");
  });
});

describe("MorphScroll — bar.reverse", () => {
  const renderBar = (reverse: boolean) =>
    render(
      <MorphScroll objects={{ size: 100 }}
        size={[100, 300]}
        progressTrigger={{ wheel: true, bar: { element: <div />, reverse } }}
      >
        {items(10)}
      </MorphScroll>,
    );

  it("pins the y bar to the right by default", () => {
    const { container } = renderBar(false);
    const bar = container.querySelector(".ms-bar") as HTMLElement;
    expect(bar.style.right).toBe("0px");
  });

  it("pins the y bar to the left when reversed", () => {
    const { container } = renderBar(true);
    const bar = container.querySelector(".ms-bar") as HTMLElement;
    expect(bar.style.left).toBe("0px");
  });
});
