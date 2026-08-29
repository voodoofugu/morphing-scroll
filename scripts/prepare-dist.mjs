import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

// Типы генерирует `npm run build:types` прямо в dist/types из src —
// единственного источника. Здесь остаётся только метаданные пакета.
const root = process.cwd();
const distDir = path.join(root, "dist");

await mkdir(path.join(distDir, "esm"), { recursive: true });
await mkdir(path.join(distDir, "cjs"), { recursive: true });

await writeFile(
  path.join(distDir, "esm", "package.json"),
  `${JSON.stringify({ type: "module" }, null, 2)}\n`,
);
await writeFile(
  path.join(distDir, "cjs", "package.json"),
  `${JSON.stringify({ type: "commonjs" }, null, 2)}\n`,
);

console.log(`Prepared dist package metadata: ${distDir}`);
