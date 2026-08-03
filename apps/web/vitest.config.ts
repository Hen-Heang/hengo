import { fileURLToPath, URL } from "node:url"
import { defineConfig } from "vitest/config"

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
  test: {
    // These are separate nested apps; goalmap/tests are Playwright suites and
    // must not be collected by this app's Vitest command.
    exclude: ["**/node_modules/**", "**/.git/**", "goalmap/**", "dev-learning-notes/**"],
  },
})
