import React from "react";

import {
  IntersectionTracker,
  MorphScroll,
  ResizeTracker,
} from "@morphing-scroll/src";
import logo from "@morphing-scroll/src/assets/morphing-scroll-logo.png";
import type {
  MorphScroll as MorphScrollProps,
  MorphScrollHandle,
  NavigateEvent,
  ControlsConfig,
  WrapperConfig,
} from "@morphing-scroll/src/types/types";

type Align = "start" | "center" | "end";
type Direction = "x" | "y" | "hybrid";
type EmptyMode = "off" | "clear" | "fallback" | "fallbackWithClick";
type EachSide = "main" | "cross" | "both";
type ObjectsSizeMode =
  | "default"
  | "number"
  | "pair"
  | "full"
  | "firstChild"
  | "each"
  | "none";
type ProgressElementMode = "custom" | "native" | "off";
type RenderMode = "off" | "lazy" | "virtual";
type ScrollMode = "scroll" | "slider" | "sliderMenu";
type SizeMode = "fixed" | "square" | "auto";
type WrapperMinMode = "off" | "number" | "pair" | "full";

type Settings = {
  className: string;
  itemCount: number;
  variableItems: boolean;
  interactiveItems: boolean;
  enableOnScrollValue: boolean;
  enableIsScrolling: boolean;
  enableOnNavigate: boolean;
  enableOnRenderedKeysChange: boolean;
  mode: ScrollMode;
  direction: Direction;
  sizeMode: SizeMode;
  width: number;
  height: number;
  squareSize: number;
  objectsSizeMode: ObjectsSizeMode;
  reorder: boolean;
  eachSide: EachSide;
  eachMin: number;
  eachMax: number;
  eachStep: number;
  eachSeed: number;
  objectWidth: number;
  objectHeight: number;
  crossCount: number;
  gapX: number;
  gapY: number;
  wrapperMarginTop: number;
  wrapperMarginRight: number;
  wrapperMarginBottom: number;
  wrapperMarginLeft: number;
  wrapperMinMode: WrapperMinMode;
  wrapperMinWidth: number;
  wrapperMinHeight: number;
  wrapperAlignX: Align;
  wrapperAlignY: Align;
  objectsAlign: Align;
  objectsDirection: "row" | "column";
  edge: boolean;
  edgeColor: string;
  edgeSize: number;
  wheel: boolean;
  wheelChangeDirection: boolean;
  wheelChangeDirectionBtn: string;
  contentDrag: boolean;
  keys: boolean;
  keysMode: "pan" | "step" | "focus";
  keysStep: number;
  gamepad: boolean;
  progressElementMode: ProgressElementMode;
  arrows: boolean;
  arrowSize: number;
  arrowContentReduce: boolean;
  barReverseX: boolean;
  barReverseY: boolean;
  barShowOnHover: boolean;
  barTrackGapX: number;
  barTrackGapY: number;
  barEdgeGapX: number;
  barEdgeGapY: number;
  barThumbMinSize: number;
  renderMode: RenderMode;
  rootMargin: number;
  stopLoadOnScroll: boolean;
  trackVisibility: boolean;
  emptyMode: EmptyMode;
  suspending: boolean;
  fallbackText: string;
  autoScrollOnDrag: boolean;
  stickToEnd: boolean;
  loop: boolean;
};

type ScrollCommand = {
  value: null | number | "end" | [null | number | "end", null | number | "end"];
  duration: number;
};

type RawCode = { __raw: string };

type CodeValue =
  | string
  | number
  | boolean
  | null
  | CodeValue[]
  | RawCode
  | { [key: string]: CodeValue | undefined };

const STORAGE_KEY = "morphing-scroll-playground-settings";

const defaultSettings: Settings = {
  className: "",
  itemCount: 72,
  variableItems: true,
  interactiveItems: true,
  enableOnScrollValue: true,
  enableIsScrolling: true,
  enableOnNavigate: true,
  enableOnRenderedKeysChange: true,
  mode: "scroll",
  direction: "y",
  sizeMode: "fixed",
  width: 680,
  height: 430,
  squareSize: 520,
  objectsSizeMode: "pair",
  objectWidth: 170,
  objectHeight: 118,
  reorder: false,
  eachSide: "main",
  eachMin: 60,
  eachMax: 240,
  eachStep: 20,
  eachSeed: 1,
  crossCount: 2,
  gapX: 12,
  gapY: 12,
  wrapperMarginTop: 0,
  wrapperMarginRight: 0,
  wrapperMarginBottom: 0,
  wrapperMarginLeft: 0,
  wrapperMinMode: "off",
  wrapperMinWidth: 0,
  wrapperMinHeight: 0,
  wrapperAlignX: "start",
  wrapperAlignY: "start",
  objectsAlign: "start",
  objectsDirection: "row",
  edge: true,
  edgeColor: "#12a3a8",
  edgeSize: 42,
  wheel: true,
  wheelChangeDirection: true,
  wheelChangeDirectionBtn: "KeyX",
  contentDrag: false,
  keys: true,
  keysMode: "pan",
  keysStep: 40,
  gamepad: false,
  progressElementMode: "custom",
  arrows: false,
  arrowSize: 36,
  arrowContentReduce: true,
  barReverseX: false,
  barReverseY: false,
  barShowOnHover: false,
  barTrackGapX: 8,
  barTrackGapY: 8,
  barEdgeGapX: 0,
  barEdgeGapY: 0,
  barThumbMinSize: 30,
  renderMode: "off",
  rootMargin: 120,
  stopLoadOnScroll: false,
  trackVisibility: false,
  emptyMode: "off",
  suspending: false,
  fallbackText: "loading",
  autoScrollOnDrag: false,
  stickToEnd: false,
  loop: false,
};

const presets: Record<string, Partial<Settings>> = {
  vertical: {
    itemCount: 96,
    mode: "scroll",
    direction: "y",
    sizeMode: "fixed",
    width: 680,
    height: 430,
    objectsSizeMode: "pair",
    objectWidth: 170,
    objectHeight: 118,
    crossCount: 2,
    renderMode: "off",
    progressElementMode: "custom",
    contentDrag: false,
    autoScrollOnDrag: false,
  },
  masonry: {
    itemCount: 120,
    mode: "scroll",
    direction: "y",
    sizeMode: "fixed",
    width: 680,
    height: 430,
    objectsSizeMode: "each",
    reorder: false,
  eachSide: "main",
    objectWidth: 170,
    eachMin: 60,
    eachMax: 240,
    eachStep: 20,
    crossCount: 3,
    gapX: 12,
    gapY: 12,
    renderMode: "virtual",
    rootMargin: 200,
    progressElementMode: "custom",
    contentDrag: true,
    autoScrollOnDrag: false,
  },
  flow: {
    itemCount: 80,
    mode: "scroll",
    direction: "y",
    sizeMode: "fixed",
    width: 680,
    height: 430,
    objectsSizeMode: "each",
    eachSide: "both",
    eachMin: 80,
    eachMax: 220,
    eachStep: 20,
    crossCount: 0, // перенос по месту, а не по счёту
    gapX: 12,
    gapY: 12,
    renderMode: "off",
    progressElementMode: "custom",
    contentDrag: true,
    autoScrollOnDrag: false,
  },
  virtual: {
    itemCount: 420,
    mode: "scroll",
    direction: "hybrid",
    sizeMode: "fixed",
    width: 720,
    height: 460,
    objectsSizeMode: "pair",
    objectWidth: 150,
    objectHeight: 112,
    crossCount: 0,
    renderMode: "virtual",
    rootMargin: 160,
    progressElementMode: "custom",
    contentDrag: true,
    autoScrollOnDrag: true,
  },
  menu: {
    itemCount: 24,
    mode: "sliderMenu",
    direction: "x",
    sizeMode: "fixed",
    width: 760,
    height: 360,
    objectsSizeMode: "pair",
    objectWidth: 240,
    objectHeight: 220,
    crossCount: 1,
    renderMode: "off",
    progressElementMode: "custom",
    arrows: true,
    edge: true,
  },
  auto: {
    itemCount: 60,
    mode: "slider",
    direction: "hybrid",
    sizeMode: "auto",
    objectsSizeMode: "pair",
    objectWidth: 155,
    objectHeight: 112,
    crossCount: 3,
    renderMode: "lazy",
    rootMargin: 100,
    progressElementMode: "custom",
    wrapperAlignX: "center",
    wrapperAlignY: "center",
  },
};

const alignOptions: Align[] = ["start", "center", "end"];
const directionOptions: Direction[] = ["y", "x", "hybrid"];
const renderOptions: RenderMode[] = ["off", "lazy", "virtual"];
const modeOptions: ScrollMode[] = ["scroll", "slider", "sliderMenu"];

function readInitialSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultSettings;
    return { ...defaultSettings, ...JSON.parse(raw) } as Settings;
  } catch {
    return defaultSettings;
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function numberOrUndefined(value: number) {
  return value > 0 ? value : undefined;
}

function useStoredSettings() {
  const [settings, setSettings] = React.useState<Settings>(readInitialSettings);

  React.useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const update = React.useCallback(
    <K extends keyof Settings>(key: K, value: Settings[K]) => {
      setSettings((current) => ({ ...current, [key]: value }));
    },
    [],
  );

  return [settings, setSettings, update] as const;
}

function ControlGroup({
  children,
  defaultOpen = false,
  hint,
  title,
}: {
  children: React.ReactNode;
  defaultOpen?: boolean;
  hint?: string;
  title: string;
}) {
  return (
    <details className="control-group" open={defaultOpen}>
      <summary>
        <span className="group-title">{title}</span>
        {hint ? <span className="group-hint">{hint}</span> : null}
      </summary>
      <div className="control-group-body">{children}</div>
    </details>
  );
}

/**
 * Вложенный параметр: настройки живут под своим ключом и появляются только
 * когда родитель включён — иначе панель предлагает крутить то, что сейчас
 * ни на что не влияет.
 */
function SubGroup({
  children,
  control,
  label,
  enabled = true,
}: {
  children?: React.ReactNode;
  control?: React.ReactNode;
  label: string;
  /** выключенная настройка своих подпараметров не показывает */
  enabled?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const canOpen = enabled && !!children;

  // включили настройку — значит собираются её настраивать
  const wasEnabled = React.useRef(enabled);
  React.useEffect(() => {
    if (enabled && !wasEnabled.current) setOpen(true);
    wasEnabled.current = enabled;
  }, [enabled]);

  return (
    <div
      className={`sub-group${enabled ? "" : " is-off"}${
        canOpen && open ? " is-open" : ""
      }`}
    >
      <div className="sub-group-head">
        <button
          aria-expanded={canOpen && open}
          className="sub-group-toggle"
          disabled={!canOpen}
          onClick={() => setOpen((current) => !current)}
          type="button"
        >
          <span className="sub-group-label">{label}</span>
        </button>
        {control}
      </div>
      {canOpen && open ? (
        <div className="sub-group-body">{children}</div>
      ) : null}
    </div>
  );
}

function Field({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function NumberField({
  label,
  max = 2000,
  min = 0,
  onChange,
  step = 1,
  value,
}: {
  label: string;
  max?: number;
  min?: number;
  onChange: (value: number) => void;
  step?: number;
  value: number;
}) {
  return (
    <Field label={label}>
      <input
        max={max}
        min={min}
        onChange={(event) => onChange(Number(event.target.value))}
        step={step}
        type="number"
        value={value}
      />
    </Field>
  );
}

function ToggleField({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: boolean) => void;
  value: boolean;
}) {
  return (
    <label className="toggle-field">
      <input
        checked={value}
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
      <span>{label}</span>
    </label>
  );
}

function SelectField<T extends string>({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: T) => void;
  options: readonly T[];
  value: T;
}) {
  return (
    <Field label={label}>
      <select
        onChange={(event) => onChange(event.target.value as T)}
        value={value}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </Field>
  );
}

function SegmentedField<T extends string>({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: T) => void;
  options: readonly T[];
  value: T;
}) {
  return (
    <div className="segmented-field">
      <span>{label}</span>
      <div className="segmented-control">
        {options.map((option) => (
          <button
            aria-pressed={option === value}
            key={option}
            onClick={() => onChange(option)}
            type="button"
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

/*
 * Случайный, но повторяемый: раскладку кладки надо смотреть глазами, а если
 * размеры меняются на каждый рендер, смотреть не на что. Один и тот же seed
 * даёт один и тот же список; кнопка рядом с полями его меняет.
 */
/*
 * Какая сторона достаётся объектам. Вдоль прокрутки — кладка, поперёк —
 * поток, обе — поток по обеим (а при hybrid — сетка по crossCount).
 */
function eachPair(
  settings: Settings,
  short = false,
): "each" | ["each" | number, "each" | number] {
  const { eachSide, objectWidth, objectHeight } = settings;

  // обе стороны — это просто "each"; в сниппете так и пишем
  if (eachSide === "both") return short ? "each" : ["each", "each"];

  // при hybrid главную ось выбирает objects.direction — как и в библиотеке
  const mainIsX =
    settings.direction === "hybrid"
      ? settings.objectsDirection === "column"
      : settings.direction === "x";
  const eachOnX = eachSide === "main" ? mainIsX : !mainIsX;

  return eachOnX ? ["each", objectHeight] : [objectWidth, "each"];
}

/** какое правило укладки выйдет из выбранных сторон и в каком порядке */
function eachHint(settings: Settings) {
  const { direction, objectsDirection, crossCount } = settings;
  const isHybrid = direction === "hybrid";
  const mainIsX = isHybrid ? objectsDirection === "column" : direction === "x";
  const byColumn = objectsDirection === "column";

  const pair = eachPair(settings) as ["each" | number, "each" | number];
  const mainEach = pair[mainIsX ? 0 : 1] === "each";
  const crossEach = pair[mainIsX ? 1 : 0] === "each";

  if (isHybrid) {
    if (!crossCount) return "needs crossCount · nothing else ends a line";

    return mainEach && !crossEach
      ? `masonry · ${crossCount} columns (crossCount)`
      : `flow · ${crossCount} per line (crossCount)`;
  }

  /*
   * Подряд идут строки при вертикальной прокрутке и столбцы при
   * горизонтальной; второе слово просит переставить порядок.
   */
  const split = mainIsX ? !byColumn : byColumn;

  // кладка знает число колонок всегда, значит перестановка ей выполнима всегда
  if (mainEach && !crossEach)
    return split
      ? "masonry · the first line takes the first objects"
      : "masonry · shortest line wins";

  if (crossCount)
    return `flow · ${crossCount} per line (crossCount)${
      split ? " · order transposed" : ""
    }${mainEach ? " · rises into the room above" : ""}`;

  const layout =
    mainEach && crossEach
      ? "fill · every object takes the highest place it fits"
      : "flow · a line fills, then the next one starts";

  return split ? `${layout} · transposing needs crossCount` : layout;
}

function sizeFor(index: number, settings: Settings) {
  const { eachMin, eachMax, eachStep, eachSeed } = settings;

  let h = Math.imul(index + 1, 2654435761) ^ Math.imul(eachSeed + 1, 40503);
  h = Math.imul(h ^ (h >>> 15), 2246822507);
  h = ((h ^ (h >>> 13)) >>> 0) / 4294967296;

  const step = Math.max(1, eachStep);
  const lo = Math.min(eachMin, eachMax);
  const hi = Math.max(eachMin, eachMax);
  const steps = Math.max(1, Math.floor((hi - lo) / step) + 1);

  /*
   * Берём старшие биты, а не остаток: у мультипликативного хеша младшие
   * коррелируют, и на коротком диапазоне соседние индексы попадали в одно и
   * то же число — все объекты выходили одной ширины.
   */
  return lo + Math.min(steps - 1, Math.floor(h * steps)) * step;
}

/*
 * Перетаскивание объектов — жест приложения, не библиотеки. Объект помечен
 * `ms-custom-drag`, чтобы прокрутка за него не бралась, а край подхватывает
 * `autoScrollOnDrag` — это ровно то, ради чего он есть.
 */
function buildItems(
  settings: Settings,
  order: number[],
  onGrab?: (id: number, event: React.PointerEvent) => void,
  dragging?: number | null,
) {
  const each = settings.objectsSizeMode === "each";
  const pair = eachPair(settings) as ["each" | number, "each" | number];

  return order.map((id) => {
    const index = id;
    const number = index + 1;
    const tone = index % 6;
    const isTall = settings.variableItems && index % 7 === 0;
    const isWide = settings.variableItems && index % 11 === 0;
    const eachSize = each
      ? {
          ...(pair[0] === "each" && { width: sizeFor(index, settings) }),
          ...(pair[1] === "each" && { height: sizeFor(index * 31 + 7, settings) }),
        }
      : undefined;

    return (
      <article
        className={[
          "demo-item",
          `tone-${tone}`,
          isTall ? "is-tall" : "",
          isWide ? "is-wide" : "",
          dragging === id ? "is-dragging" : "",
        ].join(" ")}
        data-item={id}
        key={`item-${number}`}
        onPointerDown={onGrab ? (event) => onGrab(id, event) : undefined}
        style={eachSize}
        {...(onGrab ? { "ms-custom-drag": "" } : {})}
      >
        <header>
          <b>{number.toString().padStart(2, "0")}</b>
          <span>
            {index % 3 === 0 ? "content" : index % 3 === 1 ? "media" : "task"}
          </span>
        </header>
        <p>
          {index % 2 === 0
            ? "Resize, scroll and render behavior"
            : "Useful for lazy and virtual checks"}
        </p>
        {settings.interactiveItems && (
          <button className="item-action" type="button">
            action
          </button>
        )}
      </article>
    );
  });
}

function buildProgressMenu(count: number) {
  const length = clamp(Math.ceil(count / 2), 8, 140);

  return Array.from({ length }, (_, index) => (
    <button className="slider-menu-button" key={`menu-${index}`} type="button">
      {index + 1}
    </button>
  ));
}

function raw(code: string): RawCode {
  return { __raw: code };
}

function isRawCode(value: CodeValue): value is RawCode {
  return Boolean(
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    typeof (value as RawCode).__raw === "string",
  );
}

function formatCodeValue(value: CodeValue, indent = 0): string {
  const pad = " ".repeat(indent);
  const childPad = " ".repeat(indent + 2);

  if (isRawCode(value)) return value.__raw;
  if (Array.isArray(value))
    return `[${value.map((item) => formatCodeValue(item, indent)).join(", ")}]`;
  if (value === null) return "null";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number" || typeof value === "boolean")
    return String(value);

  const entries = Object.entries(value).filter(
    ([, item]) => item !== undefined,
  );
  if (!entries.length) return "{}";

  return `{\n${entries
    .map(
      ([key, item]) =>
        `${childPad}${key}: ${formatCodeValue(item as CodeValue, indent + 2)},`,
    )
    .join("\n")}\n${pad}}`;
}

function buildSnippet(settings: Settings, scrollCommand: ScrollCommand) {
  const needsMenu = settings.mode === "sliderMenu";

  const size: CodeValue =
    settings.sizeMode === "auto"
      ? "auto"
      : settings.sizeMode === "square"
        ? settings.squareSize
        : [settings.width, settings.height];

  const objectsSize: CodeValue | undefined =
    settings.objectsSizeMode === "default"
      ? undefined
      : settings.objectsSizeMode === "number"
        ? settings.objectWidth
        : settings.objectsSizeMode === "pair"
          ? [settings.objectWidth, settings.objectHeight]
          : settings.objectsSizeMode === "each"
            ? eachPair(settings, true)
            : settings.objectsSizeMode;

  const wrapperMargin: CodeValue | undefined = [
    settings.wrapperMarginTop,
    settings.wrapperMarginRight,
    settings.wrapperMarginBottom,
    settings.wrapperMarginLeft,
  ].some(Boolean)
    ? [
        settings.wrapperMarginTop,
        settings.wrapperMarginRight,
        settings.wrapperMarginBottom,
        settings.wrapperMarginLeft,
      ]
    : undefined;

  const wrapperMinSize: CodeValue | undefined =
    settings.wrapperMinMode === "off"
      ? undefined
      : settings.wrapperMinMode === "full"
        ? "full"
        : settings.wrapperMinMode === "number"
          ? settings.wrapperMinWidth
          : [settings.wrapperMinWidth, settings.wrapperMinHeight];

  const barElement: CodeValue =
    settings.progressElementMode === "off"
      ? false
      : needsMenu
        ? raw("menuItems")
        : settings.progressElementMode === "native"
          ? true
          : raw("<YourProgressElement />");

  /** всё про бегунок теперь живёт одним объектом внутри controls */
  const barSettings = {
    edgeGap: [settings.barEdgeGapX, settings.barEdgeGapY],
    reverse: [settings.barReverseX, settings.barReverseY],
    showOnHover: settings.barShowOnHover,
    thumbMinSize: settings.barThumbMinSize,
    trackGap: [settings.barTrackGapX, settings.barTrackGapY],
  };

  const barForCode: CodeValue =
    barElement === false || barElement === true
      ? barElement
      : { element: barElement, ...barSettings };

  const controls: CodeValue = {
    wheel: settings.wheel
      ? {
          changeDirection: settings.wheelChangeDirection,
          changeDirectionBtn: settings.wheelChangeDirectionBtn || "KeyX",
        }
      : false,
    drag: settings.contentDrag,
    keys: settings.keys
      ? settings.keysMode === "pan"
        ? { mode: settings.keysMode, step: settings.keysStep }
        : { mode: settings.keysMode }
      : false,
    bar: barForCode,
    arrows: settings.arrows
      ? {
          element: raw("<YourArrow />"),
          size: settings.arrowSize,
          reserveSpace: settings.arrowContentReduce,
        }
      : false,
  };

  const render: CodeValue | undefined =
    settings.renderMode === "off"
      ? undefined
      : {
          mode: settings.renderMode,
          rootMargin: settings.rootMargin,
          stopLoadOnScroll: settings.stopLoadOnScroll,
          trackVisibility: settings.trackVisibility,
        };

  const emptyObjects: CodeValue | undefined =
    settings.emptyMode === "off"
      ? undefined
      : settings.emptyMode === "clear"
        ? "clear"
        : settings.emptyMode === "fallback"
          ? { fallback: raw("<YourEmptyFallback />"), mode: "fallback" }
          : {
              fallback: raw("<YourEmptyFallback />"),
              mode: "fallback",
              clickTrigger: { selector: ".item-action", delay: 220 },
            };

  const objectsGroup: Record<string, CodeValue | undefined> = {
    size: objectsSize,
    gap:
      settings.gapX === settings.gapY
        ? settings.gapX
        : [settings.gapX, settings.gapY],
    crossCount: numberOrUndefined(settings.crossCount),
    align: settings.objectsAlign,
    direction: settings.objectsDirection,
    empty: emptyObjects,
  };

  const props: Array<[string, CodeValue | undefined, "boolean" | "value"]> = [
    ["className", settings.className || undefined, "value"],
    ["mode", settings.mode, "value"],
    ["direction", settings.direction, "value"],
    ["size", size, "value"],

    ["objects", objectsGroup, "value"],
    [
      "wrapper",
      {
        align: [settings.wrapperAlignX, settings.wrapperAlignY],
        margin: wrapperMargin,
        minSize: wrapperMinSize,
      },
      "value",
    ],

    [
      // цвет и размер края теперь дело CSS, в проп уходит узел
      "edge",
      settings.edge ? raw("<YourEdgeElement />") : undefined,
      "value",
    ],
    ["controls", controls, "value"],
    ["render", render, "value"],

    ["suspending", settings.suspending || undefined, "boolean"],
    [
      "fallback",
      settings.fallbackText
        ? raw(`<div>${settings.fallbackText}</div>`)
        : undefined,
      "value",
    ],
    ["autoScrollOnDrag", settings.autoScrollOnDrag || undefined, "boolean"],
    ["stickToEnd", settings.stickToEnd || undefined, "boolean"],
    ["loop", settings.loop || undefined, "boolean"],
    [
      "duration",
      scrollCommand.duration === 200 ? undefined : scrollCommand.duration,
      "value",
    ],
    [
      "onScrollPosition",
      settings.enableOnScrollValue
        ? raw("(left, top) => console.log({ left, top })")
        : undefined,
      "value",
    ],
    [
      "onScrollingChange",
      settings.enableIsScrolling
        ? raw("(motion) => console.log({ motion })")
        : undefined,
      "value",
    ],
    [
      "onNavigate",
      settings.enableOnNavigate
        ? raw("({ reason, from, to }) => console.log(reason, from, to)")
        : undefined,
      "value",
    ],
    [
      "onRenderedKeysChange",
      settings.enableOnRenderedKeysChange
        ? raw("(keys) => console.log(keys)")
        : undefined,
      "value",
    ],
  ];

  const propLines = props
    .filter(([, value]) => value !== undefined)
    .map(([name, value, mode]) => {
      if (mode === "boolean" && value === true) return `  ${name}`;
      if (typeof value === "string")
        return `  ${name}=${JSON.stringify(value)}`;
      return `  ${name}={${formatCodeValue(value as CodeValue, 4)}}`;
    });

  // только сам компонент: остальное в копии всё равно лишнее
  return `<MorphScroll\n${propLines.join("\n")}\n>\n  {items}\n</MorphScroll>\n`;
}

type PadSample = {
  /** все оси, как их отдаёт устройство: [индекс, значение] */
  axes: [number, number][];
  buttons: number[];
  id: string;
};

const DEAD_ZONE = 0.15; // сколько стик отдаёт, лёжа в покое
const PAN_PER_SECOND = 900; // px при полностью отклонённом стике
const REPEAT = { first: 400, next: 120 }; // автоповтор удержанной кнопки, ms
const DPAD = { 12: "top", 13: "bottom", 14: "left", 15: "right" } as const;

/**
 * Рецепт из README, слово в слово, плюс отчёт о том, что пришло с устройства:
 * в playground важно видеть не только результат, но и сам ввод — какие оси и
 * какие кнопки геймпад отдаёт прямо сейчас.
 */
function useGamepadScroll(
  scroll: React.RefObject<MorphScrollHandle | null>,
  enabled: boolean,
  onSample: (sample: PadSample | null) => void,
  /** playground гоняет крестовину тем же способом, что выбран для клавиш */
  dpad: "step" | "focus",
) {
  React.useEffect(() => {
    if (!enabled) {
      onSample(null);
      return;
    }

    let frame = 0;
    let last = performance.now();
    let reported = "";
    const held = new Map<number, number>(); // кнопка -> когда сработает снова

    const report = (sample: PadSample | null) => {
      // состояние отдаём только на изменение, иначе рендер на каждый кадр
      const next = JSON.stringify(sample);
      if (next === reported) return;

      reported = next;
      onSample(sample);
    };

    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);

      // кадр мог быть длинным: считаем от времени, а не от количества кадров
      const delta = Math.min(now - last, 100) / 1000;
      last = now;

      const pad = navigator.getGamepads().find(Boolean);
      if (!pad) {
        held.clear();
        report(null);
        return;
      }

      // — правый стик: непрерывное движение —
      const [x, y] = [pad.axes[2] ?? 0, pad.axes[3] ?? 0].map((value) =>
        Math.abs(value) < DEAD_ZONE ? 0 : value,
      );

      if (x || y)
        scroll.current?.pan(
          { x: x * PAN_PER_SECOND * delta, y: y * PAN_PER_SECOND * delta },
          { duration: 0, reason: "gamepad" },
        );

      // — крестовина: шаг на нажатие, а не на кадр —
      for (const [index, side] of Object.entries(DPAD)) {
        const button = Number(index);

        if (!pad.buttons[button]?.pressed) {
          held.delete(button);
          continue;
        }

        const move = () =>
          dpad === "focus"
            ? scroll.current?.moveFocus(side, { reason: "gamepad" })
            : scroll.current?.step(side, { reason: "gamepad" });

        const due = held.get(button);
        if (due === undefined) {
          move();
          held.set(button, now + REPEAT.first);
        } else if (now >= due) {
          move();
          held.set(button, now + REPEAT.next);
        }
      }

      /*
       * Показываем все оси, а не только ту пару, которую крутит рецепт:
       * раскладка у геймпадов разная, и когда стик «не работает», первое,
       * что надо увидеть, — какой индекс он на самом деле шевелит.
       */
      report({
        axes: pad.axes
          .map((value, index): [number, number] => [
            index,
            Math.round(value * 20) / 20,
          ])
          .filter(([, value]) => Math.abs(value) >= 0.1),
        buttons: pad.buttons
          .map((b, i) => (b.pressed ? i : -1))
          .filter((i) => i >= 0),
        id: pad.id,
      });
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [dpad, enabled, onSample, scroll]);
}

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
  const [isProbeVisible, setIsProbeVisible] = React.useState(false);
  const [scrollXInput, setScrollXInput] = React.useState(0);
  const [scrollYInput, setScrollYInput] = React.useState(0);
  const [scrollDuration, setScrollDuration] = React.useState(220);
  const [pad, setPad] = React.useState<PadSample | null>(null);
  const scrollRef = React.useRef<MorphScrollHandle>(null);

  useGamepadScroll(
    scrollRef,
    settings.gamepad,
    setPad,
    settings.keys && settings.keysMode === "focus" ? "focus" : "step",
  );

  const [scrollCommand, setScrollCommand] = React.useState<ScrollCommand>({
    duration: 220,
    value: null,
  });
  const [copyState, setCopyState] = React.useState<"copied" | "idle">("idle");

  /*
   * Порядок живёт отдельно от настроек: его меняет перетаскивание, а не
   * панель. Ключи у объектов свои и переезжают вместе с ними — на этом же
   * проверяется, что измеренные размеры помнятся по ключу, а не по месту.
   */
  const [order, setOrder] = React.useState<number[]>(() =>
    Array.from({ length: settings.itemCount }, (_, i) => i),
  );
  const [dragging, setDragging] = React.useState<number | null>(null);

  React.useEffect(() => {
    setOrder(Array.from({ length: settings.itemCount }, (_, i) => i));
  }, [settings.itemCount]);

  const onGrab = React.useCallback((id: number, event: React.PointerEvent) => {
    if (event.button !== 0) return;

    /*
     * Свой жест, свои последствия: библиотека блокирует выделение текста на
     * время СВОЕГО перетаскивания (тот же приём, что и здесь — общий стиль
     * на время жеста), но об этом жесте она не знает и знать не должна —
     * `ms-custom-drag` просит её не лезть в него, не убирает браузерное
     * выделение сама.
     */
    event.preventDefault();
    document.body.classList.add("no-select");

    const from = event.currentTarget as HTMLElement;
    from.setPointerCapture(event.pointerId);
    setDragging(id);

    const move = (moveEvent: PointerEvent) => {
      /*
       * Куда встать, спрашиваем у того, кто под указателем: считать по
       * координатам нельзя — при `"each"` объекты разного размера и сетки,
       * по которой считать, просто нет.
       */
      from.style.pointerEvents = "none";
      const under = document
        .elementFromPoint(moveEvent.clientX, moveEvent.clientY)
        ?.closest<HTMLElement>("[data-item]");
      from.style.pointerEvents = "";

      const over = under && Number(under.dataset.item);
      if (over === undefined || over === null || Number.isNaN(over)) return;

      setOrder((current) => {
        const at = current.indexOf(id);
        const to = current.indexOf(over);
        if (at === -1 || to === -1 || at === to) return current;

        const next = [...current];
        next.splice(at, 1);
        next.splice(to, 0, id);

        return next;
      });
    };

    const drop = () => {
      setDragging(null);
      document.body.classList.remove("no-select");
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerup", drop);
      document.removeEventListener("pointercancel", drop);
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
        dragging,
      ),
    [settings, order, onGrab, dragging],
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

    if (settings.objectsSizeMode === "each") return eachPair(settings);

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

    // размер и цвет теперь дело CSS, поэтому здесь просто узел с ними
    return (
      <div
        className="playground-edge"
        style={{
          background: `linear-gradient(${settings.edgeColor}, transparent)`,
          height: `${settings.edgeSize}px`,
          width: "100%",
        }}
      />
    );
  }, [settings.edgeColor, settings.edge, settings.edgeSize]);

  const progressElement = React.useMemo<
    React.ReactNode | React.ReactNode[] | boolean
  >(() => {
    if (settings.progressElementMode === "off") return false;
    if (settings.mode === "sliderMenu") return progressMenu;
    if (settings.progressElementMode === "native") return true;
    if (settings.mode === "slider")
      return <span className="slider-progress-dot" />;
    return <span className="thumb-content" />;
  }, [progressMenu, settings.progressElementMode, settings.mode]);

  const render = React.useMemo<MorphScrollProps["render"]>(() => {
    if (settings.renderMode === "off") return undefined;
    return {
      rootMargin: settings.rootMargin,
      stopLoadOnScroll: settings.stopLoadOnScroll,
      trackVisibility: settings.trackVisibility,
      mode: settings.renderMode,
    };
  }, [
    settings.renderMode,
    settings.rootMargin,
    settings.stopLoadOnScroll,
    settings.trackVisibility,
  ]);

  const emptyObjects = React.useMemo<
    NonNullable<MorphScrollProps["objects"]>["empty"]
  >(() => {
    if (settings.emptyMode === "off") return undefined;
    if (settings.emptyMode === "clear") return "clear";
    if (settings.emptyMode === "fallback")
      return {
        fallback: <div className="empty-fallback">empty</div>,
        mode: "fallback",
      };
    return {
      clickTrigger: { delay: 220, selector: ".item-action" },
      fallback: <div className="empty-fallback">empty</div>,
      mode: "fallback",
    };
  }, [settings.emptyMode]);

  const morphProps = React.useMemo<MorphScrollProps>(
    () => ({
      className: ["playground-scroll", settings.className]
        .filter(Boolean)
        .join(" "),

      direction: settings.direction,
      autoScrollOnDrag: settings.autoScrollOnDrag,
      edge,

      fallback: <div className="cell-fallback">{settings.fallbackText}</div>,

      onScrollingChange: settings.enableIsScrolling
        ? setIsScrolling
        : undefined,
      objects: {
        size: objectsSize,
        gap:
          settings.gapX === settings.gapY
            ? settings.gapX
            : [settings.gapX, settings.gapY],
        crossCount: numberOrUndefined(settings.crossCount),
        align: settings.objectsAlign,
        direction: settings.objectsDirection,
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
              changeDirectionBtn: settings.wheelChangeDirectionBtn || "KeyX",
            }
          : false,
      },
      render,
      stickToEnd: settings.stickToEnd,
      loop: settings.loop,
      duration: scrollCommand.duration,
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
      scrollCommand,
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

  const handleIntersection = React.useCallback(
    (entry: IntersectionObserverEntry) => {
      setIsProbeVisible(entry.isIntersecting);
    },
    [],
  );

  const applyScroll = React.useCallback(
    (mode: "clear" | "end" | "start" | "value") => {
      /*
       * Считаем до, а не внутри апдейтера: React зовёт его когда сам решит, и
       * к вызову `scrollTo` значение оттуда ещё не вернулось — уезжал `null`,
       * то есть никуда.
       */
      let value: ScrollCommand["value"] = null;

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

      setScrollCommand({ duration: scrollDuration, value });

      /*
       * Единственный способ съездить куда-то по кнопке — команда: она
       * выполняется всегда, в том числе на то же самое значение.
       */
      scrollRef.current?.scrollTo(value, { duration: scrollDuration });
    },
    [scrollDuration, scrollXInput, scrollYInput, settings.direction],
  );

  const generatedCode = React.useMemo(
    () => buildSnippet(settings, scrollCommand),
    [scrollCommand, settings],
  );

  const copyGeneratedCode = React.useCallback(async () => {
    await navigator.clipboard.writeText(generatedCode);
    setCopyState("copied");
    window.setTimeout(() => setCopyState("idle"), 1200);
  }, [generatedCode]);

  return (
    <main className="app-shell">
      <aside className="control-panel">
        <div className="brand-row">
          <img alt="" src={logo} />
          <p>Playground</p>
        </div>

        <div className="preset-row">
          {Object.keys(presets).map((name) => (
            <button
              key={name}
              onClick={() =>
                setSettings((current) => ({ ...current, ...presets[name] }))
              }
              type="button"
            >
              {name}
            </button>
          ))}
        </div>

        <ControlGroup defaultOpen hint="className · children" title="general">
          <Field label="className">
            <input
              onChange={(event) => update("className", event.target.value)}
              placeholder="custom class"
              value={settings.className}
            />
          </Field>
          <NumberField
            label="children count"
            max={1200}
            min={1}
            onChange={(value) => update("itemCount", value)}
            value={settings.itemCount}
          />
          <div className="two-col">
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
          </div>
          <ToggleField
            label="drag to reorder"
            onChange={(value) => update("reorder", value)}
            value={settings.reorder}
          />
          {settings.reorder && (
            <div className="hint-line">
              objects carry <code>ms-custom-drag</code>, so the scroll leaves
              the gesture alone — turn on <code>autoScrollOnDrag</code> to have
              the edges follow
            </div>
          )}
        </ControlGroup>

        <ControlGroup
          defaultOpen
          hint="mode · direction · stickToEnd · loop · scrollTo"
          title="scroll"
        >
          <SelectField
            label="mode"
            onChange={(value) => update("mode", value)}
            options={modeOptions}
            value={settings.mode}
          />
          <SegmentedField
            label="direction"
            onChange={(value) => update("direction", value)}
            options={directionOptions}
            value={settings.direction}
          />
          <ToggleField
            label="stickToEnd"
            onChange={(value) => update("stickToEnd", value)}
            value={settings.stickToEnd}
          />
          <ToggleField
            label="loop"
            onChange={(value) => update("loop", value)}
            value={settings.loop}
          />
          <ToggleField
            label="autoScrollOnDrag"
            onChange={(value) => update("autoScrollOnDrag", value)}
            value={settings.autoScrollOnDrag}
          />

          <SubGroup label="scrollTo (ref)">
            <div className="two-col">
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
            </div>
            <NumberField
              label="duration"
              max={5000}
              onChange={setScrollDuration}
              value={scrollDuration}
            />
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
              buttons call <code>ref.scrollTo()</code> — the same target twice
              works
            </p>

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
              <code>ref.step()</code> / <code>ref.pan()</code> — how any other
              device connects; the reason reaches <code>onNavigate</code> as
              given
            </p>
          </SubGroup>

          <SubGroup
            control={
              <ToggleField
                label=""
                onChange={(value) => update("gamepad", value)}
                value={settings.gamepad}
              />
            }
            label="gamepad"
            enabled={settings.gamepad}
          >
            <p className="sub-note">
              the README recipe, running live on the same <code>ref</code>:
              right stick pans, d-pad steps — or walks the objects, when{" "}
              <code>keys</code> is set to <code>focus</code>.
            </p>
            <p className="sub-note">
              browsers hide a pad until it sends something: press any button
              once. What it sends — every axis by index, and the buttons held —
              shows in the <code>gamepad</code> meter under the surface.
            </p>
          </SubGroup>
        </ControlGroup>

        <ControlGroup hint="size · objects · wrapper" title="layout">
          <SelectField
            label="size"
            onChange={(value) => update("sizeMode", value)}
            options={["fixed", "square", "auto"] as const}
            value={settings.sizeMode}
          />
          {settings.sizeMode === "fixed" && (
            <div className="two-col">
              <NumberField
                label="width"
                max={1400}
                min={120}
                onChange={(value) => update("width", value)}
                value={settings.width}
              />
              <NumberField
                label="height"
                max={1000}
                min={120}
                onChange={(value) => update("height", value)}
                value={settings.height}
              />
            </div>
          )}
          {settings.sizeMode === "square" && (
            <NumberField
              label="square"
              max={1000}
              min={120}
              onChange={(value) => update("squareSize", value)}
              value={settings.squareSize}
            />
          )}
          <SelectField
            label="objectsSize"
            onChange={(value) => update("objectsSizeMode", value)}
            options={
              [
                "default",
                "number",
                "pair",
                "full",
                "firstChild",
                "each",
                "none",
              ] as const
            }
            value={settings.objectsSizeMode}
          />
          {["number", "pair"].includes(settings.objectsSizeMode) && (
            <div className="two-col">
              <NumberField
                label="object w"
                max={600}
                min={20}
                onChange={(value) => update("objectWidth", value)}
                value={settings.objectWidth}
              />
              <NumberField
                label="object h"
                max={600}
                min={20}
                onChange={(value) => update("objectHeight", value)}
                value={settings.objectHeight}
              />
            </div>
          )}
          {settings.objectsSizeMode === "each" && (
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
                  label={eachPair(settings)[0] === "each" ? "fixed h" : "fixed w"}
                  max={600}
                  min={20}
                  onChange={(value) =>
                    update(
                      eachPair(settings)[0] === "each"
                        ? "objectHeight"
                        : "objectWidth",
                      value,
                    )
                  }
                  value={
                    eachPair(settings)[0] === "each"
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
            </>
          )}
          <NumberField
            label="crossCount"
            max={20}
            onChange={(value) => update("crossCount", value)}
            value={settings.crossCount}
          />
          <div className="two-col">
            <NumberField
              label="gap x"
              max={80}
              onChange={(value) => update("gapX", value)}
              value={settings.gapX}
            />
            <NumberField
              label="gap y"
              max={80}
              onChange={(value) => update("gapY", value)}
              value={settings.gapY}
            />
          </div>

          <SubGroup
            control={
              <SelectField
                label=""
                onChange={(value) => update("wrapperMinMode", value)}
                options={["off", "number", "pair", "full"] as const}
                value={settings.wrapperMinMode}
              />
            }
            label="wrapper.minSize"
            enabled={["number", "pair"].includes(settings.wrapperMinMode)}
          >
            <div className="two-col">
              <NumberField
                label="x"
                max={1600}
                onChange={(value) => update("wrapperMinWidth", value)}
                value={settings.wrapperMinWidth}
              />
              <NumberField
                label="y"
                max={1600}
                onChange={(value) => update("wrapperMinHeight", value)}
                value={settings.wrapperMinHeight}
              />
            </div>
          </SubGroup>

          <SubGroup label="wrapper.margin">
            <div className="quad-grid">
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
            </div>
          </SubGroup>
        </ControlGroup>

        <ControlGroup
          hint="wrapper.align · objectsAlign · objectsDirection"
          title="layout"
        >
          <div className="two-col">
            <SelectField
              label="wrapper.align x"
              onChange={(value) => update("wrapperAlignX", value)}
              options={alignOptions}
              value={settings.wrapperAlignX}
            />
            <SelectField
              label="wrapper.align y"
              onChange={(value) => update("wrapperAlignY", value)}
              options={alignOptions}
              value={settings.wrapperAlignY}
            />
          </div>
          <div className="two-col">
            <SelectField
              label="objectsAlign"
              onChange={(value) => update("objectsAlign", value)}
              options={alignOptions}
              value={settings.objectsAlign}
            />
            <SelectField
              label="objectsDirection"
              onChange={(value) => update("objectsDirection", value)}
              options={["row", "column"] as const}
              value={settings.objectsDirection}
            />
          </div>
        </ControlGroup>

        <ControlGroup
          defaultOpen
          hint="controls · edge"
          title="progress"
        >
          <SubGroup
            control={
              <ToggleField
                label=""
                onChange={(value) => update("wheel", value)}
                value={settings.wheel}
              />
            }
            label="wheel"
            enabled={settings.wheel && settings.direction === "hybrid"}
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
                value={settings.wheelChangeDirectionBtn}
              />
            </Field>
          </SubGroup>

          <SubGroup
            control={
              <ToggleField
                label=""
                onChange={(value) => update("contentDrag", value)}
                value={settings.contentDrag}
              />
            }
            label="drag"
          />

          <SubGroup
            control={
              <ToggleField
                label=""
                onChange={(value) => update("keys", value)}
                value={settings.keys}
              />
            }
            label="keys"
            enabled={settings.keys}
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
              the arrows work while the scroll has focus — click it, or Tab to
              it. <code>pan</code> and <code>step</code> take only the keys of
              the scrolling axis; <code>focus</code> walks the objects and takes
              all four
            </p>
          </SubGroup>

          <SubGroup
            control={
              <SelectField
                label=""
                onChange={(value) => update("progressElementMode", value)}
                options={["custom", "native", "off"] as const}
                value={settings.progressElementMode}
              />
            }
            label="bar"
            enabled={settings.progressElementMode === "custom"}
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
            {/* половина пары действует на бар своей оси — при одной оси
                второй бар не существует, и поле только путало */}
            {settings.direction !== "y" && (
              <div className="axis-block">
                <div className="axis-head">
                  <span className="axis-tag">x bar</span>
                  <ToggleField
                    label="reverse"
                    onChange={(value) => update("barReverseX", value)}
                    value={settings.barReverseX}
                  />
                </div>
                <div className="two-col">
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
              </div>
            )}
            {settings.direction !== "x" && (
              <div className="axis-block">
                <div className="axis-head">
                  <span className="axis-tag">y bar</span>
                  <ToggleField
                    label="reverse"
                    onChange={(value) => update("barReverseY", value)}
                    value={settings.barReverseY}
                  />
                </div>
                <div className="two-col">
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
              </div>
            )}
          </SubGroup>

          <SubGroup
            control={
              <ToggleField
                label=""
                onChange={(value) => update("arrows", value)}
                value={settings.arrows}
              />
            }
            label="arrows"
            enabled={settings.arrows}
          >
            <NumberField
              label="size"
              max={120}
              min={16}
              onChange={(value) => update("arrowSize", value)}
              value={settings.arrowSize}
            />
            <div className="two-col">
              <ToggleField
                label="reserveSpace"
                onChange={(value) => update("arrowContentReduce", value)}
                value={settings.arrowContentReduce}
              />
            </div>
          </SubGroup>

          <SubGroup
            control={
              <ToggleField
                label=""
                onChange={(value) => update("edge", value)}
                value={settings.edge}
              />
            }
            label="edge"
            enabled={settings.edge}
          >
            <div className="two-col">
              <Field label="color">
                <input
                  onChange={(event) => update("edgeColor", event.target.value)}
                  type="color"
                  value={settings.edgeColor}
                />
              </Field>
              <NumberField
                label="size"
                max={180}
                onChange={(value) => update("edgeSize", value)}
                value={settings.edgeSize}
              />
            </div>
          </SubGroup>
        </ControlGroup>

        <ControlGroup
          hint="render · emptyObjects · suspending · fallback"
          title="optimization"
        >
          <SubGroup
            control={
              <SelectField
                label=""
                onChange={(value) => update("renderMode", value)}
                options={renderOptions}
                value={settings.renderMode}
              />
            }
            label="render"
            enabled={settings.renderMode !== "off"}
          >
            <NumberField
              label="rootMargin"
              max={800}
              onChange={(value) => update("rootMargin", value)}
              value={settings.rootMargin}
            />
            <div className="two-col">
              <ToggleField
                label="stopLoadOnScroll"
                onChange={(value) => update("stopLoadOnScroll", value)}
                value={settings.stopLoadOnScroll}
              />
              <ToggleField
                label="trackVisibility"
                onChange={(value) => update("trackVisibility", value)}
                value={settings.trackVisibility}
              />
            </div>
          </SubGroup>

          <SelectField
            label="emptyObjects"
            onChange={(value) => update("emptyMode", value)}
            options={["off", "clear", "fallback", "fallbackWithClick"] as const}
            value={settings.emptyMode}
          />
          <ToggleField
            label="suspending"
            onChange={(value) => update("suspending", value)}
            value={settings.suspending}
          />
          <Field label="fallback">
            <input
              onChange={(event) => update("fallbackText", event.target.value)}
              value={settings.fallbackText}
            />
          </Field>
        </ControlGroup>

        <ControlGroup
          hint="onScrollPosition · onScrollingChange · onNavigate · onRenderedKeysChange"
          title="events"
        >
          <ToggleField
            label="onScrollPosition"
            onChange={(value) => update("enableOnScrollValue", value)}
            value={settings.enableOnScrollValue}
          />
          <ToggleField
            label="onScrollingChange"
            onChange={(value) => update("enableIsScrolling", value)}
            value={settings.enableIsScrolling}
          />
          <ToggleField
            label="onNavigate"
            onChange={(value) => update("enableOnNavigate", value)}
            value={settings.enableOnNavigate}
          />
          <ToggleField
            label="onRenderedKeysChange"
            onChange={(value) => update("enableOnRenderedKeysChange", value)}
            value={settings.enableOnRenderedKeysChange}
          />
        </ControlGroup>
      </aside>

      <section className="workbench">
        <header className="workbench-header">
          <div>
            <h2>Live Surface</h2>
            <p>
              {settings.itemCount} items · {settings.direction} ·{" "}
              {settings.mode}
            </p>
          </div>
          <code className="prop-pill">
            scrollTo: {JSON.stringify(scrollCommand.value)}
          </code>
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

        <IntersectionTracker
          className="intersection-probe"
          onIntersection={handleIntersection}
        >
          <span>
            IntersectionTracker: {isProbeVisible ? "visible" : "hidden"}
          </span>
        </IntersectionTracker>

        <section className="code-panel">
          <header>
            <div>
              <h3>Generated MorphScroll</h3>
              <p>Current props as JSX</p>
            </div>
            <button onClick={copyGeneratedCode} type="button">
              {copyState === "copied" ? "copied" : "copy"}
            </button>
          </header>
          <pre>
            <code>{generatedCode}</code>
          </pre>
        </section>

        <footer className="metrics">
          <div>
            <span>scroll</span>
            <b>
              {Math.round(scrollLeft)}, {Math.round(scrollTop)}
            </b>
          </div>
          <div>
            <span>motion</span>
            <b>{isScrolling ? "yes" : "no"}</b>
          </div>
          <div>
            <span>navigate</span>
            <b>
              {lastNavigate
                ? `${lastNavigate.reason} ${lastNavigate.from}→${lastNavigate.to}`
                : "—"}
            </b>
          </div>
          <div>
            <span>surface</span>
            <b>
              {resizeRect.width} x {resizeRect.height}
            </b>
          </div>
          <div className="keys-meter">
            <span>gamepad</span>
            <b>{!settings.gamepad ? "off" : !pad ? "waiting" : "connected"}</b>
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
          <div className="keys-meter">
            <span>rendered keys</span>
            <b>{renderedKeys.length}</b>
            <code>{renderedKeys.slice(0, 18).join(", ") || "none"}</code>
          </div>
        </footer>
      </section>
    </main>
  );
}

export default App;
