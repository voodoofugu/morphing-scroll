import { describe, it, expect } from "vitest";
import {
  getRenderedKeysFromWrapper,
  areKeysEqual,
} from "@morphing-scroll/src/helpers/getRenderedKeysFromWrapper";
import CONST from "@morphing-scroll/src/constants";

const makeWrapper = (attrs: (string | null)[]) => {
  const wrapper = document.createElement("div");
  attrs.forEach((attr) => {
    const child = document.createElement("div");
    if (attr !== null) child.setAttribute(CONST.WRAP_ATR, attr);
    wrapper.appendChild(child);
  });
  return wrapper;
};

describe("getRenderedKeysFromWrapper", () => {
  it("returns [] for a null wrapper", () => {
    expect(getRenderedKeysFromWrapper(null)).toEqual([]);
  });

  it("collects the wrap-id attribute of each child", () => {
    const wrapper = makeWrapper(["a", "b", "c"]);
    expect(getRenderedKeysFromWrapper(wrapper)).toEqual(["a", "b", "c"]);
  });

  it("skips children without the wrap-id attribute", () => {
    const wrapper = makeWrapper(["a", null, "c"]);
    expect(getRenderedKeysFromWrapper(wrapper)).toEqual(["a", "c"]);
  });

  // разворачивает ключ helpers/childKey, ещё до того как он попал в атрибут
  it("returns the attribute as written", () => {
    const wrapper = makeWrapper(["user:id=x"]);
    expect(getRenderedKeysFromWrapper(wrapper)).toEqual(["user:id=x"]);
  });
});

describe("areKeysEqual", () => {
  it("is true for identical sequences", () => {
    expect(areKeysEqual(["a", "b"], ["a", "b"])).toBe(true);
  });

  it("is false for different lengths", () => {
    expect(areKeysEqual(["a"], ["a", "b"])).toBe(false);
  });

  it("is false for different order", () => {
    expect(areKeysEqual(["a", "b"], ["b", "a"])).toBe(false);
  });

  it("is true for two empty arrays", () => {
    expect(areKeysEqual([], [])).toBe(true);
  });
});
