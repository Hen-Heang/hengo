import { defineConfig, globalIgnores } from "eslint/config"
import nextVitals from "eslint-config-next/core-web-vitals"
import nextTs from "eslint-config-next/typescript"
import prettierConfig from "eslint-config-prettier"

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Must stay last: turns off any ESLint stylistic rule that conflicts with
  // Prettier, so formatting is Prettier's job alone.
  prettierConfig,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    ".next-stale/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Reference copy of the Orbit/goalmap source used during integration — not part of this app.
    "goalmap/**",
    // Donor source for the Dev Notes feature (ported into app/(main)/notes) — not part of this app's build.
    "dev-learning-notes/**",
  ]),
])

export default eslintConfig
