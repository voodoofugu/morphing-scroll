import { describe, it, expect } from "vitest";

import {
  loopCopies,
  loopShift,
  loopPages,
} from "@morphing-scroll/src/helpers/loopWindow";

describe("loopCopies", () => {
  /*
   * Двух копий мало: стоя в конце средней, окно смотрит в следующую, и та
   * должна быть настоящей. Отсюда «сколько окон в периоде» плюс две.
   */
  it("держит три копии, пока период больше окна", () => {
    expect(loopCopies(1000, 400)).toBe(3);
    expect(loopCopies(400, 400)).toBe(3);
  });

  it("добавляет копий, когда окно длиннее периода", () => {
    expect(loopCopies(100, 400)).toBe(6);
    expect(loopCopies(100, 450)).toBe(7);
  });

  it("без периода копий нет: множить нечего", () => {
    expect(loopCopies(0, 400)).toBe(0);
    expect(loopCopies(-10, 400)).toBe(0);
  });

  /*
   * То, ради чего копии и считаются: из любой точки средней копии окно должно
   * смотреть на настоящий контент, а не за край ленты.
   */
  it("ленты хватает, чтобы окно из конца средней копии не выехало за край", () => {
    for (const period of [60, 100, 137, 400, 900])
      for (const viewport of [50, 200, 430, 1000]) {
        const copies = loopCopies(period, viewport);

        expect(period * 2 + viewport).toBeLessThanOrEqual(period * copies);
      }
  });
});

describe("loopShift", () => {
  it("не трогает позицию внутри средней копии", () => {
    expect(loopShift(500, 500)).toBe(null);
    expect(loopShift(999, 500)).toBe(null);
  });

  it("возвращает в среднюю копию с обеих сторон", () => {
    expect(loopShift(1000, 500)).toBe(500);
    expect(loopShift(1200, 500)).toBe(700);
    expect(loopShift(499, 500)).toBe(999);
    expect(loopShift(0, 500)).toBe(500);
  });

  /*
   * Позицию может занести далеко за раз — программным переходом или быстрым
   * жестом. Одного вычитания периода тогда не хватит.
   */
  it("возвращает и с той дали, куда одним периодом не дотянуться", () => {
    expect(loopShift(5300, 500)).toBe(800);
    expect(loopShift(-1300, 500)).toBe(700);
  });

  it("подменённая позиция всегда лежит в средней копии", () => {
    const period = 137;

    for (let pos = -900; pos < 900; pos += 7) {
      const to = loopShift(pos, period) ?? pos;

      expect(to).toBeGreaterThanOrEqual(period);
      expect(to).toBeLessThan(period * 2);
      // и это та же точка круга, а не соседняя
      expect((((to - pos) % period) + period) % period).toBe(0);
    }
  });

  it("без периода не подменяет", () => {
    expect(loopShift(300, 0)).toBe(null);
  });
});

describe("loopPages", () => {
  /*
   * То, ради чего это и считается: пройдя все страницы, возвращаешься ровно
   * туда, откуда пошёл. Иначе заворот сдвигает сетку, и шаг назад уводит не
   * туда, откуда шагнул вперёд.
   */
  it("делит оборот нацело", () => {
    for (const period of [1400, 900, 777, 320, 1000])
      for (const viewport of [300, 220, 480]) {
        const { pages, step } = loopPages(period, viewport, 20);

        expect(pages * step).toBeCloseTo(period, 6);
      }
  });

  it("не делает страницу длиннее окна: пропускать контент нельзя", () => {
    for (const period of [1400, 900, 777, 1000]) {
      const { step } = loopPages(period, 300, 20);

      expect(step).toBeLessThanOrEqual(320);
    }
  });

  it("оборот короче окна — одна страница на весь оборот", () => {
    expect(loopPages(200, 300, 20)).toEqual({ pages: 1, step: 200 });
  });

  it("без оборота отдаёт обычный шаг и ни одной страницы", () => {
    expect(loopPages(0, 300, 20)).toEqual({ pages: 0, step: 320 });
  });
});
