import type { Tasks } from "./createTasks";
import type { PointerRuntime } from "./createPointerRuntime";

import { MorphScroll, Vec2 } from "../types/types";
import { ScrollStateRefT } from "./handleWheel";

import { mouseOnEl } from "./mouseOn";
import startInertiaScroll from "./startInertiaScroll";
import clampValue from "./clampValue";
import {
  overscrollBackAnim,
  stopOverscrollBackAnim,
} from "./overscrollBackAnim";

import CONST from "../constants";
import { loopPages, loopPageAt } from "./loopWindow";

type ClickedT = "thumb" | "slider" | "wrapp" | null;

type HandleMouseT = {
  scrollElement: HTMLDivElement | null;
  target: HTMLElement | null;
  clickedObject: React.MutableRefObject<ClickedT>;
  mode: MorphScroll["mode"];
  direction: "x" | "y" | "hybrid";
  scrollStateRef: ScrollStateRefT;
  sizeLocal: number[];
  smoothScroll: (
    targetScroll: number | null,
    direction: "x" | "y",
    duration: number,
  ) => Promise<void> | null;
  triggerUpdate: () => void;
  thumbSize: number;
  axisFromAtr: "x" | "y" | null;
  duration: number;
  scrollBarEdge: number[];
  rafScrollAnim: {
    schedule: (kay: string, fn: () => void) => void;
    cancel: () => void;
  };
  isTouched: boolean;
  gap: number[];
  overscrollRef: React.MutableRefObject<{
    x: number;
    y: number;
  }>;
  objLengthPerSize: number[];
  isDraggingRef: React.MutableRefObject<boolean>;
  maxScrollSize: Vec2;
  /** the circle's period per axis, zero where the axis does not loop */
  loopPeriods?: Vec2;
  /** one page turn, reported the moment the gesture aims at a new one */
  emitNavigate: (
    reason: string,
    axis: "x" | "y",
    from: number,
    to: number,
  ) => void;
  /** the pointer that started the gesture — the rest are ignored */
  pointerId: number;
  /** the pointer state of this instance */
  runtime: PointerRuntime;
  /** the task manager of this instance */
  tasks: Tasks;
};

type HandleMoveT = Omit<
  HandleMouseT,
  "controller" | "scrollBarOnHover" | "scrollContentRef" | "mouseOnRefHandle"
> & {
  event: PointerEvent;
  wrapElWH: number[];
  visualDiff: number[];
  thumbRatio: number;
  maxScrollSize: Vec2;
  /** the bar's own rectangle — the element being aimed at is read from it */
  sliderRect?: DOMRect;
};

type HandleUpT = Omit<HandleMouseT, "scrollStateRef" | "sizeLocal"> & {
  event: PointerEvent;
  thumbRatio: number;
  maxScrollSize: Vec2;
};

function getVisualToLayoutScale(el: HTMLElement) {
  const rect = el.getBoundingClientRect();
  return [rect.width / el.clientWidth, rect.height / el.clientHeight];
}

const cursorClassChange = (
  clicked: ClickedT,
  target: HTMLElement | null,
  scrollElement: HTMLDivElement | null,
  mode: "start" | "end",
  runtime: PointerRuntime,
) => {
  if (!clicked) return;
  let elem: HTMLElement | null = null;

  // уточняем elem
  if (["thumb", "slider"].includes(clicked)) {
    if (clicked === "slider")
      elem = target?.closest(".ms-slider") as HTMLDivElement | null;
    else elem = target;
  } else if (clicked === "wrapp") elem = scrollElement;

  mouseOnEl(elem, mode, runtime);
};

const setScrollValue = (
  axis: "x" | "y",
  el: HTMLDivElement,
  args: HandleMoveT,
  value: number,
) => {
  if (axis === "x") {
    args.scrollStateRef.targetScrollX = value;
    if (el.scrollLeft !== value) el.scrollLeft = value;
  } else {
    args.scrollStateRef.targetScrollY = value;
    if (el.scrollTop !== value) el.scrollTop = value;
  }
};

const motionHandler = (
  axis: "x" | "y",
  thumbRatio: number,
  visualDiff: number[],
  args: HandleMoveT,
) => {
  const el = args.scrollElement as HTMLDivElement;
  if (!el) return;

  const rt = args.runtime;
  const isX = axis === "x";

  // --- получение координат ---
  const point = { x: args.event.clientX, y: args.event.clientY };
  if (!point) return;

  // --- инициализация предыдущей точки ---
  const applyRubberBand = (
    drag: number,
    axisLocal: "x" | "y",
    invert?: boolean,
  ) => {
    if (drag === 0) return 0;

    const viewportSize =
      axisLocal === "x" ? args.sizeLocal[0] : args.sizeLocal[1];
    const K =
      Math.max(CONST.MIN_THRESHOLD_SIZE, viewportSize) * CONST.RUBBER_STIFFNESS;

    const abs = Math.abs(drag);

    return clampValue(
      (drag * K) / (K + (invert ? -abs : abs)),
      -CONST.BOUNCE_MAX_OVERSCROLL,
      CONST.BOUNCE_MAX_OVERSCROLL,
    );
  };

  if (!rt.prevCoords) {
    rt.prevCoords = {
      x: {
        value: point.x,
        rest: 0,
        raw: applyRubberBand(args.overscrollRef.current.x, "x", true),
      },
      y: {
        value: point.y,
        rest: 0,
        raw: applyRubberBand(args.overscrollRef.current.y, "y", true),
      },
    };

    return;
  }

  const prev = rt.prevCoords;

  const delta = {
    x: point.x - prev.x.value,
    y: point.y - prev.y.value,
  };

  // если checkMove больше 2px (запас), то считаем, что это scroll, и захватываем указатель
  const stableCheckMove = Math.abs(rt.checkMove[axis]);
  if (stableCheckMove > 2) {
    args.isDraggingRef.current = true;
  } else if (stableCheckMove < 3) rt.checkMove[axis] += delta[axis];

  // логика для плавного скроллинга пальцем
  if (args.isTouched) {
    const now = performance.now();

    if (!rt.velocity.t) {
      rt.velocity.t = now;
    } else {
      const dt = Math.max(now - rt.velocity.t, 8);

      rt.velocity = {
        x: rt.velocity.x * 0.8 + (delta.x / dt) * 0.2,
        y: rt.velocity.y * 0.8 + (delta.y / dt) * 0.2,
        t: now,
        distX: rt.velocity.distX + Math.abs(delta.x),
        distY: rt.velocity.distY + Math.abs(delta.y),
      };
    }
  }

  const move =
    args.clickedObject.current === "wrapp" ? -delta[axis] : delta[axis];

  const topOrLeft = isX ? "scrollLeft" : "scrollTop";
  const wh = isX ? 0 : 1;

  const applyBoundedMovement = (
    scrollDelta: number,
    rawDelta: number,
    withVisualOverscroll: boolean,
  ) => {
    const state = rt.prevCoords![axis];

    /*
     * `maxScrollSize` считается по пропсам, а докуда реально доезжает
     * scrollLeft/scrollTop — решает DOM. На дробных размерах и когда CSS ужал
     * контент они расходятся: прокрутка упирается раньше, чем мы считаем край
     * достигнутым, и резиновость просто не включалась. Берём меньшее из двух.
     */
    const propMax = isX ? args.maxScrollSize[0] : args.maxScrollSize[1];
    const domMax = isX
      ? el.scrollWidth - el.clientWidth
      : el.scrollHeight - el.clientHeight;
    const maxScrollSize = domMax > 0 ? Math.min(propMax, domMax) : propMax;

    if (!Number.isFinite(scrollDelta) || !Number.isFinite(rawDelta)) {
      // важно: сбрасываем состояние, иначе жест «залипнет»
      rt.prevCoords = null;
      return;
    }

    // Если указатель уже ушёл за край, сначала «съедаем» обратное
    // движение через raw. Для thumb это даёт браузерное поведение:
    // бегунок остаётся на краю и не начинает двигаться, пока указатель
    // не вернулся из накопленного overscroll-участка.
    if (state.raw !== 0) {
      const prevRaw = state.raw;
      state.raw += rawDelta * CONST.MICRO_DAMPENING;

      if (withVisualOverscroll) {
        args.overscrollRef.current[axis] = applyRubberBand(state.raw, axis);
        args.triggerUpdate();
      }

      // если пересекли 0 — полностью выходим в нормальный режим
      if (Math.sign(state.raw) !== Math.sign(prevRaw)) {
        state.raw = 0;
        if (withVisualOverscroll) {
          args.overscrollRef.current[axis] = 0;
          args.triggerUpdate();
        }
        return;
      }

      return;
    }

    if (maxScrollSize <= 0) {
      setScrollValue(axis, el, args, 0);
      return;
    }

    const currentScroll = el[topOrLeft];
    const isAtStart = currentScroll <= 0;
    const isAtEnd = currentScroll >= maxScrollSize;
    const isMovingBeforeStart = scrollDelta < 0;
    const isMovingAfterEnd = scrollDelta > 0;
    /*
     * В круге края нет: дотащить до него нечего, а если позиция и заехала за
     * среднюю копию на кадр, это не край, а копия — и тянуть оттуда резинку
     * значит показать отскок там, где контент продолжается.
     */
    const onLoop = (args.loopPeriods?.[axis === "x" ? 0 : 1] ?? 0) > 0;

    const shouldStartOverscroll =
      !onLoop &&
      ((isAtStart && isMovingBeforeStart) || (isAtEnd && isMovingAfterEnd));

    // Важно: если движение из середины списка просто перелетело за край,
    // сначала только доводим scroll до границы. Резиновость начинается
    // только следующим движением, когда scroll уже стоит на start/end.
    if (shouldStartOverscroll) {
      state.raw += rawDelta;

      if (withVisualOverscroll) {
        args.overscrollRef.current[axis] = applyRubberBand(state.raw, axis);
        args.triggerUpdate();
      }

      return;
    }

    const nextScroll = el[topOrLeft] + scrollDelta;
    const clampedScroll = clampValue(nextScroll, 0, maxScrollSize);
    setScrollValue(axis, el, args, clampedScroll);
  };

  // --- логика для thumb ---
  if (args.clickedObject.current === "thumb" && args.mode !== "slider") {
    const fullDelta = move * thumbRatio + prev[axis].rest;
    const intDelta = Math.trunc(fullDelta);
    prev[axis].rest = fullDelta - intDelta;

    applyBoundedMovement(intDelta, move, false);
    return;
  }

  // обновление предыдущих координат для ! wrapp при slider
  if (args.mode === "slider") rt.checkSliderThumbSize[axis] += move;

  // --- логика для wrapp ---
  if (args.clickedObject.current === "wrapp") {
    const diff = visualDiff[wh];
    applyBoundedMovement(move / diff, delta[axis], true);
    return;
  }

  /*
   * --- логика для slider ---
   *
   * Страницу выбирает то, куда указатель показывает, а не сколько он проехал.
   * Накопленный сдвиг не знает, где жест начинался: шаг случался не на
   * границе пункта, а через пункт от места, где счётчик сбросился, — и
   * возвращение из-за края бара двигало слайдер сразу, вместо того что бы
   * дождаться нужного пункта.
   */
  const bar = args.sliderRect;
  const pages = args.objLengthPerSize[wh];
  if (!bar || pages < 1) return;

  const barStart = isX ? bar.left : bar.top;
  const barSize = isX ? bar.width : bar.height;
  if (barSize <= 0) return;

  const period = args.loopPeriods?.[wh] ?? 0;
  const reach = Math.floor(((point[axis] - barStart) / barSize) * pages);

  /*
   * За краем бара обычный слайдер упирается: дальше первого и последнего
   * пункта идти некуда. В круге некуда не бывает — за последним снова первый,
   * — поэтому там прицел не упирается, а заворачивается.
   */
  const aimed = period
    ? ((reach % pages) + pages) % pages
    : clampValue(reach, 0, pages - 1);

  const step = loopPages(
    period,
    el[isX ? "clientWidth" : "clientHeight"],
    args.gap[wh],
  ).step;
  if (!(step > 0)) return;

  /*
   * Где жест уже был, помнит он сам. По текущей позиции судить нельзя: во
   * время перелёта она лежит между пунктами, и прицел в тот, откуда мы как раз
   * уезжаем, читался бы как «мы там и стоим» — перелёт не отменялся.
   */
  const seen = rt.sliderAim[axis];
  const current = seen ?? loopPageAt(el[topOrLeft] - period, step);
  rt.sliderAim[axis] = aimed;
  if (aimed === current) return;

  /*
   * Каждый пункт, через который проехал жест, — отдельное перелистывание.
   * Ждать конца жеста нельзя: за один пронос по бару их случается несколько,
   * а конец у них один на всех.
   */
  args.emitNavigate("bar", axis, current, aimed);

  /*
   * Перелёт короткий, но настоящий. Десять миллисекунд — меньше кадра: попадёт
   * ли в них хоть один промежуточный кадр, решает случай, и одно и то же
   * движение выглядело то прокруткой, то подменой позиции. Ноль остаётся
   * нулём: выключенная анимация выключена и здесь.
   */
  /*
   * Страницы в круге отсчитываются от начала оборота. И едем к ближайшему из
   * повторов: завернувшись с последней страницы на первую, мотать назад через
   * весь круг незачем — рядом та же самая.
   */
  let target = period + Math.round(aimed * step);

  if (period) {
    const at = el[topOrLeft];
    const ahead = (((target - at) % period) + period) % period;

    target = at + (ahead <= period / 2 ? ahead : ahead - period);
  }

  args.smoothScroll(
    target,
    axis,
    Math.min(args.duration, CONST.SLIDER_AIM_DURATION),
  );
};

function handleMouseOrTouch(args: HandleMouseT) {
  const rt = args.runtime;

  // останавливаем overscroll анимацию назад, если она есть
  stopOverscrollBackAnim(rt.overscrollLoop);

  // удаляем RAF и задачу слайдера
  (["x", "y"] as const).forEach((axis) => {
    args.rafScrollAnim.cancel();
    args.tasks.cancelTask(`smoothScrollBlock${axis}`); // обязательно убираем анимацию
  });

  // обновление targetScroll заранее
  const el = args.scrollElement;
  if (!el) return;

  args.scrollStateRef.targetScrollX = el.scrollLeft;
  args.scrollStateRef.targetScrollY = el.scrollTop;

  // reset inertia state for new gesture
  rt.resetGesture();

  // получение некоторых данных заранее при клике
  const wrapElWH = [el.scrollWidth, el.scrollHeight];
  const visualDiff = ["scroll", "slider"].includes(args.mode!)
    ? getVisualToLayoutScale(el)
    : [];
  // --------------------------------------------

  // получаем thumbRatio
  let thumbRatio = 1;
  if (args.clickedObject.current === "thumb" && args.axisFromAtr) {
    const wh = args.axisFromAtr === "x" ? 0 : 1;
    const maxThumbPos =
      (args.sizeLocal[wh] - args.scrollBarEdge[wh] - args.thumbSize) *
      visualDiff[wh];

    /*
     * Сколько прокрутки приходится на ход бегунка. В круге дорожка стоит за
     * оборот, а не за всю ленту, — значит и переводить ход надо в оборот:
     * иначе тот же ход увозил бы контент во столько раз дальше, сколько копий
     * в ленте.
     */
    thumbRatio =
      (args.loopPeriods?.[wh] || args.maxScrollSize[wh]) / maxThumbPos;
    // защита
    if (!Number.isFinite(thumbRatio) || thumbRatio <= 0) thumbRatio = 1;
  }

  // меняем курсор и класс
  cursorClassChange(args.clickedObject.current, args.target, el, "start", rt);

  // слушатели для движения и отжатия
  rt.controller?.abort(); // отменяем предыдущий жест этого же скролла
  const controller = new AbortController();
  rt.controller = controller;
  const { signal } = controller;

  const onMoveLocal = (e: PointerEvent) => {
    // бар мог переехать за время жеста — читаем его положение на каждом шаге
    let sliderRect: DOMRect | undefined;
    if (args.clickedObject.current === "thumb" && args.mode === "slider") {
      const bar = args.target?.closest(".ms-slider") as HTMLElement | null;
      if (!bar) return;

      sliderRect = bar.getBoundingClientRect();
    }

    handleMove({
      ...args,
      event: e,
      wrapElWH,
      visualDiff,
      thumbRatio,
      sliderRect,
    });
  };

  /*
   * Слушаем на document, что бы жест не терялся при уходе за границы
   * элемента, но реагируем только на свой указатель. Иначе любой pointerup
   * завершал чужой жест: два пальца на двух списках мешали друг другу, а
   * посторонний pointermove двигал прокрутку, которую никто не трогал.
   */
  const isOwnPointer = (e: PointerEvent) => e.pointerId === args.pointerId;

  /*
   * Ссылки и картинки браузер переносит сам: жест уходит в нативный drag,
   * приходит pointercancel — и прокрутка обрывается на полпути. Пока тащим мы,
   * нативный перенос не нужен. Элементы со своим переносом сюда не попадают:
   * жест на них не начинается вовсе.
   */
  document.addEventListener("dragstart", (e) => e.preventDefault(), { signal });

  document.addEventListener(
    "pointermove",
    (e) => {
      if (!isOwnPointer(e)) return;
      onMoveLocal(e);
    },
    { signal },
  );

  const endHandler = (e: PointerEvent) => {
    if (!isOwnPointer(e)) return;

    args.isDraggingRef.current = false; // сбрасываем флаг перетаскивания заранее

    handleUp({
      ...args,
      event: e as any,
      thumbRatio,
    });
  };

  document.addEventListener("pointerup", endHandler, { signal });
  document.addEventListener("pointercancel", endHandler, { signal });
}

function handleMove(args: HandleMoveT) {
  const dir = args.direction || "y";

  if (dir === "hybrid") {
    if (["wrapp", "slider"].includes(args.clickedObject.current!)) {
      (["x", "y"] as const).forEach((axis) =>
        motionHandler(axis, args.thumbRatio, args.visualDiff, args),
      );
    } else if (args.axisFromAtr)
      motionHandler(args.axisFromAtr, args.thumbRatio, args.visualDiff, args);
  } else
    motionHandler(
      args.axisFromAtr ? args.axisFromAtr : dir,
      args.thumbRatio,
      args.visualDiff,
      args,
    );

  // обновление prevCoords
  const point = { x: args.event.clientX, y: args.event.clientY };
  const { prevCoords } = args.runtime;
  if (prevCoords) {
    prevCoords.x.value = point.x;
    prevCoords.y.value = point.y;
  }
}

function handleUp(args: HandleUpT) {
  const rt = args.runtime;
  rt.controller?.abort(); // удаляем слушатели
  rt.controller = undefined;

  const el = args.scrollElement as HTMLDivElement;
  if (!el) return;

  // меняем курсор и классы
  cursorClassChange(args.clickedObject.current, args.target, el, "end", rt);

  // логика для слайдера
  if (args.mode === "slider" && args.clickedObject.current !== "thumb") {
    const acc = rt.checkSliderThumbSize; // размеры передвижения

    const runScroll = (dir: "x" | "y", deltaDir?: 1 | -1) => {
      const isX = dir === "x";

      const maxTopOrLeft = isX ? args.maxScrollSize[0] : args.maxScrollSize[1];
      const position = el[isX ? "scrollLeft" : "scrollTop"];
      const gapPerDir = isX ? args.gap[0] : args.gap[1];
      const clientSize = el[isX ? "clientWidth" : "clientHeight"];
      const period = args.loopPeriods?.[isX ? 0 : 1] ?? 0;

      const step = loopPages(period, clientSize, gapPerDir).step;

      /*
       * В круге страницы отсчитываются от начала оборота, а не от начала
       * ленты: лента начинается там, где пришлось, и её сетка страниц с
       * оборотом не совпадает — снап уводил бы в середину страницы.
       */
      const from = position - period;

      const currentPage = loopPageAt(from, step, deltaDir ?? 0);
      const nextValue =
        period + Math.round((currentPage + (deltaDir ?? 0)) * step);

      /*
       * За границы не выезжаем — но в круге границ нет: там страница за
       * средней копией такая же настоящая, и позицию потом довернёт перенос.
       */
      if (period || (nextValue <= maxTopOrLeft && nextValue >= 0))
        args.smoothScroll(nextValue, dir, args.duration);
    };

    const resolveScroll = (dir: "x" | "y", value: number) => {
      // запас 20px для перелистывания
      if (Math.abs(value) > 20) runScroll(dir, value > 0 ? 1 : -1);
      else runScroll(dir); // возвращает назад
    };

    if (acc.x === 0 && acc.y === 0) {
      if (args.direction === "hybrid")
        (["x", "y"] as const).forEach((dir) => resolveScroll(dir, acc[dir]));
      else resolveScroll(args.direction, acc[args.direction]);
    } else
      (Object.entries(acc) as ["x" | "y", number][]).forEach(([dir, value]) => {
        if (value !== 0) resolveScroll(dir, value);
      });
  }

  // --- inertia scroll for touch ---
  if (
    args.isTouched &&
    args.mode === "scroll" &&
    args.clickedObject.current !== "slider"
  ) {
    const inertLogic = (axis: "x" | "y") => {
      // умножаем velocity на thumbRatio для правильного передвижение по thumb
      const vel = rt.velocity[axis] * args.thumbRatio;
      const dist = axis === "x" ? rt.velocity.distX : rt.velocity.distY;

      const now = performance.now();
      const dtFromLastMove = now - rt.velocity.t; // убираем скроллинг при резком отпускании пальца

      if (
        dtFromLastMove < CONST.INERTIA_RELEASE_TIMEOUT &&
        Math.abs(vel) > CONST.MIN_VELOCITY &&
        dist > CONST.MIN_DISTANCE
      ) {
        startInertiaScroll({
          el,
          axis,
          velocity: args.clickedObject.current === "thumb" ? vel : -vel,
          rafSchedule: args.rafScrollAnim.schedule,
        });
      }
    };

    if (args.direction === "hybrid") {
      if (args.clickedObject.current === "wrapp") {
        (["x", "y"] as const).forEach((el) => inertLogic(el));
      } else {
        inertLogic(args.axisFromAtr!);
      }
    } else {
      inertLogic(args.axisFromAtr ? args.axisFromAtr : args.direction!);
    }
  }

  // - сбрасываем -
  const backAnim = (axis: "x" | "y") =>
    overscrollBackAnim(
      rt.overscrollLoop,
      args.overscrollRef,
      axis,
      args.triggerUpdate,
    );

  if (args.overscrollRef.current.x !== 0) backAnim("x");
  if (args.overscrollRef.current.y !== 0) backAnim("y");

  args.clickedObject.current = null;
  rt.resetGesture();

  // обновляем
  return args.triggerUpdate();
}

export default handleMouseOrTouch;
