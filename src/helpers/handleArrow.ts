import pageAt from "./pageAt";
import { loopPages, loopPageAt } from "./loopWindow";
import { aimOf } from "./addFunctions";

type handleArrowT = {
  arrowType: "left" | "right" | "top" | "bottom";
  scrollElement: Element;
  wrapSize: number[];
  scrollSize: number[];
  smoothScroll: (
    targetScroll: number,
    direction: "y" | "x",
    duration: number,
  ) => void;
  duration: number;
  gap: number[];
  /** the circle's period per axis, zero where the axis does not loop */
  loopPeriods?: [number, number];
  /**
   * turn the markup's horizontal position into the list's own and back.
   * A list running from the right starts where the markup ends, so its pages
   * are counted from there — off the markup's grid the two never line up and
   * a step out and back lands short.
   */
  flipX?: (value: number) => number;
};

const handleArrow = ({
  arrowType,
  scrollElement,
  wrapSize,
  scrollSize,
  smoothScroll,
  duration,
  gap,
  loopPeriods,
  flipX,
}: handleArrowT) => {
  // - vars -
  const width = wrapSize[0];
  const height = wrapSize[1];

  /*
   * Отсчёт ведём от того места, куда прокрутка уже едет. По текущей позиции
   * судить нельзя: в середине перелёта она лежит между страницами, и второе
   * нажатие подряд посчитало бы тот же шаг, что и первое — серия быстрых
   * нажатий стояла бы на месте.
   */
  const top = aimOf(scrollElement, "y") ?? scrollElement.scrollTop;
  const rawLeft = aimOf(scrollElement, "x") ?? scrollElement.scrollLeft;

  // считаем в координатах списка; наружу возвращаем обратно в разметку
  const asList = (value: number) => (flipX ? flipX(value) : value);
  const left = asList(rawLeft);

  // - funcs -
  /*
   * Страницы отсчитываются от начала оборота, а не от начала ленты: лента
   * начинается там, где пришлось, и её сетка с оборотом не совпадает. Шаг по
   * такой сетке уводил бы каждый раз в другое место — шаг вправо и шаг влево
   * не возвращали бы туда, откуда пошли.
   */
  const periodOf = (dir: "x" | "y") =>
    loopPeriods?.[dir === "x" ? 0 : 1] ?? 0;

  const stepOf = (dir: "x" | "y") => {
    const isX = dir === "x";
    const clientSize = scrollElement[isX ? "clientWidth" : "clientHeight"];

    return loopPages(periodOf(dir), clientSize, isX ? gap[0] : gap[1]).step;
  };

  const getNewPosition = (dir: "x" | "y", delta: 1 | -1) => {
    const period = periodOf(dir);
    const position = (dir === "x" ? left : top) - period;
    const step = stepOf(dir);

    /*
     * Округляем в сторону шага. Всегда вниз было неверно у зажатого конца:
     * там позиция стоит за последней целой страницей, а вниз её считали
     * предпоследней — и шаг назад перепрыгивал через страницу.
     */
    const page = loopPageAt(Math.max(0, position), step, delta);
    const nextPage = page + delta;

    // целим в целое: иначе следующий шаг снова окажется под границей
    const aim = period + Math.round(step * nextPage);

    return dir === "x" ? asList(aim) : aim;
  };

  /*
   * Тот же счёт страниц, что и у точки слайдера: в круге — внутри оборота и по
   * кольцу. Считая по ленте, шаг за конец оборота называл страницу, которой в
   * списке нет.
   */
  const pageOn = (dir: "x" | "y", value: number) => {
    const isX = dir === "x";
    const clientSize = scrollElement[isX ? "clientWidth" : "clientHeight"];
    const gapDir = isX ? gap[0] : gap[1];
    const period = periodOf(dir);

    if (!period) return pageAt(value, clientSize, gapDir);

    const { pages, step } = loopPages(period, clientSize, gapDir);
    const page = loopPageAt(value - period, step);

    return pages > 0 ? ((page % pages) + pages) % pages : 0;
  };

  const scrollTo = (dir: "x" | "y", delta: 1 | -1) => {
    const isX = dir === "x";
    const value = getNewPosition(dir, delta);

    smoothScroll(value, dir, duration);

    /*
     * Отчитываемся той страницей, на которой действительно встанем: прокрутка
     * обрежет цель по краю, а `onNavigate` иначе назвал бы страницу, которой
     * нет.
     */
    const clientSize = scrollElement[isX ? "clientWidth" : "clientHeight"];
    const landing = Math.max(
      0,
      Math.min(value, wrapSize[isX ? 0 : 1] - clientSize),
    );

    // наружу отдаём сам переход — из него собирается onNavigate
    return {
      axis: dir,
      from: pageOn(dir, isX ? left : top),
      to: pageOn(dir, isX ? asList(landing) : landing),
    };
  };

  /*
   * Сторона экрана и шаг по списку — не одно и то же: у списка, идущего
   * справа, вперёд ведёт левая стрелка. Считаем шагами списка, а сторону
   * переводим здесь.
   */
  const onward = () => left + scrollSize[0] < width;
  const backward = () => left > 0;

  // - logic -
  switch (arrowType) {
    case "top":
      if (top > 0) return scrollTo("y", -1);
      break;

    case "left":
      if (flipX ? onward() : backward()) return scrollTo("x", flipX ? 1 : -1);
      break;

    case "right":
      if (flipX ? backward() : onward()) return scrollTo("x", flipX ? -1 : 1);
      break;

    case "bottom":
      if (top + scrollSize[1] < height) return scrollTo("y", 1);
      break;
  }

  /*
   * Упёрлись в край — никуда не поехали. Заворачивать здесь незачем: в круге
   * края нет вовсе, и стрелка просто едет дальше, а без круга прыжок в начало
   * был бы прыжком, а не прокруткой.
   */
  return null;
};

export default handleArrow;
export type { handleArrowT };
