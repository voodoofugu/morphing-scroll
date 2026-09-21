import { fileURLToPath, URL } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

import msDocs from "./playground/plugins/docs";
import msReadme from "./playground/plugins/readme";

export default defineConfig({
  root: "playground",
  plugins: [react(), msDocs(), msReadme()],
  // две страницы: дашборд в корне и документация из README в /docs/
  build: {
    rollupOptions: {
      input: {
        playground: fileURLToPath(new URL("./playground/index.html", import.meta.url)),
        docs: fileURLToPath(new URL("./playground/docs/index.html", import.meta.url)),
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
