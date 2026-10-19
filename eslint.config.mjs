// Implements @superpanch/quality-feedback-loop eslint/react preset
// (inlined because file: symlinks break CJS require resolution for peer deps)
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettierConfig from "eslint-config-prettier";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";

export default [
  { ignores: ["dist", "packages", "landing"] },
  js.configs.recommended,
  ...tseslint.configs.strict,
  prettierConfig,
  reactHooks.configs["recommended-latest"],
  {
    plugins: { "react-refresh": reactRefresh },
    rules: { "react-refresh/only-export-components": "warn" },
  },
  {
    languageOptions: { globals: { ...globals.browser } },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/no-unused-expressions": "error",
      "no-fallthrough": "error",
      "no-empty": "error",
      "no-useless-catch": "error",
    },
  },
];
