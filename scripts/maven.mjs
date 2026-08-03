import { spawn } from "node:child_process"
import { fileURLToPath } from "node:url"

const apiDirectory = fileURLToPath(new URL("../apps/api/", import.meta.url))
const isWindows = process.platform === "win32"
const wrapper = isWindows ? "mvnw.cmd" : "./mvnw"
const args = process.argv.slice(2)

if (args.length === 0) {
  console.error("Usage: node scripts/maven.mjs <maven arguments>")
  process.exit(1)
}

const child = spawn(wrapper, args, {
  cwd: apiDirectory,
  stdio: "inherit",
  shell: isWindows,
})

child.on("error", (error) => {
  console.error(`Unable to start the Maven wrapper: ${error.message}`)
  process.exit(1)
})

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
    return
  }

  process.exit(code ?? 1)
})
