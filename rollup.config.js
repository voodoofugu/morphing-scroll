import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import { terser } from "rollup-plugin-terser";

export default {
  input: "./src/index.ts",
  output: [
    {
      file: "dist/index.cjs.js",
      format: "cjs",
      globals: {
        react: "React",
        "react-dom": "ReactDOM",
      },
    },
    {
      file: "dist/index.esm.js",
      format: "esm",
      globals: {
        react: "React",
        "react-dom": "ReactDOM",
      },
    },
  ],
  plugins: [resolve(), commonjs(), typescript(), terser()],
  external: ["react", "react-dom"],
};
