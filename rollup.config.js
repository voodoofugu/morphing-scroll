import resolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import { terser } from "rollup-plugin-terser";
import del from "rollup-plugin-delete";

export default [
  {
    input: "./src/index.ts",
    output: [
      {
        file: "dist/index.js",
        format: "esm",
        globals: {
          react: "React",
        },
      },
    ],
    plugins: [del({ targets: "dist/*" }), resolve(), typescript(), terser()],
    external: ["react"],
  },
];
