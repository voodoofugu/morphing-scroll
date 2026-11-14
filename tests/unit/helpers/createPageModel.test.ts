import {
  createObjectPageLayout,
  createViewportPageModel,
} from "@morphing-scroll/src/helpers/createPageModel";

describe("createPageModel", () => {
  it("preserves viewport paging including a partial final page", () => {
    const model = createViewportPageModel({
      content: 650,
      viewport: 300,
      gap: 0,
      end: 350,
    });

    expect(model.count).toBe(3);
    expect([0, 1, 2].map((page) => model.targetAt(page))).toEqual([
      0, 300, 350,
    ]);
    expect(model.stops).toEqual([]); // arithmetic pages do not grow memory
    expect(model.pageAt(349)).toBe(2);
  });

  it("creates one centred stop per object and enough edge room", () => {
    const layout = createObjectPageLayout({
      boxes: [
        { left: 0, right: 200, top: 0, bottom: 100 },
        { left: 220, right: 420, top: 0, bottom: 100 },
        { left: 440, right: 640, top: 0, bottom: 100 },
      ],
      axis: 0,
      viewport: 600,
      content: 640,
      before: 0,
      after: 0,
      align: "center",
    });

    expect(layout.inset).toEqual([200, 200]);
    expect(layout.model.stops.map((stop) => stop.position)).toEqual([
      0, 220, 440,
    ]);
  });

  it("groups objects that cannot be distinguished on the scroll axis", () => {
    const layout = createObjectPageLayout({
      boxes: [
        { left: 0, right: 100, top: 0, bottom: 100 },
        { left: 110, right: 210, top: 0, bottom: 100 },
        { left: 0, right: 100, top: 110, bottom: 210 },
        { left: 110, right: 210, top: 110, bottom: 210 },
      ],
      axis: 1,
      viewport: 200,
      content: 210,
      before: 0,
      after: 0,
      align: "start",
    });

    expect(layout.model.count).toBe(2);
    expect(layout.model.stops.map((stop) => stop.objects)).toEqual([
      [0, 1],
      [2, 3],
    ]);
  });

  it("chooses the nearest physical copy of an object page in a loop", () => {
    const { model } = createObjectPageLayout({
      boxes: [
        { left: 0, right: 100, top: 0, bottom: 100 },
        { left: 120, right: 220, top: 0, bottom: 100 },
        { left: 240, right: 340, top: 0, bottom: 100 },
      ],
      axis: 0,
      viewport: 200,
      content: 340,
      before: 0,
      after: 0,
      align: "center",
      period: 360,
    });

    expect(model.count).toBe(3);
    expect(model.targetAt(0, 700)).toBe(670);
    expect(model.targetAt(2, 700)).toBe(550);
    expect(model.pageAt(790)).toBe(1);
  });

  it("keeps an exact middle loop stop ahead of an equidistant seam", () => {
    const { model } = createObjectPageLayout({
      boxes: Array.from({ length: 5 }, (_, index) => ({
        left: index * 140,
        right: index * 140 + 120,
        top: 0,
        bottom: 100,
      })),
      axis: 0,
      viewport: 300,
      content: 680,
      before: 0,
      after: 0,
      align: "center",
      period: 700,
    });

    const middle = model.targetAt(2, 900);
    expect(model.pageAt(middle, 1)).toBe(2);
    expect(model.pageAt(middle, -1)).toBe(2);
  });

  it("supports independent object sizes", () => {
    const { model } = createObjectPageLayout({
      boxes: [
        { left: 0, right: 100, top: 0, bottom: 100 },
        { left: 120, right: 320, top: 0, bottom: 100 },
        { left: 340, right: 490, top: 0, bottom: 100 },
      ],
      axis: 0,
      viewport: 300,
      content: 490,
      before: 0,
      after: 0,
      align: "center",
    });

    expect(model.stops.map((stop) => stop.position)).toEqual([0, 170, 365]);
    expect(model.pageAt(260)).toBe(1);
    expect(model.pageAt(300)).toBe(2);
  });

  it.each([
    ["start", [0, 100], [0, 120, 240]],
    ["center", [50, 50], [0, 120, 240]],
    ["end", [100, 0], [0, 120, 240]],
  ] as const)("honours %s alignment at both content edges", (align, inset, stops) => {
    const layout = createObjectPageLayout({
      boxes: [
        { left: 0, right: 100, top: 0, bottom: 80 },
        { left: 120, right: 220, top: 0, bottom: 80 },
        { left: 240, right: 340, top: 0, bottom: 80 },
      ],
      axis: 0,
      viewport: 200,
      content: 340,
      before: 0,
      after: 0,
      align,
    });

    expect(layout.inset).toEqual(inset);
    expect(layout.model.stops.map((stop) => stop.position)).toEqual(stops);
  });
});
