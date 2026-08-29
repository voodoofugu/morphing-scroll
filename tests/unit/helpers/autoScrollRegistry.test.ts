import { describe, it, expect, afterEach } from "vitest";
import {
  registerContainer,
  unregisterContainer,
  getContainers,
} from "@morphing-scroll/src/helpers/autoScrollRegistry";

const makeContainer = (direction: "x" | "y" | "hybrid" = "y") => ({
  parent: document.createElement("div"),
  element: document.createElement("div"),
  direction,
});

afterEach(() => {
  // clean the shared module-level map between tests
  Array.from(getContainers().values()).forEach((c) => unregisterContainer(c));
});

describe("autoScrollRegistry", () => {
  it("registers a container keyed by its parent", () => {
    const c = makeContainer();
    registerContainer(c);
    expect(getContainers().has(c.parent)).toBe(true);
    expect(getContainers().size).toBe(1);
  });

  it("unregisters a container", () => {
    const c = makeContainer();
    registerContainer(c);
    unregisterContainer(c);
    expect(getContainers().size).toBe(0);
  });

  it("tracks multiple independent containers", () => {
    const a = makeContainer("x");
    const b = makeContainer("hybrid");
    registerContainer(a);
    registerContainer(b);
    expect(getContainers().size).toBe(2);

    unregisterContainer(a);
    expect(getContainers().size).toBe(1);
    expect(getContainers().has(b.parent)).toBe(true);
  });

  it("overwrites the entry when the same parent registers again", () => {
    const parent = document.createElement("div");
    const first = { parent, element: document.createElement("div"), direction: "y" as const };
    const second = { parent, element: document.createElement("div"), direction: "x" as const };
    registerContainer(first);
    registerContainer(second);
    expect(getContainers().size).toBe(1);
    expect(getContainers().get(parent)?.direction).toBe("x");
  });
});
