/*
 * Start the fake OpenAPI backend and the harness, then run Cypress.
 *
 * Both servers are child processes of this script so a failed spec still
 * tears them down. Cypress is given the harness origin as baseUrl.
 */

import { spawn } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const pkg = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const API_PORT = process.env.E2E_API_PORT ?? '4010'
const HARNESS_PORT = process.env.E2E_HARNESS_PORT ?? '5175'

function waitFor(url, { status = 200, timeoutMs = 30_000 } = {}) {
  const started = Date.now()
  return new Promise((resolveWait, reject) => {
    const tick = async () => {
      try {
        const response = await fetch(url)
        if (response.status === status) {
          resolveWait(undefined)
          return
        }
      } catch {
        // still booting
      }
      if (Date.now() - started > timeoutMs) {
        reject(new Error(`timed out waiting for ${url}`))
        return
      }
      setTimeout(() => void tick(), 200)
    }
    void tick()
  })
}

function child(command, args, extraEnv = {}) {
  const proc = spawn(command, args, {
    cwd: pkg,
    stdio: 'inherit',
    env: { ...process.env, ...extraEnv },
  })
  return proc
}

const kids = []

function stop() {
  for (const proc of kids) {
    if (!proc.killed && proc.exitCode === null) proc.kill('SIGTERM')
  }
}

process.on('SIGINT', () => {
  stop()
  process.exit(130)
})

try {
  const mock = child(process.execPath, ['e2e/mock-api.mjs'], { E2E_API_PORT: API_PORT })
  kids.push(mock)
  const harness = child(
    'pnpm',
    ['exec', 'vite', '--config', 'e2e/vite.config.ts'],
    { E2E_API_PORT: API_PORT },
  )
  kids.push(harness)

  await waitFor(`http://127.0.0.1:${API_PORT}/`)
  await waitFor(`http://127.0.0.1:${HARNESS_PORT}/`)

  const cypress = child('pnpm', ['exec', 'cypress', 'run'], {
    CYPRESS_BASE_URL: `http://127.0.0.1:${HARNESS_PORT}`,
  })
  const code = await new Promise((resolveCode) => {
    cypress.on('exit', (exitCode) => resolveCode(exitCode ?? 1))
  })
  stop()
  process.exit(code)
} catch (error) {
  stop()
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
}
