import resolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import terser from "@rollup/plugin-terser";
import del from "rollup-plugin-delete";
import commonjs from "@rollup/plugin-commonjs";

export default [
  {
    input: "./src/index.ts",
    output: [
      {
        file: "dist/cjs/index.js",
        format: "cjs",
      },
      {
        file: "dist/esm/index.js",
        format: "esm",
        preserveModules: false,
      },
    ],
    plugins: [
      del({ targets: "dist/*" }),
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
    ],
    external: (id) => /^react/.test(id),
  },
];
