import { describe, expect, it } from "vitest";
import {
  emptyPointerVelocity,
  recordPointerVelocity,
} from "@morphing-scroll/src/helpers/pointerVelocity";

type Sample = { clientX: number; clientY: number; timeStamp: number };

const pointer = (samples: Sample[], parent = samples[samples.length - 1]) =>
  ({
    ...parent,
    getCoalescedEvents: () => samples,
  }) as PointerEvent;

describe("pointer velocity", () => {
  it("uses coalesced samples and keeps the physical velocity", () => {
    const velocity = emptyPointerVelocity();

    recordPointerVelocity(
      velocity,
      pointer([
        { clientX: 0, clientY: 100, timeStamp: 10 },
        { clientX: 0, clientY: 80, timeStamp: 20 },
        { clientX: 0, clientY: 60, timeStamp: 30 },
      ]),
      35,
    );

    expect(velocity.y).toBe(-2);
    expect(velocity.distY).toBe(40);
    expect(velocity.t).toBe(35);
  });

  it("produces the same result when samples arrive as separate events", () => {
    const velocity = emptyPointerVelocity();

    recordPointerVelocity(
      velocity,
      pointer([], { clientX: 0, clientY: 100, timeStamp: 10 }),
      10,
    );
    recordPointerVelocity(
      velocity,
      pointer([], { clientX: 0, clientY: 80, timeStamp: 20 }),
      20,
    );
    recordPointerVelocity(
      velocity,
      pointer([], { clientX: 0, clientY: 60, timeStamp: 30 }),
      30,
    );

    expect(velocity.y).toBe(-2);
    expect(velocity.distY).toBe(40);
  });

  it("drops stale samples from the release window", () => {
    const velocity = emptyPointerVelocity();

    recordPointerVelocity(
      velocity,
      pointer([
        { clientX: 0, clientY: 200, timeStamp: 0 },
        { clientX: 0, clientY: 190, timeStamp: 100 },
        { clientX: 0, clientY: 150, timeStamp: 120 },
      ]),
      120,
    );

    expect(velocity.y).toBe(-2);
  });
});
