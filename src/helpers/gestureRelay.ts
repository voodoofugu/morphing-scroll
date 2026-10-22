/*
 * Начальная маршрутизация жеста между вложенными MorphScroll.
 *
 * Одноосевой scroll после первых пикселей знает, его ли это ось. Если нет,
 * ближайший подходящий MorphScroll может принять жест. После выбора оси владелец
 * больше не меняется: границу своего scroll он показывает резиновостью.
 */
type Taker = {
  /** whether this axis still has room the way the finger is going */
  room: (axis: "x" | "y", toward: 1 | -1) => boolean;
  /** whether this particular pointer is allowed to hand its drag over */
  accepts: (event: PointerEvent) => boolean;
  /** pick the gesture up from this point, at this speed */
  take: (event: PointerEvent, velocity: { x: number; y: number }) => void;
};

type Room = Pick<Taker, "room">;

const rooms = new WeakMap<Element, Room>();
const takers = new WeakMap<Element, Taker>();

const isNativeScroll = (element: Element, axis: "x" | "y") => {
  /* MorphScroll сам ведёт своё окно, даже когда рисует нативный bar. */
  if (
    element.hasAttribute("morph-scroll") ||
    element.classList.contains("ms-viewport")
  )
    return false;

  const flow = getComputedStyle(element)[
    axis === "x" ? "overflowX" : "overflowY"
  ];
  if (flow !== "auto" && flow !== "scroll" && flow !== "overlay") return false;

  return axis === "x"
    ? element.scrollWidth > element.clientWidth + 1
    : element.scrollHeight > element.clientHeight + 1;
};

const hasNativeRoom = (
  element: Element,
  axis: "x" | "y",
  toward: 1 | -1,
) => {
  if (!isNativeScroll(element, axis)) return false;

  return hasScrollRoom(element, axis, toward);
};

const hasScrollRoom = (
  element: Element,
  axis: "x" | "y",
  toward: 1 | -1,
) => {
  const at = axis === "x" ? element.scrollLeft : element.scrollTop;
  const most =
    axis === "x"
      ? element.scrollWidth - element.clientWidth
      : element.scrollHeight - element.clientHeight;

  return toward > 0 ? at < most - 1 : at > 1;
};

const registerRoom = (element: Element, room: Room) => {
  rooms.set(element, room);

  return () => {
    rooms.delete(element);
  };
};

const registerTaker = (element: Element, taker: Taker) => {
  takers.set(element, taker);

  return () => {
    takers.delete(element);
  };
};

/*
 * Ближайший снаружи, кому есть куда ехать. Идём именно вверх по предкам, а не
 * к первому попавшемуся: жест отдают наружу, а не в сторону.
 */
const findTaker = (
  from: Element | null,
  axis: "x" | "y",
  toward: 1 | -1,
  event: PointerEvent,
) => {
  let node = from?.parentElement ?? null;

  while (node) {
    const taker = takers.get(node);

    if (taker?.accepts(event) && taker.room(axis, toward)) return taker;

    /*
     * Нативный scroll — граница библиотечной цепочки. Даже на его краю не
     * перепрыгиваем к MorphScroll снаружи: дальнейший scroll chaining уже
     * выбирает браузер.
     */
    if (isNativeScroll(node, axis)) return null;

    node = node.parentElement;
  }

  return null;
};

/*
 * Может ли кто-то снаружи ехать в эту сторону — внешний MorphScroll с запасом
 * или обычный прокручиваемый предок, вплоть до самой страницы.
 *
 * Поперечный жест отдают наружу только тогда, когда его есть кому взять.
 * Отдав его в пустоту, скролл просто терял ввод: одиночная горизонтальная
 * лента на неподвижной странице переставала слышать диагональ колеса вовсе.
 */
const canTakeOutside = (
  from: Element | null,
  axis: "x" | "y",
  toward: 1 | -1,
) => {
  for (let node = from?.parentElement; node; node = node.parentElement) {
    const room = rooms.get(node);
    if (room?.room(axis, toward)) return true;

    if (hasNativeRoom(node, axis, toward)) return true;
  }

  const page = document.scrollingElement;
  return !!page && hasScrollRoom(page, axis, toward);
};

/*
 * Колесо всплывает до того, как браузер прокрутит ближайший overflow. Поэтому
 * MorphScroll снаружи обязан заранее уступить нативному потомку, если тот
 * может принять ведущую ось этого деления. На краю room исчезает, событие
 * доходит до MorphScroll и цепочка продолжается как у обычных scroll-box.
 */
const nativeWheelHasPriority = (event: WheelEvent, until: Element) => {
  const axis: "x" | "y" =
    Math.abs(event.deltaX) > Math.abs(event.deltaY) ? "x" : "y";
  const delta = axis === "x" ? event.deltaX : event.deltaY;
  if (!delta) return false;

  const target = event.target;
  let node = target instanceof Element ? target : null;
  const toward: 1 | -1 = delta > 0 ? 1 : -1;

  while (node && node !== until) {
    if (hasNativeRoom(node, axis, toward)) return true;
    node = node.parentElement;
  }

  return false;
};

/*
 * Нажатия, с которых жест уже начал какой-то скролл.
 *
 * Бар лежит вне окна своего скролла, но внутри окна внешнего, и нажатие на
 * бегунок вложенного доходило до внешнего как тяга его содержимого: бегунок
 * вёл свой список, а дрожь руки — внешний. Гасить всплытие нельзя — выше
 * слушают и свои, показ бара при касании, и приложение. Поэтому отмечаем.
 */
const claimed = new WeakSet<Event>();

const claimGesture = (event: Event) => {
  claimed.add(event);
};

const isGestureClaimed = (event: Event) => claimed.has(event);

export {
  registerRoom,
  registerTaker,
  findTaker,
  canTakeOutside,
  nativeWheelHasPriority,
  claimGesture,
  isGestureClaimed,
};
export type { Taker };
