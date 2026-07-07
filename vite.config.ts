import { fileURLToPath, URL } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  root: "playground",
  plugins: [react()],
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
