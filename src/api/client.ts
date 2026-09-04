import type { paths } from './schema'

/**
 * Typed reader for the Navigator JSON API.
 *
 * Same shape as `fetchSession`: the gateway already authenticated the
 * reader, and this module only speaks relative `/app/api` paths on the
 * page's own origin. Components still take props — an app fetches here
 * and hands the result in. An absolute URL is rejected at runtime even
 * if a caller widens the type, which is what keeps a portal from
 * reaching anywhere the OpenAPI snapshot did not name.
 */

export const API_PREFIX = '/app/api'

/** Path templates the snapshot declares — the only first argument `apiFetch` accepts. */
export type ApiPath = keyof paths

type Operation<P extends ApiPath, M extends keyof paths[P]> = paths[P][M]

type DeclaredMethod<P extends ApiPath> = {
  [M in keyof paths[P]]-?: Operation<P, M> extends { responses: infer _R } ? M : never
}[keyof paths[P]]

export type ApiMethod<P extends ApiPath> = Extract<DeclaredMethod<P>, string>

type JsonBody<T> = T extends { content: { 'application/json': infer J } } ? J : never

type SuccessJson<R> = {
  [S in keyof R]: S extends 200 | 201 ? JsonBody<R[S]> : never
}[keyof R]

export type ApiSuccess<P extends ApiPath, M extends ApiMethod<P>> =
  Operation<P, M> extends { responses: infer R } ? SuccessJson<R> : never

type RequestJson<Op> = Op extends {
  requestBody: { content: { 'application/json': infer B } }
}
  ? B
  : never

type PathParams<Op> = Op extends { parameters: { path: infer Params } } ? Params : never

type HasPath<P extends ApiPath, M extends ApiMethod<P>> = [PathParams<Operation<P, M>>] extends [
  never,
]
  ? false
  : true

type HasBody<P extends ApiPath, M extends ApiMethod<P>> = [RequestJson<Operation<P, M>>] extends [
  never,
]
  ? false
  : true

export type ApiFetchOptions<P extends ApiPath, M extends ApiMethod<P>> = {
  /** Extra `fetch` init. `credentials` stays `same-origin` regardless. */
  init?: RequestInit
} & (HasPath<P, M> extends true ? { path: PathParams<Operation<P, M>> } : { path?: never }) &
  (HasBody<P, M> extends true ? { body: RequestJson<Operation<P, M>> } : { body?: never })

export class ApiRequestError extends Error {
  readonly status: number
  readonly payload: unknown

  constructor(status: number, payload: unknown, message: string) {
    super(message)
    this.name = 'ApiRequestError'
    this.status = status
    this.payload = payload
  }
}

function assertRelativeApiPath(path: string): void {
  if (path.includes('://') || path.startsWith('//')) {
    throw new Error('apiFetch only accepts relative /app/api paths')
  }
  if (path !== API_PREFIX && !path.startsWith(`${API_PREFIX}/`)) {
    throw new Error('apiFetch only accepts /app/api paths')
  }
}

function fillPath(template: string, params?: Record<string, unknown>): string {
  return template.replace(/\{([^}]+)\}/g, (_, name: string) => {
    const value = params?.[name]
    if (value === undefined || value === '') {
      throw new Error(`apiFetch missing path parameter ${name}`)
    }
    return encodeURIComponent(String(value))
  })
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text()
  if (!text) return undefined
  try {
    return JSON.parse(text) as unknown
  } catch {
    throw new Error(`apiFetch received non-JSON from ${response.url || 'the API'}`)
  }
}

/**
 * Call one operation from the pinned OpenAPI snapshot.
 *
 * `path` is the template the spec names (`/app/api/projects/{id}`), not a
 * filled URL. Path parameters go in `options.path`; JSON bodies in
 * `options.body`.
 */
type NeedsOptions<P extends ApiPath, M extends ApiMethod<P>> =
  HasPath<P, M> extends true ? true : HasBody<P, M> extends true ? true : false

export async function apiFetch<P extends ApiPath, M extends ApiMethod<P>>(
  path: P,
  method: M,
  ...args: NeedsOptions<P, M> extends true
    ? [options: ApiFetchOptions<P, M>]
    : [options?: ApiFetchOptions<P, M>]
): Promise<ApiSuccess<P, M>> {
  const options = args[0]
  assertRelativeApiPath(path)
  const pathParams = options && 'path' in options ? options.path : undefined
  const url = fillPath(path, pathParams as Record<string, unknown> | undefined)
  if (url.includes('{')) {
    throw new Error(`apiFetch missing path parameter in ${path}`)
  }

  const headers = new Headers(options?.init?.headers)
  if (!headers.has('accept')) headers.set('accept', 'application/json')
  const body = options && 'body' in options ? options.body : undefined
  if (body !== undefined && !headers.has('content-type')) {
    headers.set('content-type', 'application/json')
  }

  const response = await fetch(url, {
    ...options?.init,
    method: String(method).toUpperCase(),
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    credentials: 'same-origin',
  })

  const payload = await readJson(response)
  if (!response.ok) {
    const fromBody =
      payload && typeof payload === 'object' && 'error' in payload && typeof payload.error === 'string'
        ? payload.error
        : `apiFetch ${String(method).toUpperCase()} ${url} returned ${response.status}`
    throw new ApiRequestError(response.status, payload, fromBody)
  }

  return payload as ApiSuccess<P, M>
}
