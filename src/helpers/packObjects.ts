import type { SizeStore } from "./createSizeStore";

/**
 * How the objects are laid out when at least one side is measured.
 *
 * - `masonry` — the side along the scroll is measured, the one across it is
 *   known: fixed columns, and every object goes into the shortest one.
 * - `flow` — the side across the scroll is measured: objects fill a line one
 *   after another, and a new line starts when the room across runs out or
 *   when `crossCount` says the line is full.
 * - `fill` — both sides are the objects' own: every object takes the highest
 *   place it fits into, so no holes are left. Order gives way to the fit.
 */
type PackLayout = "masonry" | "flow" | "fill";

type PackArgs = {
  keys: string[];
  sizes: SizeStore;
  layout: PackLayout;
  /** the scroll runs along x */
  isX: boolean;
  /** [x, y] — the size of a side the objects do not decide, 0 when they do */
  fixed: [number, number];
  /** [x, y] */
  gap: [number, number];
  /** columns for `masonry`; for `flow` — how many go in a line, 0 to fit by room */
  columns: number;
  /** how much room a line has across the scroll — `flow` wraps by it */
  crossLimit: number;
  /** where the objects sit when they do not fill the room across */
  align: "start" | "center" | "end";
  /**
   * close the gaps a line leaves along the scroll: a line is as thick as its
   * thickest object, and the shorter ones hang with room above them. Only for
   * `flow`, and only when that side is the objects' own — a line of a given
   * thickness leaves no gaps to close.
   */
  compact: boolean;
  /**
   * which way the order runs, in plain geometry: `row` fills a row and moves
   * down, `column` fills a column and moves right. One of the two is what the
   * list order already does — which one depends on the scrolling axis — and
   * the other takes the first `ceil(n / lines)` objects into the first line.
   * Counted by number, never by size, so measuring does not move anyone.
   */
  order: "row" | "column";
};

type Placed = {
  top: number;
  bottom: number;
  left: number;
  right: number;
  /** the size is known; until it is, the object is drawn to be measured */
  measured: boolean;
};

type PackResult = {
  items: Placed[];
  /** the room the packing takes */
  width: number;
  height: number;
  /** how many objects from the start of the list are measured */
  measuredPrefix: number;
};

/*
 * Неизмеренному объекту отводится ноль: он занимает место в очереди, но не
 * двигает соседей, пока не скажет свой размер. Поэтому очередь и не
 * перескакивает — объект встаёт туда же, куда встанет измеренным.
 */
const sideOf = (
  known: [number, number] | undefined,
  fixed: [number, number],
  axis: 0 | 1,
) => (fixed[axis] ? fixed[axis] : known ? known[axis] : 0);

/*
 * Свободное место поперёк делится по `align`. В минус не уходим: если объекты
 * шире отведённого, двигать их ещё дальше за край незачем.
 *
 * Пока измерены не все, не двигаем вовсе: у неизмеренных размера ещё нет,
 * свободного места «остаётся» много, и содержимое уезжало бы к краю, чтобы
 * пачку за пачкой ползти обратно.
 */
const offsetOf = (align: PackArgs["align"], free: number, ready: boolean) => {
  if (!ready || free <= 0 || align === "start") return 0;

  return align === "center" ? Math.round(free / 2) : free;
};

const shift = (
  items: Placed[],
  by: number,
  isX: boolean,
  from = 0,
  to = items.length,
) => {
  if (!by) return;

  for (let i = from; i < to; i++) {
    const item = items[i];

    if (isX) {
      item.top += by;
      item.bottom += by;
    } else {
      item.left += by;
      item.right += by;
    }
  }
};

/*
 * Кладка: следующий объект уходит в ту колонку, которая сейчас короче всех.
 * Это единственное правило, которое даёт ровный низ, поэтому оно и стоит по
 * умолчанию. `order: "column"` меняет его на «первая колонка до конца, потом
 * вторая»: низ становится рваным, зато список читается сверху вниз — и это
 * решает тот, кто просил, а не размеры.
 */
const masonry = (a: PackArgs, measuredPrefix: number): PackResult => {
  const { keys, sizes, isX, fixed, gap, columns } = a;
  const ready = measuredPrefix === keys.length;
  const main: 0 | 1 = isX ? 0 : 1;
  const cross: 0 | 1 = isX ? 1 : 0;

  const cell = fixed[cross];
  const gapMain = gap[main];
  const gapCross = gap[cross];

  const ends = new Array<number>(Math.max(1, columns)).fill(0);
  const items: Placed[] = [];

  /*
   * Правило «в самую короткую» читается поперёк прокрутки: при вертикальной
   * это строки, при горизонтальной — столбцы. Просьба о другом порядке
   * отдаёт первой линии первые `ceil(n / линий)` объектов: ровного края это
   * уже не даёт, зато список читается подряд.
   */
  const split = isX ? a.order === "row" : a.order === "column";
  const perColumn = Math.ceil(keys.length / ends.length);

  for (const [index, key] of keys.entries()) {
    const known = sizes.get(key);
    const measured = known !== undefined;

    // при равенстве — самая левая, чтобы порядок был устойчив
    let column = 0;
    if (split)
      column = Math.min(ends.length - 1, Math.floor(index / perColumn));
    else for (let c = 1; c < ends.length; c++)
      if (ends[c] < ends[column]) column = c;

    const start = ends[column];
    const along = measured ? sideOf(known, fixed, main) : 0;
    const across = column * (cell + gapCross);

    items.push(
      isX
        ? {
            left: start,
            right: start + along,
            top: across,
            bottom: across + cell,
            measured,
          }
        : {
            top: start,
            bottom: start + along,
            left: across,
            right: across + cell,
            measured,
          },
    );

    // зазор добавляем только после того, что действительно занимает место
    ends[column] = measured ? start + along + gapMain : start;
  }

  const longest = Math.max(...ends, 0);
  // последний зазор ничей: он висел бы хвостом за последним объектом
  const alongSize = longest > 0 ? longest - gapMain : 0;
  const acrossSize = ends.length * cell + gapCross * (ends.length - 1);

  /*
   * Колонки не заняли всю ширину — двигаем весь их блок целиком. Размер
   * обёртки при этом считаем после сдвига: иначе объекты уезжают за её край.
   */
  const offset = offsetOf(a.align, a.crossLimit - acrossSize, ready);
  shift(items, offset, isX);

  return {
    items,
    width: isX ? alongSize : offset + acrossSize,
    height: isX ? offset + acrossSize : alongSize,
    measuredPrefix,
  };
};

/*
 * Поток: объекты идут поперёк прокрутки, пока следующий помещается, дальше
 * начинается новая линия. Толщина линии — самый толстый в ней, если толщину
 * не задали числом.
 */
const flow = (a: PackArgs, measuredPrefix: number): PackResult => {
  const { keys, sizes, isX, fixed, gap, crossLimit, columns } = a;
  const ready = measuredPrefix === keys.length;
  const main: 0 | 1 = isX ? 0 : 1;
  const cross: 0 | 1 = isX ? 1 : 0;

  const gapMain = gap[main];
  const gapCross = gap[cross];

  /*
   * Обход. Линии тут идут поперёк прокрутки — при вертикальной это строки,
   * при горизонтальной столбцы, — и по списку заполняется именно они.
   * Просьба о другом порядке переставляет обход: сначала первая линия целиком
   * по одному объекту с каждой, — и для этого надо знать, сколько линий
   * будет. Знает это только `columns`: без него линию обрывает место, и
   * заранее их не сосчитать. Тогда порядок остаётся списочным, а сказать об
   * этом — дело компонента.
   */
  const split = isX ? a.order === "row" : a.order === "column";
  const rows = columns ? Math.ceil(keys.length / columns) : 0;
  const seq: number[] = [];

  if (split && rows)
    for (let row = 0; row < rows; row++)
      for (let column = 0; column < columns; column++) {
        const index = column * rows + row;

        if (index < keys.length) seq.push(index);
      }
  else for (let index = 0; index < keys.length; index++) seq.push(index);

  // кладём в порядке обхода, а раздаём по местам в списке
  const placed: Placed[] = [];

  let lineStart = 0;
  let lineThick = 0;
  let cursor = 0;
  let widest = 0;
  let inLine = 0;
  let lineFrom = 0;

  /*
   * Строку закрываем, когда она дособралась: раньше её длина неизвестна.
   * Выравнивать сразу нельзя — не с чем сравнивать.
   */
  const lines: { from: number; to: number; used: number }[] = [];

  const closeLine = () => {
    const used = cursor > 0 ? cursor - gapCross : 0;

    lines.push({ from: lineFrom, to: placed.length, used });
    widest = Math.max(widest, used);
  };

  for (const index of seq) {
    const key = keys[index];
    const known = sizes.get(key);
    const measured = known !== undefined;

    const across = measured ? sideOf(known, fixed, cross) : 0;
    const along = measured ? sideOf(known, fixed, main) : 0;

    /*
     * Считанный `crossCount` важнее места: он единственное, чем можно
     * оборвать строку там, где места нет вовсе — при `hybrid` прокрутка идёт
     * в обе стороны, и упереться не во что.
     */
    const full = columns
      ? inLine >= columns
      : cursor > 0 && cursor + across > crossLimit;

    if (full) {
      closeLine();
      lineStart += lineThick + gapMain;
      lineFrom = placed.length;
      cursor = 0;
      lineThick = 0;
      inLine = 0;
    }

    placed.push(
      isX
        ? {
            left: lineStart,
            right: lineStart + along,
            top: cursor,
            bottom: cursor + across,
            measured,
          }
        : {
            top: lineStart,
            bottom: lineStart + along,
            left: cursor,
            right: cursor + across,
            measured,
          },
    );

    inLine += 1;

    if (measured) {
      cursor += across + gapCross;
      lineThick = Math.max(lineThick, along);
    }
  }

  closeLine();

  /*
   * Отсчёт — самая широкая строка, а не всё окно: она и есть ширина
   * содержимого. Ей двигаться некуда, а остальные закрывают то, чего им до
   * неё не хватило. Мерить от окна значило бы двигать и её тоже.
   */
  for (const line of lines)
    shift(
      placed,
      offsetOf(a.align, widest - line.used, ready),
      isX,
      line.from,
      line.to,
    );

  /*
   * Уплотняем после выравнивания: то двигает поперёк, это вдоль, и порядок
   * между ними важен — иначе поднятый объект уезжал бы вбок уже на новом
   * месте и упирался бы не в того соседа.
   */
  if (a.compact) compactMain(placed, isX, gapMain, gapCross, widest);

  const alongSize = a.compact
    ? placed.reduce((max, item) => Math.max(max, mainEnd(item, isX)), 0)
    : lineStart + lineThick;

  const items = new Array<Placed>(keys.length);
  seq.forEach((index, at) => (items[index] = placed[at]));

  return {
    items,
    width: isX ? alongSize : widest,
    height: isX ? widest : alongSize,
    measuredPrefix,
  };
};

const crossStart = (item: Placed, isX: boolean) => (isX ? item.top : item.left);
const crossEnd = (item: Placed, isX: boolean) => (isX ? item.bottom : item.right);
const mainStart = (item: Placed, isX: boolean) => (isX ? item.left : item.top);
const mainEnd = (item: Placed, isX: boolean) => (isX ? item.right : item.bottom);

const moveCross = (item: Placed, to: number, isX: boolean) => {
  const width = crossEnd(item, isX) - crossStart(item, isX);

  if (isX) {
    item.top = to;
    item.bottom = to + width;
  } else {
    item.left = to;
    item.right = to + width;
  }
};

const moveMain = (item: Placed, to: number, isX: boolean) => {
  const along = mainEnd(item, isX) - mainStart(item, isX);

  if (isX) {
    item.left = to;
    item.right = to + along;
  } else {
    item.top = to;
    item.bottom = to + along;
  }
};

/*
 * Силуэт занятого: отрезки поперёк, у каждого своя граница по главной оси.
 * Им пользуются двое — заполнение, чтобы найти самое высокое место, куда
 * объект влезает, и уплотнение, чтобы поднять объект до того, что над ним.
 * Сверять каждого с каждым было бы квадратично, а отрезков всегда немного:
 * соседи одной высоты сливаются в один.
 */
const createSkyline = (limit: number) => {
  let parts: { at: number; size: number; top: number }[] = [
    { at: 0, size: Math.max(limit, 0), top: 0 },
  ];

  /** самая низкая точка, в которую упрётся объект шириной `size` из `at` */
  const restingAt = (at: number, size: number) => {
    let left = size;
    let top = 0;

    for (const part of parts) {
      if (part.at + part.size <= at) continue;
      if (left <= 0) break;

      top = Math.max(top, part.top);
      left -= part.at < at ? part.at + part.size - at : part.size;
    }

    return left > 0 ? null : top;
  };

  /** поднять силуэт над занятым местом */
  const raise = (at: number, size: number, top: number) => {
    const next: typeof parts = [];

    for (const part of parts) {
      const start = part.at;
      const end = part.at + part.size;

      if (end <= at || start >= at + size) {
        next.push(part);
        continue;
      }

      if (start < at) next.push({ at: start, size: at - start, top: part.top });
      if (end > at + size)
        next.push({ at: at + size, size: end - (at + size), top: part.top });
    }

    next.push({ at, size, top });
    next.sort((one, two) => one.at - two.at);

    // соседи одной высоты — это один отрезок; иначе силуэт растёт без нужды
    parts = next.reduce<typeof parts>((acc, part) => {
      const last = acc[acc.length - 1];

      if (last && last.top === part.top && last.at + last.size === part.at)
        last.size += part.size;
      else acc.push({ ...part });

      return acc;
    }, []);
  };

  return {
    restingAt,
    raise,
    /** отрезки на сейчас — заполнение перебирает их начала как места посадки */
    get parts() {
      return parts;
    },
  };
};

/*
 * Заполнение кладёт объект в первое место, куда он влезает, — это и есть
 * выравнивание к ближнему краю по построению. Дальний край и середина не
 * двигают блок целиком: строк тут нет, и общего остатка тоже — у каждого
 * объекта своё свободное место справа от него, и толкать нужно каждый
 * отдельно, а не всех на одно и то же расстояние.
 *
 * Толкаем от дальнего к ближнему: то, что толкаем сейчас, ещё не сдвинуто
 * и не помешает тому, что уже растолкано. Обратный порядок дал бы объекту
 * упереться в соседа, который потом сам отъедет и освободит место, — и это
 * место осталось бы закрытым просто потому, что до него не пересчитали.
 *
 * "center" — середина между тем, где объект лежит сейчас (это и есть его
 * положение при "start"), и тем, куда он дотолкался бы при "end". Толкаем
 * оба раза одинаково, независимо от того, что применяем в итоге: иначе
 * толкание с оглядкой на уже сдвинутых на середину соседей давало бы дырки
 * между ними, которых при чистом "end" не было.
 */
const compactFill = (
  items: Placed[],
  isX: boolean,
  gapCross: number,
  crossLimit: number,
  align: "center" | "end",
) => {
  const order = items
    .filter((item) => item.measured)
    .sort((a, b) => crossEnd(b, isX) - crossEnd(a, isX));

  const pushedTo = new Map<Placed, number>();

  for (const item of order) {
    const width = crossEnd(item, isX) - crossStart(item, isX);
    let bound = crossLimit;

    for (const [other, otherStart] of pushedTo) {
      if (mainEnd(item, isX) <= mainStart(other, isX)) continue;
      if (mainEnd(other, isX) <= mainStart(item, isX)) continue;

      bound = Math.min(bound, otherStart - gapCross);
    }

    const pushed = Math.max(crossStart(item, isX), bound - width);
    pushedTo.set(item, pushed);

    const at =
      align === "end"
        ? pushed
        : Math.round((crossStart(item, isX) + pushed) / 2);

    moveCross(item, at, isX);
  }
};

/*
 * Свободное место вдоль прокрутки. Линия толщиной с самый толстый объект
 * оставляет под низкими дыры — поднимаем каждый до того, что стоит над ним.
 * Порядок при этом остаётся построчным, чем это и отличается от заполнения:
 * то ради посадки порядок отдаёт, а тут строка остаётся строкой, просто без
 * пустот под ней.
 *
 * Идём сверху вниз: тот, до кого поднимаем, уже на своём месте.
 *
 * Упираемся не только в то, что стоит прямо над нами, но и в то, что рядом
 * ближе зазора: до уплотнения соседей из разных линий разводила сама линия, а
 * теперь объект может подъехать вплотную к тому, с кем едва разошёлся поперёк.
 * Поэтому спрашиваем силуэт про свой отрезок, расширенный на зазор в обе
 * стороны, — а поднимаем силуэт по своему собственному, чтобы расширения
 * соседей не затирали друг друга. Сосед по своей же линии при этом не мешает:
 * от него ровно зазор и есть, а отрезок, кончающийся там, где начинается
 * запрос, силуэт не считает пересечением.
 */
const compactMain = (
  items: Placed[],
  isX: boolean,
  gapMain: number,
  gapCross: number,
  crossSize: number,
) => {
  if (crossSize <= 0) return;

  const sky = createSkyline(crossSize);

  const order = items
    .filter((item) => crossEnd(item, isX) > crossStart(item, isX))
    .sort(
      (one, two) =>
        mainStart(one, isX) - mainStart(two, isX) ||
        crossStart(one, isX) - crossStart(two, isX),
    );

  for (const item of order) {
    const at = crossStart(item, isX);
    const span = crossEnd(item, isX) - at;
    const along = mainEnd(item, isX) - mainStart(item, isX);

    const from = Math.max(0, at - gapCross);
    const till = Math.min(crossSize, at + span + gapCross);
    const rest = sky.restingAt(from, till - from);
    // не влез в силуэт — трогать не за что, пусть стоит где стоял
    const to =
      rest === null ? mainStart(item, isX) : Math.min(mainStart(item, isX), rest);

    moveMain(item, to, isX);
    sky.raise(at, span, to + along + gapMain);
  }
};

/*
 * Заполнение: объект встаёт не следующим по очереди, а в самое высокое место,
 * куда влезает. Дырок под низкими соседями не остаётся — но и порядок теперь
 * не построчный: тот, кто ниже по списку, может оказаться выше на экране.
 *
 * Занятое помним силуэтом — списком отрезков поперёк с высотой каждого. Для
 * очередного объекта перебираем начала отрезков: годится то, где он влезает
 * в ширину и упирается ниже всех.
 */
const fill = (a: PackArgs, measuredPrefix: number): PackResult => {
  const { keys, sizes, isX, fixed, gap, crossLimit } = a;
  const ready = measuredPrefix === keys.length;
  const main: 0 | 1 = isX ? 0 : 1;
  const cross: 0 | 1 = isX ? 1 : 0;

  const gapMain = gap[main];
  const gapCross = gap[cross];

  const sky = createSkyline(crossLimit);
  const { restingAt, raise } = sky;

  const items: Placed[] = [];

  for (const key of keys) {
    const known = sizes.get(key);
    const measured = known !== undefined;

    const across = measured ? sideOf(known, fixed, cross) : 0;
    const along = measured ? sideOf(known, fixed, main) : 0;

    let bestAt = 0;
    let bestTop = 0;

    if (measured && across > 0) {
      let found = false;

      for (const part of sky.parts) {
        const at = part.at;
        if (at + across > crossLimit) continue;

        const top = restingAt(at, across);
        if (top === null) continue;

        if (!found || top < bestTop || (top === bestTop && at < bestAt)) {
          found = true;
          bestAt = at;
          bestTop = top;
        }
      }

      // шире отведённого — кладём с начала, за край он выйдет сам
      if (!found) bestTop = restingAt(0, Math.max(crossLimit, 1)) ?? 0;
    }

    items.push(
      isX
        ? {
            left: bestTop,
            right: bestTop + along,
            top: bestAt,
            bottom: bestAt + across,
            measured,
          }
        : {
            top: bestTop,
            bottom: bestTop + along,
            left: bestAt,
            right: bestAt + across,
            measured,
          },
    );

    if (measured && across > 0)
      raise(
        bestAt,
        Math.min(across + gapCross, Math.max(crossLimit - bestAt, across)),
        bestTop + along + gapMain,
      );
  }

  if (a.align !== "start" && ready)
    compactFill(items, isX, gapCross, crossLimit, a.align);

  const alongSize = items.reduce(
    (max, i) => Math.max(max, isX ? i.right : i.bottom),
    0,
  );
  const acrossSize = items.reduce(
    (max, i) => Math.max(max, isX ? i.bottom : i.right),
    0,
  );

  return {
    items,
    width: isX ? alongSize : acrossSize,
    height: isX ? acrossSize : alongSize,
    measuredPrefix,
  };
};

const packObjects = (args: PackArgs): PackResult => {
  let measuredPrefix = 0;
  for (const key of args.keys) {
    if (args.sizes.get(key) === undefined) break;
    measuredPrefix += 1;
  }

  if (args.layout === "fill") return fill(args, measuredPrefix);

  return args.layout === "flow"
    ? flow(args, measuredPrefix)
    : masonry(args, measuredPrefix);
};

export default packObjects;
export type { PackArgs, PackResult, PackLayout, Placed };
