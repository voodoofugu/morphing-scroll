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
  ProgressTriggerConfig,
} from "@morphing-scroll/src/types/types";

type Align = "start" | "center" | "end";
type Direction = "x" | "y" | "hybrid";
type EmptyMode = "off" | "clear" | "fallback" | "fallbackWithClick";
type ObjectsSizeMode =
  | "default"
  | "number"
  | "pair"
  | "full"
  | "firstChild"
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
  enableOnRenderedKeysChange: boolean;
  mode: ScrollMode;
  direction: Direction;
  sizeMode: SizeMode;
  width: number;
  height: number;
  squareSize: number;
  objectsSizeMode: ObjectsSizeMode;
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
  progressElementMode: ProgressElementMode;
  arrows: boolean;
  arrowSize: number;
  arrowContentReduce: boolean;
  arrowLoop: boolean;
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
};

type ScrollCommand = {
  value: null | number | "end" | (null | number | "end")[];
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
  progressElementMode: "custom",
  arrows: false,
  arrowSize: 36,
  arrowContentReduce: true,
  arrowLoop: false,
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
    arrowLoop: true,
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
  open = true,
}: {
  children?: React.ReactNode;
  control?: React.ReactNode;
  label: string;
  open?: boolean;
}) {
  return (
    <div className={`sub-group${open ? "" : " is-off"}`}>
      <div className="sub-group-head">
        <span className="sub-group-label">{label}</span>
        {control}
      </div>
      {open && children ? (
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

function buildItems(settings: Settings) {
  return Array.from({ length: settings.itemCount }, (_, index) => {
    const number = index + 1;
    const tone = index % 6;
    const isTall = settings.variableItems && index % 7 === 0;
    const isWide = settings.variableItems && index % 11 === 0;

    return (
      <article
        className={[
          "demo-item",
          `tone-${tone}`,
          isTall ? "is-tall" : "",
          isWide ? "is-wide" : "",
        ].join(" ")}
        key={`item-${number}`}
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
  const imports = `import { MorphScroll } from "morphing-scroll";`;
  const menuCount = clamp(Math.ceil(settings.itemCount / 2), 8, 140);
  const needsMenu = settings.mode === "sliderMenu";
  const helpers = [
    `const items = Array.from({ length: ${settings.itemCount} }, (_, index) => (\n  <div key={\`item-\${index + 1}\`}>Item {index + 1}</div>\n));`,
    needsMenu
      ? `const menuItems = Array.from({ length: ${menuCount} }, (_, index) => (\n  <button key={\`menu-\${index + 1}\`} type="button">\n    {index + 1}\n  </button>\n));`
      : "",
  ].filter(Boolean);

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

  /** всё про бегунок теперь живёт одним объектом внутри progressTrigger */
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

  const progressTrigger: CodeValue = {
    wheel: settings.wheel
      ? {
          changeDirection: settings.wheelChangeDirection,
          changeDirectionBtn: settings.wheelChangeDirectionBtn || "KeyX",
        }
      : false,
    content: settings.contentDrag,
    bar: barForCode,
    arrows: settings.arrows
      ? {
          element: raw("<YourArrow />"),
          size: settings.arrowSize,
          reserveSpace: settings.arrowContentReduce,
          loop: settings.arrowLoop,
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

  const props: Array<[string, CodeValue | undefined, "boolean" | "value"]> = [
    ["className", settings.className || undefined, "value"],
    ["mode", settings.mode, "value"],
    ["direction", settings.direction, "value"],
    ["size", size, "value"],
    ["objectsSize", objectsSize, "value"],
    ["crossCount", numberOrUndefined(settings.crossCount), "value"],
    [
      "gap",
      settings.gapX === settings.gapY
        ? settings.gapX
        : [settings.gapX, settings.gapY],
      "value",
    ],
    ["wrapperMargin", wrapperMargin, "value"],
    ["wrapperMinSize", wrapperMinSize, "value"],
    ["wrapperAlign", [settings.wrapperAlignX, settings.wrapperAlignY], "value"],
    ["objectsAlign", settings.objectsAlign, "value"],
    ["objectsDirection", settings.objectsDirection, "value"],
    [
      "edge",
      settings.edge
        ? { color: settings.edgeColor, size: settings.edgeSize }
        : undefined,
      "value",
    ],
    ["progressTrigger", progressTrigger, "value"],
    ["render", render, "value"],
    ["emptyObjects", emptyObjects, "value"],
    ["suspending", settings.suspending || undefined, "boolean"],
    [
      "fallback",
      settings.fallbackText
        ? raw(`<div>${settings.fallbackText}</div>`)
        : undefined,
      "value",
    ],
    ["autoScrollOnDrag", settings.autoScrollOnDrag || undefined, "boolean"],
    ["scrollPosition", scrollCommand, "value"],
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
      if (mode === "boolean" && value === true) return `      ${name}`;
      if (typeof value === "string")
        return `      ${name}=${JSON.stringify(value)}`;
      return `      ${name}={${formatCodeValue(value as CodeValue, 8)}}`;
    });

  return `${imports}\n\n${helpers.join("\n\n")}\n\nexport function Example() {\n  return (\n    <MorphScroll\n${propLines.join("\n")}\n    >\n      {items}\n    </MorphScroll>\n  );\n}\n`;
}

function App() {
  const [settings, setSettings, update] = useStoredSettings();
  const [scrollLeft, setScrollLeft] = React.useState(0);
  const [scrollTop, setScrollTop] = React.useState(0);
  const [isScrolling, setIsScrolling] = React.useState(false);
  const [renderedKeys, setRenderedKeys] = React.useState<string[]>([]);
  const [resizeRect, setResizeRect] = React.useState({ width: 0, height: 0 });
  const [isProbeVisible, setIsProbeVisible] = React.useState(false);
  const [scrollXInput, setScrollXInput] = React.useState(0);
  const [scrollYInput, setScrollYInput] = React.useState(0);
  const [scrollDuration, setScrollDuration] = React.useState(220);
  const scrollRef = React.useRef<MorphScrollHandle>(null);

  const [scrollCommand, setScrollCommand] = React.useState<ScrollCommand>({
    duration: 220,
    value: null,
  });
  const [copyState, setCopyState] = React.useState<"copied" | "idle">("idle");

  const children = React.useMemo(() => buildItems(settings), [settings]);
  const progressMenu = React.useMemo(
    () => buildProgressMenu(settings.itemCount),
    [settings.itemCount],
  );

  const size = React.useMemo<MorphScrollProps["size"]>(() => {
    if (settings.sizeMode === "auto") return "auto";
    if (settings.sizeMode === "square") return settings.squareSize;
    return [settings.width, settings.height];
  }, [settings.height, settings.sizeMode, settings.squareSize, settings.width]);

  const objectsSize = React.useMemo<MorphScrollProps["objectsSize"]>(() => {
    if (settings.objectsSizeMode === "default") return undefined;
    if (settings.objectsSizeMode === "number") return settings.objectWidth;
    if (settings.objectsSizeMode === "pair")
      return [settings.objectWidth, settings.objectHeight];
    return settings.objectsSizeMode;
  }, [settings.objectHeight, settings.objectWidth, settings.objectsSizeMode]);

  const wrapperMargin = React.useMemo<MorphScrollProps["wrapperMargin"]>(() => {
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

  const wrapperMinSize = React.useMemo<
    MorphScrollProps["wrapperMinSize"]
  >(() => {
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

  const emptyObjects = React.useMemo<MorphScrollProps["emptyObjects"]>(() => {
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
      crossCount: numberOrUndefined(settings.crossCount),
      direction: settings.direction,
      autoScrollOnDrag: settings.autoScrollOnDrag,
      edge,
      objectsAlign: settings.objectsAlign,
      objectsDirection: settings.objectsDirection,
      emptyObjects,
      fallback: <div className="cell-fallback">{settings.fallbackText}</div>,
      gap:
        settings.gapX === settings.gapY
          ? settings.gapX
          : [settings.gapX, settings.gapY],
      onScrollingChange: settings.enableIsScrolling ? setIsScrolling : undefined,
      objectsSize,
      onRenderedKeysChange: settings.enableOnRenderedKeysChange
        ? setRenderedKeys
        : undefined,
      onScrollPosition: settings.enableOnScrollValue
        ? (left, top) => {
            setScrollLeft(left);
            setScrollTop(top);
          }
        : undefined,
      progressTrigger: {
        arrows: settings.arrows
          ? {
              reserveSpace: settings.arrowContentReduce,
              element: <span className="arrow-mark">&gt;</span>,
              loop: settings.arrowLoop,
              size: settings.arrowSize,
            }
          : false,
        content: settings.contentDrag,
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
      scrollPosition: scrollCommand,
      size,
      suspending: settings.suspending,
      mode: settings.mode,
      wrapperAlign: [settings.wrapperAlignX, settings.wrapperAlignY],
      wrapperMargin,
      wrapperMinSize,
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
      let nextValue: ScrollCommand["value"] = null;

      setScrollCommand(() => {
        let value: ScrollCommand["value"] = null;

        if (mode === "start")
          value = settings.direction === "hybrid" ? [0, 0] : 0;
        if (mode === "end")
          value = settings.direction === "hybrid" ? ["end", "end"] : "end";
        if (mode === "value") {
          value =
            settings.direction === "hybrid"
              ? [scrollXInput, scrollYInput]
              : settings.direction === "x"
                ? scrollXInput
                : scrollYInput;
        }

        nextValue = value;

        return { duration: scrollDuration, value };
      });

      /*
       * `scrollPosition` описывает позицию и реагирует на изменение значения,
       * поэтому повторное нажатие той же кнопки им не поймать. Команда — это
       * ref: она выполняется всегда.
       */
      scrollRef.current?.scrollTo(nextValue, { duration: scrollDuration });
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

        <ControlGroup
          defaultOpen
          hint="className · children"
          title="general"
        >
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
        </ControlGroup>

        <ControlGroup
          defaultOpen
          hint="mode · direction · scrollPosition · autoScrollOnDrag"
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
            label="autoScrollOnDrag"
            onChange={(value) => update("autoScrollOnDrag", value)}
            value={settings.autoScrollOnDrag}
          />

          <SubGroup label="scrollPosition">
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
          </SubGroup>
        </ControlGroup>

        <ControlGroup
          hint="size · objectsSize · crossCount · gap · wrapperMargin · wrapperMinSize"
          title="size"
        >
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
            label="wrapperMinSize"
            open={["number", "pair"].includes(settings.wrapperMinMode)}
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

          <SubGroup label="wrapperMargin">
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
          hint="wrapperAlign · objectsAlign · objectsDirection"
          title="layout"
        >
          <div className="two-col">
            <SelectField
              label="wrapperAlign x"
              onChange={(value) => update("wrapperAlignX", value)}
              options={alignOptions}
              value={settings.wrapperAlignX}
            />
            <SelectField
              label="wrapperAlign y"
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
          hint="progressTrigger · edge"
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
            open={settings.wheel && settings.direction === "hybrid"}
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
            label="content"
            open={false}
          />

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
            open={settings.progressElementMode === "custom"}
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
            open={settings.arrows}
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
              <ToggleField
                label="loop"
                onChange={(value) => update("arrowLoop", value)}
                value={settings.arrowLoop}
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
            open={settings.edge}
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
            open={settings.renderMode !== "off"}
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
          hint="onScrollPosition · onScrollingChange · onRenderedKeysChange"
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
            label="onRenderedKeysChange"
            onChange={(value) =>
              update("enableOnRenderedKeysChange", value)
            }
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
            scrollPosition: {JSON.stringify(scrollCommand.value)}
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
          visibleContent
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
            <span>surface</span>
            <b>
              {resizeRect.width} x {resizeRect.height}
            </b>
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
