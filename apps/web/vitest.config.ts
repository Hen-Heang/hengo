import { fileURLToPath, URL } from "node:url"
import { defineConfig } from "vitest/config"

// Node 24+ turns Web Storage on by default, so `globalThis.localStorage`
// already exists before jsdom loads and jsdom skips installing its own. But
// Node's only works with --localstorage-file; without that path it is a stub
// whose `.clear()` is undefined, so every test touching localStorage fails.
// Switching Node's off hands the global back to jsdom.
//
// It has to go through NODE_OPTIONS: Vitest runs each test file in a child
// process that inherits this env and lets Node apply the flag at startup,
// whereas poolOptions.execArgv is overwritten by Vitest's own argv.
//
// Gated on the major version because the flag only exists from Node 22.4.
// CI runs Node 22, where Web Storage is off anyway, so it takes no flag.
const nodeMajor = Number(process.versions.node.split(".")[0])
if (nodeMajor >= 24) {
  const flag = "--no-experimental-webstorage"
  const current = process.env.NODE_OPTIONS ?? ""
  if (!current.includes(flag)) {
    process.env.NODE_OPTIONS = `${current} ${flag}`.trim()
  }
}

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
