import { readFileSync } from "node:fs";

import { collectDocs } from "../../playground/plugins/docs";
import { flatten, parseReadme, README_FILE } from "../../playground/plugins/readme";

/*
 * README — источник правды документации, JSDoc — подсказки редактора. Текст
 * у них разный по жанру и может расходиться, а набор пропсов — нет: проп,
 * который есть в типах, но не описан в README, или раздел README о пропсе,
 * которого больше нет, — это документация, отставшая от кода.
 */
const readme = parseReadme(readFileSync(README_FILE, "utf8"));
const morph = readme.api.find((node) => node.name === "MorphScroll")!;
const sections = flatten(morph.children);
const docs = collectDocs();
const paths = Object.keys(docs);

/**
 * Проп описан, если у него свой раздел — или если о нём говорит ближайший
 * раздел выше: у `edge` или `objects.empty` параметры разобраны в тексте
 * самого пропса, без вложенных разделов.
 */
const covered = (path: string) => {
  if (sections.has(path)) return true;

  const leaf = path.slice(path.lastIndexOf(".") + 1);
  for (let up = path; up.includes("."); ) {
    up = up.slice(0, up.lastIndexOf("."));
    const section = sections.get(up);
    if (section) return new RegExp(`\\b${leaf}\\b`).test(section.body);
  }
  return false;
};

describe("README и типы описывают одни и те же пропсы", () => {
  it("README разбирается на компоненты и пропсы", () => {
    expect(readme.api.map((node) => node.name)).toEqual([
      "MorphScroll",
      "ResizeTracker",
      "IntersectionTracker",
    ]);
    expect(sections.size).toBeGreaterThan(40);
  });

  it("каждый проп из типов описан в README", () => {
    expect(paths.filter((path) => !covered(path))).toEqual([]);
  });

  it("README не описывает пропсов, которых нет в типах", () => {
    const known = (path: string) =>
      path in docs || paths.some((other) => other.startsWith(`${path}.`));

    expect([...sections.keys()].filter((path) => !known(path))).toEqual([]);
  });
});
