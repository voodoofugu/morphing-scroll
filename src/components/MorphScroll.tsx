import React from "react";

import type {
  BarConfig,
  MorphScroll as MorphScrollProps,
  MorphScrollHandle,
  NavigateReason,
  ControlsConfig,
  Vec2,
  Pair,
} from "../types/types";
import argsFormatter from "../helpers/argsFormatter";
import resolveScrollTarget from "../helpers/resolveScrollTarget";
import createTasks from "../helpers/createTasks";
import createPointerRuntime from "../helpers/createPointerRuntime";

import useIdent from "../hooks/useIdent";
import useUpdate from "../hooks/useUpdate";
import useConst from "../hooks/useConst";

import ResizeTracker from "./ResizeTracker";
import ScrollBar from "./ScrollBar";
import Edge from "./Edge";
import Arrow from "./Arrow";

import handleWheel, { ScrollStateRefT } from "../helpers/handleWheel";
import focusStep from "../helpers/focusStep";
import handleMouseOrTouch, {
  hasOwnDrag,
} from "../helpers/handleMouseOrTouch";
import {
  objectsPerSize,
  smoothScroll,
  sliderCheck,
  getWrapperMinSizeStyle,
  getWrapperAlignStyle,
  createResizeHandler,
  getStyleAlign,
  isTouchDevice,
  shiftAim,
} from "../helpers/addFunctions";
import handleArrow, { handleArrowT } from "../helpers/handleArrow";
import createSizeStore from "../helpers/createSizeStore";
import packObjects from "../helpers/packObjects";
import { loopCopies, loopShift, loopPages } from "../helpers/loopWindow";
import type { PackLayout } from "../helpers/packObjects";
import {
  updateLoadedElementsKeys,
  updateEmptyKeysClick,
} from "../helpers/updateKeys";
import {
  calculateThumbSize,
  calculateThumbSpace,
} from "../helpers/calculateThumbSize";
import { hoverHandler, removeHover, addHover } from "../helpers/mouseOn";

import createSchedulerRAF from "../helpers/createSchedulerRAF";
import filterValidChildren from "../helpers/filterValidChildren";
import childKey, { groupKey } from "../helpers/childKey";
import pageAt from "../helpers/pageAt";
import stabilize from "../helpers/stabilize";
import {
  getRenderedKeysFromWrapper,
  areKeysEqual,
} from "../helpers/getRenderedKeysFromWrapper";
import {
  registerContainer,
  unregisterContainer,
} from "../helpers/autoScrollRegistry";

import CONST from "../constants";

/** the side a key points at — the same one the arrow buttons use */
const ARROW_KEYS: Record<string, handleArrowT["arrowType"] | undefined> = {
  ArrowUp: "top",
  ArrowDown: "bottom",
  ArrowLeft: "left",
  ArrowRight: "right",
};

/** inside a text field the arrows move the caret, and must not be taken */
const isTextEntry = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;

  return ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
};

/**---
 * ## ![logo](https://github.com/voodoofugu/morphing-scroll/raw/main/src/assets/morphing-scroll-logo.png)
 * ### ***MorphScroll***:
 * the main component of the library, responsible for displaying your data.
 * ### Props:
 * ##### — GENERAL —
 * - `className`
 * - `children`
 *
 * ##### — SCROLL —
 * - `mode`
 * - `direction`
 * - `initialPosition`
 * - `stickToEnd`
 * - `loop`
 * - `duration`
 * - `ref`
 * - `autoScrollOnDrag`
 *
 * ##### — LAYOUT —
 * - `size` - ***REQUIRED***
 * - `objects`
 * - `wrapper`
 *
 * ##### — PROGRESS —
 * - `controls`
 * - `edge`
 *
 * ##### — OPTIMIZATION —
 * - `render`
 * - `suspending`
 * - `fallback`
 *
 * ##### — EVENTS —
 * - `onScrollPosition`
 * - `onScrollingChange`
 * - `onNavigate`
 * - `onRenderedKeysChange`
 * ### Links:
 * [MorphScroll Documentation](https://www.npmjs.com/package/morphing-scroll)
 */
const MorphScroll = React.forwardRef<MorphScrollHandle, MorphScrollProps>(
  function MorphScroll(
    {
      // General Settings
      className,
      children,

      // Scroll Settings
      mode = "scroll",
      direction = "y",
      initialPosition,
      stickToEnd = false,
      loop = false,
      duration = 200,

      onScrollPosition,
      onScrollingChange,
      onNavigate,
      onRenderedKeysChange,

      // Visual Settings
      size,
      objects,
      wrapper,
      edge,

      // Progress Bar
      controls = { wheel: true },

      // Optimization
      render,
      suspending = false,
      fallback,

      // Additional
      autoScrollOnDrag,
    },
    ref,
  ) {
    // ♦ hooks
    const triggerUpdate = useUpdate();
    /*
     * Всё про сами объекты живёт в одной группе — размер, зазор, сколько их в
     * ряду, выравнивание, направление и что делать с пустыми. Внутри компонента
     * это по-прежнему отдельные значения.
     */
    const {
      layout: objectsLayout,
      size: objectsSize,
      gap,
      lines,
      semantics: objectsSemantics,
      groups: objectsGroups,
      align: objectsAlign,
      order: objectsOrder = "row",
      empty: emptyObjects,
    } = objects ?? {};

    // const id = `${React.useId()}`.replace(/^(.{2})(.*).$/, "$2");
    const id = useIdent();

    // ♦ helpers
    /*
     * Рантайм инстанса. Планировщики раньше создавались прямо в теле рендера,
     * то есть заново на каждый рендер: дедупликация по ключу переставала
     * работать между рендерами, а cleanup гасил только последний экземпляр —
     * анимации прошлых рендеров продолжали писать в scrollTop параллельно
     * новым. useConst создаёт их один раз на инстанс.
     */
    const raf = useConst(createSchedulerRAF);
    const rafScrollAnim = useConst(createSchedulerRAF);
    const tasks = useConst(createTasks);
    const pointerRuntime = useConst(createPointerRuntime);

    const triggerRAF = () => raf.schedule("triggerUpdate", triggerUpdate); // по-кадрово оптимизированный triggerUpdate

    // ♦ errors
    const errorTextEnd = `\n  morph-scroll ${id}`;
    const errorText = (propName: string) =>
      `prop "${propName}" is not provided${errorTextEnd}`;

    if (!size) throw new Error(errorText("size"));

    /*
     * Жалуемся один раз на сообщение, а не один раз на рендер.
     *
     * Рендер здесь идёт по кадру во время прокрутки, так что неверная пара
     * пропсов заливала консоль со скоростью шестьдесят сообщений в секунду —
     * и то самое сообщение, ради которого всё это, тонуло в собственных
     * копиях. Ключом служит текст: он и описывает случай.
     */
    const complained = React.useRef<Set<string>>(new Set());

    const complain = (message: string) => {
      if (complained.current.has(message)) return;

      complained.current.add(message);
      console.error(`${message}${errorTextEnd}`);
    };

    /*
     * Круг водит окно подменой позиции, а конца у него нет — значит и ехать к
     * концу некуда.
     */
    if (loop) {
      /*
       * Свой бегунок браузер рисует по настоящей прокрутке, а настоящая
       * прокрутка в круге — это лента из копий. Показать оборот он не может, и
       * переписать его нам нечем: бегунок выходит в треть ленты, а на каждом
       * переносе прыгает под пальцем. Отговариваем, но не запрещаем.
       */
      const nativeBar =
        !!controls &&
        typeof controls === "object" &&
        !Array.isArray(controls) &&
        (controls as { bar?: unknown }).bar === true;

      if (nativeBar)
        complain(
          `loop and controls.bar: true pull against each other: the browser draws its own bar over the strip, and the strip is a few copies of the content — the thumb comes out a fraction of a turn and jumps under the finger every time the position moves. Pass an element instead and the bar shows the turn`,
        );

      if (stickToEnd)
        complain(
          `loop and stickToEnd pull against each other: one keeps the window in the circle, the other drives it to an end the circle does not have — stickToEnd is ignored here`,
        );
    }

    // ♦ refs
    const customScrollRef = React.useRef<HTMLDivElement | null>(null);
    const scrollContentRef = React.useRef<HTMLDivElement | null>(null);
    const scrollElementRef = React.useRef<HTMLDivElement | null>(null);
    const objectsWrapperRef = React.useRef<HTMLDivElement | null>(null);

    const scrollBarsRef = React.useRef<Set<HTMLElement>>(new Set());

    const isTouchedRef = React.useRef<boolean>(isTouchDevice());
    const firstRender = React.useRef<boolean>(true);
    const clickedObject = React.useRef<"thumb" | "wrapp" | "slider" | null>(
      null,
    );
    // ключи объектов, которые когда либо были загружены
    const objectsKeys = React.useRef<{
      loaded: Set<string>;
      empty: Set<string> | null;
    }>({
      loaded: new Set(),
      empty: new Set(),
    });

    const scrollStateRef = React.useRef<ScrollStateRefT>({
      targetScrollY: 0,
      targetScrollX: 0,
      animating: false,
      animationFrameId: 0,
    });
    const isScrollingRef = React.useRef<boolean>(false);
    const keyDownX = React.useRef<boolean>(false);
    /*
     * Липнет ли скролл к концу. `scrollPosition: "end"` означает «держись
     * низа», но вырывать пользователя из середины истории нельзя — а понять,
     * ушёл ли он оттуда, можно только по положению.
     */
    const atEndRef = React.useRef({ x: true, y: true });
    const lastScrollTargetRef = React.useRef<{
      x: number | null;
      y: number | null;
    }>({
      x: null,
      y: null,
    });
    const overscrollRef = React.useRef({
      x: 0,
      y: 0,
    });
    const isDraggingRef = React.useRef(false);
    const lastRenderedKeysRef = React.useRef<string[] | null>(null);
    const onRenderedKeysChangeRef = React.useRef(onRenderedKeysChange); // для стабилизации функцию

    function useSizeRef() {
      return React.useRef<{ width: number; height: number }>({
        width: 0,
        height: 0,
      });
    }
    const receivedScrollSizeRef = useSizeRef();
    const receivedWrapSizeRef = useSizeRef();
    const receivedChildSizeRef = useSizeRef();

    // ♦ stabilize
    const [
      stickToEndST,
      initialPositionST,
      renderST,
      sizeST,
      objectsSizeST,
      emptyObjectsST,
      wrapperST,
      gapST,
      controlsST,
      objectsKeysEmptyST,
      edgeST,
    ] = stabilize(
      stickToEnd,
      initialPosition,
      render,
      size,
      objectsSize,
      emptyObjects,
      wrapper,
      gap,
      controls,
      objectsKeys.current.empty,
      edge,
    );

    /*
     * Короткая форма приводится к объектной один раз: дальше по компоненту
     * `controlsLocal` всегда объект, и ветвлений на строку/массив нет.
     *
     * Колесо включено, пока его не выключили. `controls` перечисляет, чем
     * скролл двигают, и раньше названный бегунок молча забирал колесо: группа
     * заменяла умолчание целиком, так что `{ bar: <Thumb /> }` — первое, что
     * пишут, — давало скролл, который нечем прокрутить. Отказаться от колеса
     * можно словом: `{ wheel: false }`.
     */
    const controlsLocal = React.useMemo(() => {
      const named =
        typeof controls === "string"
          ? { [controls]: true }
          : Array.isArray(controls)
            ? Object.fromEntries(controls.map((name) => [name, true]))
            : controls;

      /*
       * Клавиши включены наравне с колесом. Окно прокрутки — это остановка
       * табуляции, и нативный скролл, получив фокус, слушается стрелок сам;
       * здесь же до них надо было додуматься, и клавиатурный пользователь
       * доходил до списка, который нечем листать. Отказ по-прежнему словом:
       * `{ keys: false }`.
       */
      return { wheel: true, keys: true, ...named };
    }, [controlsST]) as ControlsConfig;

    /*
     * Пустой объект теперь законен: колесо в нём и так есть. А вот набор, в
     * котором ничем двигать нельзя, — почти наверняка описка.
     */
    if (
      !controlsLocal.wheel &&
      !controlsLocal.drag &&
      !controlsLocal.keys &&
      !controlsLocal.bar &&
      !controlsLocal.arrows
    )
      complain(
        `prop "controls" leaves nothing that can move the scroll: name at least one of wheel, drag, keys, bar, arrows`,
      );

    /*
     * Прилипание задаётся на обе оси разом или на каждую отдельно: при
     * `hybrid` бывает нужно держаться низа, но не правого края.
     */
    const stickLocal = React.useMemo<Pair<boolean>>(() => {
      // у круга конца нет, держаться нечего — сказано выше, здесь исполняем
      if (loop) return [false, false];

      return Array.isArray(stickToEnd)
        ? [!!stickToEnd[0], !!stickToEnd[1]]
        : [!!stickToEnd, !!stickToEnd];
    }, [stickToEndST, loop]);

    // ♦ default
    const initialTarget = React.useMemo(
      () => (initialPosition == null ? null : resolveScrollTarget(initialPosition)),
      [initialPositionST],
    );

    /*
     * Заглушку раньше можно было задать тремя способами — голым узлом,
     * словом "fallback" плюс общий проп, и `mode: { fallback }`, — и разбор
     * этих форм расползался лесенкой тернарников по всему компоненту.
     * Форма теперь одна, разбирается здесь.
     */
    const emptyObjectsLocal = React.useMemo(() => {
      if (!emptyObjects) return null;

      if (typeof emptyObjects === "string")
        return { mode: emptyObjects, fallback: undefined, clickTrigger: undefined };

      return {
        mode: emptyObjects.mode,
        fallback: emptyObjects.fallback,
        clickTrigger: emptyObjects.clickTrigger,
      };
    }, [emptyObjectsST]);

    // ♦ variables
    const defaultSize = 40;

    /*
     * `true` — просто разметить края, узел — отрисовать его внутри каждого,
     * объект — то же самое плюс названная толщина полосы. Форму разбираем
     * здесь, что бы `Edge` получал готовое.
     */
    const edgeLocal = React.useMemo(() => {
      if (React.isValidElement(edge)) return { element: edge, size: undefined };

      if (edge && typeof edge === "object" && !Array.isArray(edge))
        return edge as { element?: React.ReactNode; size?: number };

      return { element: undefined, size: undefined };
    }, [edgeST]);

    /*
     * Всё про бегунок собрано в одном месте — как `arrows`. Наружу отдаём
     * готовые значения, что бы ScrollBar не разбирал форму повторно.
     */
    const barLocal = React.useMemo(() => {
      const bar = controlsLocal.bar;

      const isConfig =
        !!bar &&
        typeof bar === "object" &&
        !Array.isArray(bar) &&
        !React.isValidElement(bar) &&
        !("type" in bar);

      const config = (isConfig ? bar : {}) as BarConfig;
      const element = isConfig
        ? config.element
        : (bar as React.ReactNode | React.ReactNode[]);

      const pair = <T,>(value: T | T[] | undefined, fallback: T): [T, T] => {
        if (Array.isArray(value))
          return [value[0] ?? fallback, value[1] ?? value[0] ?? fallback];

        return [value ?? fallback, value ?? fallback];
      };

      const [gapX, gapY] = pair(config.trackGap, 0);

      return {
        element,
        /** whether there is anything to show at all */
        present: !!bar,
        /** `true` — the browser's own scrollbar does the work */
        native: bar === true,
        edgeGap: pair(config.edgeGap, 0),
        // трек укорачивается с обоих концов, отсюда удвоение
        trackGap: [gapX * 2, gapY * 2] as [number, number],
        reverse: pair(config.reverse, false),
        showOnHover: config.showOnHover ?? false,
        thumbMinSize: config.thumbMinSize ?? 30,
      };
    }, [controlsST]);

    /*
     * По умолчанию клавиша делает то, что в этом режиме вообще имеет смысл:
     * в слайдере листает страницу, в обычном скролле просто подвигает контент.
     */
    const keysLocal = React.useMemo(() => {
      const keys = controlsLocal.keys;
      if (!keys) return null;

      const config = typeof keys === "object" ? keys : {};

      return {
        mode: config.mode ?? (mode === "scroll" ? "pan" : "step"),
        step: config.step ?? 40,
      };
    }, [controlsST, mode]);

    const arrowsLocal = React.useMemo(() => {
      const arrows = controlsLocal.arrows;
      /*
       * Стрелки лежат поверх содержимого, пока не попросили обратного: место
       * под них забирается по просьбе, а не отменяется отказом.
       */
      const base = { size: defaultSize, reserveSpace: false };

      if (React.isValidElement(arrows)) return { ...base, element: arrows };

      if (typeof arrows === "object" && arrows !== null)
        return { ...base, ...arrows };

      return base;
    }, [controlsST]);

    const childrenArray = React.useMemo(
      () =>
        React.Children.toArray(children).flatMap(
          filterValidChildren,
        ) as React.ReactElement[],
      [children],
    );

    const validChildrenKeys = React.useMemo(() => {
      return childrenArray
        .map((child) => {
          if (React.isValidElement(child) && child.key) {
            return childKey(String(child.key));
          }
          return null;
        })
        .filter((key): key is string => key !== null)
        .filter((key) =>
          emptyObjectsLocal?.mode === "clear"
            ? !objectsKeys.current.empty?.has(key)
            : true,
        );
    }, [children, emptyObjectsST, objectsKeysEmptyST]);

    /*
     * Ключи в списке зависимостей: сравнивать надо по содержимому, иначе
     * рендер родителя пересобирал бы раскладку на том же самом списке. Но
     * склейка десяти тысяч ключей стоит около десятой доли миллисекунды, а
     * стояла она в четырёх местах и считалась заново на каждый рендер — то
     * есть по четыре раза на каждый кадр прокрутки. Считаем один раз и там,
     * где список действительно поменялся.
     */
    const keysToken = React.useMemo(
      () => validChildrenKeys.join("|"),
      [validChildrenKeys],
    );

    const [mT, mR, mB, mL] = wrapper?.margin
      ? argsFormatter(wrapper.margin)
      : [0, 0, 0, 0];
    const mLocalY = mT + mB;
    const mLocalX = mL + mR;

    const gapLocal = React.useMemo(() => {
      if (typeof gap === "number") {
        return [gap, gap];
      }
      if (Array.isArray(gap)) {
        return [gap[1] ?? 0, gap[0] ?? 0];
      }
      return [0, 0];
    }, [gap]);

    /*
     * `gapLocal` лежит в порядке CSS: сначала между рядами, потом между
     * колонками. Помощники же считают по осям — первым x, вторым y. Пока
     * зазор один на обе стороны, разница не видна; заданный парой, он уезжал
     * не на ту ось: шаг страницы по x брал вертикальный зазор.
     */
    const gapXY = React.useMemo<Vec2>(
      () => [gapLocal[1], gapLocal[0]],
      [gapLocal[0], gapLocal[1]],
    );

    const renderLocal = React.useMemo(() => {
      const base = {
        mode: undefined as "lazy" | "virtual" | undefined,
        rootMargin: 0 as number | number[],
        deferLoadOnScroll: false,
        trackVisibility: false,
      };

      if (typeof render === "string") {
        return { ...base, mode: render };
      }

      if (typeof render === "object" && render !== null) {
        const {
          mode,
          rootMargin = base.rootMargin,
          deferLoadOnScroll = base.deferLoadOnScroll,
          trackVisibility = base.trackVisibility,
        } = render;
        return { mode, rootMargin, deferLoadOnScroll, trackVisibility };
      }

      return base;
    }, [renderST]);

    const mRootLocal = React.useMemo(() => {
      return argsFormatter(renderLocal.rootMargin);
    }, [renderLocal.rootMargin, direction]);

    const sizeLocal = React.useMemo(() => {
      const [x, y] = Array.isArray(size)
        ? size
        : typeof size === "number"
          ? [size, size]
          : [
              receivedScrollSizeRef.current.width,
              receivedScrollSizeRef.current.height,
            ];

      if (
        !controlsLocal.arrows ||
        !arrowsLocal.size ||
        !arrowsLocal.reserveSpace
      ) {
        return [x, y, x, y];
      }

      const arrowFullSize = arrowsLocal.size * 2;
      let recountX = x;
      let recountY = y;

      if (direction === "x") {
        recountX = x - arrowFullSize;
      } else if (direction === "y") {
        recountY = y - arrowFullSize;
      } else if (direction === "hybrid") {
        recountX = x - arrowFullSize;
        recountY = y - arrowFullSize;
      }

      return [recountX, recountY, x, y]; // [2, 3] is only for customScrollRef
    }, [
      sizeST,
      controlsST,
      direction,
      arrowsLocal,
      receivedScrollSizeRef.current.height,
      receivedScrollSizeRef.current.width,
    ]);
    const xySize = direction === "x" ? sizeLocal[0] : sizeLocal[1];

    const sizeMinusEdge = React.useMemo(() => {
      const x = sizeLocal[0] - barLocal.trackGap[0];
      const y = sizeLocal[1] - barLocal.trackGap[1];

      return [x, y];
    }, [barLocal.trackGap.join(), sizeLocal[0], sizeLocal[1]]);

    /*
     * Пустая ось в паре — это `"none"`: размер этой стороны решает CSS.
     * Написать её словом можно, а не написать нельзя — в паре нет пустого
     * места, — так что `[100, undefined]` из вычисленного значения обязан
     * значить то же, что `[100, "none"]`. Без этого он терял и заданную ось.
     */
    const isHybrid = direction === "hybrid";
    const hybridColumn = isHybrid && objectsOrder === "column";
    const mainAxis = hybridColumn || direction === "x" ? 0 : 1;
    const crossAxis = mainAxis === 0 ? 1 : 0;

    /*
     * Раскладка и размеры — про разное, и говорят они об одном и том же с
     * двух концов.
     *
     * `"auto"` значит «эту сторону знает сам объект», и по тому, какая
     * сторона отдана, раскладка выводится сама: вдоль прокрутки — кладка,
     * поперёк — поток, обе — заполнение. Так короче всего и написать: пара
     * размеров уже всё сказала.
     *
     * `objects.layout` называет то же самое прямо. Тогда решает он, а сторону,
     * которую он берёт себе, размерам задавать незачем — она становится
     * `"auto"` сама. Отсюда и короткая форма: `{ layout: "masonry", size: 90 }`
     * это колонка в 90 и высота по объекту.
     *
     * `hybrid` объектам ось выбрать не даёт — прокручиваются обе. Там линию
     * обрывает только `objects.lines`, а заполнению нужна граница поперёк, и
     * взять её неоткуда, кроме окна: упереть объекты в окно значило бы, что
     * вторая сторона больше никуда не едет.
     */
    const objectsSizing = React.useMemo(() => {
      const written: (number | "full" | "firstChild" | "auto" | "none" | null)[] =
        objectsSize
          ? !Array.isArray(objectsSize)
            ? argsFormatter(objectsSize, true, 2)
            : objectsSize.map((axis) => axis ?? "none")
          : [null, null];

      if (!objectsLayout) return written;

      const measures =
        objectsLayout === "fill"
          ? [mainAxis, crossAxis]
          : objectsLayout === "masonry"
            ? [mainAxis]
            : objectsLayout === "flow"
              ? [crossAxis]
              : [];

      for (const axis of measures) written[axis] = "auto";

      // сетке нечего мерить: у неё все объекты одного размера
      if (objectsLayout === "grid")
        written.forEach((value, axis) => {
          if (value !== "auto") return;

          complain(
            `objects.layout: "grid" gives every object the same size, so there is nothing to measure — objects.size: "auto" belongs to "masonry", "flow" or "fill"`,
          );
          written[axis] = "none";
        });

      return written;
    }, [objectsSizeST, objectsLayout, mainAxis, crossAxis]);

    const eachOnMain = objectsSizing[mainAxis] === "auto";
    const eachOnCross = objectsSizing[crossAxis] === "auto";
    const isEach = eachOnMain || eachOnCross;

    /*
     * При `hybrid` кладка тоже возможна — но только по названному счёту:
     * колонок ровно столько, сколько сказали, и дырок под низкими соседями
     * они не оставляют, чего поток по тому же счёту не умеет.
     */
    const inferredLayout: PackLayout = isHybrid
      ? eachOnMain && !eachOnCross && lines
        ? "masonry"
        : "flow"
      : eachOnMain && eachOnCross && !lines
        ? "fill"
        : eachOnMain && !eachOnCross
          ? "masonry"
          : "flow";

    const eachLayout: PackLayout =
      objectsLayout && objectsLayout !== "grid" ? objectsLayout : inferredLayout;

    /*
     * Виртуальная и ленивая отрисовка расставляют объекты по счёту, а считать
     * можно только известный размер. `"none"` говорит «размер решает CSS», а
     * не переданный размер значит ровно то же самое — просто молча.
     *
     * Спрашиваем у разобранных размеров, а не у написанного: `"auto"` размер
     * не отменяет, а поручает — библиотека его меряет и дальше знает. Раньше
     * проверка смотрела на проп, и названная раскладка, которой размеры не
     * нужны вовсе, получала выговор ни за что.
     */
    const sizeUnknown = (value: unknown) => value == null || value === "none";

    if (render && objectsSizing.some(sizeUnknown))
      complain(
        `"render" needs a known objects.size: "none" and no size at all leave nothing to place`,
      );

    if (isEach) {
      if (mode !== "scroll")
        complain(
          `objects.size: "auto" gives objects their own size, and pages need one size for all — "${mode}" cannot turn them`,
        );

      /*
       * Линию надо обо что-то оборвать, а при `hybrid` едут обе стороны:
       * упереться не во что, кроме `lines`. Без него линия не кончается
       * никогда — все объекты уходят в одну.
       */
      if (isHybrid && !lines)
        complain(
          `objects.size: "auto" with direction="hybrid" needs objects.lines: both ways scroll, so nothing else says where a line ends`,
        );
    }

    /*
     * `objects.order` не выбирает раскладку — раскладку выбирают размеры.
     * Он выбирает порядок, и слова означают ровно то, что говорят: `"row"`
     * заполняет строку и переходит ниже, `"column"` — столбец и переходит
     * правее. Одно из двух список делает и так, и какое именно — решает ось
     * прокрутки: при вертикальной подряд идут строки, при горизонтальной
     * столбцы. Второе просит переставить порядок: первая линия забирает
     * первые `ceil(n / линий)` объектов.
     *
     * Для перестановки надо знать, сколько будет линий. Кладка знает всегда:
     * колонок столько, сколько влезло или сколько назвали. Поток знает по
     * `lines`, а без него линию обрывает место, и заранее их не
     * сосчитать. У заполнения линий нет вовсе — оно отдаёт порядок ради
     * посадки, это его смысл.
     *
     * При `hybrid` порядок уже выражен осью: «сначала первый столбец» — это
     * ровно то, что делает перестановка осей выше, второй раз не надо.
     */
    const naturalOrder = mainAxis === 0 ? "column" : "row";
    const wantsSplit = !isHybrid && objectsOrder !== naturalOrder;
    const eachOrderable =
      eachLayout === "masonry" || (eachLayout === "flow" && !!lines);
    const eachOrder = wantsSplit && eachOrderable ? objectsOrder : naturalOrder;

    /*
     * Линия в потоке толщиной с самый толстый в ней, и под низкими остаётся
     * пусто. Закрыть это можно, когда толщину решают сами объекты: тогда
     * каждый поднимается до того, что стоит над ним, а строка остаётся
     * строкой. Заданная числом сторона дыр и не оставляет, закрывать нечего.
     */
    const eachCompact = eachLayout === "flow" && !!lines && eachOnMain;

    /*
     * Ругаемся только на написанное: `"row"` стоит умолчанием и при
     * горизонтальной прокрутке просит как раз перестановку — жаловаться на
     * значение, которого никто не писал, значит шуметь на пустом месте.
     */
    if (isEach && wantsSplit && !eachOrderable && objects && "order" in objects)
      complain(
        `objects.order: "${objectsOrder}" fills the first line to its end before the next one starts, and ${
          eachLayout === "fill"
            ? `objects.layout: "fill" gives the order up for the fit`
            : `nothing here says how many lines there will be`
        } — name objects.lines`,
      );

    const objectsSizeLocal = React.useMemo(() => {
      const { height, width } = receivedChildSizeRef.current;

      const getSize = (
        val: number | "none" | "firstChild" | "full" | "auto" | null,
        receivedSize: number,
        sizeLocal: number,
      ) =>
        receivedSize
          ? receivedSize
          : typeof val === "number"
            ? val
            : val === "full"
              ? sizeLocal
              : 0;

      return [
        getSize(objectsSizing[0], width, sizeLocal[0]),
        getSize(objectsSizing[1], height, sizeLocal[1]),
      ];
    }, [
      objectsSizing.join(),
      direction,
      receivedChildSizeRef.current.width,
      receivedChildSizeRef.current.height,
      sizeLocal.join(),
    ]);

    /* размер ячейки ещё не измерен, а взять его больше неоткуда */
    const needsFirstChildMeasure =
      (objectsSizing[0] === "firstChild" ||
        objectsSizing[1] === "firstChild") &&
      !receivedChildSizeRef.current.width &&
      !receivedChildSizeRef.current.height;

    const fallbackLocal = React.useMemo(() => {
      // делаем заглушку что бы не удалять всё подряд при emptyObjects
      if (render && emptyObjectsLocal && !fallback)
        return <div className="ms-empty-object"></div>;

      return fallback;
    }, [!!fallback, renderST, emptyObjectsST]);

    // ♦ calculations
    const objectsPerDirection = React.useMemo(() => {
      // защита при неизвестных размерах, пока это лучшее решение
      if (objectsSizing[0] === "none" || objectsSizing[1] === "none")
        return [1, validChildrenKeys.length];

      const isX = direction === "x" ? 1 : 0;
      const isRow = objectsOrder === "row";

      const localObjSize = sizeLocal[isX];
      const objectSize = objectsSizeLocal[isX]
        ? objectsSizeLocal[isX] + gapLocal[isX]
        : 0;

      const neededMaxSize =
        direction === "hybrid" && localObjSize
          ? objectSize * validChildrenKeys.length
          : localObjSize;

      const objectsPerLine = objectSize
        ? Math.floor(neededMaxSize / objectSize)
        : 1;

      // устанавливаем lines если он есть и если он меньше objects
      let rowObjects =
        lines && lines <= objectsPerLine
          ? direction === "hybrid"
            ? Math.ceil(objectsPerLine / lines)
            : lines
          : objectsPerLine;

      const columnObjects =
        rowObjects > 1 && rowObjects < validChildrenKeys.length
          ? Math.ceil(validChildrenKeys.length / rowObjects)
          : rowObjects >= validChildrenKeys.length
            ? 1
            : validChildrenKeys.length;

      // !доп. фиксируем rowObjects при column (помогает избежать пустых мест)
      if (!isRow)
        rowObjects = Math.ceil(validChildrenKeys.length / columnObjects);

      const useCrossCount = lines && lines < validChildrenKeys.length;

      const validated = (val: number): number =>
        Number.isFinite(val) && val > 0 ? val : 1;

      if (direction === "hybrid") {
        const row = useCrossCount
          ? isRow
            ? lines
            : rowObjects
          : isRow
            ? validChildrenKeys.length
            : 1;

        const column = useCrossCount
          ? !isRow
            ? lines
            : rowObjects
          : !isRow
            ? validChildrenKeys.length
            : 1;

        return [validated(row), validated(column)];
      }

      return [validated(rowObjects), validated(columnObjects)];
    }, [
      objectsOrder,
      gapLocal[0],
      gapLocal[1],
      objectsSizeLocal[0],
      objectsSizeLocal[1],
      validChildrenKeys.length,
      direction,
      sizeLocal.join(),
      lines,
    ]);

    /*
     * Кладка. Колонок столько, сколько влезает по известной поперечной
     * стороне; если и она отдана объектам, число колонок задаёт `lines`,
     * а ширина колонки делится из окна.
     */
    const sizes = useConst(() => createSizeStore(() => triggerRAF()));
    React.useEffect(() => () => sizes.destroy(), [sizes]);


    /*
     * Место поперёк — окно за вычетом полей обёртки: объекты живут внутри
     * них, и мерить перенос по всему окну значит выпускать их за край.
     */
    const crossRoom = Math.max(
      0,
      sizeLocal[crossAxis] - (crossAxis === 0 ? mLocalX : mLocalY),
    );

    const eachColumns = React.useMemo(() => {
      if (!isEach) return 1;
      /*
       * Поток считает сам, если счёт не назвали: ноль для него — «сколько
       * влезет». Для `hybrid` влезет сколько угодно, поэтому там счёт нужен.
       */
      if (eachLayout === "flow") return lines ?? (isHybrid ? 1 : 0);

      const cell = objectsSizeLocal[crossAxis];
      const gapCross = gapLocal[crossAxis === 0 ? 1 : 0];

      if (!cell) return Math.max(1, lines ?? 1);

      /*
       * Кладке при `hybrid` колонок ровно столько, сколько назвали: по этой
       * стороне тоже прокрутка, и «сколько влезет в окно» там ничего не
       * ограничивает.
       */
      if (isHybrid) return Math.max(1, lines ?? 1);

      const fit = Math.max(
        1,
        Math.floor((crossRoom + gapCross) / (cell + gapCross)),
      );

      return lines ? Math.min(lines, fit) : fit;
    }, [
      isEach,
      eachLayout,
      isHybrid,
      objectsSizeLocal[crossAxis],
      gapLocal.join(),
      crossRoom,
      lines,
      crossAxis,
    ]);

    /** ширина колонки в кладке: своя, или поделённая из окна */
    const eachCell = React.useMemo(() => {
      if (!isEach || eachLayout !== "masonry") return 0;

      const known = objectsSizeLocal[crossAxis];
      if (known) return known;

      const gapCross = gapLocal[crossAxis === 0 ? 1 : 0];

      return Math.max(
        0,
        (crossRoom - gapCross * (eachColumns - 1)) / eachColumns,
      );
    }, [
      isEach,
      eachLayout,
      objectsSizeLocal[crossAxis],
      crossRoom,
      gapLocal.join(),
      eachColumns,
      crossAxis,
    ]);

    /*
     * Стороны, которые объекты себе не выбирают. Кладка ставит поперечную из
     * `eachCell` — она могла достаться делением окна, а не числом в пропе.
     */
    const eachFixed = React.useMemo<Vec2>(() => {
      const px = (axis: 0 | 1) =>
        objectsSizing[axis] === "auto" ? 0 : objectsSizeLocal[axis];

      const fixed: Vec2 = [px(0), px(1)];
      if (eachLayout === "masonry") fixed[crossAxis] = eachCell;

      return fixed;
    }, [
      objectsSizing.join(),
      objectsSizeLocal.join(),
      eachLayout,
      eachCell,
      crossAxis,
    ]);

    /*
     * Сторона, которую мы объектам задаём, стала другой — значит и та,
     * которую они выбирают сами, стала другой: текст перетёк, картинка
     * пересчиталась. Записанное больше не про эти объекты.
     *
     * От размера окна не зависим нарочно: в потоке он решает только, где
     * перенос, а не какими объекты выросли — иначе перетаскивание края окна
     * заставляло бы мерить всё заново на каждый кадр.
     */
    const impose = isEach ? eachFixed.join() : null;
    const imposed = React.useRef<string | null>(null);

    React.useEffect(() => {
      // на первом заходе стирать нечего, а снятое наблюдение никто не вернёт
      if (imposed.current !== null && imposed.current !== impose) sizes.clear();

      imposed.current = impose;
    }, [impose, sizes]);

    // ушедшие из списка уносят с собой и свой размер
    React.useEffect(() => {
      if (isEach) sizes.keep(new Set(validChildrenKeys));
    }, [isEach, keysToken, sizes]);

    const packed = React.useMemo(() => {
      if (!isEach)
        return {
          items: [],
          width: 0,
          height: 0,
          measuredPrefix: 0,
          order: [],
          extent: 0,
        };

      return packObjects({
        keys: validChildrenKeys,
        sizes,
        layout: eachLayout,
        isX: mainAxis === 0,
        fixed: eachFixed,
        gap: gapXY,
        columns: eachColumns,
        crossLimit: crossRoom,
        align: objectsAlign ?? "start",
        order: eachOrder,
        compact: eachCompact,
      });
    }, [
      isEach,
      eachLayout,
      keysToken,
      eachColumns,
      eachFixed.join(),
      gapXY.join(),
      mainAxis,
      crossAxis,
      crossRoom,
      objectsAlign,
      eachOrder,
      eachCompact,
      sizes.version,
    ]);

    const objectsWrapperWidth = React.useMemo(() => {
      if (isEach) return packed.width;

      const childsGap =
        objectsPerDirection[0] < 1
          ? 1
          : objectsPerDirection[0] * gapLocal[1] - gapLocal[1];
      // если детей меньше чем neededObj, то считаем по ним так как lines в этом случае не имеет смысла
      const neededObj = objectsPerDirection[direction === "x" ? 1 : 0];
      const neededObjWithChildCount =
        validChildrenKeys.length < neededObj
          ? validChildrenKeys.length
          : neededObj;

      return objectsSizeLocal[0]
        ? (objectsSizeLocal[0] + gapLocal[1]) * neededObjWithChildCount -
            gapLocal[1]
        : !renderLocal.mode
          ? receivedWrapSizeRef.current.width
          : receivedChildSizeRef.current.width + childsGap;
    }, [
      direction,
      objectsSizeLocal[0],
      objectsPerDirection[0],
      objectsPerDirection[1],
      gapLocal[1],
      receivedWrapSizeRef.current.width,
      receivedChildSizeRef.current.width,
      renderLocal.mode,
      validChildrenKeys.length,
          isEach,
      packed,
    ]);

    const objectsWrapperHeight = React.useMemo(() => {
      if (isEach) return packed.height;

      const childsGap =
        objectsPerDirection[1] < 1
          ? 1
          : objectsPerDirection[1] * gapLocal[0] - gapLocal[0];

      return objectsSizeLocal[1]
        ? direction === "x"
          ? (objectsSizeLocal[1] + gapLocal[0]) * objectsPerDirection[0] -
            gapLocal[0]
          : (objectsSizeLocal[1] + gapLocal[0]) * objectsPerDirection[1] -
            gapLocal[0]
        : !renderLocal.mode
          ? receivedWrapSizeRef.current.height // on "fit-content"
          : receivedChildSizeRef.current.height + childsGap;
    }, [
      direction,
      objectsSizeLocal[1],
      objectsPerDirection[0],
      objectsPerDirection[1],
      gapLocal[0],
      receivedWrapSizeRef.current.height,
      receivedChildSizeRef.current.height,
      renderLocal.mode,
          isEach,
      packed,
    ]);

    /*
     * Круг: сколько копий контента лежит в ленте и через сколько пикселей он
     * повторяется. Период — это протяжённость одной копии плюс зазор, иначе
     * копии слиплись бы вплотную, а внутри копии объекты стоят через зазор.
     *
     * Пока размер по главной оси неизвестен, круга нет: он появится сам, когда
     * появится размер. Ругаться тут уже не на что — про несовместимые условия
     * сказано выше, один раз.
     */
    const loopLocal = React.useMemo(() => {
      if (!loop) return null;

      /*
       * Измеряемый размер круг тоже умеет, но только когда измерены все:
       * период — это протяжённость контента, а она растёт, пока приходят
       * замеры. Крутить по меняющемуся периоду значит дёргать раскладку на
       * каждой пачке. Поэтому ждём: до конца замера это обычная прокрутка, а
       * круг включается сам, когда мерить больше нечего.
       */
      if (isEach && packed.measuredPrefix !== validChildrenKeys.length)
        return null;

      const round = (axis: 0 | 1) => {
        const extent = axis === 0 ? objectsWrapperWidth : objectsWrapperHeight;

        /*
         * Пока протяжённости нет, повторять нечего. Считать круг по нулю
         * нельзя: период выродится в один зазор, а копий на окно понадобится
         * столько, сколько зазоров в него влезет — целая решётка повторов на
         * один кадр, до первого замера. Круг подождёт размера так же, как
         * ждёт его при «auto».
         */
        if (!(extent > 0)) return null;

        // gapLocal лежит в обратном порядке, отсюда перевёрнутый индекс
        const period = extent + gapLocal[axis === 0 ? 1 : 0];
        const copies = loopCopies(period, sizeLocal[axis]);

        return copies && Number.isFinite(period)
          ? { period, copies, span: period * copies }
          : null;
      };

      /*
       * При `hybrid` едут обе стороны — значит и круг идёт по обеим: контент
       * повторяется и вправо, и вниз, а копии ложатся решёткой. По каждой оси
       * при этом всё то же самое, просто дважды.
       */
      const x = direction !== "y" ? round(0) : null;
      const y = direction !== "x" ? round(1) : null;

      return x || y ? { x, y } : null;
    }, [
      loop,
      isEach,
      packed,
      validChildrenKeys.length,
      direction,
      objectsWrapperWidth,
      objectsWrapperHeight,
      gapLocal[0],
      gapLocal[1],
      sizeLocal.join(),
    ]);

    /*
     * Координаты объектам считаются одним и тем же кодом, а включали его до
     * сих пор только виртуализация да измеряемый размер. Кругу они нужны для
     * копий, а слежению за видимостью — что бы было с чем сверять окно; ни то
     * ни другое к отрисовке отношения не имеет. Отсюда один признак на всех.
     */
    const byCoords = !!(
      renderLocal.mode ||
      isEach ||
      loopLocal ||
      renderLocal.trackVisibility ||
      // удержать заголовок можно только там, где известно, где он лежит
      objectsGroups === "sticky"
    );

    /*
     * Меняет ли позиция прокрутки то, что нарисовано.
     *
     * Здесь рендер идёт по кадру, пока идёт прокрутка, и это оправдано ровно
     * тем, что от позиции зависит бегунок, край, доступность стрелок и то,
     * какие объекты вообще нужны. Списку без всего этого перерисовка даёт
     * буква в букву тот же результат — а стоит она обходом всех детей.
     */
    const showsScrollPosition =
      byCoords ||
      (barLocal.present && !barLocal.native) ||
      !!edge ||
      !!controlsLocal.arrows;

    /*
     * Наружу обёртка отдаёт длину всего круга, а не одной копии: по ней
     * браузер и даёт ту прокрутку, внутри которой окно будет ходить.
     */
    const loopedHeight = loopLocal?.y ? loopLocal.y.span : objectsWrapperHeight;
    const loopedWidth = loopLocal?.x ? loopLocal.x.span : objectsWrapperWidth;

    const objectsWrapperHeightFull = React.useMemo(() => {
      return loopedHeight + mLocalY;
    }, [loopedHeight, mLocalY]);
    const objectsWrapperWidthFull = React.useMemo(() => {
      return loopedWidth + mLocalX;
    }, [loopedWidth, mLocalX]);
    const fullHeightOrWidth =
      direction === "x" ? objectsWrapperWidthFull : objectsWrapperHeightFull;

    const maxScrollSize = React.useMemo<Vec2>(() => {
      return [
        Math.max(0, objectsWrapperWidthFull - sizeLocal[0]),
        Math.max(0, objectsWrapperHeightFull - sizeLocal[1]),
      ];
    }, [sizeLocal.join(), objectsWrapperHeightFull, objectsWrapperWidthFull]);

    const scrollSpaceFromRef =
      direction === "x"
        ? scrollElementRef.current?.scrollLeft || 0
        : scrollElementRef.current?.scrollTop || 0;

    const isNotAtStart = scrollSpaceFromRef > 1;
    const isNotAtEnd =
      Math.round(scrollSpaceFromRef + xySize) < fullHeightOrWidth;

    let isNotAtStartX = false;
    let isNotAtEndX = false;
    if (direction === "hybrid") {
      isNotAtStartX = (scrollElementRef.current?.scrollLeft || 0) > 1;
      isNotAtEndX =
        Math.round((scrollElementRef.current?.scrollLeft || 0) + sizeLocal[0]) <
        objectsWrapperWidthFull;
    }

    /*
     * Прогресс в круге показывает оборот, а не всю ленту: лента — приём, копий
     * в ней ровно столько, сколько нужно окну, и мерить себя ими странно. По
     * обороту же бегунок получается честного размера и на подмене позиции не
     * дёргается — она сдвигает ровно на период, а внутри оборота это то же
     * самое место.
     */
    const barSpan = React.useMemo(
      () => ({
        w: loopLocal?.x ? loopLocal.x.period : objectsWrapperWidthFull,
        h: loopLocal?.y ? loopLocal.y.period : objectsWrapperHeightFull,
      }),
      [loopLocal, objectsWrapperWidthFull, objectsWrapperHeightFull],
    );

    const getThumbSize = React.useCallback(
      (dir: "x" | "y") => {
        if (!barLocal.present || !fullHeightOrWidth) return 0;

        if (dir === "x") {
          return calculateThumbSize(
            sizeLocal[0] - barLocal.trackGap[0],
            barSpan.w,
            barLocal.thumbMinSize,
          );
        } else
          return calculateThumbSize(
            sizeLocal[1] - barLocal.trackGap[1],
            barSpan.h,
            barLocal.thumbMinSize,
          );
      },
      [
        controlsST,
        fullHeightOrWidth,
        sizeLocal[0],
        sizeLocal[1],
        barSpan.w,
        barSpan.h,
        barLocal.thumbMinSize,
        barLocal.trackGap.join(),
      ],
    );

    const thumbSizeMemo = React.useMemo(
      () => ({
        x: direction !== "y" ? getThumbSize("x") : 0,
        y: direction !== "x" ? getThumbSize("y") : 0,
      }),
      [getThumbSize, direction],
    );

    /*
     * Липнет ли скролл к концу — по положению, а не по направлению движения.
     * Направление стирается через SCROLL_END_DELAY, и при медленной прокрутке
     * пауза успевала стереть его раньше, чем дорастал контент: человека, уже
     * читающего историю, выбрасывало обратно вниз.
     */
    const updateAtEnd = (allow: (dir: "x" | "y") => boolean = () => true) => {
      const scrollEl = scrollElementRef.current;
      if (!scrollEl || !(stickLocal[0] || stickLocal[1])) return;

      const near = (pos: number, end: number) =>
        pos >= end - CONST.END_STICK_THRESHOLD;

      if (allow("x"))
        atEndRef.current.x = near(scrollEl.scrollLeft, endRef.current.w);
      if (allow("y"))
        atEndRef.current.y = near(scrollEl.scrollTop, endRef.current.h);
    };

    const endObjectsWrapper = React.useMemo(
      () => ({
        w: !sizeLocal[0]
          ? objectsWrapperWidthFull
          : objectsWrapperWidthFull - sizeLocal[0],
        h: !sizeLocal[1]
          ? objectsWrapperHeightFull
          : objectsWrapperHeightFull - sizeLocal[1],
      }),
      [
        objectsWrapperWidthFull,
        objectsWrapperHeightFull,
        sizeLocal[0],
        sizeLocal[1],
      ],
    );

    // читается из обработчиков, поэтому держим свежим без пересоздания замыканий
    const endRef = React.useRef(endObjectsWrapper);
    endRef.current = endObjectsWrapper;

    /*
     * В круге отсчёт идёт от начала оборота: позиция живёт в средней копии,
     * значит вычитаем период — и получаем, сколько круга пройдено. Полный
     * оборот при этом ровно проходит дорожку из конца в начало.
     */
    const loopPeriods: [number, number] = [
      loopLocal?.x?.period ?? 0,
      loopLocal?.y?.period ?? 0,
    ];

    const barAt = (axis: 0 | 1) => {
      const at =
        axis === 0
          ? scrollElementRef.current?.scrollLeft || 0
          : scrollElementRef.current?.scrollTop || 0;

      return loopPeriods[axis] ? at - loopPeriods[axis] : at;
    };

    const barEnd = (axis: 0 | 1, whole: number) =>
      loopPeriods[axis] || whole;

    // высчитываем сдвиг scroll и ограничиваем его
    const thumbSpace = {
      x:
        direction !== "y"
          ? calculateThumbSpace(
              barAt(0),
              barEnd(0, endObjectsWrapper.w),
              sizeMinusEdge[0],
              thumbSizeMemo.x,
            )
          : 0,
      y:
        direction !== "x"
          ? calculateThumbSpace(
              barAt(1),
              barEnd(1, endObjectsWrapper.h),
              sizeMinusEdge[1],
              thumbSizeMemo.y,
            )
          : 0,
    };

    const memoizedChildrenData = React.useMemo(() => {
      // кладка считает координаты сама, и считает их всегда: по ним она и кладка
      if (isEach) return packed.items;

      // считаем всем, кому координаты нужны, а не одной лишь виртуализации
      if (!byCoords) return [{ top: 0, bottom: 0, left: 0, right: 0 }];

      let alignSpace: number = 0;

      const isX = direction === "x";
      const isRow = objectsOrder === "row";
      const isRowInDir = (isX && !isRow) || (!isX && isRow);

      const stepX = objectsSizeLocal[0] + gapLocal[1];
      const stepY = objectsSizeLocal[1] + gapLocal[0];

      const itemsInLastLine = new Set<number>();

      // -- находим последние индексы
      const itemsPerLine = isRowInDir
        ? objectsPerDirection[0]
        : objectsPerDirection[1];
      const size = objectsSizeLocal[isRow ? 0 : 1];
      const gap = gapLocal[isRow ? 1 : 0];

      // начало последней линии
      const lastLineStart =
        Math.floor((validChildrenKeys.length - 1) / itemsPerLine) *
        itemsPerLine;

      for (let i = lastLineStart; i < validChildrenKeys.length; i++)
        itemsInLastLine.add(i);

      // -- вычисляем отступ
      const emptySlots = itemsPerLine - itemsInLastLine.size;
      const offset = emptySlots > 0 ? (size + gap) * emptySlots : 0;

      if (objectsAlign === "center") alignSpace = Math.round(offset / 2);
      else if (objectsAlign === "end") alignSpace = offset;

      // -- получаем координаты
      return validChildrenKeys.map((_, childIndex) => {
        // вычисляем group и subIndex сразу
        const groupIndex = isRowInDir
          ? childIndex % objectsPerDirection[0]
          : Math.floor(childIndex / objectsPerDirection[1]);

        const subIndex = isRowInDir
          ? Math.floor(childIndex / objectsPerDirection[0])
          : childIndex % objectsPerDirection[1];

        let leftIndex: number;
        let topIndex: number;

        if (direction === "x") {
          leftIndex = subIndex;
          topIndex = groupIndex;
        } else if (direction === "y") {
          leftIndex = groupIndex;
          topIndex = subIndex;
        } else {
          // hybrid
          leftIndex = groupIndex;
          topIndex = subIndex;
        }

        const isLastEl =
          itemsInLastLine.size > 0 && itemsInLastLine.has(childIndex);

        const top = (isLastEl && !isRow ? alignSpace : 0) + stepY * topIndex;
        const left = (isLastEl && isRow ? alignSpace : 0) + stepX * leftIndex;

        return {
          top,
          left,
          bottom: top + objectsSizeLocal[1],
          right: left + objectsSizeLocal[0],
        };
      });
    }, [
      objectsSizeLocal[0],
      objectsSizeLocal[1],
      gapLocal[0],
      gapLocal[1],
      objectsAlign,
      validChildrenKeys.length,
      objectsPerDirection[0],
      objectsPerDirection[1],
      byCoords,
      objectsOrder,
      direction,
          isEach,
      packed,
    ]);

    /*
     * Окно списка: у каких объектов вообще имеет смысл спрашивать, видны ли
     * они.
     *
     * Виртуализация отбрасывает невидимое, но спрашивала об этом каждого:
     * десять тысяч проверок на кадр, из которых полезны два десятка. Окно
     * отвечает на тот же вопрос заранее и всегда с запасом: это
     * предварительный отсев, а настоящую видимость по-прежнему считает
     * `renderChild`. Лишний объект в окне ничего не портит, недостающего быть
     * не может.
     *
     * Считается оно двумя способами, по тому, откуда берутся координаты.
     *
     * У равномерной сетки место объекта — арифметика от его номера, и линии
     * получаются прямо. Номера внутри линий идут подряд при обычном порядке и
     * с шагом при переставленном, поэтому наружу отдаём список номеров, а не
     * отрезок. При `hybrid` то же самое дважды, по линии на каждую ось.
     *
     * У кладки, потока и заполнения номер о месте не говорит ничего, зато
     * `packObjects` отдаёт номера, упорядоченные по началу вдоль прокрутки, и
     * длину самого длинного объекта. Двоичным поиском находим первого, кто
     * может дотянуться до окна, и идём вперёд, пока начала не ушли за него.
     *
     * `"lazy"` окна не получает: он обязан держать всё, что однажды показал,
     * и список ему нужен целиком. Отрисовка там и так растёт вместе с
     * показанным, так что обход по ней погоды не делает.
     */
    const gridPlan = React.useMemo(() => {
      if (isEach || renderLocal.mode !== "virtual") return null;
      if (objectsAlign && objectsAlign !== "start") return null;

      const isX = direction === "x";
      const isRow = objectsOrder === "row";
      const isRowInDir = (isX && !isRow) || (!isX && isRow);

      const perRow = objectsPerDirection[0];
      const perColumn = objectsPerDirection[1];
      if (!(perRow > 0) || !(perColumn > 0)) return null;

      const stepX = objectsSizeLocal[0] + gapLocal[1];
      const stepY = objectsSizeLocal[1] + gapLocal[0];
      if (!(stepX > 0) || !(stepY > 0)) return null;

      return {
        isRowInDir,
        perRow,
        perColumn,
        step: [stepX, stepY] as Vec2,
        size: [objectsSizeLocal[0], objectsSizeLocal[1]] as Vec2,
        // rootMargin лежит в порядке CSS, а стороны считаются крест-накрест
        margin: [
          [mRootLocal[3], mRootLocal[1]],
          [mRootLocal[0], mRootLocal[2]],
        ] as [Vec2, Vec2],
      };
    }, [
      isEach,
      renderLocal.mode,
      direction,
      objectsOrder,
      objectsAlign,
      objectsPerDirection[0],
      objectsPerDirection[1],
      objectsSizeLocal[0],
      objectsSizeLocal[1],
      gapLocal[0],
      gapLocal[1],
      mRootLocal.join(),
    ]);

    const packPlan = React.useMemo(() => {
      if (!isEach || renderLocal.mode !== "virtual") return null;
      if (!packed.order.length) return null;

      const axis: 0 | 1 = mainAxis;
      const [before, after] =
        axis === 0
          ? [mRootLocal[3], mRootLocal[1]]
          : [mRootLocal[0], mRootLocal[2]];

      return { axis, before, after };
    }, [isEach, renderLocal.mode, packed, mainAxis, mRootLocal.join()]);

    /** the lines of a uniform grid that reach into [from, to] on one axis */
    const linesIn = (axis: 0 | 1, from: number, to: number) => {
      const plan = gridPlan!;
      const step = plan.step[axis];
      const [before, after] = plan.margin[axis];

      // по линии запаса с каждой стороны: округления дешевле, чем пропуск
      const first = Math.floor((from - before - plan.size[axis]) / step) - 1;
      const last = Math.ceil((to + after) / step) + 1;

      return [first, last] as const;
    };

    const visibleIndices = (
      scrollLeft: number,
      scrollTop: number,
    ): number[] | null => {
      const total = validChildrenKeys.length;
      const view = (axis: 0 | 1) => {
        const at = axis === 0 ? scrollLeft : scrollTop;

        return [at, at + sizeLocal[axis]] as const;
      };

      if (packPlan) {
        const { axis, before, after } = packPlan;
        const [from, to] = view(axis);

        const reach = from - before - packed.extent;
        const { order, items } = packed;
        const startOfItem = (index: number) =>
          axis === 0 ? items[index].left : items[index].top;

        // первый, кто ещё может дотянуться до окна
        let low = 0;
        let high = order.length;
        while (low < high) {
          const mid = (low + high) >> 1;

          if (startOfItem(order[mid]) < reach) low = mid + 1;
          else high = mid;
        }

        const out: number[] = [];
        for (let i = low; i < order.length; i++) {
          const index = order[i];
          if (startOfItem(index) > to + after) break;

          // неизмеренный лежит в нуле, а не там, где будет: он идёт отдельно
          if (items[index]?.measured) out.push(index);
        }

        /*
         * Неизмеренных рисуем пачкой с конца измеренного: пока размера нет,
         * места у них тоже нет, а померить их можно только нарисовав.
         */
        for (
          let i = packed.measuredPrefix;
          i < Math.min(total, packed.measuredPrefix + CONST.MEASURE_BATCH);
          i++
        )
          if (!items[i]?.measured) out.push(i);

        return out;
      }

      if (!gridPlan) return null;

      const { isRowInDir, perRow, perColumn } = gridPlan;

      /*
       * Линия вдоль прокрутки и номера в ней. При обычном порядке номера идут
       * подряд, при переставленном — с шагом в число линий.
       */
      const push = (out: number[], line: number) => {
        if (line < 0) return;

        if (isRowInDir) {
          const from = line * perRow;
          for (let i = from; i < Math.min(total, from + perRow); i++)
            out.push(i);

          return;
        }

        /*
         * В переставленном порядке номера в линии идут с шагом, и номер линии
         * это остаток от деления на их число. Линия за пределами счёта — та же
         * самая линия по кругу, и её объекты попали бы в список второй раз:
         * один и тот же ребёнок рисовался дважды и налезал сам на себя.
         */
        if (line >= perColumn) return;

        for (let i = line; i < total; i += perColumn) out.push(i);
      };

      if (direction !== "hybrid") {
        const axis: 0 | 1 = direction === "x" ? 0 : 1;
        const [from, to] = view(axis);
        const [first, last] = linesIn(axis, from, to);

        const out: number[] = [];
        for (let line = Math.max(0, first); line <= last; line++)
          push(out, line);

        return out;
      }

      /*
       * Обе оси едут — окно становится прямоугольником. Номер объекта в сетке
       * складывается из его строки и столбца, поэтому и перебираем их парами.
       */
      const [fromX, toX] = view(0);
      const [fromY, toY] = view(1);
      const [firstX, lastX] = linesIn(0, fromX, toX);
      const [firstY, lastY] = linesIn(1, fromY, toY);

      const out: number[] = [];
      const lastColumn = Math.min(lastX, perRow - 1);
      const lastRow = Math.min(lastY, perColumn - 1);

      for (let column = Math.max(0, firstX); column <= lastColumn; column++)
        for (let row = Math.max(0, firstY); row <= lastRow; row++) {
          const index = isRowInDir
            ? row * perRow + column
            : column * perColumn + row;

          if (index < total) out.push(index);
        }

      return out;
    };

    const wrapperAlignLocal = React.useMemo(() => {
      if (!sizeLocal?.length || !wrapper?.align) return {};

      return getWrapperAlignStyle(
        wrapper.align,
        sizeLocal,
        objectsWrapperWidthFull,
        objectsWrapperHeightFull,
      );
    }, [
      wrapperST,
      sizeLocal.join(),
      objectsWrapperHeightFull,
      objectsWrapperWidthFull,
    ]);

    /*
     * Страниц в круге столько, сколько их в обороте: лента длиннее только
     * потому, что копий в ней несколько, и считать по ней значило бы показать
     * втрое больше точек, чем есть на самом деле.
     */
    const objLengthPerSize = React.useMemo(() => {
      /*
       * Обычный счёт — сколько целых окон влезло: остаток оттого и остаток,
       * что отдельной страницей не стал. В круге же остатка не бывает: он
       * замыкается на начало, и если не дать ему своей точки, последняя часть
       * оборота показывалась бы первой — та бы и залипала, пока остаток не
       * пройден.
       */
      const pages = (axis: 0 | 1, span: number) => {
        const period = loopPeriods[axis];

        return period
          ? loopPages(period, sizeLocal[axis], gapXY[axis]).pages
          : objectsPerSize(span, sizeLocal[axis]);
      };

      return [pages(0, barSpan.w), pages(1, barSpan.h)];
    }, [barSpan.w, barSpan.h, sizeLocal.join(), loopPeriods.join(), gapXY.join()]);
    const objLengthPerSizeXY = React.useMemo(() => {
      return direction === "x" ? objLengthPerSize[0] : objLengthPerSize[1];
    }, [direction, objLengthPerSize[0], objLengthPerSize[1]]);

    // ♦ functions
    const scrollResize = React.useCallback(
      createResizeHandler(receivedScrollSizeRef, triggerRAF),
      [],
    );
    const wrapResize = React.useCallback(
      createResizeHandler(receivedWrapSizeRef, triggerRAF, mLocalX, mLocalY),
      [mLocalX, mLocalY],
    );
    const childResize = React.useCallback(
      createResizeHandler(receivedChildSizeRef, triggerRAF),
      [],
    );

    const smoothScrollLocal = React.useCallback(
      (targetScroll: number | null, direction: "y" | "x", duration: number) => {
        const scrollEl = scrollElementRef.current;
        if (!scrollEl || targetScroll === null) return null;

        /*
         * `null` значит «поставь, дождавшись, пока будет куда»: до первого
         * измерения диапазон нулевой, и любая цель обрезалась бы в ноль.
         *
         * Раньше это правило висело на одном лишь «первом рендере», а он
         * держится до конца первого кадра — и любое действие, случившееся
         * внутри этого кадра, уходило в ту же ветку. Клик по пункту меню,
         * сделанный сразу после монтирования, не доезжал никуда: ждать было
         * нечего, диапазон давно посчитан. Ждём теперь по условию, а не по
         * моменту: только когда ехать действительно некуда.
         */
        const room = maxScrollSize[direction === "x" ? 0 : 1];
        const nowhereToGo = firstRender.current && room <= 0;

        return smoothScroll(
          direction,
          scrollEl,
          nowhereToGo ? null : duration,
          targetScroll,
          rafScrollAnim.schedule,
          maxScrollSize,
          tasks,
        );
      },
      [maxScrollSize.join()],
    );

    /*
     * Направление страницы, снятое один раз при монтировании.
     *
     * Отсчёт прокрутки мы закрепили на `ltr`, иначе арифметика от левого края
     * ломается на арабской странице. Но текст внутри должен читаться так, как
     * читается страница, — возвращаем направление обёртке.
     *
     * Состояние обновляем только когда направление действительно `rtl`: на
     * обычной странице лишнего рендера не случается вовсе. Спрашивать
     * окружение на каждый рендер нельзя — `getComputedStyle` заставляет
     * браузер пересчитать стили, а рендер здесь идёт по кадру прокрутки.
     */
    const [pageDirection, setPageDirection] = React.useState<"ltr" | "rtl">(
      "ltr",
    );

    React.useLayoutEffect(() => {
      const root = customScrollRef.current;
      if (!root || typeof getComputedStyle !== "function") return;

      const parent = root.parentElement ?? root;
      if (getComputedStyle(parent).direction === "rtl")
        setPageDirection("rtl");
    }, []);

    const wrapperStyle = React.useMemo<React.CSSProperties>(() => {
      const common: React.CSSProperties = {
        margin: wrapper?.margin ? `${mT}px ${mR}px ${mB}px ${mL}px` : "",
        height:
          objectsSizing[1] && objectsSizing[1] !== "none"
            ? `${loopedHeight}px`
            : "fit-content",
        width:
          objectsSizing[0] && objectsSizing[0] !== "none"
            ? `${loopedWidth}px`
            : "fit-content",
        ...(gap &&
          !renderLocal.mode &&
          !isEach &&
          !loopLocal && { gap: `${gapLocal[0]}px ${gapLocal[1]}px` }),
        ...(wrapper?.minSize &&
          getWrapperMinSizeStyle(
            wrapper.minSize,
            direction,
            sizeLocal,
            mLocalX,
            mLocalY,
          )),
        ...((direction === "hybrid" || direction === "x") && { flexShrink: 0 }), // для горизонтального выравнивания при "hybrid"/"x"
        // окно прокрутки закреплено на ltr — содержимому направление возвращаем
        direction: pageDirection,
      };

      // кладка размещает объекты абсолютно, значит обёртке нужен свой отсчёт
      if (byCoords) {
        return {
          ...common,
          position: "relative",
        };
      }

      const flexDirection =
        objectsPerDirection[0] === 1
          ? direction === "y"
            ? "column"
            : "row" // так как при objectsPerDirection[0] === 1, x/hybrid это row
          : objectsOrder;

      // выравнивание элементы в линию когда размер неизвестен при direction !== "y"
      const flexWrap =
        !objectsSizing[0] ||
        objectsSizing[0] === "none" ||
        !objectsSizing[1] ||
        objectsSizing[1] === "none"
          ? undefined
          : "wrap";

      return {
        ...common,
        display: "flex",
        flexDirection,
        flexWrap,
        justifyContent: getStyleAlign(objectsAlign),
      };
    }, [
      wrapperST,
      [mT, mR, mB, mL, mLocalX, mLocalY, gapLocal[0], gapLocal[1]].join(),
      sizeLocal.join(),
      gapST,
      objectsSizing[1],
      loopedHeight,
      loopedWidth,
      gapST,
      renderLocal.mode,
      direction,
      objectsPerDirection[0],
      objectsOrder,
      objectsAlign,
          isEach,
      loopLocal,
      pageDirection,
    ]);

    // ♦ events
    /*
     * Жест начинается раньше, чем объявлен отчёт о перелистывании, и живёт
     * дольше одного рендера. Ссылка развязывает это: в неё кладут свежий
     * `emitNavigate`, а жест читает её в момент, когда действительно нужен.
     */
    const emitNavigateRef = React.useRef<
      (reason: NavigateReason, axis: "x" | "y", from: number, to: number) => void
    >(() => {});

    const onMouseOrTouchDown = React.useCallback(
      (
        clicked: "thumb" | "slider" | "wrapp",
        event: PointerEvent,
        checkClickedBar?: boolean,
      ) => {
        isTouchedRef.current = isTouchDevice(); // уточняем девайс

        const target = event.target as HTMLElement;

        // свой drag у элемента и поля ввода — не наше дело ни на каком устройстве
        if (
          target.closest(
            `
          [ms-custom-drag], [draggable="true"], [contenteditable],
          input, textarea, select
        `,
          )
        )
          return;

        /*
         * Список, целиком собранный из ссылок или кнопок — меню, лента
         * карточек, — должен скроллиться с любой точки, как нативный: указатель
         * попадает по пункту, а не между ними. Тап от прокрутки отличает
         * расстояние, а не то, куда попали: до 2px это тап и click проходит,
         * дальше поднимается isDraggingRef, ms-objects-wrapper получает
         * pointer-events: none, и click уже не случится.
         *
         * Мышь раньше была исключением — ради выделения текста и нативного
         * переноса ссылки. Но выделение всё равно снимает курсорный замок на
         * всё время жеста, а нативный перенос гасится через dragstart, так что
         * от исключения оставалась только неработающая прокрутка по кнопкам.
         */

        let axisFromAtr: "x" | "y" | null = null;
        if (checkClickedBar) {
          axisFromAtr = target
            .closest(mode === "scroll" ? ".ms-bar" : ".ms-slider")
            ?.getAttribute(CONST.BAR_AXIS_ATR) as "x" | "y";
        }

        clickedObject.current = clicked;

        handleMouseOrTouch({
          scrollElement: scrollElementRef.current,
          target,
          clickedObject,
          scrollStateRef: scrollStateRef.current,
          mode,
          triggerUpdate: triggerRAF,
          direction,
          smoothScroll: smoothScrollLocal,
          sizeLocal: [sizeLocal[0], sizeLocal[1]],
          thumbSize: axisFromAtr === "x" ? thumbSizeMemo.x : thumbSizeMemo.y,
          axisFromAtr,
          duration: duration,
          scrollBarEdge: barLocal.trackGap,
          rafScrollAnim,
          isTouched: isTouchedRef.current,
          gap: gapXY,
          overscrollRef,
          objLengthPerSize,
          isDraggingRef,
          maxScrollSize,
          loopPeriods,
          emitNavigate: (reason, axis, from, to) =>
            emitNavigateRef.current(reason, axis, from, to),
          pointerId: event.pointerId,
          runtime: pointerRuntime,
          tasks,
        });
      },

      [
        direction,
        mode,
        sizeLocal.join(),
        duration,
        smoothScrollLocal,
        barLocal.trackGap.join(),
        thumbSizeMemo.x,
        thumbSizeMemo.y,
        gapLocal.join(),
        objLengthPerSize,
        maxScrollSize.join(),
      ],
    );

    const onMoveScrollThumb = React.useCallback(
      (event: PointerEvent) => {
        onMouseOrTouchDown("thumb", event, true);
      },
      [onMouseOrTouchDown],
    );

    /*
     * Причину знает тот, кто начал переход, а сам переход виден только когда
     * скролл остановился. Между этими двумя моментами метка ждёт здесь.
     *
     * Отчитываемся именно по остановке, а не по каждой пройденной странице:
     * клик по точке слайдера пролетает мимо трёх страниц по дороге к четвёртой,
     * и три лишних события — это три лишних звука.
     */
    const pending = React.useRef<NavigateReason | null>(null);
    const pageRef = React.useRef<{ x: number | null; y: number | null }>({
      x: null,
      y: null,
    });

    const pageNow = React.useCallback(
      (axis: "x" | "y") => {
        const el = scrollElementRef.current;
        if (!el) return null;

        return axis === "x"
          ? pageAt(el.scrollLeft, el.clientWidth, gapXY[0])
          : pageAt(el.scrollTop, el.clientHeight, gapXY[1]);
      },
      [gapLocal[0], gapLocal[1]],
    );

    /*
     * Причина жеста, у которого страница определится только в конце: бар
     * нажали, а куда он приедет, решит снап после отпускания. Заодно
     * записываем страницу отправления, если её ещё не успели записать —
     * нажатие сразу после монтирования иначе потеряло бы первое событие.
     */
    const markNavigate = React.useCallback(
      (reason: NavigateReason) => {
        pending.current = reason;

        if (pageRef.current.x === null) pageRef.current.x = pageNow("x");
        if (pageRef.current.y === null) pageRef.current.y = pageNow("y");
      },
      [pageNow],
    );

    /*
     * Перелистнули по команде — про это известно всё и сразу: и откуда, и
     * куда. Ждать конца прокрутки незачем, а главное — нельзя: три быстрых
     * нажатия стрелки доезжают одним движением, и одно событие на всех
     * потеряло бы два перелистывания. Отчитывается каждое.
     */
    const emitNavigate = React.useCallback(
      (reason: NavigateReason, axis: "x" | "y", from: number, to: number) => {
        if (from === to) return;

        // страница записана вперёд: финал увидит её и не отчитается второй раз
        pageRef.current[axis] = to;
        pending.current = null;

        onNavigate?.({ reason, axis, from, to });
      },
      [onNavigate],
    );
    emitNavigateRef.current = emitNavigate;

    /** the scroll has stopped — compare the page with the one it left */
    const reportNavigate = React.useCallback(() => {
      const reason = pending.current;
      pending.current = null;

      for (const axis of ["x", "y"] as const) {
        const now = pageNow(axis);
        if (now === null) continue;

        const before = pageRef.current[axis];
        pageRef.current[axis] = now;

        if (before === null || before === now) continue;

        // в обычном скролле страниц нет — их листают только команды
        if (mode === "scroll") continue;

        onNavigate?.({ reason: reason ?? "scroll", axis, from: before, to: now });
      }
    }, [mode, onNavigate, pageNow]);

    const handleArrowLocal = React.useCallback(
      (
        arrowType: handleArrowT["arrowType"],
        // тот же шаг делают и кнопки-стрелки, и клавиши — меняется только след
        reason: NavigateReason = "arrows",
      ) => {
        if (!scrollElementRef.current) return;

        const moved = handleArrow({
          arrowType: arrowType,
          scrollElement: scrollElementRef.current,
          wrapSize: [objectsWrapperWidthFull, objectsWrapperHeightFull],
          scrollSize: sizeLocal,
          smoothScroll: smoothScrollLocal,
          duration: duration,
          gap: gapXY,
          loopPeriods,
        });

        // упёрлись в край — никуда не поехали, и отчитываться не о чем
        if (moved) emitNavigate(reason, moved.axis, moved.from, moved.to);
      },

      [
        sizeLocal.join(),
        objectsWrapperWidthFull,
        objectsWrapperHeightFull,
        duration,
        smoothScrollLocal,
        loopPeriods.join(),
        gapLocal[0],
        gapLocal[1],
        emitNavigate,
      ],
    );

    const sliderCheckLocal = React.useCallback(() => {
      // защита от нулевых значений
      if (mode === "scroll" || !sizeLocal[0] || !sizeLocal[1]) return;

      if (
        !scrollContentRef.current ||
        !scrollElementRef.current ||
        !scrollBarsRef.current.size
      )
        return;

      sliderCheck(
        scrollElementRef.current,
        scrollBarsRef.current,
        direction,
        objLengthPerSize,
        loopPeriods,
      );
    }, [
      sizeLocal.join(),
      direction,
      mode,
      objLengthPerSize.join(),
      loopPeriods.join(),
    ]);

    const onRenderedKeysChangeUpdate = React.useCallback(
      (callback: MorphScrollProps["onRenderedKeysChange"]) => {
        if (callback) {
          const renderedKeys = getRenderedKeysFromWrapper(
            objectsWrapperRef.current,
          );

          if (
            !lastRenderedKeysRef.current ||
            !areKeysEqual(lastRenderedKeysRef.current, renderedKeys)
          ) {
            lastRenderedKeysRef.current = renderedKeys;
            callback(renderedKeys);
          }
        }
      },
      [],
    );

    const updateLoadedElementsKeysLocal = React.useCallback(() => {
      if (!objectsWrapperRef.current) return;

      updateLoadedElementsKeys(
        objectsWrapperRef.current,
        objectsKeys,
        triggerRAF,
        renderLocal.mode,
      );
    }, [renderST]);

    // для обновления ключей при emptyObjects
    const updateEmptyKeysClickLocal = React.useCallback(
      (event: React.MouseEvent) => {
        if (emptyObjectsLocal?.clickTrigger !== undefined) {
          updateEmptyKeysClick(
            event,
            emptyObjectsLocal.clickTrigger,
            updateLoadedElementsKeysLocal,
            tasks,
          );
        }
      },

      [emptyObjectsST, updateLoadedElementsKeysLocal],
    );

    // для обработки onScrollPosition
    const handleScroll = React.useCallback(
      (event: React.UIEvent<HTMLDivElement>) => {
        tasks.cancelTask("removeHover"); // удаляем task

        const el = scrollContentRef.current;
        const mainEl = customScrollRef.current;
        const scrollEl = scrollElementRef.current;

        if (!el || !mainEl || !scrollEl) return;

        /*
         * Кадры собственной анимации к концу — не мнение пользователя о том,
         * где он хочет стоять. Пока библиотека сама везёт эту ось, отметку не
         * трогаем: иначе она успевала записать промежуточное положение как
         * «ушёл вниз» и следующая подгрузка уже никуда не ехала.
         */
        updateAtEnd((dir) => !tasks.hasTask(`smoothScrollBlock${dir}`));

        /*
         * Круг: как только окно ушло из средней копии — переносим позицию на
         * период назад или вперёд. Под окном в этот момент тот же контент, так
         * что подмены не видно; наружу же уходит уже новая позиция, чтобы
         * слушатель не получил ту, которой через кадр не будет.
         */
        if (loopLocal) {
          const rounds = [loopLocal.x, loopLocal.y] as const;

          rounds.forEach((round, axis) => {
            if (!round) return;

            const at = axis === 0 ? scrollEl.scrollLeft : scrollEl.scrollTop;
            const to = loopShift(at, round.period);

            if (to === null || to === at) return;

            if (axis === 0) scrollEl.scrollLeft = to;
            else scrollEl.scrollTop = to;

            /*
             * Колесо и инерция везут не к позиции, а к своей отметке, и
             * читают её каждый кадр. Не сдвинув её вместе с позицией, мы бы
             * тянули окно обратно за границу — и оно ходило бы туда-сюда,
             * пока отметка убегает всё дальше.
             */
            const moved = to - at;

            if (axis === 0) scrollStateRef.current.targetScrollX += moved;
            else scrollStateRef.current.targetScrollY += moved;

            // и цель плавной прокрутки: она едет по своим числам, не по живым
            shiftAim(scrollEl, axis === 0 ? "x" : "y", moved);

            // и сами копии — на столько же, что бы под окном остались те же
            loopSlideRef.current[axis] += Math.round(moved / round.period);

            // до рендера ту же работу делает обёртка, иначе кадр с прыжком
            loopNudgeRef.current[axis] += moved;

            const wrap = objectsWrapperRef.current;

            if (wrap) {
              const [byX, byY] = loopNudgeRef.current;

              wrap.style.transform = `translate(${byX}px, ${byY}px)`;

              /*
               * Перестановка копий — это бухгалтерия, а не движение: объект
               * остаётся там же, где был. Но на боксе может лежать переход, и
               * тогда он честно проанимирует эту перестановку через весь
               * оборот — со стороны объекты уезжают и медленно возвращаются.
               * Гасим переход на тот единственный кадр, в котором координаты
               * меняются.
               */
              for (const box of wrap.children)
                (box as HTMLElement).style.transition = "none";
            }
          });
        }

        /*
         * Кроме позиции отдаём и предел: «докуда ещё можно». Без него
         * подгрузка по приближению к концу требовала считать длину контента
         * самому, а при виртуализации и измеряемом размере её знает только
         * библиотека.
         *
         * Предел берём у самого элемента, а не из посчитанного по пропсам:
         * посчитанное и настоящее расходятся на дробных размерах и когда CSS
         * ужал контент, и тогда позиция до предела просто не доезжает —
         * сравнение с концом не срабатывало бы никогда. Читаем здесь же, где
         * уже прочитаны scrollLeft и scrollTop: раскладка на этот момент
         * посчитана, лишнего пересчёта не будет.
         */
        onScrollPosition?.(scrollEl.scrollLeft, scrollEl.scrollTop, {
          x: Math.max(0, scrollEl.scrollWidth - scrollEl.clientWidth),
          y: Math.max(0, scrollEl.scrollHeight - scrollEl.clientHeight),
        });

        const scrollOrSlider = el.querySelectorAll<HTMLElement>(
          mode === "scroll" ? ".ms-bar" : ".ms-slider",
        );
        if (
          barLocal.showOnHover &&
          scrollOrSlider.length > 0 &&
          !isScrollingRef.current
        ) {
          // доп логика что-бы показать скрытый scrollBar
          scrollOrSlider.forEach((el) => {
            if (!el.classList.contains("ms-hover")) addHover(el, tasks);
          });
        }

        // только на переходе: событий scroll за один жест десятки,
        // а прокрутка началась один раз
        if (!isScrollingRef.current) {
          isScrollingRef.current = true;
          // видно снаружи: по нему вложенные скроллы решают, брать ли колесо
          mainEl.setAttribute(CONST.SCROLLING_ATR, "");
          onScrollingChange?.(true);
        }

        // debounce для финала через setTask
        tasks.setTask(
          () => {
            isScrollingRef.current = false;
            mainEl.removeAttribute(CONST.SCROLLING_ATR);
            onScrollingChange?.(false);
            // всё доехало — отметка о конце тут точно про итоговое положение
            updateAtEnd();
            reportNavigate();
            renderLocal.mode && updateLoadedElementsKeysLocal();

            if (
              barLocal.showOnHover &&
              scrollOrSlider.length > 0 &&
              !clickedObject.current
            ) {
              // этот removeHover убирает scrollbar если он был сдвинуть но курсор мыши не был наведён
              scrollOrSlider.forEach((el) => {
                // добавил в setTask что бы была задержка перед исчезновением thumbs
                tasks.setTask(
                  () => {
                    if (el.hasAttribute("ms-manual-hover")) return; // выход если атрибут
                    removeHover(el, tasks);
                  },
                  1000,
                  "removeHover",
                );
              });
            }
          },
          CONST.SCROLL_END_DELAY,
          "isScrolling",
        );

        tasks.setTask(
          // логика обновления массива при прокрутке
          () => onRenderedKeysChangeUpdate(onRenderedKeysChangeRef.current),
          "raf",
          "onRenderedKeysChange",
        );

        // по-кадровое обновление
        raf.schedule("sliderCheckLocal", () => {
          if (mode !== "scroll") sliderCheckLocal();
          if (showsScrollPosition) triggerUpdate(); // main updater
        });
      },
      [
        onScrollPosition,
        onScrollingChange,
        reportNavigate,
        mode,
        sliderCheckLocal,
        updateLoadedElementsKeysLocal,
        barLocal.showOnHover,
        renderLocal.mode,
        stickLocal.join(), // читается внутри для трекера конца
        loopLocal,
        direction,
        showsScrollPosition,
      ],
    );

    /*
     * Стрелки как Tab, только прицельно: фокус переходит на соседний объект,
     * а прокрутка догоняет его — ровно настолько, что бы он оказался в окне.
     */
    const moveFocusLocal = React.useCallback(
      (
        side: handleArrowT["arrowType"],
        reason: NavigateReason,
        duration: number,
      ) => {
        const scrollEl = scrollElementRef.current;
        const moved = focusStep(objectsWrapperRef.current, scrollEl, side, {
          gap: gapXY,
          margin: [mT, mR, mB, mL],
        });
        if (!moved || !scrollEl) return;

        const axes: ("x" | "y")[] =
          direction === "hybrid" ? ["x", "y"] : [direction];

        const shift = axes.filter((axis) => moved.delta[axis]);
        if (!shift.length) return; // объект и так в окне — двигать нечего

        markNavigate(reason);

        shift.forEach((axis) =>
          smoothScrollLocal(
            (axis === "x" ? scrollEl.scrollLeft : scrollEl.scrollTop) +
              moved.delta[axis],
            axis,
            duration,
          ),
        );
      },
      [
        direction,
        markNavigate,
        smoothScrollLocal,
        gapXY[0],
        gapXY[1],
        mT,
        mR,
        mB,
        mL,
      ],
    );

    const onKeyDown = React.useCallback(
      (e: KeyboardEvent) => {
        if (keyDownX.current) return; // ранний выход

        const keyName =
          typeof controlsLocal.wheel === "object" &&
          typeof controlsLocal.wheel.changeDirectionBtn === "string"
            ? controlsLocal.wheel.changeDirectionBtn
            : "KeyX";

        if (e.code === keyName && direction === "hybrid" && !keyDownX.current) {
          // останавливаем нажатие на кнопку что бы не попасть на родителя если он тоже scroll
          e.stopPropagation();
          keyDownX.current = true;
          triggerRAF();
          return;
        }

        if (!keysLocal) return;

        const side = ARROW_KEYS[e.key];
        if (!side) return;

        // в поле ввода стрелки принадлежат тексту, а не скроллу
        if (isTextEntry(e.target)) return;

        const isVertical = side === "top" || side === "bottom";

        /*
         * По оси прокрутки клавиши делятся только там, где стрелка её и
         * двигает. В режиме фокуса она ходит по сетке, а сетка живёт поперёк
         * оси тоже: в вертикальном списке в два столбца «вправо» — это шаг к
         * соседу, а не попытка прокрутить вбок.
         */
        if (keysLocal.mode !== "focus") {
          if (direction === "x" && isVertical) return;
          if (direction === "y" && !isVertical) return;
        }

        // забираем клавишу себе: иначе прокрутит ещё и браузер, и родитель
        e.preventDefault();
        e.stopPropagation();

        if (keysLocal.mode === "focus") {
          moveFocusLocal(side, "keys", duration);
          return;
        }

        if (keysLocal.mode === "step") {
          handleArrowLocal(side, "keys");
          return;
        }

        const scrollEl = scrollElementRef.current;
        if (!scrollEl) return;

        const axis = isVertical ? "y" : "x";
        const from = axis === "y" ? scrollEl.scrollTop : scrollEl.scrollLeft;
        const delta =
          side === "top" || side === "left" ? -keysLocal.step : keysLocal.step;

        /*
         * Метку не ставим: `pan` — это непрерывное движение, такое же как
         * колесо или перетаскивание. Если оно доедет до новой страницы
         * слайдера, это и есть "scroll".
         */
        smoothScrollLocal(from + delta, axis, duration);
      },

      [
        direction,
        controlsST,
        keysLocal,
        handleArrowLocal,
        moveFocusLocal,
        smoothScrollLocal,
        duration,
      ],
    );
    const onKeyUp = React.useCallback((e: KeyboardEvent) => {
      if (keyDownX.current) {
        // останавливаем нажатие на кнопку что бы не попасть на родителя если он тоже scroll
        e.stopPropagation();
        keyDownX.current = false;
        triggerRAF();
      }
    }, []);

    // ♦ effects
    React.useEffect(() => {
      // эффект заставляет сразу выключать или включать работу onRenderedKeysChange
      if (!onRenderedKeysChange) {
        onRenderedKeysChangeRef.current = undefined;
        lastRenderedKeysRef.current = null;
        return;
      }

      onRenderedKeysChangeRef.current = onRenderedKeysChange;
      lastRenderedKeysRef.current = null;

      onRenderedKeysChangeUpdate(onRenderedKeysChange);
    }, [onRenderedKeysChange, onRenderedKeysChangeUpdate]);

    React.useEffect(() => {
      if (!onRenderedKeysChangeRef.current) return;

      if (!sizeLocal[0] || !sizeLocal[1]) return;

      // логика получения массива ключей
      // (кейсы: первый рендер и при удалении с emptyObjects)
      onRenderedKeysChangeUpdate(onRenderedKeysChangeRef.current);
    }, [keysToken, sizeLocal.join()]);

    React.useEffect(() => {
      // эффект для нажатия клавиш
      if (isTouchedRef.current) return;

      const wrapperEl = objectsWrapperRef.current;
      const scrollEl = scrollElementRef.current;
      if (!wrapperEl || !scrollEl) return;

      /*
       * `changeDirectionBtn` нужен только там, где есть между чем переключать:
       * hybrid, и контент вылезает по обеим осям. `keys` таких условий не
       * ставит — стрелки работают в любом направлении, поэтому слушатель
       * вешается, если нужен хоть кому-то из них.
       */
      const forChangeDirection =
        direction === "hybrid" &&
        wrapperEl.clientWidth! + mLocalX > scrollEl.clientWidth! &&
        wrapperEl.clientHeight! + mLocalY > scrollEl.clientHeight!;

      if (!forChangeDirection && !keysLocal) return;

      scrollEl.addEventListener("keydown", onKeyDown);
      scrollEl.addEventListener("keyup", onKeyUp);

      return () => {
        scrollEl.removeEventListener("keydown", onKeyDown);
        scrollEl.removeEventListener("keyup", onKeyUp);
      };
    }, [
      direction,
      controlsST,
      keysLocal,
      onKeyDown,
      // при изменении размеров
      sizeST,
      objectsSizeST,
      // при изменении количества детей
      keysToken,
      mLocalX,
      mLocalY,
    ]);

    /*
     * Запомненные ключи живут не дольше списка.
     *
     * `"lazy"` тем и живёт, что однажды показанное больше не прячет, — и
     * потому не удаляет ключ никогда. Но список меняется: лента дочитана,
     * фильтр переключён, страница другая. Ключи ушедших объектов оставались
     * в наборе навсегда, и на долгоживущем списке с большой текучестью он рос
     * без предела, храня строки, которым уже ничего не соответствует.
     *
     * Ключ копии в круге несёт хвост с её номером — сравниваем по корню.
     */
    React.useEffect(() => {
      const alive = new Set(validChildrenKeys);
      const rootOf = (key: string) => key.split(CONST.LOOP_KEY_SEP)[0];

      const prune = (set: Set<string> | null) => {
        if (!set) return;

        for (const key of [...set])
          if (!alive.has(rootOf(key))) set.delete(key);
      };

      prune(objectsKeys.current.loaded);
      prune(objectsKeys.current.empty);
    }, [keysToken]);

    React.useEffect(() => {
      if (!emptyObjectsLocal || !renderLocal.mode) return; // ранний выход

      updateLoadedElementsKeysLocal(); // запуск проверки ключей
    }, [
      emptyObjectsST,
      renderLocal.mode,
      updateLoadedElementsKeysLocal,
      validChildrenKeys.length, // при изменении количества детей
    ]);

    React.useEffect(() => {
      if (isTouchedRef.current) return; // при touch устроиствах выключаем

      // wheel вешается вручную что бы выключить scroll e.preventDefault()!
      const scrollEl = scrollElementRef.current;
      const objectsWrapper = objectsWrapperRef.current;
      if (!scrollEl || !objectsWrapper) return;

      const directionWithPriority =
        direction === "hybrid" &&
        typeof controlsLocal.wheel === "object" &&
        controlsLocal.wheel.changeDirection
          ? "x"
          : direction;

      const preferredDirection =
        (direction === "hybrid" &&
          objectsWrapperHeight + mLocalY <= sizeLocal[1]) ||
        keyDownX.current
          ? // уточнение был ли применён changeDirection что бы клавиша меняла уже его направление
            ["hybrid", "y"].includes(directionWithPriority)
            ? "x"
            : "y"
          : directionWithPriority;

      /*
       * Приоритет остаётся приоритетом, но только пока по выбранной оси есть
       * что прокручивать. Иначе `changeDirection` уводил колесо на ось, где
       * контент никуда не выходит — например при hybrid и таком `lines`,
       * при котором ряд помещается целиком, — и скролл замирал совсем.
       */
      const roomOn = (axis: "x" | "y") =>
        maxScrollSize[axis === "x" ? 0 : 1] > 0;

      const other = preferredDirection === "x" ? "y" : "x";
      const directionForWheel =
        preferredDirection !== "hybrid" &&
        !roomOn(preferredDirection) &&
        roomOn(other)
          ? other
          : preferredDirection;

      const wheelHandler = (e: WheelEvent) => {
        /*
         * Событие всплывает, поэтому во вложенных скроллах его ловил и
         * внутренний, и внешний — контент уезжал в обоих сразу. Колесо должно
         * доставаться самому внутреннему.
         *
         * Исключение — внешний скролл прямо сейчас едет. Перехватывать у него
         * колесо посреди движения значит ловить пользователя списком, мимо
         * которого он пролетал; в этом случае пропускаем событие дальше
         * нетронутым.
         */
        if (
          customScrollRef.current?.parentElement?.closest(
            `[${CONST.SCROLLING_ATR}]`,
          )
        )
          return;

        /*
         * Останавливаем событие только если сами его отработали. Упёршись в
         * край, скролл движение не берёт — и тогда оно уходит наружу, к
         * родительскому скроллу или к странице, как у нативной прокрутки.
         */
        const consumed = handleWheel(
          e,
          scrollEl,
          maxScrollSize,
          scrollStateRef.current,
          directionForWheel,
        );

        if (!consumed) return;

        e.stopPropagation();
        e.preventDefault();
      };

      controlsLocal.wheel &&
        scrollEl.addEventListener("wheel", wheelHandler, { passive: false });

      return () => {
        scrollEl.removeEventListener("wheel", wheelHandler);
      };
    }, [
      direction,
      controlsST,
      objectsWrapperHeight,
      sizeLocal[1],
      mLocalY,
      keyDownX.current,
      maxScrollSize.join(),
    ]);

    /*
     * Единственное место, откуда прокрутка уезжает в заданную позицию: сюда
     * приходит и эффект на `scrollPosition`, и команда `scrollTo`.
     *
     * Разница одна — `respectUserScroll`. Декларативный "end" не должен тащить
     * пользователя обратно вниз, если он сам ушёл вверх; явная команда обязана
     * сработать всегда.
     */
    /*
     * В круге число значит место внутри оборота, а не в ленте: лента — приём,
     * и просить «встань на 100» пользователь может только про контент. Едем к
     * ближайшему из повторов: они все одинаковые, и мотать через полкруга,
     * когда рядом такой же, незачем.
     */
    const loopTarget = React.useCallback(
      (dir: "x" | "y", value: number) => {
        const period = loopPeriods[dir === "x" ? 0 : 1];
        const scrollEl = scrollElementRef.current;

        if (!period || !scrollEl) return value;

        const at = dir === "x" ? scrollEl.scrollLeft : scrollEl.scrollTop;
        const inside = ((value % period) + period) % period;
        const ahead = ((inside - at) % period + period) % period;

        return at + (ahead <= period / 2 ? ahead : ahead - period);
      },
      [loopPeriods.join()],
    );

    /*
     * Шаг страницы — один на всю библиотеку: по нему считает стрелка, по нему
     * же отчитывается `onNavigate`, и по нему должно ехать меню слайдера.
     *
     * Раньше меню прыгало на `окно * номер`, забыв про зазор между объектами,
     * — а всё остальное шагает на `окно + зазор`. Промах копился по зазору на
     * страницу: к третьей точке это уже полсотни пикселей мимо.
     */
    const goToPage = React.useCallback(
      (index: number, axis: "x" | "y") => {
        const scrollEl = scrollElementRef.current;
        if (!scrollEl) return;

        const isX = axis === "x";
        const wh = isX ? 0 : 1;
        const period = loopPeriods[wh];

        const clientSize = isX ? scrollEl.clientWidth : scrollEl.clientHeight;
        const { step } = loopPages(
          period,
          clientSize || sizeLocal[wh],
          gapXY[wh],
        );
        if (!(step > 0)) return;

        markNavigate("bar");

        let target = period + Math.round(index * step);

        // в круге едем к ближайшему из повторов, а не через весь оборот
        if (period) {
          const at = isX ? scrollEl.scrollLeft : scrollEl.scrollTop;
          const ahead = (((target - at) % period) + period) % period;

          target = at + (ahead <= period / 2 ? ahead : ahead - period);
        }

        smoothScrollLocal(target, axis, duration);
        raf.schedule("sliderCheckLocal", sliderCheckLocal);
      },
      [
        loopPeriods.join(),
        gapXY.join(),
        sizeLocal.join(),
        markNavigate,
        smoothScrollLocal,
        duration,
        sliderCheckLocal,
      ],
    );

    const applyScrollPosition = React.useCallback(
      (
        target: (number | "end" | null)[],
        duration: number,
        respectUserScroll: boolean,
      ) => {
        // обязательно вызываем всё в одном raf
        raf.schedule("smoothScrollLocal", () => {
          const directions: ("x" | "y")[] =
            direction === "hybrid" ? ["x", "y"] : [direction];

          directions.forEach((dir) => {
            const value = target[dir === "x" ? 0 : 1];

            // "end"
            if (value === "end") {
              // пользователь ушёл от конца читать историю — не тянем обратно
              if (respectUserScroll && !atEndRef.current[dir]) return;

              smoothScrollLocal(
                dir === "x" ? endObjectsWrapper.w : endObjectsWrapper.h,
                dir,
                duration,
              );
            }

            // "number"
            else if (typeof value === "number") {
              lastScrollTargetRef.current[dir] = value;

              smoothScrollLocal(loopTarget(dir, value), dir, duration);
            }
          });
        });
      },
      [
        direction,
        endObjectsWrapper.w,
        endObjectsWrapper.h,
        smoothScrollLocal,
        loopTarget,
      ],
    );

    /*
     * Число — цель разовая: проп говорит «встань сюда», и переприменять его на
     * каждое переизмерение контента нельзя. Раньше он приезжал в зависимости
     * эффекта целиком, вместе со своей ссылкой, и та менялась от роста списка —
     * прокрутка возвращалась на заданное место сама, отменяя всё, что человек
     * успел сделать после: колесо, стрелку, команду через `ref`.
     *
     * "end" — единственное стоячее правило: контент дорос, и мы едем за ним.
     * От ушедшего читать вверх его бережёт `respectUserScroll`.
     */
    const applyScrollPositionRef = React.useRef(applyScrollPosition);
    applyScrollPositionRef.current = applyScrollPosition;

    /*
     * Доставка задержана ровно до того момента, когда цель становится
     * достижимой. Измеряемые размеры приезжают не сразу — при `size="auto"`
     * или `objectsSize="firstChild"` диапазон прокрутки несколько кадров равен
     * нулю, и цель обрезается в ноль. Раньше это лечилось само собой: ссылка
     * применяющей функции менялась от каждого переизмерения и тянула за собой
     * эффект. Но тот же механизм возвращал прокрутку на заданное место и
     * позже, отменяя всё, что человек успел сделать, — колесо, стрелку,
     * команду через `ref`.
     *
     * Теперь повтор ограничен доставкой: ждём, пока диапазон вместит цель или
     * перестанет расти, ставим — и больше проп сам по себе не вмешивается.
     */
    /*
     * «Первый рендер» — это не первый кадр, а всё время, пока прокручивать
     * ещё нечего: до этого момента любая позиция ставится сразу, без анимации,
     * потому что ехать неоткуда. Кадр отсрочки нужен от двойного вызова в
     * StrictMode.
     */
    React.useEffect(() => {
      if (!firstRender.current) return;
      if (maxScrollSize[0] <= 0 && maxScrollSize[1] <= 0) return;

      const id = requestAnimationFrame(() => (firstRender.current = false));
      return () => cancelAnimationFrame(id);
    }, [maxScrollSize.join()]);

    /*
     * Позиция открытия — один раз за жизнь скролла, без анимации и без
     * повторов: `initialPosition` говорит, откуда начать, и ничего больше.
     * Дожидаться измерения не нужно, этим занят сам первый рендер.
     */
    React.useEffect(() => {
      if (!initialTarget) return;

      applyScrollPositionRef.current(initialTarget, 0, false);
    }, []); // именно на монтирование: значение позже не читается

    /*
     * Круг открывается со средней копии, а не с самого начала ленты: из нуля
     * назад не уехать, там край, — и круг бы им и кончился. Ставим один раз на
     * период, а дальше позицию водит подмена в обработчике прокрутки.
     *
     * Период появляется не сразу: пока размер объектов неизвестен, круга нет.
     * Поэтому смотрим на период, а не на монтирование.
     */
    /*
     * Копии стоят не по своим номерам, а со сдвигом. Без него перенос позиции
     * менял то, какая копия под окном: узлы у копий разные, и всё видимое
     * пересоздавалось — контент тот же, а на экране моргание.
     *
     * Со сдвигом всё наоборот: перенося позицию на период назад, на столько же
     * двигаем и копии. Узел остаётся тем же и остаётся на месте — подмену
     * теперь не только не видно, её и React не замечает.
     */
    const loopSlideRef = React.useRef<[number, number]>([0, 0]);

    /*
     * Сдвиг копий доедет только следующим рендером, а позиция меняется сразу —
     * и один кадр контент стоит уехавшим на период. Поэтому тем же движением
     * двигаем обёртку: она едет на столько же и в ту же сторону, так что на
     * экране не меняется ничего. Рендер потом переложит это в сами копии и
     * обёртку отпустит — обмен незаметен, оба слагаемых равны.
     */
    const loopNudgeRef = React.useRef<[number, number]>([0, 0]);

    /*
     * Снимаем сдвиг обёртки сразу после того, как копии встали со своим — до
     * отрисовки, поэтому промежуточного кадра не бывает. Снимаем руками, а не
     * стилем: поставили мы его тоже руками, мимо React, и React о нём не
     * знает — сравнивая со своим прошлым значением, он бы решил, что менять
     * нечего, и сдвиг остался бы навсегда.
     */
    React.useLayoutEffect(() => {
      if (!loopNudgeRef.current[0] && !loopNudgeRef.current[1]) return;

      loopNudgeRef.current = [0, 0];

      const wrap = objectsWrapperRef.current;
      if (!wrap) return;

      wrap.style.transform = "";

      /*
       * Новые координаты уже в разметке; заставляем браузер их принять и
       * только потом возвращаем переходы. Вернуть раньше — значит вернуть до
       * того, как он их учёл, и переход всё-таки запустится.
       */
      void wrap.offsetHeight;

      for (const box of wrap.children) (box as HTMLElement).style.transition = "";
    });

    const loopStartRef = React.useRef("");
    React.useEffect(() => {
      const scrollEl = scrollElementRef.current;
      if (!loopLocal || !scrollEl) return;

      const mark = loopPeriods.join();
      if (loopStartRef.current === mark) return;

      const was = loopStartRef.current
        ? loopStartRef.current.split(",").map(Number)
        : null;

      loopStartRef.current = mark;

      /*
       * Период может смениться под ногами: при измеряемом размере что-то
       * доросло. Прыгать от этого в начало оборота нельзя — под окном стоит
       * то, что читают. Сохраняем место внутри оборота, а не саму позицию:
       * тогда видно примерно то же, что и было.
       */
      const place = (axis: 0 | 1, period: number) => {
        if (!period) return;

        const before = was?.[axis] ?? 0;
        const at = axis === 0 ? scrollEl.scrollLeft : scrollEl.scrollTop;
        const inside = before
          ? Math.min(Math.max(at - before, 0), period - 1)
          : 0;

        if (axis === 0) scrollEl.scrollLeft = period + inside;
        else scrollEl.scrollTop = period + inside;
      };

      place(0, loopPeriods[0]);
      place(1, loopPeriods[1]);
    }, [loopLocal, loopPeriods.join()]);

    /*
     * А это правило, а не движение: контент дорос — едем за ним. От ушедшего
     * читать историю его бережёт `respectUserScroll`.
     */
    React.useEffect(() => {
      if (!stickLocal[0] && !stickLocal[1]) return;

      applyScrollPositionRef.current(
        [stickLocal[0] ? "end" : null, stickLocal[1] ? "end" : null],
        // открываемся уже внизу, а не приезжаем туда на глазах у читателя
        firstRender.current ? 0 : duration,
        true,
      );
    }, [
      stickLocal.join(),
      endObjectsWrapper.w,
      endObjectsWrapper.h,
      duration,
    ]);

    /*
     * Якорь: содержимое выросло сверху — читатель остаётся на месте.
     *
     * Браузер делает это сам, но здесь объекты разложены по координатам, и
     * своей прокрутки, которую можно было бы заякорить, у них нет. Так что
     * подгруженная история сдвигала контент вниз прямо под читающим: он
     * смотрел в десятое сообщение, а после подгрузки в том же месте окна
     * оказывалось двадцатое.
     *
     * Держим не позицию, а объект: запоминаем верхний из видимых и то, на
     * сколько он утоплен за край окна, а после смены списка возвращаем его
     * туда же. Прибавилось сверху, убавилось, переставили — неважно, вопрос
     * всегда один: где теперь тот объект, на который человек смотрел.
     *
     * Отдельного пропа для этого нет намеренно. Правило «не уезжать из-под
     * читателя» не имеет разумной альтернативы, а `stickToEnd` рядом
     * описывает другое — следовать за концом, — и они складываются: стоя в
     * конце, едешь за концом, стоя в середине, стоишь на месте.
     */
    /** where an object sits and how big it is, by its place in the list */
    const boxOf = React.useCallback(
      (index: number) => {
        if (isEach) {
          const item = packed.items[index];
          if (!item)
            return { left: 0, top: 0, width: 0, height: 0 };

          return {
            left: item.left,
            top: item.top,
            width: item.right - item.left,
            height: item.bottom - item.top,
          };
        }

        const isX = direction === "x";
        const isRow = objectsOrder === "row";
        const isRowInDir = (isX && !isRow) || (!isX && isRow);

        const perRow = Math.max(1, objectsPerDirection[0]);
        const perColumn = Math.max(1, objectsPerDirection[1]);

        const groupIndex = isRowInDir
          ? index % perRow
          : Math.floor(index / perColumn);
        const subIndex = isRowInDir
          ? Math.floor(index / perRow)
          : index % perColumn;

        const [leftIndex, topIndex] = isX
          ? [subIndex, groupIndex]
          : [groupIndex, subIndex];

        return {
          left: (objectsSizeLocal[0] + gapLocal[1]) * leftIndex,
          top: (objectsSizeLocal[1] + gapLocal[0]) * topIndex,
          width: objectsSizeLocal[0],
          height: objectsSizeLocal[1],
        };
      },
      [
        isEach,
        packed,
        mainAxis,
        direction,
        objectsOrder,
        objectsPerDirection[0],
        objectsPerDirection[1],
        objectsSizeLocal[0],
        objectsSizeLocal[1],
        gapLocal[0],
        gapLocal[1],
      ],
    );

    const startOf = React.useCallback(
      (index: number) => {
        const box = boxOf(index);

        return mainAxis === 0 ? box.left : box.top;
      },
      [boxOf, mainAxis],
    );

    /*
     * Группы и то, где каждая из них лежит вдоль прокрутки.
     *
     * Группу объект называет в собственном ключе, так что отдельного списка
     * вести не надо. Протяжённость группы считаем по её объектам: у сетки и
     * потока они и так идут подряд, у кладки и заполнения — как лягут, и
     * тогда полоса группы просто шире.
     *
     * Первый объект группы служит ей заголовком: он и прилипает.
     */
    const groupBands = React.useMemo(() => {
      if (objectsGroups !== "sticky") return null;

      const bands: {
        name: string;
        first: number;
        start: number;
        end: number;
      }[] = [];

      validChildrenKeys.forEach((key, index) => {
        const name = groupKey(key);
        if (name === null) return;

        const box = boxOf(index);
        const from = mainAxis === 0 ? box.left : box.top;
        const to = from + (mainAxis === 0 ? box.width : box.height);

        const last = bands[bands.length - 1];

        if (last && last.name === name) {
          last.start = Math.min(last.start, from);
          last.end = Math.max(last.end, to);

          return;
        }

        bands.push({ name, first: index, start: from, end: to });
      });

      return bands.length ? bands : null;
    }, [objectsGroups, keysToken, boxOf, mainAxis]);

    /*
     * Какой заголовок держать у края и где именно.
     *
     * Держим тот, чья полоса накрыла начало окна, и не даём ему налезть на
     * следующий: подъехав, тот выталкивает предыдущий, как и положено.
     */
    const stickyHead = (at: number) => {
      if (!groupBands) return null;

      let held: (typeof groupBands)[number] | null = null;
      let next: (typeof groupBands)[number] | null = null;

      for (let i = 0; i < groupBands.length; i++) {
        const band = groupBands[i];

        if (band.start <= at && at < band.end) {
          held = band;
          next = groupBands[i + 1] ?? null;
          break;
        }
      }

      if (!held) return null;

      const box = boxOf(held.first);
      const size = mainAxis === 0 ? box.width : box.height;

      const pushed = next ? next.start - size : Infinity;

      return { index: held.first, at: Math.max(held.start, Math.min(at, pushed)) };
    };

    const anchorRef = React.useRef<{
      token: string;
      keys: string[];
      startOf: (index: number) => number;
    } | null>(null);

    React.useLayoutEffect(() => {
      const previous = anchorRef.current;
      const remember = () => {
        anchorRef.current = { token: keysToken, keys: validChildrenKeys, startOf };
      };

      // первый список якорить не от чего, круг водит окно сам
      if (!previous || previous.token === keysToken || loopLocal)
        return remember();

      const scrollEl = scrollElementRef.current;
      if (!scrollEl || firstRender.current) return remember();

      const isX = mainAxis === 0;
      const at = isX ? scrollEl.scrollLeft : scrollEl.scrollTop;
      if (at <= 0) return remember(); // стоим в начале — начало никуда не делось

      /*
       * Верхний из видимых в прежнем списке. Перебор здесь не жалко: он
       * случается на смену списка, а не на кадр прокрутки.
       */
      const size = objectsSizeLocal[isX ? 0 : 1];
      let anchor = -1;

      for (let i = 0; i < previous.keys.length; i++)
        if (previous.startOf(i) + size > at) {
          anchor = i;
          break;
        }

      if (anchor === -1) return remember();

      const key = previous.keys[anchor];
      const moved = validChildrenKeys.indexOf(key);
      if (moved === -1) return remember(); // якорь унесли вместе с объектом

      const shift = startOf(moved) - previous.startOf(anchor);
      remember();

      if (!shift) return;

      if (isX) scrollEl.scrollLeft = at + shift;
      else scrollEl.scrollTop = at + shift;

      /*
       * Колесо и плавная прокрутка едут к своим отметкам, а не к живой
       * позиции: не сдвинув отметку, мы бы тут же уехали обратно.
       */
      if (isX) scrollStateRef.current.targetScrollX += shift;
      else scrollStateRef.current.targetScrollY += shift;

      shiftAim(scrollEl, isX ? "x" : "y", shift);
    });

    /*
     * Прокрутка к объекту, а не к пикселю.
     *
     * Пиксель пользователь посчитать не может: при виртуализации объектов в
     * разметке нет, а при измеряемом размере их координаты знает только
     * библиотека. Поэтому спрашивают номером, ключом или названием группы, а
     * место ищем мы.
     */
    const objectIndex = React.useCallback(
      (target: number | string) => {
        const total = validChildrenKeys.length;
        if (!total) return -1;

        if (typeof target === "number")
          return target >= 0 && target < total ? target : -1;

        // сперва как ключ: он уникален, и совпадение тут однозначное
        const byKey = validChildrenKeys.indexOf(target);
        if (byKey !== -1) return byKey;

        // затем как название группы: едем к первому её объекту
        return validChildrenKeys.findIndex((key) => groupKey(key) === target);
      },
      [validChildrenKeys],
    );

    const scrollToObjectLocal = React.useCallback(
      (
        target: number | string,
        options?: {
          duration?: number;
          align?: "start" | "center" | "end";
          reason?: NavigateReason;
        },
      ) => {
        const scrollEl = scrollElementRef.current;
        if (!scrollEl) return;

        const index = objectIndex(target);
        if (index === -1) return;

        const box = boxOf(index);
        const align = options?.align ?? "start";
        const moveDuration = options?.duration ?? duration;

        if (options?.reason) markNavigate(options.reason);

        const axes: ("x" | "y")[] =
          direction === "hybrid" ? ["x", "y"] : [direction];

        axes.forEach((axis) => {
          const isX = axis === "x";
          const wh = isX ? 0 : 1;

          const start = isX ? box.left : box.top;
          const size = isX ? box.width : box.height;
          const view = sizeLocal[wh];

          const room = Math.max(0, view - size);
          const place =
            align === "center" ? room / 2 : align === "end" ? room : 0;

          const period = loopPeriods[wh];
          let to = start - place;

          // в круге место названо внутри оборота, и едем к ближнему повтору
          if (period) {
            const at = isX ? scrollEl.scrollLeft : scrollEl.scrollTop;
            const inside = ((to % period) + period) % period;
            const ahead = (((inside - at) % period) + period) % period;

            to = at + (ahead <= period / 2 ? ahead : ahead - period);
          }

          smoothScrollLocal(Math.round(to), axis, moveDuration);
        });
      },
      [
        objectIndex,
        boxOf,
        direction,
        sizeLocal.join(),
        loopPeriods.join(),
        duration,
        markNavigate,
        smoothScrollLocal,
      ],
    );

    /*
     * Команды держим в ссылке, а наружу отдаём один и тот же объект на всю
     * жизнь скролла.
     *
     * Список зависимостей у `useImperativeHandle` собирал бы объект заново на
     * каждое изменение размеров — а прежний оставался бы у того, кто положил
     * его в переменную или передал дочернему компоненту. И этот прежний молча
     * переставал работать: внутри него размеры ещё нулевые, любая цель
     * обрезается в текущее место, вызов проходит и не делает ничего. Молчащая
     * команда — худший вид поломки, поэтому объект неизменен, а свежие
     * действия достаются из ссылки в момент вызова.
     */
    const commandsRef = React.useRef({
      applyScrollPosition,
      handleArrowLocal,
      moveFocusLocal,
      smoothScrollLocal,
      scrollToObjectLocal,
      markNavigate,
      duration,
    });

    /*
     * Обновляем после коммита, а не в теле: команда действует на то дерево,
     * которое сейчас на экране, а не на то, которое React ещё только считает
     * и может выбросить.
     */
    React.useLayoutEffect(() => {
      commandsRef.current = {
        applyScrollPosition,
        handleArrowLocal,
        moveFocusLocal,
        smoothScrollLocal,
        scrollToObjectLocal,
        markNavigate,
        duration,
      };
    });

    React.useImperativeHandle(
      ref,
      () => ({
        scrollTo: (target, options) =>
          commandsRef.current.applyScrollPosition(
            resolveScrollTarget(target),
            options?.duration ?? commandsRef.current.duration,
            false,
          ),

        /*
         * Те же два действия, что библиотека делает по своим триггерам, но
         * названные наружу. Опрашивать геймпад, слушать пульт или разбирать
         * свои горячие клавиши — не её дело: устройство знает приложение, а
         * `reason` довозит это знание до `onNavigate` нетронутым.
         */
        scrollToObject: (target, options) =>
          commandsRef.current.scrollToObjectLocal(target, options),

        step: (side, options) =>
          commandsRef.current.handleArrowLocal(
            side,
            options?.reason ?? "arrows",
          ),

        pan: (delta, options) => {
          const scrollEl = scrollElementRef.current;
          if (!scrollEl) return;

          const now = commandsRef.current;

          if (options?.reason) now.markNavigate(options.reason);

          const moveDuration = options?.duration ?? now.duration;

          if (delta.x)
            now.smoothScrollLocal(
              scrollEl.scrollLeft + delta.x,
              "x",
              moveDuration,
            );
          if (delta.y)
            now.smoothScrollLocal(
              scrollEl.scrollTop + delta.y,
              "y",
              moveDuration,
            );
        },

        moveFocus: (side, options) =>
          commandsRef.current.moveFocusLocal(
            side,
            options?.reason ?? "keys",
            options?.duration ?? commandsRef.current.duration,
          ),
      }),
      [],
    );

    // эффект запускается раз при старте
    React.useEffect(() => {
      const animationFrameId = scrollStateRef.current.animationFrameId;

      onScrollingChange?.(false); // стартовое состояние


      return () => {
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        if (scrollStateRef.current.animationFrameId)
          cancelAnimationFrame(scrollStateRef.current.animationFrameId);

        raf.cancel();
        rafScrollAnim.cancel();

        /*
         * Раньше здесь нельзя было чистить задачи: менеджер был общий, и
         * `cancelTask()` убивал финал прокрутки у всех скроллов страницы.
         * Теперь менеджер свой, так что снимаем только собственные задачи —
         * вместе с оборванным жестом и курсорным замком.
         */
        tasks.clear();
        pointerRuntime.destroy();
      };
    }, []);

    // регистрация контейнера для auto drag scroll
    React.useEffect(() => {
      if (!autoScrollOnDrag) return;

      const parent = customScrollRef.current;
      const element = scrollElementRef.current;
      if (!parent || !element) return;

      const container = {
        parent,
        element,
        direction,
      };

      registerContainer(container);

      return () => {
        unregisterContainer(container);
      };
    }, [autoScrollOnDrag, direction]);

    // установка слушателя нажатия на обертку
    React.useEffect(() => {
      const scrollEl = scrollElementRef.current;
      if (!scrollEl) return;

      /*
       * С нативным скроллбаром (`progressElement: true`) сам бегунок остаётся
       * частью элемента прокрутки, и нажатие по нему не должно превращаться в
       * перенос контента. Раньше ради этого перенос отключали целиком — то
       * есть `drag: true` рядом с `progressElement: true` просто не работал.
       * Отсекаем только полосу: clientWidth/clientHeight её не включают.
       */
      const isOnNativeBar = (event: PointerEvent) => {
        if (!barLocal.native) return false;

        const rect = scrollEl.getBoundingClientRect();
        return (
          event.clientX > rect.left + scrollEl.clientWidth ||
          event.clientY > rect.top + scrollEl.clientHeight
        );
      };

      const handler = (event: PointerEvent) => {
        if (isOnNativeBar(event)) return;

        /*
         * Жест забирает себе самый внутренний скролл — но только тот, которому
         * есть что прокручивать.
         *
         * Событие всплывает, и вложенный список вместе с внешним получали один
         * и тот же перенос: палец двигал оба сразу, каждый на своё. Колесо
         * решает это тем, что не отдаёт событие дальше, — жест решает так же.
         *
         * Но забирать его нечем, когда ехать некуда: короткий список внутри
         * длинного глотал перенос целиком, и палец на нём не двигал ничего.
         * Такой пропускает жест наружу, к тому, кто им распорядится.
         *
         * Элементы со своим переносом сюда не относятся: на них жест не
         * начинается вовсе, и глушить событие нельзя — по нему работает
         * автопрокрутка у края.
         */
        if (hasOwnDrag(event.target as Element | null)) return;

        const room =
          direction === "hybrid"
            ? maxScrollSize[0] > 0 || maxScrollSize[1] > 0
            : maxScrollSize[direction === "x" ? 0 : 1] > 0;

        if (!room) return;

        event.stopPropagation();
        onMouseOrTouchDown("wrapp", event);
      };

      // сложное условие...
      if (
        controlsLocal.drag ||
        (!controlsLocal.drag &&
          isTouchedRef.current &&
          controlsLocal.wheel)
      )
        scrollEl.addEventListener("pointerdown", handler);

      return () => {
        scrollEl.removeEventListener("pointerdown", handler);
      };
    }, [controlsST, onMouseOrTouchDown, direction, maxScrollSize.join()]);

    // установка слушателя нажатия на scrollContentRef
    React.useEffect(() => {
      const el = scrollContentRef.current;
      if (!el || !barLocal.showOnHover) return;

      if (!scrollBarsRef.current.size) return;

      const handler = (event: PointerEvent | MouseEvent) => {
        // динамический mouseup в таком виде помог решить проблему с исчезновением и залипанием thumb
        if (event.type === "mouseenter")
          document.removeEventListener("mouseup", handler);
        if (event.type === "mouseleave" && clickedObject.current) {
          document.addEventListener("mouseup", handler);
          return;
        }

        Array.from(scrollBarsRef.current).forEach((el) => {
          hoverHandler({
            el,
            event,
            tasks,
            isScrolling: isScrollingRef,
          });
        });
      };

      const listenersHandler = (
        type: "addEventListener" | "removeEventListener",
        fn: (event: any) => void,
      ) => {
        if (isTouchedRef.current) {
          Array.from(scrollBarsRef.current).forEach((el) =>
            el[type]("pointerdown", fn),
          ); // на сам thumb
          document[type]("pointerup", fn);
          document[type]("pointercancel", fn);
        } else {
          el[type]("mouseenter", fn);
          el[type]("mouseleave", fn);
        }
      };

      listenersHandler("addEventListener", handler);

      return () => {
        listenersHandler("removeEventListener", handler);
      };
    }, [
      barLocal.showOnHover,
      mode,
      // почему-то при изменении direction отваливается ивент
      direction,
      scrollBarsRef.current.size,
    ]);

    // отделил потому что size может вычисляться позже при "auto"
    React.useEffect(() => {
      if (mode === "scroll") return;
      raf.schedule("sliderCheckLocal", sliderCheckLocal);
    }, [mode, sliderCheckLocal, sizeLocal.join()]);

    /*
     * Стартовую страницу надо запомнить до первого перехода, иначе первому
     * же нажатию стрелки не с чем будет сравниться и оно потеряется.
     */
    React.useEffect(() => {
      if (!onNavigate) return;

      raf.schedule("navigateStart", () => {
        pageRef.current = { x: pageNow("x"), y: pageNow("y") };
      });
    }, [!!onNavigate, pageNow, sizeLocal.join()]);

    // ♦ contents
    const scrollObjectWrapper = React.useCallback(
      (
        key: string,
        elementTop?: number,
        left?: number,
        children?: React.ReactNode,
        visibility?: number | null,
        domKey?: string,
        index?: number,
        /** held against the leading edge as its group scrolls past */
        pinned?: boolean,
      ) => {
        /*
         * Сторону задаём только ту, которую объект себе не выбирает: за
         * остальным его и меряют. Разложено абсолютно — в потоке ни колонок
         * разной высоты, ни строк разной ширины не собрать.
         */
        const sidePx = (axis: 0 | 1) => {
          const px = isEach ? eachFixed[axis] : objectsSizeLocal[axis];

          return px ? `${px}px` : undefined;
        };

        const wrapStyle: React.CSSProperties = {
          width: sidePx(0),
          height: sidePx(1),
          ...(byCoords && {
            position: "absolute",
            transform: `translate(${left}px, ${elementTop}px)`,
          }),
          ...(typeof visibility === "number" && {
            [CONST.CONTENT_VISIBILITY_VAR]: visibility,
          }),
          // соседи по разметке идут после него, иначе они бы его накрыли
          ...(pinned && { zIndex: 1 }),
        };

        const content = suspending ? (
          <React.Suspense fallback={fallbackLocal}>{children}</React.Suspense>
        ) : (
          children
        );

        return (
          <div
            key={domKey ?? key}
            {...(byCoords || emptyObjectsLocal
              ? {
                  [CONST.WRAP_ATR]: `${key}`,
                }
              : {})}
            ref={isEach ? sizes.refFor(key) : undefined}
            className={`ms-object-box${pinned ? " ms-sticky" : ""}`}
            /*
             * С виртуализацией в разметке лежит окно из десятка объектов, и
             * без счёта скринридер объявил бы список из десятка. Номер и
             * общее число читаются только внутри роли, которая их
             * поддерживает, — поэтому роль и счёт идут вместе, и только по
             * просьбе: карточки, слайды и меню списком называть неверно.
             */
            {...(objectsSemantics === "list" && index !== undefined
              ? {
                  role: "listitem",
                  "aria-setsize": validChildrenKeys.length,
                  "aria-posinset": index + 1,
                }
              : {})}
            style={wrapStyle}
            onClick={emptyObjectsLocal ? updateEmptyKeysClickLocal : undefined}
          >
            {content}
          </div>
        );
      },
      [
        suspending,
        !!fallbackLocal, // просто проверка на наличие, но не на изменение, думаю этого достаточно
        objectsSizeLocal[0],
        objectsSizeLocal[1],
        renderST,
        emptyObjectsST,
        objectsPerDirection[0],
        objectsSemantics,
        validChildrenKeys.length,
        objectsGroups,
        updateEmptyKeysClickLocal,
        renderLocal.mode,
        isEach,
        eachFixed.join(),
        sizes,
        loopLocal,
      ],
    );

    const childrenMap = React.useMemo(() => {
      const m = new Map<string, React.ReactElement>();
      childrenArray.forEach((ch) => {
        if (React.isValidElement(ch) && ch.key != null)
          m.set(childKey(String(ch.key)), ch);
      });
      return m;
    }, [childrenArray]);

    /*
     * Номер копии — это ключ, а место ей выбирает сдвиг: одна и та же копия
     * переезжает по ленте, а не заменяется соседней.
     */
    /*
     * Отражать горизонталь можно, только пока по ней не едут: у вертикального
     * списка она поперечная и решает лишь порядок колонок.
     */
    const mirrorX = pageDirection === "rtl" && direction === "y" && byCoords;

    const loopPlace = (copy: number, axis: 0 | 1) => {
      const round = axis === 0 ? loopLocal?.x : loopLocal?.y;
      if (!round) return 0;

      const slid = copy + loopSlideRef.current[axis];
      const slot = ((slid % round.copies) + round.copies) % round.copies;

      return slot * round.period;
    };

    const renderChild = (
      key: string,
      index: number,
      scrollLeft: number,
      scrollTop: number,
      copyX: number = 0,
      copyY: number = 0,
      /** where to hold this one instead of where it naturally lies */
      pin?: number,
    ) => {
      /*
       * Копия — тот же ребёнок, сдвинутый на период. При `hybrid` копии лежат
       * решёткой, поэтому их две координаты. Ключ для React у копии свой,
       * иначе одинаковые ключи среди соседей, а наружу — в `ms-wrap-id` и в
       * `onRenderedKeysChange` — уходит по-прежнему тот ключ, который написал
       * пользователь: копии его дело не касаются.
       */
      const domKey =
        copyX || copyY
          ? `${key}${CONST.LOOP_KEY_SEP}${copyX}-${copyY}`
          : key;
      const shiftX = loopPlace(copyX, 0);
      const shiftY = loopPlace(copyY, 1);
      // ищем реальный child по ключу
      const child = childrenMap.get(key);

      // обработка детей когда их лучше не показывать
      const childRenderOnScroll =
        renderLocal.deferLoadOnScroll &&
        isScrollingRef.current &&
        !objectsKeys.current.loaded.has(domKey)
          ? fallbackLocal
          : objectsKeys.current.empty?.has(key)
            ? (emptyObjectsLocal?.fallback ?? fallbackLocal)
            : child;

      // доп обработка для ResizeTracker
      const childLocal =
        (objectsSizing[0] === "firstChild" ||
          objectsSizing[1] === "firstChild") &&
        index === 0 ? (
          // for first child
          <ResizeTracker onResize={childResize}>
            {childRenderOnScroll}
          </ResizeTracker>
        ) : (
          childRenderOnScroll
        );

      // ===== NO VIRTUAL =====
      if (!byCoords)
        return scrollObjectWrapper(
          key,
          0,
          0,
          childLocal,
          undefined,
          domKey,
          index,
              pin !== undefined,
        );

      /*
       * Курица и яйцо: при `objectsSize: "firstChild"` размер ячейки берётся
       * из первого ребёнка, а он завёрнут в ResizeTracker внутри этой же
       * функции. Пока размер неизвестен, все координаты нулевые, проверка
       * видимости даёт 0, и первый ребёнок не рендерится — значит и не
       * измеряется. Список так и оставался пустым.
       *
       * Поэтому первого ребёнка показываем безусловно, пока мерять нечего.
       */
      if (needsFirstChildMeasure && index === 0)
        return scrollObjectWrapper(
          key,
          0,
          0,
          childLocal,
          undefined,
          domKey,
          index,
              pin !== undefined,
        );

      // обработка виртуализации
      const placed = memoizedChildrenData[index];
      let top = placed.top + shiftY;
      let bottom = placed.bottom + shiftY;
      let left = placed.left + shiftX;
      let right = placed.right + shiftX;

      /*
       * Зеркалим горизонталь там, где она не ось прокрутки.
       *
       * На странице, которую читают справа налево, ряд карточек обязан идти
       * оттуда же. Координаты здесь считаются в пикселях от левого края, и
       * пока горизонталь поперечная, отражение — чистая раскладка: ни отсчёт
       * прокрутки, ни страницы, ни бегунок её не касаются.
       *
       * Ось прокрутки так не отразить: «начало справа» означает, что ноль
       * прокрутки у правого края, а это уже другая система координат.
       * Горизонтальный список поэтому пока идёт слева направо и на своей оси.
       */
      if (mirrorX) {
        const width = right - left;

        left = objectsWrapperWidth - right;
        right = left + width;
      }

      /*
       * Заголовок группы стоит там, где его держат, а не там, где он лежит.
       * Видимость при этом считается по удержанному месту — он в окне ровно
       * потому, что его туда и поставили.
       */
      if (pin !== undefined) {
        if (mainAxis === 0) {
          const width = right - left;
          left = pin;
          right = pin + width;
        } else {
          const height = bottom - top;
          top = pin;
          bottom = pin + height;
        }
      }

      /*
       * Доля видимости объекта.
       *
       * Округление здесь нужно переменной `--ms-content-visibility`: без него
       * она меняется на каждый пиксель и заставляет браузер пересчитывать
       * стиль по кадру. Но по этому же округлённому числу решалось, рисовать
       * ли объект вообще, и объект, видимый меньше чем на пять процентов,
       * округлялся в ноль и не рисовался — у края окна оставалась пустая
       * полоса в те самые проценты. Решение теперь по настоящей доле,
       * округление осталось переменной.
       */
      const getVisibilityRatio = (
        withRootMargin: boolean = true,
        round: boolean = false,
      ): number => {
        const rootMarginLocal = withRootMargin ? mRootLocal : [0, 0, 0, 0];

        const checkAxis = (dir: "x" | "y") => {
          const viewportStart = dir === "x" ? scrollLeft : scrollTop;
          const viewportEnd =
            viewportStart + (dir === "x" ? sizeLocal[0] : sizeLocal[1]);

          /*
           * rootMargin приходит в CSS-порядке [top, right, bottom, left], но
           * растягиваем мы бокс элемента, а не вьюпорт, поэтому стороны идут
           * крест-накрест: что бы дотянуться до того, что ниже/правее, надо
           * растянуть начало бокса — туда уходит bottom/right, а в конец
           * top/left. По оси x стороны были перепутаны местами.
           */
          const [marginBefore, marginAfter] =
            dir === "x"
              ? [rootMarginLocal[3], rootMarginLocal[1]]
              : [rootMarginLocal[0], rootMarginLocal[2]];

          const elStart = (dir === "x" ? left : top) - marginAfter;
          const elEnd = (dir === "x" ? right : bottom) + marginBefore;

          const elementSize = elEnd - elStart;
          if (elementSize <= 0) return 0;

          const visible =
            Math.min(elEnd, viewportEnd) - Math.max(elStart, viewportStart);

          if (visible <= 0) return 0;

          const ratio = Math.min(1, visible / elementSize);

          return round ? Math.round(ratio * 10) / 10 : ratio;
        };

        if (direction === "hybrid") {
          const x = checkAxis("x");
          const y = checkAxis("y");
          return Math.min(x, y);
        }

        return direction === "x" ? checkAxis("x") : checkAxis("y");
      };
      const visibilityRatioWithoutMargin = renderLocal.trackVisibility
        ? getVisibilityRatio(false, true)
        : null;

      if (isEach) {
        /*
         * Неизмеренный объект надо нарисовать, иначе мерить нечего — но не
         * всех сразу: тысяча карточек в первом кадре и есть та задержка,
         * ради которой всё это делается. Рисуем очередную пачку за уже
         * измеренными, остальные ждут своей.
         */
        if (!packed.items[index]?.measured)
          return index < packed.measuredPrefix + CONST.MEASURE_BATCH
            ? scrollObjectWrapper(
                key,
                top,
                left,
                childLocal,
                visibilityRatioWithoutMargin,
                domKey,
              index,
              pin !== undefined,
              )
            : null;
      }

      /*
       * Отрисовку никто не сужал — рисуем всё. Долю видимости при этом всё
       * равно отдаём: считать её мешала не отрисовка, а отсутствие координат,
       * и раз они есть, скрывать её незачем.
       */
      if (!renderLocal.mode)
        return scrollObjectWrapper(
          key,
          top,
          left,
          childLocal,
          visibilityRatioWithoutMargin,
          domKey,
              index,
              pin !== undefined,
        );

      const visibilityRatio = getVisibilityRatio();

      // - LAZY -
      if (renderLocal.mode === "lazy") {
        /*
         * Раньше только что ставший видимым элемент попадал в loaded, но этот
         * же проход всё равно возвращал null — элемент появлялся лишь на
         * следующем рендере. В приложении тик приходил быстро и это выглядело
         * морганием, а на первом кадре список был просто пустым.
         */
        if (!objectsKeys.current.loaded.has(domKey)) {
          if (!visibilityRatio) return null;

          // откладываем первую отрисовку пока идёт прокрутка
          if (isScrollingRef.current && renderLocal.deferLoadOnScroll)
            return null;

          objectsKeys.current.loaded.add(domKey);
        }

        return scrollObjectWrapper(
          key,
          top,
          left,
          childLocal,
          visibilityRatioWithoutMargin,
          domKey,
              index,
              pin !== undefined,
        );
      }

      // - VIRTUAL -
      if (!visibilityRatio) {
        objectsKeys.current.loaded.delete(domKey); // удаляем из loaded
        return null;
      }

      return scrollObjectWrapper(
        key,
        top,
        left,
        childLocal,
        visibilityRatioWithoutMargin,
        domKey,
              index,
              pin !== undefined,
      );
    };

    const getEdgeOrArrowData = React.useMemo(
      () => [
        {
          positionType: direction === "x" ? "left" : "top",
          visibility: isNotAtStart,
        },
        {
          positionType: direction === "x" ? "right" : "bottom",
          visibility: isNotAtEnd,
        },
        ...(direction === "hybrid"
          ? [
              { positionType: "left", visibility: isNotAtStartX },
              { positionType: "right", visibility: isNotAtEndX },
            ]
          : []),
      ],
      [isNotAtStart, isNotAtEnd, direction, isNotAtStartX, isNotAtEndX],
    );

    const containerStyle = React.useMemo(
      (): React.CSSProperties => ({
        // стрелки позиционируются внутри компонента — без этого они уезжали
        // к любому позиционированному предку выше по дереву
        position: "relative",
        width: `${sizeLocal[2]}px`,
        height: `${sizeLocal[3]}px`,
      }),
      [sizeLocal],
    );

    const overflowStyleValue = React.useMemo(() => {
      const map = {
        x: objectsWrapperWidthFull > sizeLocal[0] ? "scroll hidden" : "hidden",
        y: objectsWrapperHeightFull > sizeLocal[1] ? "hidden scroll" : "hidden",
        hybrid: `${
          objectsWrapperWidthFull > sizeLocal[0] ? "scroll" : "hidden"
        } ${objectsWrapperHeightFull > sizeLocal[1] ? "scroll" : "hidden"}`,
        hide: "hidden",
      };
      /*
       * Ветка эта работает только при нативном бегунке, а нативный бегунок
       * без переполнения браузер не рисует вовсе: `controls={{ bar: true }}`
       * давал коробку, в которой ничего не двигается и ничего не видно.
       */
      return (
        map[
          barLocal.native ||
          controlsLocal.wheel ||
          (controlsLocal.drag && mode === "scroll")
            ? direction
            : "hide"
        ] ?? "hidden"
      );
    }, [
      objectsWrapperWidthFull,
      objectsWrapperHeightFull,
      sizeLocal,
      controlsST,
      direction,
      barLocal.native,
    ]);

    const edgesJSX = React.useMemo(() => {
      if (!edge) return null;

      return getEdgeOrArrowData.map(({ positionType, visibility }) => (
        <Edge
          key={`edge-${positionType}`}
          element={edgeLocal.element}
          size={edgeLocal.size}
          visibility={visibility}
          edgeType={positionType as "left" | "right" | "top" | "bottom"}
        />
      ));
    }, [edgeST, getEdgeOrArrowData, edgeLocal, sizeST]);

    const arrowsJSX = React.useMemo(() => {
      if (!controlsLocal.arrows) return null;

      return getEdgeOrArrowData.map(({ positionType, visibility }) => (
        <Arrow
          key={`arrow-${positionType}`}
          visibility={visibility}
          arrows={arrowsLocal}
          arrowType={positionType as handleArrowT["arrowType"]}
          handleArrow={handleArrowLocal}
        />
      ));
    }, [controlsST, getEdgeOrArrowData, arrowsLocal, handleArrowLocal]);

    const scrollBarConfigs = () => {
      const isNotX = direction !== "x";

      /*
       * Меряем оборотом, а не лентой: лента в круге длиннее окна всегда — на
       * то она и лента, — и бар выходил бы даже там, где показывать нечего:
       * оборот целиком в окне, бегунок во всю дорожку и неподвижен.
       */
      const base: any[] = [
        {
          shouldRender:
            (isNotX ? barSpan.h : barSpan.w) > sizeLocal[isNotX ? 1 : 0],
          direction,
          thumbSize: isNotX ? thumbSizeMemo.y : thumbSizeMemo.x,
          thumbSpace: isNotX ? thumbSpace.y : thumbSpace.x,
          objLengthPerSize: objLengthPerSizeXY,
          progressReverseIndex: 0,
        },
        {
          shouldRender: direction === "hybrid" && barSpan.w > sizeLocal[0],
          direction: "x" as const,
          thumbSize: thumbSizeMemo.x,
          thumbSpace: thumbSpace.x,
          objLengthPerSize: objLengthPerSize[0],
          progressReverseIndex: 1,
        },
      ];

      return base.filter(({ shouldRender }) => shouldRender);
    };

    const scrollBarsJSX = () => {
      // нативный скроллбар браузера рисует себя сам
      if (!barLocal.present || barLocal.native) return null;

      return scrollBarConfigs().map((args) => {
        /*
         * Половину пары выбирает ось самого бара, а не его место в списке:
         * первый бар бывает и горизонтальным — при `direction="x"`, — и тогда
         * по индексу ему доставались настройки вертикального.
         */
        const axis = args.direction === "x" ? 0 : 1;

        return (
          <ScrollBar
            key={args.direction}
            mode={mode}
            direction={args.direction}
            pageDirection={pageDirection}
            element={barLocal.element}
            reverse={barLocal.reverse[axis]}
            edgeGap={barLocal.edgeGap[axis]}
            showOnHover={barLocal.showOnHover}
            size={sizeMinusEdge}
            controls={[controlsLocal, controlsST]}
            scrollBarEvent={onMoveScrollThumb}
            goToPage={goToPage}
            thumbSize={args.thumbSize}
            thumbSpace={args.thumbSpace}
            objLengthPerSize={args.objLengthPerSize}
            sliderCheckLocal={sliderCheckLocal}
            markNavigate={markNavigate}
            duration={duration}
            isTouched={isTouchedRef.current}
            scrollStateRef={scrollStateRef}
            scrollEl={scrollElementRef}
            scrollBarsRef={scrollBarsRef}
            triggerUpdate={triggerRAF}
            overscroll={overscrollRef}
            maxScrollSize={maxScrollSize}
          />
        );
      });
    };

    // objects wrapper - рендерим только видимые элементы при виртуализации
    const objectsWrapper = () => {
      const scrollLeft = scrollElementRef.current?.scrollLeft || 0;
      const scrollTop = scrollElementRef.current?.scrollTop || 0;

      /*
       * Копия — тот же список, сдвинутый на своё место в ленте. Окно у неё то
       * же самое, только смотрит на него окно прокрутки, отодвинутое назад на
       * этот сдвиг; сам `renderChild` при этом получает настоящее положение.
       */
      /*
       * Удерживаемый заголовок обязан быть нарисован, где бы он ни лежал: его
       * место — у края окна, а не там, где он оказался бы сам, и окно про
       * него ничего не знает.
       */
      const head = stickyHead(mainAxis === 0 ? scrollLeft : scrollTop);

      const draw = (copyX = 0, copyY = 0) => {
        const asked = visibleIndices(
          scrollLeft - loopPlace(copyX, 0),
          scrollTop - loopPlace(copyY, 1),
        );

        const pinOf = (i: number) =>
          head && head.index === i ? head.at : undefined;

        if (!asked)
          return validChildrenKeys.map((key, i) =>
            renderChild(key, i, scrollLeft, scrollTop, copyX, copyY, pinOf(i)),
          );

        const list = head && !asked.includes(head.index)
          ? [head.index, ...asked]
          : asked;

        return list.map((i) =>
          renderChild(
            validChildrenKeys[i],
            i,
            scrollLeft,
            scrollTop,
            copyX,
            copyY,
            pinOf(i),
          ),
        );
      };

      return (
        <div
          className="ms-objects-wrapper"
          ref={objectsWrapperRef}
          {...(objectsSemantics === "list" ? { role: "list" } : {})}
          style={{
            ...wrapperStyle,
            ...((overscrollRef.current.x || overscrollRef.current.y) && {
              transform: `translate(${overscrollRef.current.x}px, ${overscrollRef.current.y}px)`,
            }),
            ...(isDraggingRef.current && { pointerEvents: "none" }), // отключаем pointerEvents при перетаскивании что бы не было проблем с захватом thumb
          }}
        >
          {loopLocal
            ? Array.from({ length: loopLocal.x?.copies ?? 1 }, (_, copyX) =>
                Array.from({ length: loopLocal.y?.copies ?? 1 }, (_, copyY) =>
                  draw(copyX, copyY),
                ),
              )
            : draw()}
        </div>
      );
    };

    const contentBoxStyle = React.useMemo(() => {
      const base: any = {
        position: "relative",
        width: `${sizeLocal[0]}px`,
        height: `${sizeLocal[1]}px`,
      };

      if (
        controlsLocal.arrows &&
        arrowsLocal.reserveSpace &&
        arrowsLocal.size
      ) {
        if (direction === "x") base.left = `${arrowsLocal.size}px`;
        else if (direction === "y") base.top = `${arrowsLocal.size}px`;
        else {
          base.top = `${arrowsLocal.size}px`;
          base.left = `${arrowsLocal.size}px`;
        }
      }

      return base;
    }, [sizeLocal, controlsST, arrowsLocal, direction]);

    const content = (
      <div
        /*
         * Атрибут — маркер присутствия: autoScrollRegistry ищет ближайший
         * `[morph-scroll]`, значение никто не читает. Печатать сюда id нельзя —
         * он из модульного счётчика, на сервере и на клиенте счёт разный, и
         * гидрация ловила несовпадение атрибутов. id остаётся в текстах ошибок.
         */
        morph-scroll=""
        className={className}
        ref={customScrollRef}
        style={containerStyle}
      >
        <div
          className="ms-content"
          ref={scrollContentRef}
          style={{
            ...contentBoxStyle,
            transform: "translateZ(0)", // помогает оптимизировать отображение
            // блокируем touch оставляя только zoom (тут что бы захватить thumb)
            ...(isTouchedRef.current && {
              touchAction: "pinch-zoom",
            }),
          }}
        >
          <div
            className="ms-viewport"
            ref={scrollElementRef}
            onScroll={handleScroll}
            tabIndex={0} // ! для работы событий onKeyDown и onKeyUp
            style={{
              width: "100%",
              height: "100%",
              outline: "none",
              /*
               * Сторону отсчёта `scrollLeft` задаёт направление самого
               * прокручиваемого элемента. На арабской или ивритской странице
               * оно наследуется как `rtl`, и тогда ноль оказывается у правого
               * края, а влево прокрутка уходит в минус — вся арифметика,
               * которая считает от нуля вправо, ломается молча.
               *
               * Здесь координаты объектов считаются в пикселях от левого края,
               * поэтому и отсчёт прокрутки закрепляем таким же. Направление
               * страницы при этом не теряется: обёртка ниже возвращает его
               * содержимому, а вместе с ним и порядок в потоке.
               */
              direction: "ltr",
              ...wrapperAlignLocal,
              ...(!barLocal.native
                ? {
                    scrollbarWidth: "none",
                    overflow: "hidden",
                  }
                : { overflow: overflowStyleValue }),
              ...(controlsLocal.drag && { cursor: "grab" }),
            }}
          >
            {objectsSizeLocal[0] && objectsSizeLocal[1] ? (
              objectsWrapper()
            ) : (
              <ResizeTracker onResize={wrapResize} style={wrapperAlignLocal}>
                {objectsWrapper()}
              </ResizeTracker>
            )}
          </div>

          {edgesJSX}
          {scrollBarsJSX()}
        </div>

        {arrowsJSX}
      </div>
    );

    if (size === "auto") {
      return (
        <ResizeTracker measure="outer" onResize={scrollResize}>
          {content}
        </ResizeTracker>
      );
    } else {
      return content;
    }
  },
);

MorphScroll.displayName = "MorphScroll";
export default MorphScroll;
