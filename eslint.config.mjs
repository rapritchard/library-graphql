import js from "@eslint/js";
import globals from "globals";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import eslintPluginUnicorn from "eslint-plugin-unicorn";

export default [
  eslintPluginPrettierRecommended,
  eslintPluginUnicorn.configs["flat/recommended"],
  {
    files: ["**/*.{js, test.js}"],
    languageOptions: {
      sourceType: "module",
      globals: {
        ...globals.node,
      },
      ecmaVersion: "latest",
    },
    plugins: {},
    rules: {
      ...js.configs.recommended.rules,
      "unicorn/no-null": "off",
      "unicorn/no-array-reduce": "warn",
      eqeqeq: "error",
      "no-trailing-spaces": "error",
      "object-curly-spacing": ["error", "always"],
      "arrow-spacing": ["error", { before: true, after: true }],
      "no-console": "warn",
      "no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "no-implicit-coercion": "error",
      "arrow-body-style": "off",
      "prefer-const": [
        "error",
        {
          destructuring: "all",
          ignoreReadBeforeAssign: true,
        },
      ],
    },
  },
  {
    ignores: ["node_modules/**", "bin/**", "build/**"],
  },
];
