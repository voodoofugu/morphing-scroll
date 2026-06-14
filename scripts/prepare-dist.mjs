import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const publicTypesDir = path.join(root, "types");
const distDir = path.join(root, "dist");
const distTypesDir = path.join(distDir, "types");

await rm(distTypesDir, { recursive: true, force: true });
await mkdir(distTypesDir, { recursive: true });

await cp(publicTypesDir, distTypesDir, { recursive: true });

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

console.log(`Prepared dist package metadata and public types: ${distDir}`);
