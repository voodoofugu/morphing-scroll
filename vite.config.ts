import { fileURLToPath, URL } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

import msDocs from "./playground/plugins/docs";
import msReadme from "./playground/plugins/readme";

export default defineConfig({
  root: "playground",
  plugins: [react(), msDocs(), msReadme()],
  // документация — главная страница, дашборд живёт отдельно в /playground/;
  // старый /docs/ остаётся лёгким редиректом для опубликованных ссылок
  build: {
    rollupOptions: {
      input: {
        docs: fileURLToPath(new URL("./playground/index.html", import.meta.url)),
        playground: fileURLToPath(
          new URL("./playground/playground/index.html", import.meta.url),
        ),
        docsLegacy: fileURLToPath(
          new URL("./playground/docs/index.html", import.meta.url),
        ),
      },
    },
  },
  resolve: {
    alias: {
      "@morphing-scroll/src": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    fs: {
      allow: [".."],
    },
  },
});
