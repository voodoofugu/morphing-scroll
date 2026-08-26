import React from "react";
import { describe, it, expect, vi } from "vitest";
import {
  updateLoadedElementsKeys,
  updateEmptyKeysClick,
} from "@morphing-scroll/src/helpers/updateKeys";
import createTasks from "@morphing-scroll/src/helpers/createTasks";
import CONST from "@morphing-scroll/src/constants";

const makeKeysRef = () => ({
  current: { loaded: new Set<string>(), empty: new Set<string>() as Set<string> | null },
});

// Build a wrapper whose children carry WRAP_ATR; `filled` keys get a child node.
const buildWrapper = (keys: string[], filled: Set<string>) => {
  const wrapper = document.createElement("div");
  keys.forEach((key) => {
    const box = document.createElement("div");
    box.setAttribute(CONST.WRAP_ATR, key);
    if (filled.has(key)) box.appendChild(document.createElement("span"));
    wrapper.appendChild(box);
  });
  return wrapper;
};

describe("updateLoadedElementsKeys", () => {
  it("marks empty boxes as empty and non-empty as loaded (non-virtual)", () => {
    const wrapper = buildWrapper(["a", "b"], new Set(["a"]));
    const ref = makeKeysRef();
    const cb = vi.fn();

    updateLoadedElementsKeys(wrapper, ref as any, cb);

    expect(ref.current.loaded.has("a")).toBe(true);
    expect(ref.current.empty?.has("b")).toBe(true);
    // non-virtual: empty keys are also considered loaded
    expect(ref.current.loaded.has("b")).toBe(true);
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it("excludes empty boxes from loaded in virtual mode", () => {
    const wrapper = buildWrapper(["a", "b"], new Set(["a"]));
    const ref = makeKeysRef();

    updateLoadedElementsKeys(wrapper, ref as any, () => {}, "virtual");

    expect(ref.current.loaded.has("a")).toBe(true);
    expect(ref.current.empty?.has("b")).toBe(true);
    expect(ref.current.loaded.has("b")).toBe(false);
  });

  it("lazily allocates the empty set when null", () => {
    const wrapper = buildWrapper(["x"], new Set());
    const ref = { current: { loaded: new Set<string>(), empty: null } };

    updateLoadedElementsKeys(wrapper, ref as any, () => {});

    expect(ref.current.empty).not.toBeNull();
    expect((ref.current.empty as unknown as Set<string>).has("x")).toBe(true);
  });
});

describe("updateEmptyKeysClick", () => {
  const buildClickTarget = () => {
    const wrapper = document.createElement("div");
    wrapper.setAttribute(CONST.WRAP_ATR, "k");
    const inner = document.createElement("button");
    inner.className = "close";
    wrapper.appendChild(inner);
    document.body.appendChild(wrapper);
    return { wrapper, inner };
  };

  it("marks the wrapper with 'remove' when the selector matches", () => {
    const { wrapper, inner } = buildClickTarget();
    updateEmptyKeysClick(
      { target: inner } as unknown as React.MouseEvent,
      ".close",
      () => {},
      createTasks(),
    );
    expect(wrapper.classList.contains("remove")).toBe(true);
    wrapper.remove();
  });

  it("does nothing when the click target does not match the selector", () => {
    const { wrapper, inner } = buildClickTarget();
    const cb = vi.fn();
    updateEmptyKeysClick(
      { target: inner } as unknown as React.MouseEvent,
      ".other",
      cb,
      createTasks(),
    );
    expect(wrapper.classList.contains("remove")).toBe(false);
    expect(cb).not.toHaveBeenCalled();
    wrapper.remove();
  });
});
