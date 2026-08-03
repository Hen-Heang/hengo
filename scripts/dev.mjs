import { spawn } from "node:child_process"
import { fileURLToPath } from "node:url"

const repositoryRoot = fileURLToPath(new URL("../", import.meta.url))
const apiDirectory = fileURLToPath(new URL("../apps/api/", import.meta.url))
const isWindows = process.platform === "win32"
const pnpm = isWindows ? "pnpm.cmd" : "pnpm"
const maven = isWindows ? "mvnw.cmd" : "./mvnw"

const services = [
  spawn(pnpm, ["--dir", "apps/web", "dev"], {
    cwd: repositoryRoot,
    stdio: "inherit",
    shell: isWindows,
  }),
  spawn(maven, ["spring-boot:run"], {
    cwd: apiDirectory,
    stdio: "inherit",
    shell: isWindows,
  }),
]

let shuttingDown = false

function stopServices(signal = "SIGTERM") {
  if (shuttingDown) return
  shuttingDown = true

  for (const service of services) {
    if (!service.killed) service.kill(signal)
  }
}

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => stopServices(signal))
}

for (const service of services) {
  service.on("error", (error) => {
    console.error(`Unable to start a development service: ${error.message}`)
    stopServices()
    process.exitCode = 1
  })

  service.on("exit", (code, signal) => {
    if (!shuttingDown && (code !== 0 || signal)) {
      process.exitCode = code ?? 1
      stopServices()
    }
  })
}
