import { describe, it, expect, vi } from "vitest";
import { createResizeHandler } from "@morphing-scroll/src/helpers/addFunctions";

const makeRef = () => ({ current: { width: 0, height: 0 } });

describe("createResizeHandler (characterization)", () => {
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

  // NOTE: `firstZero` is declared inside the returned handler, so it resets on
  // every invocation. The net effect is that ANY 0x0 measurement is always
  // ignored — a collapse to zero is never reported. This pins the current
  // behavior; revisit if the "ignore only the first zero" intent is restored.
  it("ignores a 0x0 measurement even after a real size", () => {
    const ref = { current: { width: 100, height: 50 } };
    const trigger = vi.fn();
    const handler = createResizeHandler(ref, trigger);

    handler({ width: 0, height: 0 });

    expect(ref.current).toEqual({ width: 100, height: 50 }); // unchanged
    expect(trigger).not.toHaveBeenCalled();
  });
});
