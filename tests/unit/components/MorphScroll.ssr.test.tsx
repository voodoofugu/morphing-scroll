import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { renderToString } from "react-dom/server";
import { hydrateRoot } from "react-dom/client";
import { act } from "@testing-library/react";
import MorphScroll from "@morphing-scroll/src/components/MorphScroll";

const items = (n: number) =>
  Array.from({ length: n }, (_, i) => <div key={`item-${i}`}>item {i}</div>);

const Tree = () => (
  <MorphScroll objects={{ size: 100 }} size={[100, 300]}>
    {items(5)}
  </MorphScroll>
);

describe("MorphScroll — server rendering", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("renders on the server without touching browser globals", () => {
    expect(() => renderToString(<Tree />)).not.toThrow();
  });

  it("hydrates the server markup without a mismatch", () => {
    // The instance id comes from a module counter, so the server and the
    // client start from different numbers. Anything derived from it that
    // reaches the DOM shows up here as a hydration mismatch.
    const html = renderToString(<Tree />);

    const host = document.createElement("div");
    host.innerHTML = html;
    document.body.appendChild(host);

    const errors = vi.spyOn(console, "error").mockImplementation(() => {});

    act(() => {
      hydrateRoot(host, <Tree />);
    });

    const messages = errors.mock.calls.map((c) => String(c[0]));
    expect(messages.filter((m) => /hydrat|did not match|mismatch/i.test(m))).toEqual([]);
  });
});
