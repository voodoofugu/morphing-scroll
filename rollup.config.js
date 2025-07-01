import resolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import terser from "@rollup/plugin-terser";
import del from "rollup-plugin-delete";
import commonjs from "@rollup/plugin-commonjs";

const plugins = [
  resolve(),
  commonjs(),
  typescript(),
  terser({
    compress: {
      passes: 2,
      unsafe: true,
      unsafe_arrows: true,
      unsafe_comps: true,
      unsafe_math: true,
      drop_console: true,
      pure_funcs: ["console.log"],
    },
    mangle: {
      toplevel: true,
    },
    output: {
      comments: false,
    },
  }),
];

export default [
  // Shared ESM-библиотека
  {
    input: "./src/shared/index.ts",
    output: {
      dir: "dist/shared",
      format: "esm",
      preserveModules: true,
      entryFileNames: "[name].js",
    },
    plugins: [del({ targets: "dist/*" }), ...plugins],
    external: (id) => /^react/.test(id),
  },

  // ESM точка входа
  {
    input: "./src/entry.esm.ts",
    output: {
      file: "dist/esm/index.js",
      format: "esm",
    },
    plugins,
    external: (id) => /^react/.test(id),
  },

  // CJS точка входа
  {
    input: "./src/entry.cjs.ts",
    output: {
      file: "dist/cjs/index.js",
      format: "cjs",
    },
    plugins,
    external: (id) => /^react/.test(id),
  },
];
