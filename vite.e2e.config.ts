import { fileURLToPath, URL } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Dedicated Vite server for the Playwright fixture app.
export default defineConfig({
  root: "tests/e2e/fixture",
  plugins: [react()],
  resolve: {
    alias: {
      "@morphing-scroll/src": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 5199,
    fs: { allow: [".."] },
  },
});
