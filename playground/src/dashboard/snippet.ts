import type { Settings } from "./settings";
import { objectsSizeValue } from "./settings";
import { numberOrUndefined } from "../utils";

export type RawCode = { __raw: string };

export type CodeValue =
  | string
  | number
  | boolean
  | null
  | CodeValue[]
  | RawCode
  | { [key: string]: CodeValue | undefined };

export function raw(code: string): RawCode {
  return { __raw: code };
}

export function isRawCode(value: CodeValue): value is RawCode {
  return Boolean(
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    typeof (value as RawCode).__raw === "string",
  );
}

export function formatCodeValue(value: CodeValue, indent = 0): string {
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

const hasValues = (value: Record<string, CodeValue | undefined>) =>
  Object.values(value).some((item) => item !== undefined);

const axisValue = <T extends CodeValue>(x: T, y: T, fallback: T) => {
  if (x === fallback && y === fallback) return undefined;
  return x === y ? x : ([x, y] as CodeValue);
};

export function buildSnippet(settings: Settings, duration: number) {
  const needsMenu = settings.mode === "sliderMenu";

  const size: CodeValue =
    settings.sizeMode === "auto"
      ? "auto"
      : settings.sizeMode === "square"
        ? settings.squareSize
        : [settings.width, settings.height];

  const objectsSize = objectsSizeValue(settings) as CodeValue | undefined;

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
  const barSettings: Record<string, CodeValue | undefined> = {
    edgeGap: axisValue(settings.barEdgeGapX, settings.barEdgeGapY, 0),
    reverse: axisValue(settings.barReverseX, settings.barReverseY, false),
    showOnHover: settings.barShowOnHover || undefined,
    thumbMinSize:
      settings.barThumbMinSize === 30
        ? undefined
        : settings.barThumbMinSize,
    maxItems: numberOrUndefined(settings.barMaxItems),
    trackGap: axisValue(settings.barTrackGapX, settings.barTrackGapY, 0),
  };

  const barForCode: CodeValue =
    barElement === false || barElement === true
      ? barElement
      : hasValues(barSettings)
        ? { element: barElement, ...barSettings }
        : barElement;

  const wheelForCode: CodeValue | undefined = settings.wheel
    ? settings.wheelChangeDirection
      ? {
          changeDirection: true,
          ...(settings.wheelChangeDirectionBtn && {
            changeDirectionBtn: settings.wheelChangeDirectionBtn,
          }),
        }
      : true
    : undefined;

  const defaultKeysMode = settings.mode === "scroll" ? "pan" : "step";
  const keysForCode: CodeValue | undefined = settings.keys
    ? settings.keysMode === defaultKeysMode &&
      (settings.keysMode !== "pan" || settings.keysStep === 40)
      ? true
      : settings.keysMode === "pan" && settings.keysStep !== 40
        ? { mode: settings.keysMode, step: settings.keysStep }
        : { mode: settings.keysMode }
    : undefined;

  const arrowsForCode: CodeValue | undefined = settings.arrows
    ? settings.arrowSize === 40 && !settings.arrowContentReduce
      ? raw("<YourArrow />")
      : {
          element: raw("<YourArrow />"),
          size: settings.arrowSize === 40 ? undefined : settings.arrowSize,
          reserveSpace: settings.arrowContentReduce || undefined,
        }
    : undefined;

  const controlsObject: Record<string, CodeValue | undefined> = {
    wheel: wheelForCode,
    drag: settings.contentDrag || undefined,
    keys: keysForCode,
    bar: barForCode === false ? undefined : barForCode,
    arrows: arrowsForCode,
  };
  const controlsAreDefault =
    wheelForCode === true &&
    keysForCode === true &&
    !settings.contentDrag &&
    barForCode === false &&
    arrowsForCode === undefined;
  const controls: CodeValue | undefined = controlsAreDefault
    ? undefined
    : controlsObject;

  /*
   * Слежение за видимостью ничего не выбрасывает и живёт отдельным пропом:
   * `render` остаётся про то, что рисовать, и без `mode` его не бывает.
   */
  const render: CodeValue | undefined =
    settings.renderMode === "off"
      ? undefined
      : {
          mode: settings.renderMode,
          rootMargin: settings.rootMargin || undefined,
          deferLoadOnScroll: settings.deferLoadOnScroll || undefined,
        };

  const emptyObjects: CodeValue | undefined =
    settings.emptyMode === "off"
      ? undefined
      : settings.emptyMode === "clear"
        ? "clear"
        : settings.emptyMode === "fallback"
          ? "fallback"
          : {
              mode: "fallback",
              clickTrigger: { selector: ".item-action", delay: 220 },
            };

  const objectsGroup: Record<string, CodeValue | undefined> = {
    size: objectsSize,
    gap:
      settings.gapX === 0 && settings.gapY === 0
        ? undefined
        : settings.gapX === settings.gapY
          ? settings.gapX
          : [settings.gapX, settings.gapY],
    lines:
      settings.direction === "hybrid" && settings.lines === 1
        ? undefined
        : numberOrUndefined(settings.lines),
    align:
      settings.objectsAlign === "start" ? undefined : settings.objectsAlign,
    order: settings.objectsOrder === "row" ? undefined : settings.objectsOrder,
    empty: emptyObjects,
  };

  const wrapperGroup: Record<string, CodeValue | undefined> = {
    align: axisValue(
      settings.wrapperAlignX,
      settings.wrapperAlignY,
      "start",
    ),
    margin: wrapperMargin,
    minSize: wrapperMinSize,
  };

  const props: Array<[string, CodeValue | undefined, "boolean" | "value"]> = [
    ["className", settings.className || undefined, "value"],
    ["mode", settings.mode === "scroll" ? undefined : settings.mode, "value"],
    ["direction", settings.direction === "y" ? undefined : settings.direction, "value"],
    ["fromRight", settings.fromRight || undefined, "boolean"],
    ["size", size, "value"],

    ["objects", hasValues(objectsGroup) ? objectsGroup : undefined, "value"],
    ["wrapper", hasValues(wrapperGroup) ? wrapperGroup : undefined, "value"],

    [
      // цвет и размер края теперь дело CSS, в проп уходит узел
      "edge",
      settings.edge
        ? raw(`{{ element: <YourEdgeElement />, size: ${settings.edgeSize} }}`)
        : undefined,
      "value",
    ],
    ["controls", controls, "value"],
    ["render", render, "value"],
    ["trackVisibility", settings.trackVisibility || undefined, "boolean"],

    ["suspending", settings.suspending || undefined, "boolean"],
    [
      "fallback",
      settings.fallbackText
        ? settings.emptyMode === "off"
          ? raw(`<div>${settings.fallbackText}</div>`)
          : {
              loading: raw(`<div>${settings.fallbackText}</div>`),
              empty: raw("<YourEmptyFallback />"),
            }
        : undefined,
      "value",
    ],
    ["autoScrollOnDrag", settings.autoScrollOnDrag || undefined, "boolean"],
    ["stickToEnd", settings.stickToEnd || undefined, "boolean"],
    ["loop", settings.loop || undefined, "boolean"],
    [
      "duration",
      // 200 — умолчание библиотеки, его в разметку не пишем
      duration === 200 ? undefined : duration,
      "value",
    ],
    [
      "onScrollPosition",
      settings.enableOnScrollValue
        ? raw(
            "(left, top, max, overscroll) => console.log({ left, top, max, overscroll })",
          )
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
