import raw from "../custom.css?raw";
import type { Settings } from "./settings";

/*
 * Стенд показывает свой же CSS, а не его копию: куски вырезаются из
 * `custom.css` по разметке регионов. Тогда скопированное — ровно то, что
 * человек видит в превью, и два текста не разъезжаются.
 */
type Block = {
  name: string;
  /** чья это забота — библиотеки или оформления */
  note: string;
  when: (settings: Settings) => boolean;
};

const BLOCKS: Block[] = [
  {
    name: "scroll",
    note: "The scroll itself. The library paints nothing: the shell, the corners and the focus ring of a focused object are yours.",
    when: () => true,
  },
  {
    name: "objects",
    note: "Your own card inside every object. With trackVisibility on, the box carries `--ms-content-visibility` — how much of it shows — and the class of the side cutting it — ms-outside-top, ms-outside-right, ms-outside-bottom, ms-outside-left. The variable says how much, the class says where. The appearing animation sits on the card and never on .ms-object-box: the library places that box with transform, and an animation touching transform there outranks it — every object would collapse into one point.",
    when: () => true,
  },
  {
    name: "bar",
    note: "The bar and its thumb. The library gives them their size and reports state — --ms-bar-visibility for showOnHover, the ms-grabbing class while held; the look is yours.",
    when: (settings) =>
      settings.mode === "scroll" && settings.progressElementMode === "custom",
  },
  {
    name: "slider",
    note: "Slider pages. ms-active marks the page you are standing on.",
    when: (settings) => settings.mode !== "scroll",
  },
  {
    name: "arrows",
    note: "Arrows. ms-disabled says the path has ended that way.",
    when: (settings) => settings.arrows,
  },
  {
    name: "edge",
    note: "The fading edge. --ms-edge-visibility carries it smoothly and ms-disabled finishes it off when there is nothing left to cut.",
    when: (settings) => settings.edge,
  },
  {
    name: "fallback",
    note: "Stand-ins: one for an object that came out empty, one for an object still on its way.",
    when: (settings) =>
      settings.emptyMode !== "off" || settings.fallbackText !== "",
  },
];

/* имена стенда меняем на нейтральные — код уезжает в чужой проект */
const RENAME: [RegExp, string][] = [
  [/playground-scroll/g, "my-scroll"],
  [/playground-edge/g, "my-edge"],
  [/demo-item/g, "my-object"],
];

const slice = (name: string) => {
  const open = `/* #region ${name} */`;
  const from = raw.indexOf(open);
  if (from === -1) return "";

  const to = raw.indexOf("/* #endregion */", from);

  return raw.slice(from + open.length, to === -1 ? undefined : to);
};

/* свои комментарии в вырезанном не нужны: к каждому блоку идёт своя строка */
const strip = (css: string) =>
  css
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

/*
 * Токены стенда подставляем значениями — у того, кто копирует, их нет.
 * Переменные библиотеки (`--ms-…`) остаются как есть: их приносит она сама.
 */
const resolve = (css: string) => {
  const root = getComputedStyle(document.documentElement);

  return css.replace(
    /var\((--[\w-]+)(?:,\s*([^)]+))?\)/g,
    (all, name: string, fallback?: string) => {
      if (name.startsWith("--ms-")) return all;

      const value = root.getPropertyValue(name).trim();

      return value || fallback || all;
    },
  );
};

const wrap = (text: string, width = 72) => {
  const rows: string[] = [];
  let row = "";

  for (const word of text.split(" ")) {
    if (row && (row + word).length > width) {
      rows.push(row.trimEnd());
      row = "";
    }
    row += `${word} `;
  }

  return [...rows, row.trimEnd()]
    .filter(Boolean)
    .map((line) => ` * ${line}`)
    .join("\n");
};

function buildStyles(settings: Settings) {
  const head = [
    "/*",
    wrap(
      "Everything below is the look, and the look is yours: the library ships no colours of its own. This is what the stand wears, for the scroll you have just put together.",
    ),
    " *",
    wrap(
      'Give the scroll className="my-scroll" to use it as it stands. The hooks the library offers are classes — ms-grabbing, ms-disabled, ms-hover, ms-active — and variables: --ms-bar-visibility, --ms-edge-visibility, --ms-content-visibility; ms-outside-top/right/bottom/left on an object leaving the window; and ms-child on every object box, its place in the list — the number scrollToObject takes.',
    ),
    " */",
  ].join("\n");

  const blocks = BLOCKS.filter((block) => block.when(settings)).map(
    (block) => `/*\n${wrap(block.note)}\n */\n${strip(slice(block.name))}`,
  );

  return RENAME.reduce(
    (text, [from, to]) => text.replace(from, to),
    resolve([head, ...blocks].join("\n\n")),
  );
}

export default buildStyles;
