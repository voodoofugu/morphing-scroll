import React from "react";

export type Align = "start" | "center" | "end";

export type Direction = "x" | "y" | "hybrid";

export type EmptyMode = "off" | "clear" | "fallback" | "fallbackWithClick";

export type EachSide = "main" | "cross" | "both";

export type ObjectsSizeMode =
  | "default"
  | "number"
  | "pair"
  | "full"
  | "firstChild"
  | "auto";

export type ProgressElementMode = "custom" | "native" | "off";

export type RenderMode = "off" | "lazy" | "virtual";

export type ScrollMode = "scroll" | "slider" | "sliderMenu";

export type SizeMode = "fixed" | "square" | "auto";

export type WrapperMinMode = "off" | "number" | "pair" | "full";

export type Settings = {
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
  fromRight: boolean;
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
  lines: number;
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
  objectsOrder: "row" | "column";
  sectionSize: number;
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
  deferLoadOnScroll: boolean;
  trackVisibility: boolean;
  emptyMode: EmptyMode;
  suspending: boolean;
  fallbackText: string;
  autoScrollOnDrag: boolean;
  stickToEnd: boolean;
  loop: boolean;
};

export type ScrollCommand = {
  value: null | number | "end" | [null | number | "end", null | number | "end"];
  duration: number;
};

export const STORAGE_KEY = "morphing-scroll-playground-settings";

export const defaultSettings: Settings = {
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
  fromRight: false,
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
  lines: 2,
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
  objectsOrder: "row",
  sectionSize: 10,
  edge: true,
  edgeColor: "#12a3a8",
  edgeSize: 42,
  wheel: true,
  wheelChangeDirection: true,
  wheelChangeDirectionBtn: "",
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
  deferLoadOnScroll: false,
  trackVisibility: false,
  emptyMode: "off",
  suspending: false,
  fallbackText: "loading",
  autoScrollOnDrag: false,
  stickToEnd: false,
  loop: false,
};

export const presets: Record<string, Partial<Settings>> = {
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
    lines: 2,
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
    objectsSizeMode: "auto",
    reorder: false,
  eachSide: "main",
    objectWidth: 170,
    eachMin: 60,
    eachMax: 240,
    eachStep: 20,
    lines: 3,
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
    objectsSizeMode: "auto",
    eachSide: "both",
    eachMin: 80,
    eachMax: 220,
    eachStep: 20,
    lines: 0, // перенос по месту, а не по счёту
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
    lines: 0,
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
    lines: 1,
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
    lines: 3,
    renderMode: "lazy",
    rootMargin: 100,
    progressElementMode: "custom",
    wrapperAlignX: "center",
    wrapperAlignY: "center",
  },
};

export const alignOptions: Align[] = ["start", "center", "end"];

export const directionOptions: Direction[] = ["y", "x", "hybrid"];

export const renderOptions: RenderMode[] = ["off", "lazy", "virtual"];

export const modeOptions: ScrollMode[] = ["scroll", "slider", "sliderMenu"];

export function readInitialSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultSettings;
    return { ...defaultSettings, ...JSON.parse(raw) } as Settings;
  } catch {
    return defaultSettings;
  }
}

export function useStoredSettings() {
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

/*
 * Случайный, но повторяемый: раскладку кладки надо смотреть глазами, а если
 * размеры меняются на каждый рендер, смотреть не на что. Один и тот же seed
 * даёт один и тот же список; кнопка рядом с полями его меняет.
 */
/*
 * Какая сторона достаётся объектам. Вдоль прокрутки — кладка, поперёк —
 * поток, обе — поток по обеим (а при hybrid — сетка по lines).
 */
export function eachPair(
  settings: Settings,
  short = false,
): "auto" | ["auto" | number, "auto" | number] {
  const { eachSide, objectWidth, objectHeight } = settings;

  // обе стороны — это просто "auto"; в сниппете так и пишем
  if (eachSide === "both") return short ? "auto" : ["auto", "auto"];

  // при hybrid главную ось выбирает objects.order — как и в библиотеке
  const mainIsX =
    settings.direction === "hybrid"
      ? settings.objectsOrder === "column"
      : settings.direction === "x";
  const eachOnX = eachSide === "main" ? mainIsX : !mainIsX;

  return eachOnX ? ["auto", objectHeight] : [objectWidth, "auto"];
}

/** какое правило укладки выйдет из выбранных сторон и в каком порядке */
export function eachHint(settings: Settings) {
  const { direction, objectsOrder, lines } = settings;
  const isHybrid = direction === "hybrid";
  const mainIsX = isHybrid ? objectsOrder === "column" : direction === "x";
  const byColumn = objectsOrder === "column";

  const pair = eachPair(settings) as ["auto" | number, "auto" | number];
  const mainEach = pair[mainIsX ? 0 : 1] === "auto";
  const crossEach = pair[mainIsX ? 1 : 0] === "auto";

  if (isHybrid) {
    if (!lines) return "needs lines · nothing else ends a line";

    return mainEach && !crossEach
      ? `masonry · ${lines} columns (lines)`
      : `flow · ${lines} per line (lines)`;
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

  if (lines)
    return `flow · ${lines} per line (lines)${
      split ? " · order transposed" : ""
    }${mainEach ? " · rises into the room above" : ""}`;

  const layout =
    mainEach && crossEach
      ? "fill · every object takes the highest place it fits"
      : "flow · a line fills, then the next one starts";

  return split ? `${layout} · transposing needs lines` : layout;
}
