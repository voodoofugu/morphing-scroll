#!/usr/bin/env node
/**
 * Проверка собранного пакета: то, что уедет в npm, должно заводиться.
 *
 * Тесты гоняют исходники, а сюда доезжает результат сборки — ES-таргет,
 * терсер, интероп с React. Ломается это молча и только у пользователя,
 * поэтому проверяем отдельно и на обеих сборках.
 */
import path from "node:path";
import url from "node:url";
import { createRequire } from "node:module";

import React from "react";
import { renderToString } from "react-dom/server";

const ROOT = path.resolve(url.fileURLToPath(new URL("..", import.meta.url)));
const PKG = path.join(ROOT, "publish");
const require = createRequire(import.meta.url);

const check = (name, mod) => {
  for (const key of ["MorphScroll", "ResizeTracker", "IntersectionTracker"]) {
    const kind = typeof mod[key];
    if (kind !== "object" && kind !== "function")
      throw new Error(`${name}: нет экспорта ${key}`);
  }

  const html = renderToString(
    React.createElement(
      mod.MorphScroll,
      { size: 300, objectsSize: 100 },
      React.createElement("div", { key: "a" }, "item"),
    ),
  );

  if (!html.includes("ms-viewport"))
    throw new Error(`${name}: разметка не собралась`);

  return html.length;
};

const esm = await import(
  url.pathToFileURL(path.join(PKG, "dist/esm/index.js")).href
);
const cjs = require(path.join(PKG, "dist/cjs/index.js"));

console.log(`smoke esm: ${check("esm", esm)} символов разметки`);
console.log(`smoke cjs: ${check("cjs", cjs)} символов разметки`);
