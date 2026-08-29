import { describe, expect, it } from "vitest";

import resolveScrollTarget from "@morphing-scroll/src/helpers/resolveScrollTarget";
import type { ScrollTarget } from "@morphing-scroll/src/types/types";

describe("resolveScrollTarget", () => {
  it("applies a scalar target to both axes", () => {
    expect(resolveScrollTarget(120)).toEqual([120, 120]);
    expect(resolveScrollTarget("end")).toEqual(["end", "end"]);
  });

  it("always returns a complete pair for runtime input", () => {
    expect(resolveScrollTarget([120] as unknown as ScrollTarget)).toEqual([
      120,
      null,
    ]);
  });
});
