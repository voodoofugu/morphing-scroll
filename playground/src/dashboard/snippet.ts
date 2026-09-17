import type { Settings } from "./settings";
import { eachPair } from "./settings";
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

export function buildSnippet(settings: Settings, duration: number) {
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
          : settings.objectsSizeMode === "auto"
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
          // пусто — значит умолчание библиотеки, Shift; в разметку не пишем
          ...(settings.wheelChangeDirectionBtn && {
            changeDirectionBtn: settings.wheelChangeDirectionBtn,
          }),
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

  /*
   * Слежение за видимостью ничего не выбрасывает и живёт отдельным пропом:
   * `render` остаётся про то, что рисовать, и без `mode` его не бывает.
   */
  const render: CodeValue | undefined =
    settings.renderMode === "off"
      ? undefined
      : {
          mode: settings.renderMode,
          rootMargin: settings.rootMargin,
          deferLoadOnScroll: settings.deferLoadOnScroll,
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
      settings.gapX === settings.gapY
        ? settings.gapX
        : [settings.gapX, settings.gapY],
    lines: numberOrUndefined(settings.lines),
    align: settings.objectsAlign,
    order: settings.objectsOrder,
    empty: emptyObjects,
  };

  const props: Array<[string, CodeValue | undefined, "boolean" | "value"]> = [
    ["className", settings.className || undefined, "value"],
    ["mode", settings.mode, "value"],
    ["direction", settings.direction, "value"],
    ["fromRight", settings.fromRight || undefined, "boolean"],
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
