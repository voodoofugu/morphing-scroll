import resolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import terser from "@rollup/plugin-terser";
import del from "rollup-plugin-delete";
import commonjs from "@rollup/plugin-commonjs";

const external = (id) => /^react/.test(id) || id === "keytask-core";
const isDevBuild = process.env.MORPHING_SCROLL_BUILD === "development";
/*
 * ES5 стоил примерно десятую часть бандла: даунлевелинг классов, спреда и
 * циклов тянет за собой вспомогательные функции в каждый модуль. ES2018 —
 * это Chrome 63, Safari 12, Edge 79, и он покрывает всё, где вообще может
 * работать React из peerDependencies.
 */
const bundleCompilerOptions = {
  target: "ES2018",
};
const outputOptions = {
  generatedCode: "es2015",
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
          ecma: 2018,
          compress: {
            ecma: 2018,
            passes: 2,
            unsafe: true,
            unsafe_comps: true,
            unsafe_math: true,
            // console.error несёт диагностику, которую видит потребитель
            // библиотеки, — её оставляем; глушим только отладочный вывод
            pure_funcs: ["console.log", "console.debug", "console.info"],
          },
          mangle: {
            toplevel: true,
          },
          format: {
            ecma: 2018,
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
