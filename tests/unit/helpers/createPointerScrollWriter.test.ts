import { afterEach, describe, expect, it, vi } from "vitest";
import createPointerScrollWriter from "@morphing-scroll/src/helpers/createPointerScrollWriter";

describe("createPointerScrollWriter", () => {
  afterEach(() => vi.useRealTimers());

  it("writes only the latest pointer position in a frame", () => {
    vi.useFakeTimers();
    const writer = createPointerScrollWriter();
    const el = document.createElement("div");
    let top = 0;
    let writes = 0;

    Object.defineProperty(el, "scrollTop", {
      configurable: true,
      get: () => top,
      set: (value: number) => {
        top = value;
        writes++;
      },
    });

    writer.schedule(el, "y", 10);
    writer.schedule(el, "y", 20);
    writer.schedule(el, "y", 30);

    expect(top).toBe(0);
    expect(writes).toBe(0);

    vi.advanceTimersToNextFrame();

    expect(top).toBe(30);
    expect(writes).toBe(1);
  });

  it("flushes the final position before pointer release", () => {
    vi.useFakeTimers();
    const writer = createPointerScrollWriter();
    const el = document.createElement("div");

    writer.schedule(el, "x", 45);
    writer.schedule(el, "y", 80);
    writer.flush();

    expect(el.scrollLeft).toBe(45);
    expect(el.scrollTop).toBe(80);

    vi.advanceTimersToNextFrame();
    expect(el.scrollTop).toBe(80);
  });
});
