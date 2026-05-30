import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import unusedImports from "eslint-plugin-unused-imports";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  {
    ignores: [
      ".next/**",
      "out/**",
      "dist/**",
      "build/**",
      "node_modules/**",
      "next-env.d.ts",
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    plugins: {
      "unused-imports": unusedImports,
    },
    rules: {
      // Large existing surface of `any` is style debt, not bugs; surface as
      // warnings so lint stays runnable in CI without a mass refactor.
      "@typescript-eslint/no-explicit-any": "warn",
      // Delegated to unused-imports below (its no-unused-imports rule is
      // auto-fixable, unlike the base rule).
      "@typescript-eslint/no-unused-vars": "off",
      // Auto-removes unused imports on --fix.
      "unused-imports/no-unused-imports": "error",
      // Unused locals are surfaced as warnings (not bundled like imports, and
      // hand-removal across the existing surface is high-churn/low-value);
      // underscore-prefixed names and caught errors are ignored.
      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
          caughtErrors: "none",
        },
      ],
      // Cosmetic: apostrophes/quotes in JSX text. Commonly disabled; not a
      // correctness concern.
      "react/no-unescaped-entities": "off",
    },
  },
  {
    // CommonJS config files and Node scripts legitimately use require().
    files: ["**/*.js", "**/*.cjs"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
];

export default eslintConfig;
