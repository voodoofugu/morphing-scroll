import fs from "fs";
import path from "path";

const distDir = path.resolve("./dist");
const publishDir = path.resolve("./publish");

// Что переносим из dist
const distFilesToCopy = ["cjs/index.js", "esm/index.js"];

// создаём publish папку если её нет
fs.mkdirSync(publishDir, { recursive: true });

// Копируем dist-файлы
for (const file of distFilesToCopy) {
  const src = path.join(distDir, file);
  const dest = path.join(publishDir, file);

  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  console.log(`✔ Copied ${file}`);
}

// Копируем README.md (он в корне)
const readmeSrc = path.resolve("./README.md");
const readmeDest = path.join(publishDir, "README.md");
fs.copyFileSync(readmeSrc, readmeDest);
console.log("✔ Copied README.md");
