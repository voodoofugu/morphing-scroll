import { describe, expect, it } from "vitest";

import { buildSnippet } from "../../../playground/src/dashboard/snippet";
import {
  defaultSettings,
  type Settings,
} from "../../../playground/src/dashboard/settings";

const settings = (patch: Partial<Settings> = {}): Settings => ({
  ...defaultSettings,
  ...patch,
});

describe("playground JSX snippet", () => {
  it("omits library defaults from nested configs", () => {
    const code = buildSnippet(settings(), 200);

    expect(code).not.toContain('mode="scroll"');
    expect(code).not.toContain('direction="y"');
    expect(code).not.toContain("reverse:");
    expect(code).not.toContain("showOnHover:");
    expect(code).not.toContain("thumbMinSize:");
    expect(code).not.toContain("drag: false");
    expect(code).not.toContain("align: \"start\"");
    expect(code).not.toContain("order: \"row\"");
    expect(code).toContain("edgeGap: 8");
    expect(code).toContain("trackGap: 8");
  });

  it("omits controls when they match the component default", () => {
    const code = buildSnippet(
      settings({
        progressElementMode: "off",
        contentDrag: false,
        arrows: false,
        wheel: true,
        keys: true,
        keysMode: "pan",
        keysStep: 40,
      }),
      200,
    );

    expect(code).not.toContain("controls=");
  });

  it("keeps an explicit empty controls object when every control is off", () => {
    const code = buildSnippet(
      settings({
        progressElementMode: "off",
        contentDrag: false,
        arrows: false,
        wheel: false,
        keys: false,
      }),
      200,
    );

    expect(code).toContain("controls={{}}");
  });

  it("keeps bar values that differ from library defaults", () => {
    const code = buildSnippet(
      settings({
        barReverseX: true,
        barShowOnHover: true,
        barThumbMinSize: 24,
      }),
      200,
    );

    expect(code).toContain("reverse: [true, false]");
    expect(code).toContain("showOnHover: true");
    expect(code).toContain("thumbMinSize: 24");
  });

  it("keeps a slider example compact when its direction is y", () => {
    const code = buildSnippet(
      settings({ mode: "slider", direction: "y", lines: 1 }),
      220,
    );

    expect(code).toContain('mode="slider"');
    expect(code).not.toContain('direction="y"');
    expect(code).toContain("lines: 1");
    expect(code).toContain("wheel: true");
    expect(code).toContain('mode: "pan"');
    expect(code).not.toContain("step: 40");
    expect(code).not.toContain("changeDirection: false");
    expect(code).not.toContain("drag: false");
    expect(code).not.toContain("reverse: [false, false]");
    expect(code).not.toContain("showOnHover: false");
    expect(code).not.toContain("arrows: false");
  });
});
