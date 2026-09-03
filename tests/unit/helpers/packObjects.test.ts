import { describe, it, expect } from "vitest";
import packObjects from "@morphing-scroll/src/helpers/packObjects";
import type { PackArgs } from "@morphing-scroll/src/helpers/packObjects";

const store = (m: Record<string, [number, number]>) => ({
  get: (k: string) => m[k],
  size: Object.keys(m).length,
  version: 1,
  watch: () => {},
  keep: () => {},
  clear: () => {},
  destroy: () => {},
});

const pack = (over: Partial<Parameters<typeof packObjects>[0]>) =>
  packObjects({
    keys: [],
    sizes: store({}),
    layout: "masonry",
    isX: false,
    fixed: [0, 0],
    gap: [0, 0],
    columns: 1,
    crossLimit: 0,
    ...over,
  } as PackArgs);

const box = (i: { left: number; top: number; right: number; bottom: number }) => [
  i.left,
  i.top,
  i.right,
  i.bottom,
];

describe("packObjects: masonry", () => {
  it("кладёт следующий объект в самую короткую колонку", () => {
    const r = pack({
      keys: ["a", "b", "c", "d"],
      sizes: store({ a: [100, 50], b: [100, 20], c: [100, 30], d: [100, 10] }),
      columns: 2,
      fixed: [100, 0],
    });

    expect(r.items.map((i) => [i.left, i.top, i.bottom])).toEqual([
      [0, 0, 50],
      [100, 0, 20],
      [100, 20, 50],
      [0, 50, 60],
    ]);
    expect(r.height).toBe(60);
    expect(r.width).toBe(200);
  });

  it("зазор идёт между объектами, но не за последним", () => {
    const r = pack({
      keys: ["a", "b"],
      sizes: store({ a: [100, 40], b: [100, 40] }),
      columns: 1,
      fixed: [100, 0],
      gap: [0, 10],
    });

    expect(r.items.map((i) => i.top)).toEqual([0, 50]);
    expect(r.height).toBe(90);
  });

  it("неизмеренный не двигает соседей и обрывает счёт измеренных", () => {
    const r = pack({
      keys: ["a", "b", "c"],
      sizes: store({ a: [100, 40], c: [100, 40] }),
      columns: 1,
      fixed: [100, 0],
    });

    expect(r.measuredPrefix).toBe(1);
    expect(r.items[1].measured).toBe(false);
    expect(r.items[1].top).toBe(40);
    expect(r.items[2].top).toBe(40);
  });

  it("по горизонтали колонки становятся строками", () => {
    const r = pack({
      keys: ["a", "b"],
      sizes: store({ a: [30, 100], b: [50, 100] }),
      columns: 2,
      fixed: [0, 100],
      isX: true,
    });

    expect(r.items.map((i) => [i.left, i.right, i.top])).toEqual([
      [0, 30, 0],
      [0, 50, 100],
    ]);
    expect(r.width).toBe(50);
    expect(r.height).toBe(200);
  });
});

describe("packObjects: flow", () => {
  it("переносит, когда следующий уже не помещается", () => {
    const r = pack({
      layout: "flow",
      keys: ["a", "b", "c"],
      sizes: store({ a: [60, 40], b: [50, 40], c: [30, 40] }),
      crossLimit: 100,
    });

    // 60 + 50 = 110 > 100, значит b начинает вторую строку
    expect(r.items.map(box)).toEqual([
      [0, 0, 60, 40],
      [0, 40, 50, 80],
      [50, 40, 80, 80],
    ]);
    expect(r.height).toBe(80);
    expect(r.width).toBe(80);
  });

  it("строка становится толщиной с самый толстый объект в ней", () => {
    const r = pack({
      layout: "flow",
      keys: ["a", "b", "c"],
      sizes: store({ a: [40, 30], b: [40, 90], c: [40, 20] }),
      crossLimit: 100,
    });

    // a и b в первой строке — она 90 толщиной, c уходит во вторую
    expect(r.items.map((i) => i.top)).toEqual([0, 0, 90]);
    expect(r.height).toBe(110);
  });

  it("заданная сторона важнее измеренной", () => {
    const r = pack({
      layout: "flow",
      keys: ["a", "b"],
      sizes: store({ a: [40, 999], b: [40, 999] }),
      fixed: [0, 25],
      crossLimit: 100,
    });

    expect(r.items.map((i) => i.bottom)).toEqual([25, 25]);
    expect(r.height).toBe(25);
  });

  it("по горизонтали линии идут сверху вниз, а строки — вправо", () => {
    const r = pack({
      layout: "flow",
      keys: ["a", "b", "c"],
      sizes: store({ a: [30, 60], b: [30, 50], c: [30, 30] }),
      isX: true,
      crossLimit: 100,
    });

    expect(r.items.map(box)).toEqual([
      [0, 0, 30, 60],
      [30, 0, 60, 50],
      [30, 50, 60, 80],
    ]);
    expect(r.width).toBe(60);
  });
});

describe("packObjects: grid", () => {
  it("колонка шириной с самый широкий, строка высотой с самый высокий", () => {
    const r = pack({
      layout: "grid",
      keys: ["a", "b", "c", "d"],
      sizes: store({ a: [30, 40], b: [70, 20], c: [50, 60], d: [20, 10] }),
      columns: 2,
    });

    // колонки: max(30,50)=50 и max(70,20)=70; строки: max(40,20)=40 и max(60,10)=60
    expect(r.items.map(box)).toEqual([
      [0, 0, 50, 40],
      [50, 0, 120, 40],
      [0, 40, 50, 100],
      [50, 40, 120, 100],
    ]);
    expect(r.width).toBe(120);
    expect(r.height).toBe(100);
  });

  it("зазоры идут между колонками и строками, но не по краям", () => {
    const r = pack({
      layout: "grid",
      keys: ["a", "b", "c", "d"],
      sizes: store({ a: [30, 30], b: [30, 30], c: [30, 30], d: [30, 30] }),
      columns: 2,
      gap: [10, 20],
    });

    expect(r.items.map((i) => [i.left, i.top])).toEqual([
      [0, 0],
      [40, 0],
      [0, 50],
      [40, 50],
    ]);
    expect(r.width).toBe(70);
    expect(r.height).toBe(80);
  });

  it("неизмеренная строка не занимает места", () => {
    const r = pack({
      layout: "grid",
      keys: ["a", "b", "c"],
      sizes: store({ a: [30, 30], b: [30, 30] }),
      columns: 2,
      gap: [10, 10],
    });

    // c один во второй строке и ещё не измерен — высота остаётся первой строкой
    expect(r.height).toBe(30);
    expect(r.items[2].measured).toBe(false);
  });
});
