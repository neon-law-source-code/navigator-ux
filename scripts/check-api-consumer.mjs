/*
 * Gate the API declarations as a consumer sees them: from the packed tarball,
 * with library checking enabled and without source-tree aliases.
 */

import { mkdtemp, mkdir, readdir, writeFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const pkg = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const scratch = await mkdtemp(join(tmpdir(), 'navigator-ux-api-consumer-'))
const packDir = join(scratch, 'pack')
const consumer = join(scratch, 'consumer')
await mkdir(packDir)
await mkdir(consumer)

function runPackageManager(args, cwd) {
  const execPath = process.env.npm_execpath
  const isJavaScript = execPath ? /\.(?:c?m?js)$/.test(execPath) : false
  const command = execPath ? (isJavaScript ? process.execPath : execPath) : 'pnpm'
  const commandArgs = execPath && isJavaScript ? [execPath, ...args] : args
  const result = spawnSync(command, commandArgs, { cwd, encoding: 'utf8' })
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || `package manager failed: ${args.join(' ')}`)
  }
  return result.stdout
}

runPackageManager(['pack', '--pack-destination', packDir], pkg)
const tarball = (await readdir(packDir)).find((file) => file.endsWith('.tgz'))
if (!tarball) throw new Error('pnpm pack produced no tarball')

await writeFile(
  join(consumer, 'package.json'),
  JSON.stringify(
    {
      name: 'navigator-ux-packed-consumer',
      private: true,
      type: 'module',
      dependencies: {
        '@neon-law-source-code/navigator-ux': `file:${join(packDir, tarball)}`,
        react: '19.3.0',
      },
      devDependencies: {
        '@types/react': '19.3.0',
        typescript: '5.9.3',
      },
    },
    null,
    2,
  ),
)

await writeFile(
  join(consumer, 'tsconfig.json'),
  JSON.stringify(
    {
      compilerOptions: {
        target: 'ES2022',
        module: 'ESNext',
        moduleResolution: 'Bundler',
        strict: true,
        skipLibCheck: false,
        noEmit: true,
        jsx: 'react-jsx',
      },
      files: ['valid.ts', 'invalid.ts'],
    },
    null,
    2,
  ),
)

await writeFile(
  join(consumer, 'valid.ts'),
  `import { apiFetch } from '@neon-law-source-code/navigator-ux'
import type { ApiComponents, ApiPaths } from '@neon-law-source-code/navigator-ux'

const peoplePath: keyof ApiPaths = '/app/api/people'
const role: ApiComponents['schemas']['PersonRole'] = 'client'

void role
void apiFetch(peoplePath, 'get')
void apiFetch('/app/api/people', 'post', {
  body: { name: 'Example', email: 'example@example.com' },
})
void apiFetch('/app/api/projects/{id}', 'get', { path: { id: 'example' } })
`,
)

await writeFile(
  join(consumer, 'invalid.ts'),
  `import { apiFetch } from '@neon-law-source-code/navigator-ux'

// @ts-expect-error Unknown API paths are rejected.
void apiFetch('/app/api/not-a-real-path', 'get')
// @ts-expect-error Methods absent from the selected operation are rejected.
void apiFetch('/app/api/people', 'delete')
// @ts-expect-error Request bodies use the generated operation shape.
void apiFetch('/app/api/people', 'post', { body: { name: 42, email: 'example@example.com' } })
// @ts-expect-error Required request-body fields stay required.
void apiFetch('/app/api/people', 'post', { body: { email: 'example@example.com' } })
`,
)

runPackageManager(['install', '--prefer-offline', '--ignore-scripts', '--lockfile=false'], consumer)
runPackageManager(['exec', 'tsc', '--project', 'tsconfig.json', '--pretty', 'false'], consumer)

console.log('check:api:consumer: clean (packed tarball, valid calls, invalid path/method/body rejected)')
