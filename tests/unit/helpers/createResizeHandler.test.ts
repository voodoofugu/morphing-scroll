import { describe, it, expect, vi } from "vitest";
import { createResizeHandler } from "@morphing-scroll/src/helpers/addFunctions";

const makeRef = () => ({ current: { width: 0, height: 0 } });

describe("createResizeHandler", () => {
  it("stores the new size and triggers an update on change", () => {
    const ref = makeRef();
    const trigger = vi.fn();
    const handler = createResizeHandler(ref, trigger);

    handler({ width: 100, height: 50 });

    expect(ref.current).toEqual({ width: 100, height: 50 });
    expect(trigger).toHaveBeenCalledTimes(1);
  });

  it("does not trigger when the size is unchanged", () => {
    const ref = { current: { width: 100, height: 50 } };
    const trigger = vi.fn();
    const handler = createResizeHandler(ref, trigger);

    handler({ width: 100, height: 50 });

    expect(trigger).not.toHaveBeenCalled();
  });

  it("subtracts the x/y offsets from the measured rect", () => {
    const ref = makeRef();
    const trigger = vi.fn();
    const handler = createResizeHandler(ref, trigger, 10, 20);

    handler({ width: 100, height: 50 });

    expect(ref.current).toEqual({ width: 90, height: 30 });
  });

  it("treats missing width/height as 0", () => {
    const ref = { current: { width: 5, height: 5 } };
    const trigger = vi.fn();
    const handler = createResizeHandler(ref, trigger);

    handler({ width: 200 }); // height omitted -> 0

    expect(ref.current).toEqual({ width: 200, height: 0 });
    expect(trigger).toHaveBeenCalledTimes(1);
  });

  // A 0x0 rect means the element is hidden (display: none), not that it lost
  // its size — keep the last known one so the tree does not recompute from
  // zeros and flash when it comes back.
  it("ignores a 0x0 measurement and keeps the last known size", () => {
    const ref = { current: { width: 100, height: 50 } };
    const trigger = vi.fn();
    const handler = createResizeHandler(ref, trigger);

    handler({ width: 0, height: 0 });

    expect(ref.current).toEqual({ width: 100, height: 50 }); // unchanged
    expect(trigger).not.toHaveBeenCalled();
  });

  it("keeps ignoring zeros across repeated hidden/measured cycles", () => {
    const ref = makeRef();
    const trigger = vi.fn();
    const handler = createResizeHandler(ref, trigger);

    handler({ width: 100, height: 50 });
    handler({ width: 0, height: 0 });
    handler({ width: 0, height: 0 });

    expect(ref.current).toEqual({ width: 100, height: 50 });
    expect(trigger).toHaveBeenCalledTimes(1);
  });

  it("still reports a collapse on a single axis", () => {
    const ref = { current: { width: 100, height: 50 } };
    const trigger = vi.fn();
    const handler = createResizeHandler(ref, trigger);

    handler({ width: 100, height: 0 });

    expect(ref.current).toEqual({ width: 100, height: 0 });
    expect(trigger).toHaveBeenCalledTimes(1);
  });
});
