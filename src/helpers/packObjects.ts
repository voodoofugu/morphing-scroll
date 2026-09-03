import type { SizeStore } from "./createSizeStore";

type PackArgs = {
  keys: string[];
  sizes: SizeStore;
  /** how many columns across the scrolling axis */
  crossCount: number;
  /** width of one column, px */
  crossSize: number;
  /** [along the scrolling axis, across it] */
  gap: [number, number];
  /** the scroll runs along x */
  isX: boolean;
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
  /** how far the packing reaches along the scrolling axis */
  mainSize: number;
  /** how many objects from the start of the list are measured */
  measuredPrefix: number;
};

/*
 * Кладка: следующий объект уходит в ту колонку, которая сейчас короче всех.
 * Это единственное правило, которое даёт ровный низ; «сначала первая колонка
 * до конца, потом вторая» ровный низ не даёт и порядок чтения всё равно
 * ломает, так что выбирать тут не из чего.
 *
 * Неизмеренному объекту отводится ноль: он занимает место в очереди, но не
 * двигает соседей, пока не скажет свой размер. Поэтому очередь и не
 * перескакивает — объект встаёт в ту же колонку, что и займёт.
 */
const packObjects = ({
  keys,
  sizes,
  crossCount,
  crossSize,
  gap,
  isX,
}: PackArgs): PackResult => {
  const columns = Math.max(1, crossCount);
  const [gapMain, gapCross] = gap;

  const ends = new Array<number>(columns).fill(0);
  const items: Placed[] = [];

  let measuredPrefix = 0;
  let prefixOpen = true;

  for (const key of keys) {
    const known = sizes.get(key);
    const measured = known !== undefined;

    if (measured && prefixOpen) measuredPrefix += 1;
    else prefixOpen = false;

    // самая короткая колонка; при равенстве — самая левая, чтобы порядок был устойчив
    let column = 0;
    for (let c = 1; c < columns; c++) if (ends[c] < ends[column]) column = c;

    const start = ends[column];
    const main = measured ? (isX ? known[0] : known[1]) : 0;
    const cross = column * (crossSize + gapCross);

    items.push(
      isX
        ? {
            left: start,
            right: start + main,
            top: cross,
            bottom: cross + crossSize,
            measured,
          }
        : {
            top: start,
            bottom: start + main,
            left: cross,
            right: cross + crossSize,
            measured,
          },
    );

    // зазор добавляем только после того, что действительно занимает место
    ends[column] = measured ? start + main + gapMain : start;
  }

  const longest = Math.max(...ends, 0);

  return {
    items,
    // последний зазор ничей: он висел бы хвостом за последним объектом
    mainSize: longest > 0 ? longest - gapMain : 0,
    measuredPrefix,
  };
};

export default packObjects;
export type { PackResult, Placed };
