import pluginJs from "@eslint/js";
import pluginReact from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

export default [
  {
    ignores: ["publish/**", "node_modules/**", "dist/**"],
  },

  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,

  {
    files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      react: pluginReact,
      "react-hooks": reactHooks,
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      "react/prop-types": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "no-unused-expressions": [
        "error",
        { allowShortCircuit: true, allowTernary: true },
      ],
      "@typescript-eslint/no-unused-expressions": [
        "error",
        { allowShortCircuit: true, allowTernary: true },
      ],
      "react/react-in-jsx-scope": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "off",
    },
  },
];
