/*
 * Fake Navigator API. Routes and required fields come from the pinned
 * OpenAPI snapshot; bodies are the invented fixtures in fixtures.mjs.
 *
 * Listens on 4010. The e2e harness proxies /app/api here so apiFetch keeps
 * speaking relative same-origin paths.
 */

import { createServer } from 'node:http'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

import { NOW, person, seed } from './fixtures.mjs'

const pkg = join(dirname(fileURLToPath(import.meta.url)), '..')
const spec = JSON.parse(readFileSync(join(pkg, 'spec/openapi.json'), 'utf8'))
const PORT = Number(process.env.E2E_API_PORT ?? 4010)
const SESSION_COOKIE = 'navigator_session'

const store = seed()

function matchTemplate(template, pathname) {
  const names = []
  const source = template.replace(/\{([^}]+)\}/g, (_, name) => {
    names.push(name)
    return '([^/]+)'
  })
  const match = pathname.match(new RegExp(`^${source}$`))
  if (!match) return null
  const params = {}
  names.forEach((name, index) => {
    params[name] = decodeURIComponent(match[index + 1] ?? '')
  })
  return params
}

function lookup(method, pathname) {
  const verb = method.toLowerCase()
  for (const [template, operations] of Object.entries(spec.paths)) {
    const operation = operations[verb]
    if (!operation) continue
    const params = matchTemplate(template, pathname)
    if (params) return { template, operation, params }
  }
  return null
}

function requiredBodyFields(operation) {
  const schema = operation.requestBody?.content?.['application/json']?.schema
  if (!schema) return []
  if (schema.$ref) {
    const name = schema.$ref.split('/').pop()
    return spec.components?.schemas?.[name]?.required ?? []
  }
  return schema.required ?? []
}

function readCookie(req, name) {
  const header = req.headers.cookie
  if (!header) return null
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=')
    if (key === name) return rest.join('=')
  }
  return null
}

function send(res, status, body) {
  const payload = body === undefined ? '' : JSON.stringify(body)
  res.writeHead(status, {
    'content-type': 'application/json',
    'access-control-allow-origin': '*',
  })
  res.end(payload)
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (chunk) => chunks.push(chunk))
    req.on('end', () => {
      if (chunks.length === 0) {
        resolve(undefined)
        return
      }
      const text = Buffer.concat(chunks).toString('utf8')
      try {
        resolve(JSON.parse(text))
      } catch (error) {
        reject(error)
      }
    })
    req.on('error', reject)
  })
}

function handle(template, method, params, body) {
  const key = `${method.toUpperCase()} ${template}`

  switch (key) {
    case 'GET /app/api/people':
      return { status: 200, body: store.people }
    case 'POST /app/api/people': {
      const created = person({
        id: `0199a1f0-0000-7000-8000-${String(100 + store.people.length).padStart(12, '0')}`,
        name: body.name,
        email: body.email,
        role: body.role ?? 'client',
      })
      store.people.push(created)
      return { status: 201, body: created }
    }
    case 'GET /app/api/projects':
      return { status: 200, body: store.projects }
    case 'GET /app/api/projects/{id}': {
      const found = store.projects.find((row) => row.id === params.id)
      return found
        ? { status: 200, body: found }
        : { status: 404, body: { error: 'not_found' } }
    }
    case 'GET /app/api/entities':
      return { status: 200, body: store.entities }
    case 'GET /app/api/entity-types':
      return { status: 200, body: store.entityTypes }
    case 'GET /app/api/jurisdictions':
      return { status: 200, body: store.jurisdictions }
    case 'GET /app/api/projects/{id}/conversation':
      return { status: 200, body: store.messages.filter((row) => row.project_id === params.id) }
    case 'POST /app/api/projects/{id}/conversation/messages': {
      const message = {
        id: `msg-${store.messages.length + 1}`,
        project_id: params.id,
        body: body.body,
        internal: Boolean(body.internal),
        inserted_at: NOW,
      }
      store.messages.push(message)
      return { status: 201, body: message }
    }
    case 'POST /app/api/templates/validate': {
      const contents = String(body.contents ?? '')
      const path = body.path ?? 'template.md'
      if (contents.includes('BROKEN')) {
        return {
          status: 200,
          body: {
            path,
            clean: false,
            violations: [{ code: 'N101', line: 1, message: 'specimen violation' }],
          },
        }
      }
      return { status: 200, body: { path, clean: true, violations: [] } }
    }
    default:
      return { status: 501, body: { error: 'not_implemented', message: key } }
  }
}

export function createMockApi() {
  return createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', `http://127.0.0.1:${PORT}`)

    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'access-control-allow-origin': '*',
        'access-control-allow-headers': 'content-type, accept',
        'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE',
      })
      res.end()
      return
    }

    if (req.method === 'GET' && url.pathname === '/') {
      send(res, 200, { ok: true })
      return
    }

    const found = lookup(req.method ?? 'GET', url.pathname)
    if (!found) {
      send(res, 404, { error: 'not_in_spec', message: `${req.method} ${url.pathname}` })
      return
    }

    if (!readCookie(req, SESSION_COOKIE)) {
      send(res, 401, { error: 'unauthenticated' })
      return
    }

    let body
    try {
      body = await readBody(req)
    } catch {
      send(res, 400, { error: 'invalid', message: 'body is not JSON' })
      return
    }

    const missing = requiredBodyFields(found.operation).filter(
      (field) => body == null || body[field] === undefined || body[field] === '',
    )
    if (missing.length > 0) {
      send(res, 400, { error: 'invalid', message: `missing ${missing.join(', ')}` })
      return
    }

    const result = handle(found.template, req.method ?? 'GET', found.params, body ?? {})
    send(res, result.status, result.body)
  })
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const server = createMockApi()
  server.listen(PORT, '127.0.0.1', () => {
    console.log(`mock-api: http://127.0.0.1:${PORT}`)
  })
}
