import resolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import terser from "@rollup/plugin-terser";
import del from "rollup-plugin-delete";
import commonjs from "@rollup/plugin-commonjs";

const external = (id) => /^react/.test(id) || id === "keytask-core";
const isDevBuild = process.env.MORPHING_SCROLL_BUILD === "development";
const bundleCompilerOptions = {
  target: "ES5",
  downlevelIteration: true,
};
const outputOptions = {
  generatedCode: "es5",
};

const plugins = [
  resolve(),
  commonjs(),
  typescript({
    compilerOptions: bundleCompilerOptions,
  }),
  ...(isDevBuild
    ? []
    : [
        terser({
          ecma: 5,
          compress: {
            ecma: 5,
            passes: 2,
            unsafe: true,
            unsafe_comps: true,
            unsafe_math: true,
            drop_console: true,
            pure_funcs: ["console.log"],
          },
          mangle: {
            toplevel: true,
          },
          format: {
            ecma: 5,
            comments: false,
          },
        }),
      ]),
];

export default [
  // ESM точка входа
  {
    input: "./src/index.ts",
    output: {
      ...outputOptions,
      file: "dist/esm/index.js",
      format: "esm",
    },
    plugins: [del({ targets: "dist/*" }), ...plugins],
    external,
  },

  // CJS точка входа
  {
    input: "./src/index.ts",
    output: {
      ...outputOptions,
      file: "dist/cjs/index.js",
      format: "cjs",
      exports: "named",
    },
    plugins,
    external,
  },
];
