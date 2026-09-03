import { describe, it, expect } from "vitest";
import packObjects from "@morphing-scroll/src/helpers/packObjects";

const store = (m: Record<string, [number, number]>) => ({
  get: (k: string) => m[k],
  size: Object.keys(m).length,
  watch: () => {},
  forget: () => {},
  clear: () => {},
  destroy: () => {},
});

describe("packObjects", () => {
  it("кладёт следующий объект в самую короткую колонку", () => {
    const r = packObjects({
      keys: ["a", "b", "c", "d"],
      sizes: store({ a: [100, 50], b: [100, 20], c: [100, 30], d: [100, 10] }),
      crossCount: 2,
      crossSize: 100,
      gap: [0, 0],
      isX: false,
    });
    // a -> col0 (0..50), b -> col1 (0..20), c -> col1 (20..50), d -> обе по 50, левая
    expect(r.items.map((i) => [i.left, i.top, i.bottom])).toEqual([
      [0, 0, 50],
      [100, 0, 20],
      [100, 20, 50],
      [0, 50, 60],
    ]);
    expect(r.mainSize).toBe(60);
  });

  it("зазор идёт между объектами, но не за последним", () => {
    const r = packObjects({
      keys: ["a", "b"],
      sizes: store({ a: [100, 40], b: [100, 40] }),
      crossCount: 1,
      crossSize: 100,
      gap: [10, 0],
      isX: false,
    });
    expect(r.items.map((i) => i.top)).toEqual([0, 50]);
    expect(r.mainSize).toBe(90);
  });

  it("неизмеренный не двигает соседей и обрывает счёт измеренных", () => {
    const r = packObjects({
      keys: ["a", "b", "c"],
      sizes: store({ a: [100, 40], c: [100, 40] }),
      crossCount: 1,
      crossSize: 100,
      gap: [0, 0],
      isX: false,
    });
    expect(r.measuredPrefix).toBe(1);
    expect(r.items[1].measured).toBe(false);
    expect(r.items[1].top).toBe(40);
    expect(r.items[2].top).toBe(40);
  });

  it("по горизонтали колонки становятся строками", () => {
    const r = packObjects({
      keys: ["a", "b"],
      sizes: store({ a: [30, 100], b: [50, 100] }),
      crossCount: 2,
      crossSize: 100,
      gap: [0, 0],
      isX: true,
    });
    expect(r.items.map((i) => [i.left, i.right, i.top])).toEqual([
      [0, 30, 0],
      [0, 50, 100],
    ]);
    expect(r.mainSize).toBe(50);
  });
});
