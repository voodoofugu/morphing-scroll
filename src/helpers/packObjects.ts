import type { SizeStore } from "./createSizeStore";

/**
 * How the objects are laid out when at least one side is measured.
 *
 * - `masonry` — the side along the scroll is measured, the one across it is
 *   known: fixed columns, and every object goes into the shortest one.
 * - `flow` — the side across the scroll is measured: objects fill a line one
 *   after another, and a new line starts when the room across runs out or
 *   when `crossCount` says the line is full.
 */
type PackLayout = "masonry" | "flow";

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
 */
const offsetOf = (align: PackArgs["align"], free: number) => {
  if (free <= 0 || align === "start") return 0;

  return align === "center" ? Math.round(free / 2) : free;
};

const shift = (items: Placed[], by: number, isX: boolean, from = 0) => {
  if (!by) return;

  for (let i = from; i < items.length; i++) {
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

  // колонки не заняли всю ширину — двигаем весь их блок целиком
  shift(items, offsetOf(a.align, a.crossLimit - acrossSize), isX);

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
  const { keys, sizes, isX, fixed, gap, crossLimit, columns } = a;
  const main: 0 | 1 = isX ? 0 : 1;
  const cross: 0 | 1 = isX ? 1 : 0;

  const gapMain = gap[main];
  const gapCross = gap[cross];

  const items: Placed[] = [];

  let lineStart = 0;
  let lineThick = 0;
  let cursor = 0;
  let widest = 0;
  let inLine = 0;
  let lineFrom = 0;

  // строку выравниваем, когда она дособралась: раньше её длина неизвестна
  const closeLine = () => {
    const used = cursor > 0 ? cursor - gapCross : 0;

    shift(items, offsetOf(a.align, crossLimit - used), isX, lineFrom);
    widest = Math.max(widest, used);
  };

  for (const key of keys) {
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
      lineFrom = items.length;
      cursor = 0;
      lineThick = 0;
      inLine = 0;
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

    inLine += 1;

    if (measured) {
      cursor += across + gapCross;
      lineThick = Math.max(lineThick, along);
    }
  }

  closeLine();
  const alongSize = lineStart + lineThick;

  return {
    items,
    width: isX ? alongSize : widest,
    height: isX ? widest : alongSize,
    measuredPrefix,
  };
};

const packObjects = (args: PackArgs): PackResult => {
  let measuredPrefix = 0;
  for (const key of args.keys) {
    if (args.sizes.get(key) === undefined) break;
    measuredPrefix += 1;
  }

  return args.layout === "flow"
    ? flow(args, measuredPrefix)
    : masonry(args, measuredPrefix);
};

export default packObjects;
export type { PackArgs, PackResult, PackLayout, Placed };
