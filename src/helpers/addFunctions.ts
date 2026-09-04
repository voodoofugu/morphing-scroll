import React from "react";

import { MorphScroll, Vec2, WrapperConfig } from "../types/types";
import clampValue from "./clampValue";
import CONST from "../constants";
import type { Tasks } from "./createTasks";

function objectsPerSize(availableSize: number, objectSize: number): number {
  /*
   * Пока размер окна не измерен, он ноль — а делить на ноль значит получить
   * бесконечность и попытаться отрисовать бесконечный список точек слайдера.
   * До первого измерения страница ровно одна.
   */
  if (!(objectSize > 0) || availableSize <= objectSize) return 1;

  const objects = Math.floor(availableSize / objectSize);

  return Number.isFinite(objects) ? objects : 1;
}

/*
 * Ждём, пока контент сможет удержать запрошенную позицию, что бы стартовая
 * цель не применилась в пустоту.
 *
 * Измеряемые размеры приезжают ступенями — сначала объект, потом обёртка, — и
 * диапазон прокрутки растёт несколько кадров. Цель 600 при доступных пока 100
 * встанет на 100 и там и останется. Ждём до того, как цель поместится; ровный
 * диапазон на нескольких кадрах подряд значит, что расти он перестал и ждать
 * больше нечего. Предел кадров обязателен: `maxScrollSize` считается по
 * пропсам, а прокручиваемость — по DOM, и они могут разойтись (CSS ужал
 * контент, размеры заданы неверно). Без предела это был бы вечный rAF.
 */
async function checkScrollReady(el: Element, isY: boolean, target: number) {
  let previous = -1;
  let still = 0;

  for (let frame = 0; frame < CONST.SCROLL_READY_MAX_FRAMES; frame++) {
    const max = isY
      ? el.scrollHeight - el.clientHeight
      : el.scrollWidth - el.clientWidth;

    if (max > 0 && max >= target) return;

    still = max === previous ? still + 1 : 0;
    if (max > 0 && still >= CONST.SCROLL_READY_STILL_FRAMES) return;

    previous = max;
    await new Promise((r) => requestAnimationFrame(r));
  }
}

/*
 * Куда едет анимация каждой оси — по элементу, а значит по инстансу. Нужно,
 * что бы отличить повторный запрос той же цели от новой, а `alive` гасит
 * кадры прошлой анимации: снятая задача их уже не остановит.
 */
type Aim = { target: number; alive: boolean };
const aimedAt = new WeakMap<Element, { x: Aim | null; y: Aim | null }>();

const aimsOf = (el: Element) => {
  let aims = aimedAt.get(el);
  if (!aims) aimedAt.set(el, (aims = { x: null, y: null }));

  return aims;
};

/*
 * Куда прокрутка едет прямо сейчас, или `null`, если никуда не едет.
 *
 * Нужна тому, кто считает следующий шаг: во время перелёта позиция лежит
 * между страницами, и второе нажатие стрелки, посчитанное по ней, целилось бы
 * туда же, куда первое — быстрая серия нажатий перелистывала бы одну страницу.
 */
const aimOf = (el: Element, direction: "x" | "y") =>
  aimedAt.get(el)?.[direction]?.target ?? null;

async function smoothScroll(
  direction: "x" | "y",
  scrollEl: Element,
  duration: number | null,
  targetScroll: number,
  rafScrollAnim: (kay: string, fn: () => void) => void,
  maxScrollSize: Vec2,
  tasks: Tasks,
) {
  const isY = direction === "y";

  const topOrLeft = isY ? "scrollTop" : "scrollLeft";
  const maxScroll = isY ? maxScrollSize[1] : maxScrollSize[0];

  /*
   * Первый рендер ставит позицию сразу, без анимации: ехать ещё неоткуда.
   *
   * Проверка «мы уже на месте» стоять выше не может — пока размеры не
   * измерены, `maxScrollSize` равен нулю, любая цель обрезается в ноль, и
   * выходит, что двигаться некуда. Обрезать тут и незачем: лишнее уберёт сам
   * браузер, по настоящему диапазону, а не по посчитанному заранее.
   */
  if (duration === null) {
    await checkScrollReady(scrollEl, isY, targetScroll);
    scrollEl[topOrLeft] = targetScroll;

    return;
  }

  const clampedTargetScroll = clampValue(targetScroll, 0, maxScroll);
  const startScroll = clampValue(scrollEl[topOrLeft], 0, maxScroll);

  if (startScroll === clampedTargetScroll) return;

  const lockKey = `smoothScrollBlock${direction}`;

  /*
   * Очередь кадров держит по одной работе на ключ, а ключ был общим на обе
   * оси: при `hybrid` анимация одной оси затирала другую — из двух запросов
   * доезжал только последний.
   */
  const rafKey = `smoothScroll${direction}`;

  const aims = aimsOf(scrollEl);

  const drop = () => {
    if (aims[direction]) aims[direction]!.alive = false;
    aims[direction] = null;
    tasks.cancelTask(lockKey);
  };

  /*
   * Ноль — это не анимация в ноль секунд, а «поставь сюда сейчас». Стик
   * геймпада шлёт такой сдвиг каждый кадр, и лишний кадр задержки на каждом
   * из них превращал движение в дёрганье на месте.
   */
  if (duration <= 0) {
    drop();
    scrollEl[topOrLeft] = clampedTargetScroll;

    return;
  }

  /*
   * Замок бережёт анимацию от рестарта на каждом кадре, но цель умеет уезжать
   * из-под неё: в чате дорастал контент, пока мы ехали к прежнему концу, и
   * запрос нового конца просто терялся — прокрутка замирала на старом.
   * Та же цель по-прежнему игнорируется, новая — перенацеливает.
   */
  if (tasks.hasTask(lockKey)) {
    if (aims[direction]?.target === clampedTargetScroll) return;

    drop();
  }

  const aim: Aim = { target: clampedTargetScroll, alive: true };
  aims[direction] = aim;

  tasks.setLockTask(
    () => {
      const startTime = performance.now();

      const animate = () => {
        if (!aim.alive) return; // цель сменилась — этот кадр уже не наш

        const currentTime = performance.now();
        const timeElapsed = currentTime - startTime;
        const progress = Math.min(timeElapsed / duration, 1);

        const nextScroll = clampValue(
          startScroll + (clampedTargetScroll - startScroll) * progress,
          0,
          maxScroll,
        );

        scrollEl[topOrLeft] = nextScroll;

        if (progress < 1 && nextScroll !== clampedTargetScroll)
          rafScrollAnim(rafKey, animate);
      };

      rafScrollAnim(rafKey, animate); // запускаем и обязательно в rafScrollAnim иначе timeElapsed будет 0
    },
    duration,
    lockKey,
  );
}

const sliderCache = new WeakMap<
  HTMLElement,
  { elements: Element[]; lastIndex: number }
>();

const sliderCheck = (
  scrollEl: HTMLDivElement,
  scrollBars: Set<HTMLElement>,
  direction: Exclude<MorphScroll["direction"], undefined>,
  objLengthPerSize: number[],
  /* периоды круга по осям: позиция считается внутри оборота, а не по ленте */
  loopPeriods: [number, number] = [0, 0],
) => {
  [...scrollBars].forEach((msSlider, i) => {
    let cache = sliderCache.get(msSlider);
    const dir = i === 0 ? direction : "x";
    const axisIndex = dir === "x" ? 0 : 1;

    // Обновляем кэш только если изменилось количество элементов
    if (!cache || cache.elements.length !== objLengthPerSize[axisIndex]) {
      const elements = Array.from(
        msSlider.querySelectorAll(".ms-slider-item"),
      );

      cache = { elements, lastIndex: -1 };
      sliderCache.set(msSlider, cache);
    }

    if (!cache.elements.length) return;

    const at = dir === "x" ? scrollEl.scrollLeft : scrollEl.scrollTop;
    const visibleSize =
      dir === "x" ? scrollEl.clientWidth : scrollEl.clientHeight;
    const half = visibleSize / 2;

    /*
     * В круге позиция живёт в средней копии, а страница нужна та, что внутри
     * оборота: вычитаем период. Последняя половина страницы при этом смотрит
     * уже на первую — оборот замкнулся, — поэтому индекс берём по кольцу.
     */
    const period = loopPeriods[axisIndex];
    const onLoop = period > 0;
    const scrollPosition = onLoop ? at - period : at;

    // вычисляем индекс страницы
    const raw = Math.floor((scrollPosition + half) / visibleSize);
    const activeIndex = onLoop
      ? ((raw % cache.elements.length) + cache.elements.length) %
        cache.elements.length
      : raw;

    if (activeIndex === cache.lastIndex) return;

    if (cache.lastIndex !== -1)
      cache.elements[cache.lastIndex]?.classList.remove("ms-active");
    cache.elements[activeIndex]?.classList.add("ms-active");

    cache.lastIndex = activeIndex;
  });
};

function getWrapperMinSizeStyle(
  wrapperMinSize: NonNullable<WrapperConfig["minSize"]>,
  direction: Exclude<MorphScroll["direction"], undefined>,
  sizeLocal: number[],
  mLocalX: number,
  mLocalY: number,
): React.CSSProperties {
  const resolveSize = (value: number | "full", axis: "x" | "y"): number =>
    value === "full"
      ? (axis === "x" ? sizeLocal[0] : sizeLocal[1]) -
        (axis === "x" ? mLocalX : mLocalY)
      : value;

  if (direction !== "hybrid" && !Array.isArray(wrapperMinSize)) {
    const minSize = `${resolveSize(wrapperMinSize, direction)}px`;
    return direction === "x" ? { minWidth: minSize } : { minHeight: minSize };
  }

  // direction is hybrid
  let x: number | "full", y: number | "full";

  if (Array.isArray(wrapperMinSize)) {
    [x, y] = wrapperMinSize;
  } else {
    x = y = wrapperMinSize;
  }

  const minWidth = `${resolveSize(x, "x")}px`;
  const minHeight = `${resolveSize(y, "y")}px`;

  return { minWidth, minHeight };
}

const getStyleAlign = (algin: "start" | "center" | "end" | undefined) =>
  algin
    ? algin === "start"
      ? "flex-start"
      : algin === "center"
        ? "center"
        : "flex-end"
    : undefined;

function getWrapperAlignStyle(
  wrapperAlign: NonNullable<WrapperConfig["align"]>,
  sizeLocal: number[],
  objectsWrapperWidthFull: number,
  objectsWrapperHeightFull: number,
): React.CSSProperties {
  const [alignX, alignY = "start"] =
    typeof wrapperAlign === "string"
      ? [wrapperAlign, wrapperAlign]
      : wrapperAlign;

  const alignStyles: React.CSSProperties = { display: "flex" };

  // ряд по умолчанию: главная ось — горизонталь, поперечная — вертикаль
  if (sizeLocal[0] > objectsWrapperWidthFull)
    alignStyles.justifyContent = getStyleAlign(alignX);

  if (sizeLocal[1] > objectsWrapperHeightFull) {
    alignStyles.alignItems = getStyleAlign(alignY);
  }

  return alignStyles;
}

function createResizeHandler(
  dataRef: React.MutableRefObject<{ width: number; height: number }>,
  triggerUpdate: () => void,
  offsetX = 0,
  offsetY = 0,
) {
  return (rect: Partial<DOMRectReadOnly>) => {
    const newSize = {
      width: (rect.width ?? 0) - offsetX,
      height: (rect.height ?? 0) - offsetY,
    };

    /*
     * 0×0 приходит, когда элемент скрыт (display: none) — размер не потерян,
     * его просто сейчас не измерить. Держим последний известный: иначе всё
     * дерево пересчитается по нулям и моргнёт при возврате.
     *
     * Раньше тут был флаг firstZero, объявленный внутри самого обработчика,
     * то есть сбрасывавшийся на каждый вызов. Имя обещало «пропустить только
     * первый ноль», код всегда пропускал любой.
     */
    if (newSize.width === 0 && newSize.height === 0) return;

    if (
      dataRef.current?.width === newSize.width &&
      dataRef.current?.height === newSize.height
    )
      return;

    dataRef.current = newSize;
    triggerUpdate();
  };
}

const isTouchDevice = () => {
  return typeof window !== "undefined"
    ? (window.matchMedia?.("(pointer: coarse)").matches ?? false)
    : false;
};

export {
  objectsPerSize,
  smoothScroll,
  aimOf,
  sliderCheck,
  getWrapperMinSizeStyle,
  getWrapperAlignStyle,
  createResizeHandler,
  getStyleAlign,
  isTouchDevice,
};
