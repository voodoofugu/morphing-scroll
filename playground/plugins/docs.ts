import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import ts from "typescript";
import type { Plugin } from "vite";

/**
 * Описания пропсов дашборд не хранит у себя: он берёт их из тех же типов, что
 * видит пользователь в редакторе. Модуль `virtual:ms-docs` собирается на месте
 * из `src/types/types.ts` и в dev пересобирается, как только типы правят.
 */
const VIRTUAL_ID = "virtual:ms-docs";
const RESOLVED_ID = "\0" + VIRTUAL_ID;

/*
 * Путь считаем от самого файла, без `new URL(путь, import.meta.url)`: эту связку
 * Vite принимает за ассет и в тестах под jsdom превращает в адрес dev-сервера.
 */
const TYPES_FILE = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../src/types/types.ts",
);

/** откуда начинаем обход: тип в types.ts → путь, которым его зовёт дашборд */
const ROOTS: Record<string, string> = {
  MorphScroll: "",
  MorphScrollHandle: "ref",
};

export type PropDoc = { text: string; default?: string };

/** строки шапки: разделитель, логотип и заголовок с именем пропса */
const isHeading = (line: string) =>
  line === "" || line === "---" || line.startsWith("#");

/**
 * Подсказке достаётся первый абзац: остальное в типе — это `@description` и
 * `@note`, целая страница текста, которой во всплывающей плашке не место.
 */
const firstParagraph = (raw: string) => {
  const lines = raw.split("\n").map((line) => line.trim());
  while (lines.length && isHeading(lines[0])) lines.shift();

  const end = lines.indexOf("");
  return (end === -1 ? lines : lines.slice(0, end)).join(" ").trim();
};

const oneLine = (raw: string) =>
  raw
    .split("\n")
    .map((line) => line.trim())
    .join(" ")
    .trim();

const docOf = (member: ts.TypeElement): PropDoc | undefined => {
  // блок берём только свой: у члена без описания API отдаёт родительский
  const blocks = ts
    .getJSDocCommentsAndTags(member)
    .filter((node): node is ts.JSDoc => ts.isJSDoc(node) && node.parent === member);

  const text = firstParagraph(
    ts.getTextOfJSDocComment(blocks[blocks.length - 1]?.comment) ?? "",
  );
  if (!text) return undefined;

  const tag = ts
    .getJSDocTags(member)
    .find((item) => item.tagName.text === "default");
  const fallback = ts.getTextOfJSDocComment(tag?.comment);

  return fallback ? { text, default: oneLine(fallback) } : { text };
};

/** объектный тип: сам литерал или пересечение таких же */
const membersOf = (node: ts.TypeNode | undefined): ts.TypeElement[] => {
  if (!node) return [];
  if (ts.isTypeLiteralNode(node)) return [...node.members];
  if (ts.isIntersectionTypeNode(node))
    return node.types.flatMap((part) => membersOf(part));
  return [];
};

/**
 * Куда уводит тип пропса: `bar?: boolean | BarConfig` — в `BarConfig`, а
 * `render` держит свой объект прямо в себе. И то и другое даёт вложенные
 * пути вида `controls.bar.*` и `render.*`.
 */
type Child = { alias?: string; node: ts.TypeNode };

const children = (node: ts.TypeNode | undefined, known: Set<string>) => {
  const found: Child[] = [];

  const visit = (current: ts.Node) => {
    if (ts.isTypeReferenceNode(current) && ts.isIdentifier(current.typeName)) {
      const name = current.typeName.text;
      if (known.has(name)) found.push({ alias: name, node: current });
    }

    // в найденный объект не углубляемся: его разберёт свой заход обхода
    if (ts.isTypeLiteralNode(current)) {
      found.push({ node: current });
      return;
    }

    ts.forEachChild(current, visit);
  };

  if (node) visit(node);
  return found;
};

/** все описания из типов: путь пропса → первый абзац и `@default` */
export const collectDocs = (): Record<string, PropDoc> => {
  const source = ts.createSourceFile(
    TYPES_FILE,
    ts.sys.readFile(TYPES_FILE) ?? "",
    ts.ScriptTarget.Latest,
    true,
  );

  const objects = new Map<string, ts.TypeNode>();
  for (const statement of source.statements) {
    if (!ts.isTypeAliasDeclaration(statement)) continue;
    if (membersOf(statement.type).length) objects.set(statement.name.text, statement.type);
  }

  const docs: Record<string, PropDoc> = {};

  const walk = (node: ts.TypeNode, prefix: string, seen: Set<string>) => {
    for (const member of membersOf(node)) {
      if (!ts.isPropertySignature(member) || !member.name) continue;

      const name = member.name.getText(source);
      const key = prefix ? `${prefix}.${name}` : name;

      const doc = docOf(member);
      if (doc) docs[key] = doc;

      for (const child of children(member.type, new Set(objects.keys()))) {
        if (!child.alias) {
          walk(child.node, key, seen);
          continue;
        }

        // тип, который уже раскрыт выше по пути, второй раз не разворачиваем
        if (seen.has(child.alias)) continue;
        walk(objects.get(child.alias)!, key, new Set([...seen, child.alias]));
      }
    }
  };

  for (const [alias, prefix] of Object.entries(ROOTS)) {
    const node = objects.get(alias);
    if (node) walk(node, prefix, new Set([alias]));
  }

  return docs;
};

export default function msDocs(): Plugin {
  return {
    name: "ms-docs",

    resolveId(id) {
      return id === VIRTUAL_ID ? RESOLVED_ID : null;
    },

    load(id) {
      return id === RESOLVED_ID
        ? `export default ${JSON.stringify(collectDocs())};`
        : null;
    },

    configureServer(server) {
      server.watcher.add(TYPES_FILE);
      server.watcher.on("change", (file) => {
        if (file !== TYPES_FILE) return;

        const graph = server.environments.client.moduleGraph;
        const module = graph.getModuleById(RESOLVED_ID);
        if (module) graph.invalidateModule(module);
        server.hot.send({ type: "full-reload" });
      });
    },
  };
}
