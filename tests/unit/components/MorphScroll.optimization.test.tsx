import React from "react";
import { describe, it, expect } from "vitest";
import { render, waitFor } from "@testing-library/react";
import MorphScroll from "@morphing-scroll/src/components/MorphScroll";

const SIZE: [number, number] = [100, 300];
const OBJ = 100;

// item-1 renders nothing -> an "empty" box that emptyObjects should act on.
const Empty = () => null;

const mixed = () => [
  <div key="item-0">item 0</div>,
  <Empty key="item-1" />,
  <div key="item-2">item 2</div>,
];

const boxes = (c: HTMLElement) => c.querySelectorAll(".ms-object-box");

describe("MorphScroll — emptyObjects", () => {
  it("fallback: replaces an empty box with the empty-element placeholder", async () => {
    const { container } = render(
      <MorphScroll objects={{ size: OBJ, empty: "fallback" }} size={SIZE} render="virtual">
        {mixed()}
      </MorphScroll>,
    );

    await waitFor(() => {
      expect(container.querySelector(".ms-empty-object")).toBeInTheDocument();
    });
    // all three boxes stay mounted under "fallback"
    expect(boxes(container)).toHaveLength(3);
  });

  /*
   * Заглушка одна, и различаются два случая её именами: `empty` встаёт там,
   * где объект оказался пуст, `loading` — пока он в пути. Раньше их было две
   * — общий проп и своя внутри `empty`, — с правилом, которая главнее.
   */
  it("tells the empty stand-in from the one that waits", async () => {
    const { container } = render(
      <MorphScroll
        objects={{ size: OBJ, empty: "fallback" }}
        size={SIZE}
        render="virtual"
        fallback={{ empty: <b className="mine" />, loading: <i className="waits" /> }}
      >
        {mixed()}
      </MorphScroll>,
    );

    await waitFor(() => {
      expect(container.querySelector("b.mine")).toBeInTheDocument();
    });
    expect(container.querySelector("i.waits")).toBeNull();
  });

  /* а голый узел встаёт в обоих случаях — это простая форма того же */
  it("a bare node stands in for both", async () => {
    const { container } = render(
      <MorphScroll
        objects={{ size: OBJ, empty: "fallback" }}
        size={SIZE}
        render="virtual"
        fallback={<i className="shared" />}
      >
        {mixed()}
      </MorphScroll>,
    );

    await waitFor(() => {
      expect(container.querySelector("i.shared")).toBeInTheDocument();
    });
  });

  /*
   * `empty` — уточнение: не назвав его, человек не отказался от заглушки, и
   * названный `loading` встаёт и на пустой объект.
   */
  it("the empty case takes the stand-in there is when it has none", async () => {
    const { container } = render(
      <MorphScroll
        objects={{ size: OBJ, empty: "fallback" }}
        size={SIZE}
        render="virtual"
        fallback={{ loading: <i className="only-one" /> }}
      >
        {mixed()}
      </MorphScroll>,
    );

    await waitFor(() => {
      expect(container.querySelector("i.only-one")).toBeInTheDocument();
    });
  });

  /* та же заглушка и при объектной форме `empty` — она про режим, не про узел */
  it("the object form of empty asks for the same stand-in", async () => {
    const { container } = render(
      <MorphScroll objects={{ size: OBJ, empty: { mode: "fallback" } }}
        size={SIZE}
        render="virtual"
        fallback={<i className="shared" />}
      >
        {mixed()}
      </MorphScroll>,
    );

    await waitFor(() => {
      expect(container.querySelector("i.shared")).toBeInTheDocument();
    });
  });

  it("clear: drops the empty box from the tree", async () => {
    const { container } = render(
      <MorphScroll objects={{ size: OBJ, empty: "clear" }} size={SIZE} render="virtual">
        {mixed()}
      </MorphScroll>,
    );

    await waitFor(() => {
      expect(boxes(container)).toHaveLength(2);
    });
    const tagged = Array.from(container.querySelectorAll("[ms-wrap-id]")).map((n) =>
      n.getAttribute("ms-wrap-id"),
    );
    expect(tagged).toEqual(["item-0", "item-2"]);
  });
});

describe("MorphScroll — suspending", () => {
  it("wraps children in a Suspense boundary and shows the fallback", () => {
    const Suspends = (): React.ReactElement => {
      throw new Promise<void>(() => {}); // never resolves -> stays suspended
    };

    const { container } = render(
      <MorphScroll objects={{ size: OBJ }}
        size={SIZE}
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
    <MorphScroll objects={{ size: 100 }}
      size={direction === "x" ? [300, 100] : [100, 300]}
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
