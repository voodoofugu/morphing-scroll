import { MorphScrollT } from "../types/types";
import { ScrollStateRefT } from "./handleWheel";

import { mouseOnEl } from "./mouseOn";
import startInertiaScroll from "./startInertiaScroll";
import { clampValue } from "./addFunctions";
import { cancelTask } from "./taskManager";

import CONST from "../constants";

type ClickedT = "thumb" | "slider" | "wrapp" | null;

let checkMove = 0;
let checkSliderThumbSize = {
  x: 0,
  y: 0,
};
let abortController: AbortController | undefined;
let velocity = {
  x: 0,
  y: 0,
  t: 0,
  distX: 0, // дистанция для границы запуска конца touch анимации
  distY: 0,
};

type HandleMouseT = {
  scrollElementRef: HTMLDivElement | null;
  objectsWrapperRef: HTMLDivElement | null;
  target: HTMLElement | null;
  clickedObject: React.MutableRefObject<ClickedT>;
  scrollContentRef: HTMLDivElement | null;
  type: MorphScrollT["type"];
  direction: MorphScrollT["direction"];
  scrollStateRef: ScrollStateRefT;
  sizeLocal: number[];
  smoothScroll: (
    targetScrollTop: number | null,
    direction: "y" | "x",
    duration: number,
    callback?: () => void,
  ) => Promise<string | null | undefined> | null;
  triggerUpdate: () => void;
  prevCoordsRef: React.MutableRefObject<{
    x: number;
    y: number;
    leftover: number;
  } | null>;
  thumbSize: number;
  axisFromAtr: "x" | "y" | null;
  duration: number;
  scrollBarEdge: number[];
  rafID: React.MutableRefObject<{
    x: number;
    y: number;
  }>;
  isTouched: boolean;
  pointerId: number;
};

type HandleMoveT = Omit<
  HandleMouseT,
  "controller" | "scrollBarOnHover" | "scrollContentRef" | "mouseOnRefHandle"
> & {
  event: PointerEvent;
  fullMargin: number[];
  scrollElementWH: number[];
  objectsWrapperWH: number[];
  wrapElWH: number[];
  visualDiff: number[];
  thumbRatio: number;
  sliderElSize?: number[];
};

type HandleUpT = Omit<HandleMouseT, "scrollStateRef" | "sizeLocal"> & {
  event: PointerEvent;
  thumbRatio: number;
};

function getVisualToLayoutScale(el: HTMLElement) {
  const rect = el.getBoundingClientRect();
  return [rect.width / el.clientWidth, rect.height / el.clientHeight];
}

const cursorClassChange = (
  clicked: ClickedT,
  target: HTMLElement | null,
  scrollElementRef: HTMLDivElement | null,
  mode: "start" | "end" = "start",
) => {
  if (!clicked) return;

  if (["thumb", "slider"].includes(clicked)) {
    // уточняем кликнутый объект для slider
    if (clicked === "slider") {
      mouseOnEl(target?.closest(".ms-slider") as HTMLDivElement | null, mode);
    } else mouseOnEl(target, mode);
  } else if (clicked === "wrapp") {
    mouseOnEl(scrollElementRef, mode);
  }
};

const applyThumb = (
  axis: "x" | "y",
  args: HandleMoveT,
  move: number,
  prev: { leftover: number },
  thumbRatio: number,
) => {
  if (!args.scrollElementRef || !args.objectsWrapperRef) return;

  const scrollEl = args.scrollElementRef;
  const fullDelta = move * thumbRatio + prev.leftover;
  const intDelta = Math.trunc(fullDelta);

  if (args.prevCoordsRef.current) {
    args.prevCoordsRef.current.leftover = fullDelta - intDelta;
  }

  if (axis === "x") {
    const prevTarget =
      typeof args.scrollStateRef.targetScrollX === "number"
        ? args.scrollStateRef.targetScrollX
        : scrollEl.scrollLeft;

    const maxScroll = scrollEl.scrollWidth - scrollEl.clientWidth;
    args.scrollStateRef.targetScrollX = clampValue(
      prevTarget + intDelta,
      0,
      maxScroll,
    );
  } else {
    const prevTarget =
      typeof args.scrollStateRef.targetScrollY === "number"
        ? args.scrollStateRef.targetScrollY
        : scrollEl.scrollTop;

    const maxScroll = scrollEl.scrollHeight - scrollEl.clientHeight;

    args.scrollStateRef.targetScrollY = clampValue(
      prevTarget + intDelta,
      0,
      maxScroll,
    );
  }

  // для перетягивания
  if (scrollEl.scrollLeft !== args.scrollStateRef.targetScrollX) {
    scrollEl.scrollLeft = args.scrollStateRef.targetScrollX;
  }
  if (scrollEl.scrollTop !== args.scrollStateRef.targetScrollY) {
    scrollEl.scrollTop = args.scrollStateRef.targetScrollY;
  }
};

const motionHandler = (
  axis: "x" | "y",
  thumbRatio: number,
  visualDiff: number[],
  args: HandleMoveT,
) => {
  const el = args.scrollElementRef as HTMLDivElement;
  if (!el) return;

  // --- получение координат ---
  const point = { x: args.event.clientX, y: args.event.clientY };
  if (!point) return;

  // --- инициализация предыдущей точки ---
  if (!args.prevCoordsRef.current) {
    args.prevCoordsRef.current = {
      x: point.x,
      y: point.y,
      leftover: 0,
    };
    return;
  }

  const prev = args.prevCoordsRef.current;

  const delta = {
    x: point.x - prev.x,
    y: point.y - prev.y,
  };

  // если checkMove больше 5px (запас), то считаем, что это scroll, и захватываем указатель
  if (!el.hasPointerCapture(args.pointerId) && Math.abs(checkMove) > 5) {
    el.setPointerCapture(args.pointerId);
  } else if (Math.abs(checkMove) < 6) checkMove += delta[axis];

  // логика для плавного скроллинга пальцем
  if (args.isTouched) {
    const now = performance.now();

    if (!velocity.t) {
      velocity.t = now;
    } else {
      const dt = Math.max(now - velocity.t, 8);

      velocity = {
        x: velocity.x * 0.8 + (delta.x / dt) * 0.2,
        y: velocity.y * 0.8 + (delta.y / dt) * 0.2,
        t: now,
        distX: (velocity.distX ?? 0) + Math.abs(delta.x),
        distY: (velocity.distY ?? 0) + Math.abs(delta.y),
      };
    }
  }

  const move =
    args.clickedObject.current === "wrapp" ? -delta[axis] : delta[axis];

  const topOrLeft = axis === "y" ? "scrollTop" : "scrollLeft";
  const wh = axis === "x" ? 0 : 1;
  // обновление предыдущих координат, важно делать заранее
  if (args.type === "slider") checkSliderThumbSize[axis] += move;

  // --- логика для thumb ---
  if (args.clickedObject.current === "thumb" && args.type !== "slider") {
    applyThumb(axis, args, move, prev, thumbRatio);
    return;
  }

  // --- логика для wrapp ---
  if (args.clickedObject.current === "wrapp") {
    const diff = visualDiff[wh];

    if (!Number.isFinite(diff) || diff === 0) {
      // важно: сбрасываем состояние, иначе жест «залипнет»
      args.prevCoordsRef.current = null;
      return;
    }

    el[topOrLeft] += move / diff;
    return;
  }

  //  --- логика для slider ---
  const scroll = el[topOrLeft];

  // проверка если checkSliderThumbSize меньше размера элемента thumb слайдера
  if (
    args.sliderElSize &&
    Math.abs(checkSliderThumbSize[axis]) <
      args.sliderElSize[axis === "x" ? 0 : 1]
  )
    return;

  const nextScroll =
    move > 0 && scroll + args.sizeLocal[wh] < args.wrapElWH[wh]
      ? scroll + args.sizeLocal[wh]
      : move < 0 && scroll > 0
        ? scroll - args.sizeLocal[wh]
        : null;

  checkSliderThumbSize[axis] = 0; // обязательно сбрасываем

  // быстрое движение для слайдера по thumb длящееся 10мс
  args.smoothScroll(nextScroll, axis, 10);
};

function handleMouseOrTouch(args: HandleMouseT) {
  // удаляем RAF и задачу слайдера
  (["x", "y"] as const).forEach((axis) => {
    const id = args.rafID.current[axis];
    if (id) {
      cancelAnimationFrame(id);
      args.rafID.current[axis] = 0;
    }
    // cancelTask(`smoothScrollBlock${axis}`);
  });

  // обновление targetScroll заранее
  const el = args.scrollElementRef;
  if (!el) return;

  args.scrollStateRef.targetScrollX = el.scrollLeft;
  args.scrollStateRef.targetScrollY = el.scrollTop;

  // reset inertia state for new gesture
  velocity = {
    x: 0,
    y: 0,
    t: 0,
    distX: 0,
    distY: 0,
  };

  // получение некоторых данных заранее при клике
  let fullMargin: number[] = [],
    scrollElementWH: number[] = [],
    objectsWrapperWH: number[] = [],
    wrapElWH: number[] = [],
    visualDiff: number[] = [];

  if (args.clickedObject.current === "thumb") {
    const styles = getComputedStyle(args.objectsWrapperRef!);
    const getMrg = (dir: "x" | "y") => {
      const toNum = (value: string) => parseFloat(value);
      if (dir === "x")
        return toNum(styles.marginLeft) + toNum(styles.marginRight);
      else return toNum(styles.marginTop) + toNum(styles.marginBottom);
    };

    fullMargin = [getMrg("x"), getMrg("y")];
    scrollElementWH = [el.clientWidth, el.clientHeight];

    objectsWrapperWH = [
      args.objectsWrapperRef!.clientWidth,
      args.objectsWrapperRef!.clientHeight,
    ];
  }
  if (args.type === "slider") {
    wrapElWH = [
      args.objectsWrapperRef!.clientWidth,
      args.objectsWrapperRef!.clientHeight,
    ];
  }

  if (["scroll", "slider"].includes(args.type!))
    visualDiff = getVisualToLayoutScale(el);
  // --------------------------------------------

  // получаем thumbRatio
  let thumbRatio = 1;
  if (args.clickedObject.current === "thumb" && args.axisFromAtr) {
    const wh = args.axisFromAtr === "x" ? 0 : 1;
    const maxThumbPos =
      (scrollElementWH[wh] - args.scrollBarEdge[wh] - args.thumbSize) *
      visualDiff[wh];
    const objectsWrapperSize = objectsWrapperWH[wh] + fullMargin[wh]; // не забываем прибавить margin
    const scrollableSize = objectsWrapperSize - scrollElementWH[wh];
    thumbRatio = scrollableSize / maxThumbPos;
    // защита
    if (!Number.isFinite(thumbRatio) || thumbRatio <= 0) {
      thumbRatio = 1;
    }
  }

  const onMove = (e: PointerEvent) => {
    // вычисления заранее для sliderThumb
    let sliderElSize: number[] | undefined;
    if (args.clickedObject.current === "thumb" && args.type === "slider") {
      const getRectSize = (axis: "x" | "y") => {
        const rect = args.scrollContentRef
          ?.querySelector(".ms-slider-element.active")
          ?.getBoundingClientRect();
        if (!rect) return 1;
        return axis === "x" ? rect.width : rect.height;
      };

      sliderElSize = [getRectSize("x"), getRectSize("y")];
    }

    handleMove({
      ...args,
      event: e,
      fullMargin,
      scrollElementWH,
      objectsWrapperWH,
      wrapElWH,
      visualDiff,
      thumbRatio,
      sliderElSize,
    });
  };

  // меняем курсор и классы
  cursorClassChange(args.clickedObject.current, args.target, el);

  // слушатели для движения и отжатия
  abortController?.abort(); // отменяем предыдущие слушатели
  const controller = new AbortController();
  abortController = controller;
  const { signal } = controller;

  document.addEventListener(
    "pointermove",
    (e) => {
      if (e.pointerId !== args.pointerId) return;
      onMove(e);
    },
    { signal },
  );

  const endHandler = (e: PointerEvent) => {
    if (e.pointerId !== args.pointerId) return; // убираем лишние события
    el.releasePointerCapture(args.pointerId);

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
    } else {
      args.axisFromAtr &&
        motionHandler(args.axisFromAtr, args.thumbRatio, args.visualDiff, args);
    }
  } else {
    motionHandler(
      args.axisFromAtr ? args.axisFromAtr : dir,
      args.thumbRatio,
      args.visualDiff,
      args,
    );
  }

  // единое обновление prevCoordsRef
  const point = { x: args.event.clientX, y: args.event.clientY };
  if (args.prevCoordsRef.current) {
    args.prevCoordsRef.current = {
      x: point.x,
      y: point.y,
      leftover: args.prevCoordsRef.current.leftover,
    };
  }
}

function handleUp(args: HandleUpT) {
  if (args.pointerId !== args.pointerId) return; // убирает все лишние события типа click (клики по контенту)
  abortController?.abort(); // удаляем слушатели

  const el = args.scrollElementRef as HTMLDivElement;
  if (!el) return;

  // меняем курсор и классы
  cursorClassChange(args.clickedObject.current, args.target, el, "end");

  // логика для слайдера
  if (args.type === "slider") {
    const acc = checkSliderThumbSize;

    // TODO
    // if (acc.x === 0 && acc.y === 0) {
    //   ["x", "y"].forEach((dir) => {
    //     const heightOrWidth = dir === "y" ? el.clientHeight : el.clientWidth;
    //     const getNextScroll = (math: "ceil" | "floor") => {
    //       return (
    //         heightOrWidth *
    //         Math[math](
    //           el[dir === "y" ? "scrollTop" : "scrollLeft"] / heightOrWidth,
    //         )
    //       );
    //     };

    //     // console.log('getNextScroll("ceil")', getNextScroll("ceil"));
    //     args.smoothScroll(
    //       getNextScroll("ceil"),
    //       dir as "x" | "y",
    //       args.duration,
    //     );
    //   });
    // } else
    // проходимся по разным осям
    for (const [dir, value] of Object.entries(acc)) {
      // убираем запуск для двух осей если нужна одна
      if (value !== 0) {
        const heightOrWidth = dir === "y" ? el.clientHeight : el.clientWidth;
        const getNextScroll = (math: "ceil" | "floor") => {
          return (
            heightOrWidth *
            Math[math](
              el[dir === "y" ? "scrollTop" : "scrollLeft"] / heightOrWidth,
            )
          );
        };

        // запас 20px для перелистывания
        if (Math.abs(value) > 20)
          args.smoothScroll(
            getNextScroll(value > 0 ? "ceil" : "floor"),
            dir as "x" | "y",
            args.duration,
          );
        // возврат если < 20
        else
          args.smoothScroll(
            getNextScroll(value > 0 ? "floor" : "ceil"),
            dir as "x" | "y",
            args.duration,
          );
      }
    }
  }

  // --- inertia scroll for touch ---
  if (
    args.isTouched &&
    args.type === "scroll" &&
    args.clickedObject.current !== "slider"
  ) {
    const inertLogic = (axis: "x" | "y") => {
      // умножаем velocity на thumbRatio для правильного передвижение по thumb
      const vel = velocity[axis] * args.thumbRatio;
      const dist = axis === "x" ? velocity.distX : velocity.distY;

      const now = performance.now();
      const dtFromLastMove = now - velocity.t; // убираем скроллинг при резком отпускании пальца

      if (
        dtFromLastMove < CONST.INERTIA_RELEASE_TIMEOUT &&
        Math.abs(vel) > CONST.MIN_VELOCITY &&
        dist > CONST.MIN_DISTANCE
      ) {
        startInertiaScroll({
          el,
          axis,
          velocity:
            (args.clickedObject.current === "thumb" ? vel : -vel) *
            CONST.INERTIA_FRAME_SCALE, // переводим в px/frame
          rafID: args.rafID,
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

  // сбрасываем
  el.releasePointerCapture(args.pointerId);
  args.prevCoordsRef.current = null;
  args.clickedObject.current = null;
  velocity = {
    x: 0,
    y: 0,
    t: 0,
    distX: 0,
    distY: 0,
  };
  checkMove = 0;
  checkSliderThumbSize = {
    x: 0,
    y: 0,
  };
  // обновляем
  args.triggerUpdate();
}

export default handleMouseOrTouch;
