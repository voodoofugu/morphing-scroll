import type { SizeStore } from "./createSizeStore";

/**
 * How the objects are laid out when at least one side is measured.
 *
 * - `masonry` — the side along the scroll is measured, the one across it is
 *   known: fixed columns, and every object goes into the shortest one.
 * - `flow` — the side across the scroll is measured: objects fill a line
 *   until the next one no longer fits, then a new line starts.
 * - `grid` — nothing bounds either side, so `crossCount` does: columns take
 *   the width of their widest object, rows the height of their tallest.
 */
type PackLayout = "masonry" | "flow" | "grid";

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
  /** columns for `masonry` and `grid` */
  columns: number;
  /** how much room a line has across the scroll — `flow` wraps by it */
  crossLimit: number;
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
 * Кладка: следующий объект уходит в ту колонку, которая сейчас короче всех.
 * Это единственное правило, которое даёт ровный низ; «сначала первая колонка
 * до конца, потом вторая» ровный низ не даёт и порядок чтения всё равно
 * ломает, так что выбирать тут не из чего.
 */
const masonry = (a: PackArgs, measuredPrefix: number): PackResult => {
  const { keys, sizes, isX, fixed, gap, columns } = a;
  const main: 0 | 1 = isX ? 0 : 1;
  const cross: 0 | 1 = isX ? 1 : 0;

  const cell = fixed[cross];
  const gapMain = gap[main];
  const gapCross = gap[cross];

  const ends = new Array<number>(Math.max(1, columns)).fill(0);
  const items: Placed[] = [];

  for (const key of keys) {
    const known = sizes.get(key);
    const measured = known !== undefined;

    // при равенстве — самая левая, чтобы порядок был устойчив
    let column = 0;
    for (let c = 1; c < ends.length; c++) if (ends[c] < ends[column]) column = c;

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

  return {
    items,
    width: isX ? alongSize : acrossSize,
    height: isX ? acrossSize : alongSize,
    measuredPrefix,
  };
};

/*
 * Поток: объекты идут поперёк прокрутки, пока следующий помещается, дальше
 * начинается новая линия. Толщина линии — самый толстый в ней, если толщину
 * не задали числом.
 */
const flow = (a: PackArgs, measuredPrefix: number): PackResult => {
  const { keys, sizes, isX, fixed, gap, crossLimit } = a;
  const main: 0 | 1 = isX ? 0 : 1;
  const cross: 0 | 1 = isX ? 1 : 0;

  const gapMain = gap[main];
  const gapCross = gap[cross];

  const items: Placed[] = [];

  let lineStart = 0;
  let lineThick = 0;
  let cursor = 0;
  let widest = 0;

  for (const key of keys) {
    const known = sizes.get(key);
    const measured = known !== undefined;

    const across = measured ? sideOf(known, fixed, cross) : 0;
    const along = measured ? sideOf(known, fixed, main) : 0;

    // перенос по месту, а не по счёту: где кончилась строка, там и конец
    if (cursor > 0 && cursor + across > crossLimit) {
      lineStart += lineThick + gapMain;
      widest = Math.max(widest, cursor - gapCross);
      cursor = 0;
      lineThick = 0;
    }

    items.push(
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

    if (measured) {
      cursor += across + gapCross;
      lineThick = Math.max(lineThick, along);
    }
  }

  widest = Math.max(widest, cursor > 0 ? cursor - gapCross : 0);
  const alongSize = lineStart + lineThick;

  return {
    items,
    width: isX ? alongSize : widest,
    height: isX ? widest : alongSize,
    measuredPrefix,
  };
};

/*
 * Сетка: ни одна сторона не ограничена — при `hybrid` прокрутка идёт в обе, —
 * поэтому линию обрывает `crossCount`. Колонка становится шириной с самый
 * широкий свой объект, строка — высотой с самый высокий: иначе получается не
 * сетка, а рваная лесенка, по которой в обе стороны не поездишь.
 */
const grid = (a: PackArgs, measuredPrefix: number): PackResult => {
  const { keys, sizes, fixed, gap, columns } = a;
  const cols = Math.max(1, columns);
  const rows = Math.ceil(keys.length / cols) || 1;

  const colWidth = new Array<number>(cols).fill(0);
  const rowHeight = new Array<number>(rows).fill(0);

  keys.forEach((key, i) => {
    const known = sizes.get(key);
    if (!known) return;

    const c = i % cols;
    const r = Math.floor(i / cols);

    colWidth[c] = Math.max(colWidth[c], sideOf(known, fixed, 0));
    rowHeight[r] = Math.max(rowHeight[r], sideOf(known, fixed, 1));
  });

  const runningX = [0];
  for (let c = 0; c < cols; c++)
    runningX.push(runningX[c] + colWidth[c] + (colWidth[c] ? gap[0] : 0));

  const runningY = [0];
  for (let r = 0; r < rows; r++)
    runningY.push(runningY[r] + rowHeight[r] + (rowHeight[r] ? gap[1] : 0));

  const items = keys.map((key, i) => {
    const measured = sizes.get(key) !== undefined;
    const c = i % cols;
    const r = Math.floor(i / cols);

    return {
      left: runningX[c],
      right: runningX[c] + colWidth[c],
      top: runningY[r],
      bottom: runningY[r] + rowHeight[r],
      measured,
    };
  });

  // край сетки — правый край последней непустой колонки, без зазора за ним
  const extent = (running: number[], sides: number[]) => {
    let last = -1;
    for (let i = 0; i < sides.length; i++) if (sides[i] > 0) last = i;

    return last === -1 ? 0 : running[last] + sides[last];
  };

  return {
    items,
    width: extent(runningX, colWidth),
    height: extent(runningY, rowHeight),
    measuredPrefix,
  };
};

const packObjects = (args: PackArgs): PackResult => {
  let measuredPrefix = 0;
  for (const key of args.keys) {
    if (args.sizes.get(key) === undefined) break;
    measuredPrefix += 1;
  }

  if (args.layout === "flow") return flow(args, measuredPrefix);
  if (args.layout === "grid") return grid(args, measuredPrefix);

  return masonry(args, measuredPrefix);
};

export default packObjects;
export type { PackArgs, PackResult, PackLayout, Placed };
