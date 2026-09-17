import React from "react";

import { MorphScroll, ResizeTracker } from "@morphing-scroll/src";
import logo from "@morphing-scroll/src/assets/morphing-scroll.svg";
import type {
  MorphScroll as MorphScrollProps,
  MorphScrollHandle,
  ScrollTarget,
  NavigateEvent,
  ControlsConfig,
  WrapperConfig,
} from "@morphing-scroll/src/types/types";

import type { Align } from "./dashboard/settings";
import {
  alignOptions,
  defaultSettings,
  directionOptions,
  eachHint,
  eachPair,
  modeOptions,
  renderOptions,
  useStoredSettings,
} from "./dashboard/settings";
import { numberOrUndefined } from "./utils";
import {
  Field,
  NumberField,
  PropCard,
  Section,
  SegmentedField,
  SelectField,
  TextField,
  ToggleField,
} from "./dashboard/fields";
import { buildSnippet } from "./dashboard/snippet";
import buildStyles from "./dashboard/styles";
import Code from "./dashboard/Code";
import { buildItems, buildProgressMenu } from "./custom/items";
import type { PadSample } from "./custom/gamepad";
import { useGamepadScroll } from "./custom/gamepad";
import ScrollThumb from "./custom/ScrollThumb";

function App() {
  const [settings, setSettings, update] = useStoredSettings();
  const [scrollLeft, setScrollLeft] = React.useState(0);
  const [scrollTop, setScrollTop] = React.useState(0);
  const [isScrolling, setIsScrolling] = React.useState(false);
  const [lastNavigate, setLastNavigate] = React.useState<NavigateEvent | null>(
    null,
  );
  const [renderedKeys, setRenderedKeys] = React.useState<string[]>([]);
  const [resizeRect, setResizeRect] = React.useState({ width: 0, height: 0 });
  const [scrollXInput, setScrollXInput] = React.useState(0);
  const [scrollYInput, setScrollYInput] = React.useState(0);
  const [scrollDuration, setScrollDuration] = React.useState(220);
  const [pad, setPad] = React.useState<PadSample | null>(null);
  /* панель складывается до полоски — тогда в окно влезают любые размеры */
  const [panelOpen, setPanelOpen] = React.useState(true);
  /* код нужен не всегда: сначала собирают скролл, потом забирают JSX */
  const [codeOpen, setCodeOpen] = React.useState(false);
  const [codeTab, setCodeTab] = React.useState<"css" | "jsx">("jsx");
  const scrollRef = React.useRef<MorphScrollHandle>(null);

  useGamepadScroll(
    scrollRef,
    settings.gamepad,
    setPad,
    settings.keys && settings.keysMode === "focus" ? "focus" : "step",
  );

  /* имена секций — те же, что уходят в ключи объектов */
  /*
   * Плашка отмечена, когда проп и правда уходит в компонент со своим
   * значением. Сверяем с умолчаниями библиотеки, а не стенда: поля обёртки,
   * зазоры и бегунок стенд ставит сам, и это ровно то, что компонент
   * получает сверх своего умолчания. Список читается как код в панели ниже.
   */
  const touched = React.useMemo(() => {
    const objectsSize = settings.objectsSizeMode !== "default";
    const gap = settings.gapX > 0 || settings.gapY > 0;
    const lines = settings.lines > 0;
    const objectsAlign = settings.objectsAlign !== "start";
    const order = settings.objectsOrder !== "row";
    const empty = settings.emptyMode !== "off";

    const wrapperAlign =
      settings.wrapperAlignX !== "start" || settings.wrapperAlignY !== "start";
    const margin = [
      settings.wrapperMarginTop,
      settings.wrapperMarginRight,
      settings.wrapperMarginBottom,
      settings.wrapperMarginLeft,
    ].some((value) => value > 0);
    const minSize = settings.wrapperMinMode !== "off";

    // умолчание библиотеки — `{ wheel: true, keys: true }`, остальное молчит
    const wheel =
      !settings.wheel ||
      settings.wheelChangeDirection ||
      settings.wheelChangeDirectionBtn !== "";
    const keys = !settings.keys || settings.keysMode !== "pan";
    const bar = settings.progressElementMode !== "off";

    return {
      className: settings.className !== "",
      mode: settings.mode !== "scroll",
      direction: settings.direction !== "y",
      fromRight: settings.fromRight,
      stickToEnd: settings.stickToEnd,
      loop: settings.loop,
      autoScrollOnDrag: settings.autoScrollOnDrag,
      objectsSize,
      gap,
      lines,
      objectsAlign,
      order,
      empty,
      objects: objectsSize || gap || lines || objectsAlign || order || empty,
      wrapperAlign,
      margin,
      minSize,
      wrapper: wrapperAlign || margin || minSize,
      wheel,
      drag: settings.contentDrag,
      keys,
      bar,
      arrows: settings.arrows,
      controls: wheel || settings.contentDrag || keys || bar || settings.arrows,
      edge: settings.edge,
      render: settings.renderMode !== "off",
      trackVisibility: settings.trackVisibility,
      suspending: settings.suspending,
      fallback: settings.fallbackText !== "",
      onScrollPosition: settings.enableOnScrollValue,
      onScrollingChange: settings.enableIsScrolling,
      onNavigate: settings.enableOnNavigate,
      onRenderedKeysChange: settings.enableOnRenderedKeysChange,
    };
  }, [settings]);

  const sectionNames = React.useMemo(
    () =>
      settings.sectionSize > 0
        ? Array.from(
            { length: Math.ceil(settings.itemCount / settings.sectionSize) },
            (_, i) => `s${i + 1}`,
          ).slice(0, 6)
        : [],
    [settings.itemCount, settings.sectionSize],
  );

  const [objectTarget, setObjectTarget] = React.useState("s3");
  const [objectAlign, setObjectAlign] = React.useState<Align>("start");

  const [copyState, setCopyState] = React.useState<"copied" | "idle">("idle");

  /*
   * Порядок живёт отдельно от настроек: его меняет перетаскивание, а не
   * панель. Ключи у объектов свои и переезжают вместе с ними — на этом же
   * проверяется, что измеренные размеры помнятся по ключу, а не по месту.
   */
  const [order, setOrder] = React.useState<number[]>(() =>
    Array.from({ length: settings.itemCount }, (_, i) => i),
  );
  /*
   * Что несут и над кем держат. Порядок меняется на отпускании, а не на ходу:
   * так видно, куда объект встанет, и список не пляшет под указателем.
   */
  const [drag, setDrag] = React.useState<{
    id: number;
    over: number | null;
    x: number;
    y: number;
  } | null>(null);
  const dragRef = React.useRef<{ id: number; over: number | null } | null>(null);
  const ghostRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setOrder(Array.from({ length: settings.itemCount }, (_, i) => i));
  }, [settings.itemCount]);

  const onGrab = React.useCallback((id: number, event: React.PointerEvent) => {
    if (event.button !== 0) return;

    /*
     * Свой жест, свои последствия: библиотека блокирует выделение текста на
     * время СВОЕГО перетаскивания, но об этом жесте она не знает и знать не
     * должна — `ms-custom-drag` просит её не лезть в него.
     */
    event.preventDefault();
    document.body.classList.add("no-select");

    const from = event.currentTarget as HTMLElement;
    // указатель мог уже отпуститься — тогда захват просто не нужен
    try {
      from.setPointerCapture(event.pointerId);
    } catch {
      /* пусто: жест и без захвата слушает документ */
    }

    dragRef.current = { id, over: null };
    setDrag({ id, over: null, x: event.clientX, y: event.clientY });

    const move = (moveEvent: PointerEvent) => {
      /*
       * Миниатюру двигаем прямо по узлу: на каждый шаг указателя перерисовывать
       * список из семидесяти объектов незачем.
       */
      if (ghostRef.current)
        ghostRef.current.style.transform = `translate(${moveEvent.clientX}px, ${moveEvent.clientY}px)`;

      /*
       * Над кем держим, спрашиваем у документа: считать по координатам нельзя
       * — при `"auto"` объекты разного размера, и сетки просто нет.
       */
      from.style.pointerEvents = "none";
      const under = document
        .elementFromPoint(moveEvent.clientX, moveEvent.clientY)
        ?.closest<HTMLElement>("[data-item]");
      from.style.pointerEvents = "";

      const found = under ? Number(under.dataset.item) : Number.NaN;
      const over = Number.isNaN(found) ? null : found;

      if (dragRef.current?.over === over) return;

      dragRef.current = { id, over };
      setDrag((current) => current && { ...current, over });
    };

    const drop = () => {
      const held = dragRef.current;

      dragRef.current = null;
      setDrag(null);
      document.body.classList.remove("no-select");
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerup", drop);
      document.removeEventListener("pointercancel", drop);

      if (!held || held.over === null || held.over === held.id) return;

      setOrder((current) => {
        const at = current.indexOf(held.id);
        const to = current.indexOf(held.over!);
        if (at === -1 || to === -1 || at === to) return current;

        const next = [...current];
        next.splice(at, 1);
        next.splice(to, 0, held.id);

        return next;
      });
    };

    document.addEventListener("pointermove", move);
    document.addEventListener("pointerup", drop);
    document.addEventListener("pointercancel", drop);
  }, []);

  const children = React.useMemo(
    () =>
      buildItems(
        settings,
        order,
        settings.reorder ? onGrab : undefined,
        drag?.id ?? null,
        drag?.over ?? null,
      ),
    [settings, order, onGrab, drag],
  );
  const progressMenu = React.useMemo(
    () => buildProgressMenu(settings.itemCount),
    [settings.itemCount],
  );

  const size = React.useMemo<MorphScrollProps["size"]>(() => {
    if (settings.sizeMode === "auto") return "auto";
    if (settings.sizeMode === "square") return settings.squareSize;
    return [settings.width, settings.height];
  }, [settings.height, settings.sizeMode, settings.squareSize, settings.width]);

  const objectsSize = React.useMemo<
    NonNullable<MorphScrollProps["objects"]>["size"]
  >(() => {
    if (settings.objectsSizeMode === "default") return undefined;
    if (settings.objectsSizeMode === "number") return settings.objectWidth;
    if (settings.objectsSizeMode === "pair")
      return [settings.objectWidth, settings.objectHeight];

    if (settings.objectsSizeMode === "auto") return eachPair(settings);

    return settings.objectsSizeMode;
  }, [settings]);

  const wrapperMargin = React.useMemo<WrapperConfig["margin"]>(() => {
    const values = [
      settings.wrapperMarginTop,
      settings.wrapperMarginRight,
      settings.wrapperMarginBottom,
      settings.wrapperMarginLeft,
    ] as const;

    return values.some(Boolean) ? [...values] : undefined;
  }, [
    settings.wrapperMarginBottom,
    settings.wrapperMarginLeft,
    settings.wrapperMarginRight,
    settings.wrapperMarginTop,
  ]);

  const wrapperMinSize = React.useMemo<WrapperConfig["minSize"]>(() => {
    if (settings.wrapperMinMode === "off") return undefined;
    if (settings.wrapperMinMode === "full") return "full";
    if (settings.wrapperMinMode === "number") return settings.wrapperMinWidth;
    return [settings.wrapperMinWidth, settings.wrapperMinHeight];
  }, [
    settings.wrapperMinHeight,
    settings.wrapperMinMode,
    settings.wrapperMinWidth,
  ]);

  const edge = React.useMemo<MorphScrollProps["edge"]>(() => {
    if (!settings.edge) return false;

    /*
     * Узел пишем один раз — так, как он выглядит сверху. По остальным сторонам
     * его развернёт библиотека, а толщину полосы получит из `size`.
     */
    return {
      size: settings.edgeSize,
      element: <div className="playground-edge" />,
    };
  }, [settings.edge, settings.edgeSize]);

  const progressElement = React.useMemo<
    React.ReactNode | React.ReactNode[] | boolean
  >(() => {
    if (settings.progressElementMode === "off") return false;
    if (settings.mode === "sliderMenu") return progressMenu;
    if (settings.progressElementMode === "native") return true;
    if (settings.mode === "slider")
      return <span className="slider-progress-dot" />;
    return <ScrollThumb />;
  }, [progressMenu, settings.progressElementMode, settings.mode]);

  const render = React.useMemo<MorphScrollProps["render"]>(() => {
    if (settings.renderMode === "off") return undefined;

    return {
      mode: settings.renderMode,
      rootMargin: settings.rootMargin,
      deferLoadOnScroll: settings.deferLoadOnScroll,
    };
  }, [settings.renderMode, settings.rootMargin, settings.deferLoadOnScroll]);

  const emptyObjects = React.useMemo<
    NonNullable<MorphScrollProps["objects"]>["empty"]
  >(() => {
    if (settings.emptyMode === "off") return undefined;
    if (settings.emptyMode === "clear") return "clear";
    if (settings.emptyMode === "fallback") return "fallback";
    return {
      clickTrigger: { delay: 220, selector: ".item-action" },
      mode: "fallback",
    };
  }, [settings.emptyMode]);

  const morphProps = React.useMemo<MorphScrollProps>(
    () => ({
      className: ["playground-scroll", settings.className]
        .filter(Boolean)
        .join(" "),

      direction: settings.direction,
      fromRight: settings.fromRight,
      autoScrollOnDrag: settings.autoScrollOnDrag,
      edge,

      fallback:
        settings.emptyMode === "off"
          ? <div className="cell-fallback">{settings.fallbackText}</div>
          : {
              loading: <div className="cell-fallback">{settings.fallbackText}</div>,
              empty: <div className="empty-fallback">empty</div>,
            },

      onScrollingChange: settings.enableIsScrolling
        ? setIsScrolling
        : undefined,
      objects: {
        size: objectsSize,
        gap:
          settings.gapX === settings.gapY
            ? settings.gapX
            : [settings.gapX, settings.gapY],
        lines: numberOrUndefined(settings.lines),
        align: settings.objectsAlign,
        order: settings.objectsOrder,
        empty: emptyObjects,
      },
      onNavigate: settings.enableOnNavigate ? setLastNavigate : undefined,
      onRenderedKeysChange: settings.enableOnRenderedKeysChange
        ? setRenderedKeys
        : undefined,
      onScrollPosition: settings.enableOnScrollValue
        ? (left, top) => {
            setScrollLeft(left);
            setScrollTop(top);
          }
        : undefined,
      controls: {
        arrows: settings.arrows
          ? {
              reserveSpace: settings.arrowContentReduce,
              element: <span className="arrow-mark">&gt;</span>,
                  size: settings.arrowSize,
            }
          : false,
        drag: settings.contentDrag,
        keys: settings.keys
          ? { mode: settings.keysMode, step: settings.keysStep }
          : false,
        bar:
          typeof progressElement === "boolean"
            ? progressElement
            : {
                edgeGap: [settings.barEdgeGapX, settings.barEdgeGapY],
                element: progressElement,
                reverse: [settings.barReverseX, settings.barReverseY],
                showOnHover: settings.barShowOnHover,
                thumbMinSize: settings.barThumbMinSize,
                trackGap: [settings.barTrackGapX, settings.barTrackGapY],
              },
        wheel: settings.wheel
          ? {
              changeDirection: settings.wheelChangeDirection,
              ...(settings.wheelChangeDirectionBtn && {
                changeDirectionBtn: settings.wheelChangeDirectionBtn,
              }),
            }
          : false,
      },
      render,
      trackVisibility: settings.trackVisibility,
      stickToEnd: settings.stickToEnd,
      loop: settings.loop,
      duration: scrollDuration,
      size,
      suspending: settings.suspending,
      mode: settings.mode,
      wrapper: {
        align: [settings.wrapperAlignX, settings.wrapperAlignY],
        margin: wrapperMargin,
        minSize: wrapperMinSize,
      },
    }),
    [
      edge,
      emptyObjects,
      objectsSize,
      progressElement,
      render,
      scrollDuration,
      settings,
      size,
      wrapperMargin,
      wrapperMinSize,
    ],
  );

  const handleResize = React.useCallback((rect: Partial<DOMRectReadOnly>) => {
    setResizeRect((current) => {
      const width = Math.round(rect.width || 0);
      const height = Math.round(rect.height || 0);
      if (current.width === width && current.height === height) return current;
      return { height, width };
    });
  }, []);

  const applyScroll = React.useCallback(
    (mode: "clear" | "end" | "start" | "value") => {
      let value: ScrollTarget = null;

      if (mode === "start") value = settings.direction === "hybrid" ? [0, 0] : 0;
      if (mode === "end")
        value = settings.direction === "hybrid" ? ["end", "end"] : "end";
      if (mode === "value")
        value =
          settings.direction === "hybrid"
            ? [scrollXInput, scrollYInput]
            : settings.direction === "x"
              ? scrollXInput
              : scrollYInput;


      /*
       * Единственный способ съездить куда-то по кнопке — команда: она
       * выполняется всегда, в том числе на то же самое значение.
       */
      scrollRef.current?.scrollTo(value, { duration: scrollDuration });
    },
    [scrollDuration, scrollXInput, scrollYInput, settings.direction],
  );

  const generatedCode = React.useMemo(
    () => buildSnippet(settings, scrollDuration),
    [scrollDuration, settings],
  );

  /*
   * Вторая вкладка — оформление: библиотека не несёт ни одного цвета, и
   * первый вопрос у нового человека не про пропсы, а про то, за что
   * цепляться в CSS. Текст вырезается из стилей самого стенда.
   */
  const generatedStyles = React.useMemo(
    () => buildStyles(settings),
    // тема меняет подставляемые значения токенов, поэтому она в зависимостях
    [settings],
  );
  const shownCode = codeTab === "jsx" ? generatedCode : generatedStyles;

  const copyGeneratedCode = React.useCallback(async () => {
    await navigator.clipboard.writeText(shownCode);
    setCopyState("copied");
    window.setTimeout(() => setCopyState("idle"), 1200);
  }, [shownCode]);

  /* системная тема ничего не ставит — её решает сам браузер */
  React.useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === "system") root.removeAttribute("data-theme");
    else root.dataset.theme = settings.theme;
  }, [settings.theme]);

  return (
    <main className={`app-shell${panelOpen ? "" : " is-folded"}`}>
      <aside className="control-panel">
        <div className="brand-row">
          {/* знак красим сами: форму берём маской, цвет — из темы */}
          <span
            className="brand-mark"
            style={{ "--mark": `url("${logo}")` } as React.CSSProperties}
          />
          <span className="brand-name">morphing-scroll</span>
          <button
            aria-label={panelOpen ? "collapse" : "expand"}
            className="panel-fold"
            onClick={() => setPanelOpen((current) => !current)}
            type="button"
          >
            {panelOpen ? "←" : "→"}
          </button>
          <div className="brand-actions">
            <div className="theme-switch">
              {(["system", "light", "dark"] as const).map((name) => (
                <button
                  aria-pressed={settings.theme === name}
                  key={name}
                  onClick={() => update("theme", name)}
                  type="button"
                >
                  {name}
                </button>
              ))}
            </div>
            <button
              className="ghost-btn reset-btn"
              onClick={() =>
                setSettings({ ...defaultSettings, theme: settings.theme })
              }
              type="button"
            >
              reset
            </button>
          </div>
        </div>

        {/*
         * Стенд отдельно, API отдельно: здесь то, чего в пропсах нет вовсе.
         * Дальше — по плашке на проп, вложенные пропсы вложенными плашками.
         */}
        <Section title="demo">
          <PropCard
            control={
              <NumberField
                label=""
                max={1200}
                min={1}
                onChange={(value) => update("itemCount", value)}
                value={settings.itemCount}
              />
            }
            active
            defaultOpen
            name="children"
          >
            <ToggleField
              label="mixed sizes"
              onChange={(value) => update("variableItems", value)}
              value={settings.variableItems}
            />
            <ToggleField
              label="buttons inside"
              onChange={(value) => update("interactiveItems", value)}
              value={settings.interactiveItems}
            />
            <p className="sub-note">
              a button in every object: the target of{" "}
              <code>objects.empty</code> → <code>clickTrigger</code>, and a
              list made of buttons still drags from any point
            </p>
            <NumberField
              label="section size"
              max={200}
              min={0}
              onChange={(value) => update("sectionSize", value)}
              value={settings.sectionSize}
            />
            <p className="sub-note">
              sections are cut into equal runs and named on each child itself:
              <code>ms-group=&quot;s2&quot;</code>. That is the name{" "}
              <code>scrollToObject</code> takes. 0 turns them off.
            </p>
            <ToggleField
              label="drag to reorder"
              onChange={(value) => update("reorder", value)}
              value={settings.reorder}
            />
            {settings.reorder && (
              <div className="hint-line">
                objects carry <code>ms-custom-drag</code>, so the scroll leaves
                the gesture alone — turn on <code>autoScrollOnDrag</code> to
                have the edges follow
              </div>
            )}
          </PropCard>

          <PropCard
            control={
              <ToggleField
                label=""
                onChange={(value) => update("gamepad", value)}
                value={settings.gamepad}
              />
            }
            active={settings.gamepad}
            enabled={settings.gamepad}
            name="gamepad"
          >
            <p className="sub-note">
              the README recipe, running live on the same <code>ref</code>:
              right stick pans, d-pad steps — or walks the objects, when{" "}
              <code>keys</code> is set to <code>focus</code>. Browsers hide a
              pad until it sends something: press any button once.
            </p>
            <div className="pad-meter">
              <b>{!pad ? "waiting" : "connected"}</b>
              {pad && (
                <code>
                  {[
                    pad.axes.map(([i, v]) => `${i}:${v}`).join(" "),
                    pad.buttons.length ? `btn ${pad.buttons.join(" ")}` : "",
                  ]
                    .filter(Boolean)
                    .join("  ·  ") || "idle"}
                </code>
              )}
            </div>
          </PropCard>
        </Section>

        <Section title="general">
          <PropCard
            control={
              <input
                onChange={(event) => update("className", event.target.value)}
                placeholder="custom class"
                value={settings.className}
              />
            }
            active={touched.className}
            name="className"
            note="children are the objects themselves — the stand builds them, see demo"
          />
        </Section>

        <Section title="scroll">
          <PropCard
            control={
              <SelectField
                label=""
                onChange={(value) => update("mode", value)}
                options={modeOptions}
                value={settings.mode}
              />
            }
            active={touched.mode}
            name="mode"
          />
          <PropCard
            control={
              <SelectField
                label=""
                onChange={(value) => update("direction", value)}
                options={directionOptions}
                value={settings.direction}
              />
            }
            active={touched.direction}
            name="direction"
            note="hybrid gives both axes — the props below start asking for two values"
          />
          <PropCard
            control={
              <ToggleField
                label=""
                onChange={(value) => update("fromRight", value)}
                value={settings.fromRight}
              />
            }
            active={touched.fromRight}
            name="fromRight"
            note="the list begins at the right and runs leftwards; the objects themselves are left alone"
          />
          <PropCard
            control={
              <ToggleField
                label=""
                onChange={(value) => update("stickToEnd", value)}
                value={settings.stickToEnd}
              />
            }
            active={touched.stickToEnd}
            name="stickToEnd"
          />
          <PropCard
            control={
              <ToggleField
                label=""
                onChange={(value) => update("loop", value)}
                value={settings.loop}
              />
            }
            active={touched.loop}
            name="loop"
          />
          <PropCard
            control={
              <NumberField
                label=""
                max={5000}
                onChange={setScrollDuration}
                value={scrollDuration}
              />
            }
            active={scrollDuration !== 200}
            name="duration"
            note="how long a move of the library's own takes; the ref commands take it too"
          />
          <PropCard
            control={
              <ToggleField
                label=""
                onChange={(value) => update("autoScrollOnDrag", value)}
                value={settings.autoScrollOnDrag}
              />
            }
            active={touched.autoScrollOnDrag}
            name="autoScrollOnDrag"
          />

          <PropCard name="ref">
            <PropCard defaultOpen name="scrollTo">
              {settings.direction !== "y" && (
                <NumberField
                  label="value x"
                  max={20000}
                  onChange={setScrollXInput}
                  value={scrollXInput}
                />
              )}
              {settings.direction !== "x" && (
                <NumberField
                  label="value y"
                  max={20000}
                  onChange={setScrollYInput}
                  value={scrollYInput}
                />
              )}
              <div className="scroll-command-row">
                <button onClick={() => applyScroll("value")} type="button">
                  value
                </button>
                <button onClick={() => applyScroll("start")} type="button">
                  0
                </button>
                <button onClick={() => applyScroll("end")} type="button">
                  end
                </button>
                <button onClick={() => applyScroll("clear")} type="button">
                  null
                </button>
              </div>
              <p className="sub-note">
                the same target twice works — a command does something now
              </p>
            </PropCard>

            <PropCard name="step · pan">
              <div className="scroll-command-row">
                <button
                  onClick={() =>
                    scrollRef.current?.step(
                      settings.direction === "x" ? "left" : "top",
                      { reason: "playground" },
                    )
                  }
                  type="button"
                >
                  step ←
                </button>
                <button
                  onClick={() =>
                    scrollRef.current?.step(
                      settings.direction === "x" ? "right" : "bottom",
                      { reason: "playground" },
                    )
                  }
                  type="button"
                >
                  step →
                </button>
                <button
                  onClick={() =>
                    scrollRef.current?.pan(
                      settings.direction === "x" ? { x: -80 } : { y: -80 },
                      { reason: "playground" },
                    )
                  }
                  type="button"
                >
                  pan ←
                </button>
                <button
                  onClick={() =>
                    scrollRef.current?.pan(
                      settings.direction === "x" ? { x: 80 } : { y: 80 },
                      { reason: "playground" },
                    )
                  }
                  type="button"
                >
                  pan →
                </button>
              </div>
              <p className="sub-note">
                how any other device connects; the reason reaches{" "}
                <code>onNavigate</code> as given
              </p>
            </PropCard>

            <PropCard name="scrollToObject">
              <TextField
                label="target"
                onChange={setObjectTarget}
                placeholder="12, item-12 or s3"
                value={objectTarget}
              />
              <SegmentedField
                label="align"
                onChange={setObjectAlign}
                options={alignOptions}
                value={objectAlign}
              />
              <div className="scroll-command-row">
                <button
                  onClick={() => {
                    /*
                     * Целью может быть и место в списке, и ключ, и имя группы
                     * — число отличаем от имени здесь, а не заставляем это
                     * делать библиотеку.
                     */
                    const asNumber = Number(objectTarget);
                    const target =
                      objectTarget.trim() !== "" && !Number.isNaN(asNumber)
                        ? asNumber
                        : objectTarget;

                    scrollRef.current?.scrollToObject(target, {
                      align: objectAlign,
                      duration: scrollDuration,
                      reason: "playground",
                    });
                  }}
                  type="button"
                >
                  go
                </button>
                {sectionNames.map((name) => (
                  <button
                    key={name}
                    onClick={() => {
                      setObjectTarget(name);
                      scrollRef.current?.scrollToObject(name, {
                        align: objectAlign,
                        duration: scrollDuration,
                        reason: "playground",
                      });
                    }}
                    type="button"
                  >
                    {name}
                  </button>
                ))}
              </div>
              <p className="sub-note">
                a place in the list, a child&apos;s <code>key</code>, or the
                name of a section
              </p>
            </PropCard>
          </PropCard>
        </Section>

        <Section title="layout">
          <PropCard
            control={
              <SelectField
                label=""
                onChange={(value) => update("sizeMode", value)}
                options={["fixed", "square", "auto"] as const}
                value={settings.sizeMode}
              />
            }
            defaultOpen
            enabled={settings.sizeMode !== "auto"}
            active={true}
            name="size"
          >
            {settings.sizeMode === "fixed" && (
              <>
                <NumberField
                  label="x"
                  max={1400}
                  min={120}
                  onChange={(value) => update("width", value)}
                  value={settings.width}
                />
                <NumberField
                  label="y"
                  max={1000}
                  min={120}
                  onChange={(value) => update("height", value)}
                  value={settings.height}
                />
              </>
            )}
            {settings.sizeMode === "square" && (
              <NumberField
                label="side"
                max={1000}
                min={120}
                onChange={(value) => update("squareSize", value)}
                value={settings.squareSize}
              />
            )}
          </PropCard>

          <PropCard defaultOpen active={touched.objects}
            name="objects">
            <PropCard
              control={
                <SelectField
                  label=""
                  onChange={(value) => update("objectsSizeMode", value)}
                  options={
                    [
                      "default",
                      "number",
                      "pair",
                      "full",
                      "firstChild",
                      "auto",
                    ] as const
                  }
                  value={settings.objectsSizeMode}
                />
              }
              enabled={["number", "pair", "auto"].includes(
                settings.objectsSizeMode,
              )}
              active={touched.objectsSize}
            name="size"
            >
              {settings.objectsSizeMode === "number" && (
                <NumberField
                  label="both sides"
                  max={600}
                  min={20}
                  onChange={(value) => update("objectWidth", value)}
                  value={settings.objectWidth}
                />
              )}
              {settings.objectsSizeMode === "pair" && (
                <>
                  <NumberField
                    label="x"
                    max={600}
                    min={20}
                    onChange={(value) => update("objectWidth", value)}
                    value={settings.objectWidth}
                  />
                  <NumberField
                    label="y"
                    max={600}
                    min={20}
                    onChange={(value) => update("objectHeight", value)}
                    value={settings.objectHeight}
                  />
                </>
              )}
              {settings.objectsSizeMode === "auto" && (
                <>
                  <SegmentedField
                    label="each side"
                    onChange={(value) => update("eachSide", value)}
                    options={["main", "cross", "both"] as const}
                    value={settings.eachSide}
                  />
                  <div className="hint-line">{eachHint(settings)}</div>
                  {settings.eachSide !== "both" && (
                    <NumberField
                      label={
                        eachPair(settings)[0] === "auto" ? "fixed y" : "fixed x"
                      }
                      max={600}
                      min={20}
                      onChange={(value) =>
                        update(
                          eachPair(settings)[0] === "auto"
                            ? "objectHeight"
                            : "objectWidth",
                          value,
                        )
                      }
                      value={
                        eachPair(settings)[0] === "auto"
                          ? settings.objectHeight
                          : settings.objectWidth
                      }
                    />
                  )}
                  <div className="two-col">
                    <NumberField
                      label="min"
                      max={600}
                      min={20}
                      onChange={(value) => update("eachMin", value)}
                      step={10}
                      value={settings.eachMin}
                    />
                    <NumberField
                      label="max"
                      max={600}
                      min={20}
                      onChange={(value) => update("eachMax", value)}
                      step={10}
                      value={settings.eachMax}
                    />
                  </div>
                  <div className="two-col">
                    <NumberField
                      label="round to"
                      max={100}
                      min={1}
                      onChange={(value) => update("eachStep", value)}
                      value={settings.eachStep}
                    />
                    <button
                      className="ghost-btn"
                      onClick={() => update("eachSeed", settings.eachSeed + 1)}
                      type="button"
                    >
                      reshuffle
                    </button>
                  </div>
                  <p className="sub-note">
                    min, max and round to are the stand&apos;s own: they give
                    the demo objects their sizes, so that{" "}
                    <code>&quot;auto&quot;</code> has something to measure
                  </p>
                </>
              )}
            </PropCard>

            <PropCard defaultOpen active={touched.gap}
            name="gap">
              <NumberField
                label="x"
                max={80}
                onChange={(value) => update("gapX", value)}
                value={settings.gapX}
              />
              <NumberField
                label="y"
                max={80}
                onChange={(value) => update("gapY", value)}
                value={settings.gapY}
              />
            </PropCard>

            <PropCard
              control={
                <NumberField
                  label=""
                  max={20}
                  onChange={(value) => update("lines", value)}
                  value={settings.lines}
                />
              }
              active={touched.lines}
            name="lines"
            />
            <PropCard
              control={
                <SelectField
                  label=""
                  onChange={(value) => update("objectsAlign", value)}
                  options={alignOptions}
                  value={settings.objectsAlign}
                />
              }
              active={touched.objectsAlign}
            name="align"
            />
            <PropCard
              control={
                <SelectField
                  label=""
                  onChange={(value) => update("objectsOrder", value)}
                  options={["row", "column"] as const}
                  value={settings.objectsOrder}
                />
              }
              active={touched.order}
            name="order"
            />
            <PropCard
              control={
                <SelectField
                  label=""
                  onChange={(value) => update("emptyMode", value)}
                  options={
                    ["off", "clear", "fallback", "fallbackWithClick"] as const
                  }
                  value={settings.emptyMode}
                />
              }
              active={touched.empty}
            name="empty"
            />
          </PropCard>

          <PropCard active={touched.wrapper}
            name="wrapper">
            <PropCard defaultOpen active={touched.wrapperAlign}
            name="align">
              <SelectField
                label="x"
                onChange={(value) => update("wrapperAlignX", value)}
                options={alignOptions}
                value={settings.wrapperAlignX}
              />
              <SelectField
                label="y"
                onChange={(value) => update("wrapperAlignY", value)}
                options={alignOptions}
                value={settings.wrapperAlignY}
              />
            </PropCard>

            <PropCard active={touched.margin}
            name="margin">
              <NumberField
                label="top"
                max={200}
                onChange={(value) => update("wrapperMarginTop", value)}
                value={settings.wrapperMarginTop}
              />
              <NumberField
                label="right"
                max={200}
                onChange={(value) => update("wrapperMarginRight", value)}
                value={settings.wrapperMarginRight}
              />
              <NumberField
                label="bottom"
                max={200}
                onChange={(value) => update("wrapperMarginBottom", value)}
                value={settings.wrapperMarginBottom}
              />
              <NumberField
                label="left"
                max={200}
                onChange={(value) => update("wrapperMarginLeft", value)}
                value={settings.wrapperMarginLeft}
              />
            </PropCard>

            <PropCard
              control={
                <SelectField
                  label=""
                  onChange={(value) => update("wrapperMinMode", value)}
                  options={["off", "number", "pair", "full"] as const}
                  value={settings.wrapperMinMode}
                />
              }
              enabled={["number", "pair"].includes(settings.wrapperMinMode)}
              active={touched.minSize}
            name="minSize"
            >
              <NumberField
                label="x"
                max={1600}
                onChange={(value) => update("wrapperMinWidth", value)}
                value={settings.wrapperMinWidth}
              />
              {settings.wrapperMinMode === "pair" && (
                <NumberField
                  label="y"
                  max={1600}
                  onChange={(value) => update("wrapperMinHeight", value)}
                  value={settings.wrapperMinHeight}
                />
              )}
            </PropCard>
          </PropCard>
        </Section>

        <Section title="progress">
          <PropCard defaultOpen active={touched.controls}
            name="controls">
            <PropCard
              control={
                <ToggleField
                  label=""
                  onChange={(value) => update("wheel", value)}
                  value={settings.wheel}
                />
              }
              enabled={settings.wheel && settings.direction === "hybrid"}
              active={touched.wheel}
            name="wheel"
            >
              <ToggleField
                label="changeDirection"
                onChange={(value) => update("wheelChangeDirection", value)}
                value={settings.wheelChangeDirection}
              />
              <Field label="changeDirectionBtn">
                <input
                  onChange={(event) =>
                    update("wheelChangeDirectionBtn", event.target.value)
                  }
                  placeholder="Shift"
                  value={settings.wheelChangeDirectionBtn}
                />
              </Field>
            </PropCard>

            <PropCard
              control={
                <ToggleField
                  label=""
                  onChange={(value) => update("contentDrag", value)}
                  value={settings.contentDrag}
                />
              }
              active={touched.drag}
            name="drag"
            />

            <PropCard
              control={
                <ToggleField
                  label=""
                  onChange={(value) => update("keys", value)}
                  value={settings.keys}
                />
              }
              enabled={settings.keys}
              active={touched.keys}
            name="keys"
            >
              <SelectField
                label="mode"
                onChange={(value) => update("keysMode", value)}
                options={["pan", "step", "focus"] as const}
                value={settings.keysMode}
              />
              {settings.keysMode === "pan" && (
                <NumberField
                  label="step"
                  max={400}
                  min={4}
                  onChange={(value) => update("keysStep", value)}
                  value={settings.keysStep}
                />
              )}
              <p className="sub-note">
                the arrows work while the scroll has focus — click it, or Tab
                to it
              </p>
            </PropCard>

            <PropCard
              control={
                <SelectField
                  label=""
                  onChange={(value) => update("progressElementMode", value)}
                  options={["custom", "native", "off"] as const}
                  value={settings.progressElementMode}
                />
              }
              enabled={settings.progressElementMode === "custom"}
              active={touched.bar}
            name="bar"
            >
              <ToggleField
                label="showOnHover"
                onChange={(value) => update("barShowOnHover", value)}
                value={settings.barShowOnHover}
              />
              <NumberField
                label="thumbMinSize"
                max={400}
                min={8}
                onChange={(value) => update("barThumbMinSize", value)}
                value={settings.barThumbMinSize}
              />
              {settings.direction !== "y" && (
                <div className="axis-block">
                  <span className="axis-tag">x</span>
                  <ToggleField
                    label="reverse"
                    onChange={(value) => update("barReverseX", value)}
                    value={settings.barReverseX}
                  />
                  <NumberField
                    label="trackGap"
                    max={100}
                    onChange={(value) => update("barTrackGapX", value)}
                    value={settings.barTrackGapX}
                  />
                  <NumberField
                    label="edgeGap"
                    max={100}
                    min={-100}
                    onChange={(value) => update("barEdgeGapX", value)}
                    value={settings.barEdgeGapX}
                  />
                </div>
              )}
              {settings.direction !== "x" && (
                <div className="axis-block">
                  <span className="axis-tag">y</span>
                  <ToggleField
                    label="reverse"
                    onChange={(value) => update("barReverseY", value)}
                    value={settings.barReverseY}
                  />
                  <NumberField
                    label="trackGap"
                    max={100}
                    onChange={(value) => update("barTrackGapY", value)}
                    value={settings.barTrackGapY}
                  />
                  <NumberField
                    label="edgeGap"
                    max={100}
                    min={-100}
                    onChange={(value) => update("barEdgeGapY", value)}
                    value={settings.barEdgeGapY}
                  />
                </div>
              )}
              {settings.direction === "hybrid" && (
                <p className="sub-note">
                  each axis has its own bar, and a bar exists while its axis
                  has room to go
                </p>
              )}
            </PropCard>

            <PropCard
              control={
                <ToggleField
                  label=""
                  onChange={(value) => update("arrows", value)}
                  value={settings.arrows}
                />
              }
              enabled={settings.arrows}
              active={touched.arrows}
            name="arrows"
            >
              <NumberField
                label="size"
                max={120}
                min={16}
                onChange={(value) => update("arrowSize", value)}
                value={settings.arrowSize}
              />
              <ToggleField
                label="reserveSpace"
                onChange={(value) => update("arrowContentReduce", value)}
                value={settings.arrowContentReduce}
              />
            </PropCard>
          </PropCard>

          <PropCard
            control={
              <ToggleField
                label=""
                onChange={(value) => update("edge", value)}
                value={settings.edge}
              />
            }
            enabled={settings.edge}
            active={touched.edge}
            name="edge"
          >
            <NumberField
              label="size"
              max={180}
              onChange={(value) => update("edgeSize", value)}
              value={settings.edgeSize}
            />
          </PropCard>
        </Section>

        <Section title="optimization">
          <PropCard
            control={
              <SelectField
                label=""
                onChange={(value) => update("renderMode", value)}
                options={renderOptions}
                value={settings.renderMode}
              />
            }
            enabled={settings.renderMode !== "off"}
            active={touched.render}
            name="render"
          >
            <NumberField
              label="rootMargin"
              max={800}
              onChange={(value) => update("rootMargin", value)}
              value={settings.rootMargin}
            />
            <ToggleField
              label="deferLoadOnScroll"
              onChange={(value) => update("deferLoadOnScroll", value)}
              value={settings.deferLoadOnScroll}
            />
          </PropCard>
          <PropCard
            control={
              <ToggleField
                label=""
                onChange={(value) => update("trackVisibility", value)}
                value={settings.trackVisibility}
              />
            }
            active={touched.trackVisibility}
            name="trackVisibility"
          />
          <PropCard
            control={
              <ToggleField
                label=""
                onChange={(value) => update("suspending", value)}
                value={settings.suspending}
              />
            }
            active={touched.suspending}
            name="suspending"
          />
          <PropCard
            control={
              <input
                onChange={(event) => update("fallbackText", event.target.value)}
                value={settings.fallbackText}
              />
            }
            active={touched.fallback}
            name="fallback"
          />
        </Section>

        <Section title="events">
          <PropCard
            control={
              <ToggleField
                label=""
                onChange={(value) => update("enableOnScrollValue", value)}
                value={settings.enableOnScrollValue}
              />
            }
            active={touched.onScrollPosition}
            name="onScrollPosition"
          />
          <PropCard
            control={
              <ToggleField
                label=""
                onChange={(value) => update("enableIsScrolling", value)}
                value={settings.enableIsScrolling}
              />
            }
            active={touched.onScrollingChange}
            name="onScrollingChange"
          />
          <PropCard
            control={
              <ToggleField
                label=""
                onChange={(value) => update("enableOnNavigate", value)}
                value={settings.enableOnNavigate}
              />
            }
            active={touched.onNavigate}
            name="onNavigate"
          />
          <PropCard
            control={
              <ToggleField
                label=""
                onChange={(value) =>
                  update("enableOnRenderedKeysChange", value)
                }
                value={settings.enableOnRenderedKeysChange}
              />
            }
            active={touched.onRenderedKeysChange}
            name="onRenderedKeysChange"
          />
        </Section>
      </aside>

      <section className="workbench">
        <header className="workbench-header">
          <h2>Live surface</h2>
          {/*
           * Живые показания, а не повтор настроек: где стоим, едем ли, что
           * последним сказал onNavigate, сколько намерено окно и сколько
           * объектов сейчас отрисовано.
           */}
          <div className="readouts">
            <span>
              scroll{" "}
              <b>
                {Math.round(scrollLeft)}, {Math.round(scrollTop)}
              </b>
            </span>
            <span>
              motion <b>{isScrolling ? "yes" : "no"}</b>
            </span>
            <span>
              navigate{" "}
              <b>
                {lastNavigate
                  ? `${lastNavigate.reason} ${lastNavigate.from}→${lastNavigate.to}`
                  : "—"}
              </b>
            </span>
            <span>
              surface{" "}
              <b>
                {resizeRect.width} × {resizeRect.height}
              </b>
            </span>
            <span>
              rendered{" "}
              <b>
                {/* без `render` в документе стоят все объекты, а не ноль */}
                {!settings.enableOnRenderedKeysChange
                  ? "—"
                  : settings.renderMode === "off"
                    ? settings.itemCount
                    : renderedKeys.length}
              </b>
            </span>
          </div>
        </header>

        <ResizeTracker
          className="resize-probe"
          measure="outer"
          onResize={handleResize}
        >
          <div
            className={[
              "preview-shell",
              settings.sizeMode === "auto" ? "auto-size" : "",
            ].join(" ")}
          >
            <MorphScroll ref={scrollRef} {...morphProps}>
              {children}
            </MorphScroll>
          </div>
        </ResizeTracker>

        <section className={`code-panel${codeOpen ? " is-open" : ""}`}>
          <header>
            <button
              aria-expanded={codeOpen}
              className="code-fold"
              onClick={() => setCodeOpen((current) => !current)}
              type="button"
            >
              Generated MorphScroll
            </button>
            {codeOpen && (
              <div className="code-actions">
                <div className="code-tabs">
                  {(["jsx", "css"] as const).map((tab) => (
                    <button
                      aria-pressed={codeTab === tab}
                      key={tab}
                      onClick={() => setCodeTab(tab)}
                      type="button"
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                <button onClick={copyGeneratedCode} type="button">
                  {copyState === "copied" ? "copied" : "copy"}
                </button>
              </div>
            )}
          </header>
          {codeOpen && (
            <pre>
              <Code code={shownCode} lang={codeTab} />
            </pre>
          )}
        </section>
      </section>

      {/* миниатюра под указателем: видно, что несут и куда оно встанет */}
      {drag && (
        <div
          className="drag-ghost"
          ref={ghostRef}
          style={{ transform: `translate(${drag.x}px, ${drag.y}px)` }}
        >
          {String(drag.id + 1).padStart(2, "0")}
        </div>
      )}
    </main>
  );
}

export default App;

