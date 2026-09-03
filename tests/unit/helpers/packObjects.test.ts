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
    columns: 0, // 0 — «сколько влезет»: поток меряет местом, кладка берёт одну
    crossLimit: 0,
    align: "start",
    order: "row",
    compact: false,
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

describe("packObjects: align", () => {
  /*
   * Отсчёт — самая широкая строка, а не окно: она и есть ширина содержимого,
   * ей двигаться некуда. Остальные закрывают то, чего им до неё не хватило.
   */
  it("самая широкая строка не двигается, узкие подтягиваются к ней", () => {
    const r = pack({
      layout: "flow",
      keys: ["a", "b", "c"],
      sizes: store({ a: [30, 20], b: [30, 20], c: [50, 20] }),
      columns: 2,
      crossLimit: 100,
      align: "end",
    });

    // широкая — первая (60), она на месте; вторая (50) уезжает на 10
    expect(r.items.map((i) => i.left)).toEqual([0, 30, 10]);
  });

  it("не двигает ничего, когда все строки одной ширины", () => {
    const r = pack({
      layout: "flow",
      keys: ["a", "b", "c", "d"],
      sizes: store({ a: [50, 20], b: [50, 20], c: [50, 20], d: [50, 20] }),
      columns: 2,
      crossLimit: 200,
      align: "end",
    });

    expect(r.items.map((i) => i.left)).toEqual([0, 50, 0, 50]);
  });

  it("center делит между строками пополам", () => {
    const r = pack({
      layout: "flow",
      keys: ["a", "b"],
      sizes: store({ a: [50, 20], b: [30, 20] }),
      columns: 1,
      crossLimit: 100,
      align: "center",
    });

    // широкая 50 стоит, узкая 30 встаёт по центру относительно неё
    expect(r.items.map((i) => i.left)).toEqual([0, 10]);
  });

  /*
   * Строк в заполнении нет, но у каждого объекта своё свободное место справа
   * от него — и толкается каждый отдельно, а не единым блоком. Двух объектов
   * мало, чтобы это увидеть: с ними случайно получается то же самое, что и
   * при сдвиге всего блока. Ниже — тесты, где это уже не так.
   */
  it("в заполнении с двумя объектами толкание совпадает со сдвигом блока", () => {
    const r = pack({
      layout: "fill",
      keys: ["a", "b"],
      sizes: store({ a: [40, 20], b: [30, 20] }),
      gap: [10, 10],
      crossLimit: 200,
      align: "end",
    });

    expect(r.items.map((i) => i.left)).toEqual([120, 170]);
    // обёртка накрывает уехавшее, иначе объекты торчат за её краем
    expect(r.width).toBe(200);
  });

  it("в заполнении не двигает, когда блок занял всю область", () => {
    const r = pack({
      layout: "fill",
      keys: ["a", "b"],
      sizes: store({ a: [100, 20], b: [90, 20] }),
      gap: [10, 10],
      crossLimit: 200,
      align: "end",
    });

    expect(r.items.map((i) => i.left)).toEqual([0, 110]);
  });

  /*
   * Сам случай, из-за которого сдвиг блоком был неправильным: A и B стоят
   * бок о бок в одном ряду и оставляют справа заметное место — C ниже занял
   * почти всю ширину сам по себе. Единый сдвиг блока мерил бы по C (общий
   * максимум) и подвинул бы весь блок всего на 10px — ряд A/B остался бы
   * с дырой почти в 20px справа, хотя место у обоих есть. Каждый должен
   * дотолкаться до своего края независимо.
   */
  it("толкает каждый объект в его собственное свободное место, не блоком", () => {
    const r = pack({
      layout: "fill",
      keys: ["a", "b", "c"],
      sizes: store({ a: [80, 50], b: [80, 50], c: [190, 40] }),
      gap: [10, 10],
      crossLimit: 200,
      align: "end",
    });

    const [a, b, c] = r.items;

    // A и B — один ряд, дотолкались до правого края вместе, с зазором между ними
    expect(b.right).toBe(200);
    expect(b.left - a.right).toBe(10);
    expect(a.left).toBe(30);

    // C ниже толкается независимо и тоже доходит до края
    expect(c.right).toBe(200);
    expect(c.left).toBe(10);

    // единый сдвиг блока дал бы всем офсет 10 — здесь он разный
    expect(a.left).not.toBe(10);
  });

  it("center — середина между тем, где лежит сейчас, и тем, куда дотолкался бы", () => {
    const r = pack({
      layout: "fill",
      keys: ["a", "b", "c"],
      sizes: store({ a: [80, 50], b: [80, 50], c: [190, 40] }),
      gap: [10, 10],
      crossLimit: 200,
      align: "center",
    });

    const [a, b, c] = r.items;

    // "end" даёт a.left=30, "start" (без толкания) даёт a.left=0 — середина 15
    expect(a.left).toBe(15);
    // не пересекаются между собой — B в своей середине не наезжает на A
    expect(b.left).toBeGreaterThanOrEqual(a.right);
  });

  it("в кладке двигается весь блок колонок", () => {
    const r = pack({
      keys: ["a", "b"],
      sizes: store({ a: [40, 20], b: [40, 20] }),
      columns: 2,
      fixed: [40, 0],
      crossLimit: 100,
      align: "end",
    });

    // две колонки по 40 — блок 80, свободных 20
    expect(r.items.map((i) => i.left)).toEqual([20, 60]);
  });

  /*
   * У неизмеренного размера ещё нет, свободного места «остаётся» много —
   * выровняв сейчас, содержимое пришлось бы возвращать пачка за пачкой.
   */
  it("не двигает, пока измерены не все", () => {
    const r = pack({
      layout: "flow",
      keys: ["a", "b"],
      sizes: store({ a: [30, 20] }),
      columns: 1,
      crossLimit: 100,
      align: "end",
    });

    expect(r.items[0].left).toBe(0);
  });

  it("не двигает, когда объекты шире отведённого", () => {
    const r = pack({
      layout: "flow",
      keys: ["a"],
      sizes: store({ a: [200, 20] }),
      columns: 1,
      crossLimit: 100,
      align: "center",
    });

    expect(r.items[0].left).toBe(0);
  });
});

describe("packObjects: fill", () => {
  it("низкий сосед не оставляет под собой дыру", () => {
    const r = pack({
      layout: "fill",
      keys: ["a", "b", "c"],
      sizes: store({ a: [50, 20], b: [50, 60], c: [50, 30] }),
      crossLimit: 100,
    });

    // a и b встали рядом, c влез под a, а не под самый низкий край строки
    expect(r.items.map(box)).toEqual([
      [0, 0, 50, 20],
      [50, 0, 100, 60],
      [0, 20, 50, 50],
    ]);
    expect(r.height).toBe(60);
  });

  it("порядок уступает месту: следующий может встать выше предыдущего", () => {
    const r = pack({
      layout: "fill",
      keys: ["tall", "wide", "small"],
      sizes: store({ tall: [60, 100], wide: [40, 80], small: [40, 10] }),
      crossLimit: 100,
    });

    // small влезает над wide, хотя в списке идёт после него
    expect(r.items[2].top).toBe(80);
    expect(r.items[2].left).toBe(60);
    expect(r.height).toBe(100);
  });

  it("зазор держится и между соседями, и над ними", () => {
    const r = pack({
      layout: "fill",
      keys: ["a", "b", "c"],
      sizes: store({ a: [40, 20], b: [40, 20], c: [40, 20] }),
      gap: [10, 10],
      crossLimit: 100,
    });

    expect(r.items.map((i) => [i.left, i.top])).toEqual([
      [0, 0],
      [50, 0],
      [0, 30],
    ]);
  });

  it("неизмеренный ничего не занимает и никого не двигает", () => {
    const r = pack({
      layout: "fill",
      keys: ["a", "b", "c"],
      sizes: store({ a: [40, 20], c: [40, 20] }),
      crossLimit: 100,
    });

    expect(r.items[1].measured).toBe(false);
    expect(r.items[1].right - r.items[1].left).toBe(0);
    expect(r.items[2].left).toBe(40);
  });
});

describe("packObjects: flow по счёту", () => {
  it("crossCount обрывает линию вместо места", () => {
    const r = pack({
      layout: "flow",
      keys: ["a", "b", "c", "d"],
      sizes: store({ a: [30, 40], b: [70, 20], c: [50, 60], d: [20, 10] }),
      columns: 2,
      crossLimit: 10_000,
    });

    expect(r.items.map(box)).toEqual([
      [0, 0, 30, 40],
      [30, 0, 100, 20],
      [0, 40, 50, 100],
      [50, 40, 70, 50],
    ]);
    expect(r.width).toBe(100);
    expect(r.height).toBe(100);
  });

  /*
   * То, ради чего колонки перестали выравниваться: сосед-великан больше не
   * раздвигает отступ у соседа-малыша.
   */
  it("отступ между объектами один и тот же, каким бы ни был сосед", () => {
    const r = pack({
      layout: "flow",
      keys: ["a", "b", "c"],
      sizes: store({ a: [30, 40], b: [70, 40], c: [20, 40] }),
      columns: 3,
      gap: [10, 0],
      crossLimit: 10_000,
    });

    const xs = r.items.map((i) => i.left);
    expect(xs).toEqual([0, 40, 120]);

    // каждый начинается ровно через 10 после конца предыдущего
    for (let i = 1; i < r.items.length; i++)
      expect(r.items[i].left - r.items[i - 1].right).toBe(10);
  });

  it("зазоры идут между объектами и строками, но не по краям", () => {
    const r = pack({
      layout: "flow",
      keys: ["a", "b", "c", "d"],
      sizes: store({ a: [30, 30], b: [30, 30], c: [30, 30], d: [30, 30] }),
      columns: 2,
      gap: [10, 20],
      crossLimit: 10_000,
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

  it("неизмеренный не растягивает свою линию", () => {
    const r = pack({
      layout: "flow",
      keys: ["a", "b", "c"],
      sizes: store({ a: [30, 30], b: [30, 30] }),
      columns: 2,
      gap: [10, 10],
      crossLimit: 10_000,
    });

    expect(r.items[2].measured).toBe(false);
    expect(r.items[2].bottom - r.items[2].top).toBe(0);
    expect(r.items[2].right - r.items[2].left).toBe(0);
  });
});

describe("packObjects: порядок по столбцам", () => {
  /*
   * Кладка при `"column"` перестаёт искать самую короткую: первая колонка
   * забирает первые ceil(5 / 2) = 3 объекта, вторая остальные. Считается по
   * числу, поэтому не зависит от того, кого успели измерить.
   */
  it("кладка отдаёт первой колонке первые ceil(n / колонок) объектов", () => {
    const r = pack({
      keys: ["a", "b", "c", "d", "e"],
      sizes: store({
        a: [100, 50],
        b: [100, 20],
        c: [100, 30],
        d: [100, 10],
        e: [100, 40],
      }),
      layout: "masonry",
      fixed: [100, 0],
      columns: 2,
      order: "column",
    });

    expect(r.items.map(box)).toEqual([
      [0, 0, 100, 50],
      [0, 50, 100, 70],
      [0, 70, 100, 100],
      [100, 0, 200, 10],
      [100, 10, 200, 50],
    ]);
  });

  it("та же кладка при row идёт по самой короткой, а не блоками", () => {
    const same = {
      keys: ["a", "b", "c", "d", "e"],
      sizes: store({
        a: [100, 50],
        b: [100, 20],
        c: [100, 30],
        d: [100, 10],
        e: [100, 40],
      }),
      layout: "masonry" as const,
      fixed: [100, 0] as [number, number],
      columns: 2,
    };

    expect(pack({ ...same, order: "row" }).items.map(box)).toEqual([
      [0, 0, 100, 50],
      [100, 0, 200, 20],
      [100, 20, 200, 50],
      [0, 50, 100, 60],
      [100, 50, 200, 90],
    ]);
  });

  /*
   * При горизонтальной прокрутке слова меняются местами: подряд идут столбцы,
   * значит переставляет порядок уже `"row"`, а `"column"` — то, что список
   * делает и так. Числа зеркальны кладке выше.
   */
  it("при direction=x переставляет row, а column идёт по самой короткой", () => {
    const same = {
      keys: ["a", "b", "c", "d", "e"],
      sizes: store({
        a: [50, 60],
        b: [20, 60],
        c: [30, 60],
        d: [10, 60],
        e: [40, 60],
      }),
      layout: "masonry" as const,
      isX: true,
      fixed: [0, 60] as [number, number],
      columns: 2,
    };

    expect(pack({ ...same, order: "row" }).items.map(box)).toEqual([
      [0, 0, 50, 60],
      [50, 0, 70, 60],
      [70, 0, 100, 60],
      [0, 60, 10, 120],
      [10, 60, 50, 120],
    ]);

    expect(pack({ ...same, order: "column" }).items.map(box)).toEqual([
      [0, 0, 50, 60],
      [0, 60, 20, 120],
      [20, 60, 50, 120],
      [50, 0, 60, 60],
      [50, 60, 90, 120],
    ]);
  });

  it("поток при direction=x тоже переставляет по row, а не по column", () => {
    const same = {
      keys: ["a", "b", "c", "d", "e"],
      sizes: store({
        a: [100, 10],
        b: [100, 20],
        c: [100, 30],
        d: [100, 40],
        e: [100, 50],
      }),
      layout: "flow" as const,
      isX: true,
      fixed: [100, 0] as [number, number],
      columns: 2,
      crossLimit: 1000,
    };

    expect(pack({ ...same, order: "column" }).items.map(box)).toEqual([
      [0, 0, 100, 10],
      [0, 10, 100, 30],
      [100, 0, 200, 30],
      [100, 30, 200, 70],
      [200, 0, 300, 50],
    ]);

    expect(pack({ ...same, order: "row" }).items.map(box)).toEqual([
      [0, 0, 100, 10],
      [100, 0, 200, 20],
      [200, 0, 300, 30],
      [0, 10, 100, 50],
      [100, 20, 200, 70],
    ]);
  });

  /*
   * Поток при `"column"` заполняет сначала первый столбец сетки: пять
   * объектов по два в строке — это три строки, и они собираются из a, d /
   * b, e / c. Раскладка та же, что и была, меняется только кто где.
   */
  it("поток при названном счёте собирает строки из столбцов", () => {
    const r = pack({
      keys: ["a", "b", "c", "d", "e"],
      sizes: store({
        a: [10, 100],
        b: [20, 100],
        c: [30, 100],
        d: [40, 100],
        e: [50, 100],
      }),
      layout: "flow",
      columns: 2,
      crossLimit: 1000,
      order: "column",
    });

    expect(r.items.map(box)).toEqual([
      [0, 0, 10, 100],
      [0, 100, 20, 200],
      [0, 200, 30, 300],
      [10, 0, 50, 100],
      [20, 100, 70, 200],
    ]);
  });

  /*
   * Без счёта строки обрывает место, и сколько их будет — заранее не знает
   * никто. Порядок остаётся списочным: ругаться — дело компонента, дело
   * укладки — не выдумать число, которого нет.
   */
  it("поток без счёта оставляет порядок списочным", () => {
    const same = {
      keys: ["a", "b", "c"],
      sizes: store({ a: [60, 100], b: [60, 100], c: [60, 100] }),
      layout: "flow" as const,
      crossLimit: 130,
    };

    expect(pack({ ...same, order: "column" }).items.map(box)).toEqual(
      pack({ ...same, order: "row" }).items.map(box),
    );
  });
});

describe("packObjects: свободное место вдоль прокрутки", () => {
  /*
   * Строка толщиной с самый толстый: под низкой карточкой остаётся пусто, и
   * следующая за ней поднимается туда. Соседи по строке друг друга не держат
   * — поперёк они не пересекаются, — а тот, над кем стоит высокая, остаётся
   * на месте: подниматься некуда.
   */
  const rows = {
    keys: ["a", "b", "c", "d"],
    sizes: store({ a: [40, 20], b: [50, 80], c: [30, 30], d: [40, 25] }),
    layout: "flow" as const,
    gap: [10, 10] as [number, number],
    columns: 2,
    crossLimit: 1000,
  };

  it("поднимает объект в пустоту под низким соседом", () => {
    // c уходит под низкую a на 30, d держит высокая b и оставляет на 90
    expect(pack({ ...rows, compact: true }).items.map(box)).toEqual([
      [0, 0, 40, 20],
      [50, 0, 100, 80],
      [0, 30, 30, 60],
      [40, 90, 80, 115],
    ]);
  });

  it("без уплотнения та же строка стоит под самой толстой", () => {
    expect(pack({ ...rows, compact: false }).items.map(box)).toEqual([
      [0, 0, 40, 20],
      [50, 0, 100, 80],
      [0, 90, 30, 120],
      [40, 90, 80, 115],
    ]);
  });

  /*
   * Широкий c упирается в высокую a, а узкий d за ним влезает под низкую b —
   * и обогнал бы его, встав выше по экрану. Читалось бы это как дырка на
   * месте следующего по счёту и он же сам, всплывший где-то выше.
   */
  it("не поднимает выше предыдущего, даже когда место там есть", () => {
    const overtake = {
      keys: ["a", "b", "c", "d"],
      sizes: store({ a: [40, 80], b: [50, 20], c: [30, 30], d: [40, 25] }),
      layout: "flow" as const,
      gap: [10, 10] as [number, number],
      columns: 2,
      crossLimit: 1000,
    };

    // d поднялась бы на 30 — под b, — но c стоит на 90, и выше неё нельзя
    expect(pack({ ...overtake, compact: true }).items.map(box)).toEqual([
      [0, 0, 40, 80],
      [50, 0, 100, 20],
      [0, 90, 30, 120],
      [40, 90, 80, 115],
    ]);
  });

  it("обёртка считается по поднятым, а не по последней строке", () => {
    const tall = {
      keys: ["a", "b", "c"],
      sizes: store({ a: [40, 10], b: [40, 80], c: [40, 10] }),
      layout: "flow" as const,
      gap: [10, 10] as [number, number],
      columns: 2,
      crossLimit: 1000,
    };

    // c уходит под a на 20, и высота считается по b, а не по строке c
    expect(pack({ ...tall, compact: true }).height).toBe(80);
    expect(pack({ ...tall, compact: false }).height).toBe(100);
  });
});
