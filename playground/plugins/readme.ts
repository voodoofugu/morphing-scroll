import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { marked } from "marked";
import type { Plugin } from "vite";

/**
 * README — источник правды документации: его правят первым, а сайт только
 * показывает его удобнее. Модуль `virtual:ms-readme` разбирает README при
 * сборке и отдаёт дерево «компонент → проп → параметр» с готовым HTML; в dev
 * он пересобирается, как только README правят.
 */
const VIRTUAL_ID = "virtual:ms-readme";
const RESOLVED_ID = "\0" + VIRTUAL_ID;

// путь от самого файла: `new URL(путь, import.meta.url)` Vite считает ассетом
export const README_FILE = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../README.md",
);

export type ReadmeNode = {
  name: string;
  /** путь, которым проп зовут в коде: `controls.bar.edgeGap` */
  path: string;
  /** компонент, которому принадлежит проп: `MorphScroll` */
  component: string;
  kind: "component" | "prop";
  /** что стоит в заголовке после имени: `REQUIRED`, подпись компонента */
  note: string;
  /** группа, под которой проп стоит в README: `SCROLL`, `LAYOUT` */
  group: string;
  /** свой текст раздела, без вложенных разделов */
  body: string;
  children: ReadmeNode[];
};

export type ReadmeSection = { title: string; body: string };

export type Readme = {
  /** разделы до API: About, Playground, Installation */
  sections: ReadmeSection[];
  /** компоненты с их пропсами */
  api: ReadmeNode[];
};

const GROUP = /###### \*\*— (.+?) —\*\*/g;
const HEADING = /^### 〈 (.+?) 〉\s*$/gm;

const stripTags = (html: string) => html.replace(/<[^>]+>/g, "").trim();

/**
 * Имя в заголовке раздела бывает трёх видов: компонент — `<b>MorphScroll</b>:
 * <em>…</em>`, проп — `<b><code>mode</code></b>`, параметр внутри пропса —
 * `<code><b>edgeGap</b></code>`. После имени может стоять пометка.
 */
const readSummary = (summary: string) => {
  const component = summary.match(/^<b>(\w+)<\/b>:\s*([\s\S]*)$/);
  if (component)
    return { kind: "component" as const, name: component[1], note: stripTags(component[2]) };

  const prop = summary.match(
    /^(?:<b>)?<code>(?:<b>)?(\w+)(?:<\/b>)?<\/code>(?:<\/b>)?([\s\S]*)$/,
  );
  if (prop) return { kind: "prop" as const, name: prop[1], note: stripTags(prop[2]) };

  return null;
};

/** обёртки, которыми README держит разметку на GitHub, — на сайте они лишние */
const tidy = (body: string) =>
  body
    .replace(GROUP, "")
    .replace(/<h2><\/h2>/g, "")
    .replace(/^\s*<br \/>\s*<ul><div>/, "")
    .replace(/<\/div><\/ul>\s*$/, "")
    .replace(/^- #### Props:\s*$/m, "")
    .replace(/^\s*<ul><div>\s*$/gm, "")
    .replace(/^\s*<\/div><\/ul>\s*$/gm, "")
    .trim();

type Open = ReadmeNode & { currentGroup: string };

export function parseReadme(text: string): Readme {
  const headings = [...text.matchAll(HEADING)];
  const sections: ReadmeSection[] = [];
  let apiText = "";

  headings.forEach((heading, index) => {
    const start = heading.index! + heading[0].length;
    const end = headings[index + 1]?.index ?? text.length;
    const body = text.slice(start, end).replace(/<h2><\/h2>\s*$/, "").trim();

    if (heading[1] === "API") apiText = body;
    else if (heading[1] !== "Table of contents") sections.push({ title: heading[1], body });
  });

  const root: Open = {
    name: "",
    path: "",
    component: "",
    kind: "component",
    note: "",
    group: "",
    body: "",
    children: [],
    currentGroup: "",
  };
  const stack: Open[] = [root];

  // текст между тегами достаётся тому разделу, что сейчас открыт
  const feed = (chunk: string) => {
    const top = stack[stack.length - 1];
    for (const match of chunk.matchAll(GROUP)) top.currentGroup = match[1];
    top.body += chunk;
  };

  const tags = /<details>|<\/details>/g;
  let cursor = 0;

  for (let tag = tags.exec(apiText); tag; tag = tags.exec(apiText)) {
    feed(apiText.slice(cursor, tag.index));
    cursor = tag.index + tag[0].length;

    if (tag[0] === "</details>") {
      const node = stack.pop()!;
      const { currentGroup: _, ...clean } = node;
      stack[stack.length - 1].children.push({ ...clean, body: tidy(clean.body) });
      continue;
    }

    const summary = apiText.slice(cursor).match(/^<summary>([\s\S]*?)<\/summary>/);
    const head = summary ? readSummary(summary[1]) : null;
    if (summary) cursor += summary[0].length;

    const parent = stack[stack.length - 1];
    const name = head?.name ?? "";
    const isComponent = head?.kind === "component";

    stack.push({
      name,
      path: isComponent ? "" : parent.path ? `${parent.path}.${name}` : name,
      component: isComponent ? name : parent.component,
      kind: head?.kind ?? "prop",
      note: head?.note ?? "",
      group: parent.currentGroup,
      body: "",
      children: [],
      currentGroup: "",
    });
  }

  return { sections, api: root.children };
}

/** все разделы компонента плоским списком: путь → раздел */
export function flatten(nodes: ReadmeNode[], into = new Map<string, ReadmeNode>()) {
  for (const node of nodes) {
    if (node.kind === "prop") into.set(node.path, node);
    flatten(node.children, into);
  }
  return into;
}

const render = (markdown: string) => marked.parse(markdown, { async: false }) as string;

/** то, что уходит в браузер: вместо исходного markdown — готовый HTML */
const toClient = (node: ReadmeNode): ReadmeNode => ({
  ...node,
  body: render(node.body),
  children: node.children.map(toClient),
});

export default function msReadme(): Plugin {
  return {
    name: "ms-readme",

    resolveId(id) {
      return id === VIRTUAL_ID ? RESOLVED_ID : null;
    },

    load(id) {
      if (id !== RESOLVED_ID) return null;

      const readme = parseReadme(readFileSync(README_FILE, "utf8"));
      return `export default ${JSON.stringify({
        sections: readme.sections.map((section) => ({
          ...section,
          body: render(section.body),
        })),
        api: readme.api.map(toClient),
      })};`;
    },

    configureServer(server) {
      server.watcher.add(README_FILE);
      server.watcher.on("change", (file) => {
        if (file !== README_FILE) return;

        const graph = server.environments.client.moduleGraph;
        const module = graph.getModuleById(RESOLVED_ID);
        if (module) graph.invalidateModule(module);
        server.hot.send({ type: "full-reload" });
      });
    },
  };
}
