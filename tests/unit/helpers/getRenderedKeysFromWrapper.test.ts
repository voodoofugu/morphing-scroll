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

  it("strips a root React key prefix ('.$Key')", () => {
    const wrapper = makeWrapper([".$myKey"]);
    expect(getRenderedKeysFromWrapper(wrapper)).toEqual(["myKey"]);
  });

  it("decodes React key escapes (=0 -> =, =2 -> :)", () => {
    const wrapper = makeWrapper([".$user=2id=0x"]);
    expect(getRenderedKeysFromWrapper(wrapper)).toEqual(["user:id=x"]);
  });

  it("extracts an explicit nested key after ':$'", () => {
    const wrapper = makeWrapper([".0:$Key"]);
    expect(getRenderedKeysFromWrapper(wrapper)).toEqual(["Key"]);
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
