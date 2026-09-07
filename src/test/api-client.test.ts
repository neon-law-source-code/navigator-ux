import { afterEach, describe, expect, it, vi } from 'vitest'
import { fakePerson } from '../../fixtures/fake.mjs'
import { API_PREFIX, ApiRequestError, apiFetch } from '../api/client'
import type { components } from '../api/schema'
import type { Person as FormPerson } from '../components/Form'
import type { SessionRole } from '../session/session'

type ApiPerson = components['schemas']['Person']
type PersonRole = components['schemas']['PersonRole']

type Expect<T extends true> = T
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
  ? true
  : false

export type SessionRoleMatchesSpec = Expect<Equal<SessionRole, PersonRole>>

const LAWYER = fakePerson('api-client/lawyer')
const CLIENT = fakePerson('api-client/client')

function person(overrides: Partial<ApiPerson> = {}): ApiPerson {
  return {
    id: '0199a1f0-0000-7000-8000-000000000003',
    name: LAWYER.name,
    email: LAWYER.email,
    role: 'lawyer',
    inserted_at: '2026-01-15T00:00:00.000Z',
    updated_at: '2026-01-15T00:00:00.000Z',
    ...overrides,
  }
}

function respondWith(status: number, body?: unknown) {
  const fetchMock = vi.fn<typeof fetch>(async () => {
    const empty = body === undefined
    return new Response(empty ? null : JSON.stringify(body), {
      status,
      headers: empty ? undefined : { 'content-type': 'application/json' },
    })
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

afterEach(() => vi.unstubAllGlobals())

describe('apiFetch', () => {
  it('GETs a listing over a relative /app/api path', async () => {
    const fetchMock = respondWith(200, [person()])
    await expect(apiFetch('/app/api/people', 'get')).resolves.toEqual([person()])
    expect(fetchMock).toHaveBeenCalledOnce()
    const call = fetchMock.mock.calls[0]
    expect(call?.[0]).toBe('/app/api/people')
    expect((call?.[1] as RequestInit | undefined)?.method).toBe('GET')
    expect((call?.[1] as RequestInit | undefined)?.credentials).toBe('same-origin')
  })

  it('fills a path template and POSTs a JSON body', async () => {
    const created = person({ name: CLIENT.name, email: CLIENT.email, role: 'client' })
    const fetchMock = respondWith(201, created)
    await expect(
      apiFetch('/app/api/people', 'post', {
        body: { name: CLIENT.name, email: CLIENT.email, role: 'client' },
      }),
    ).resolves.toEqual(created)

    const fetchProject = respondWith(200, { id: '0199a1f0-0000-7000-8000-000000000010' })
    await apiFetch('/app/api/projects/{id}', 'get', {
      path: { id: '0199a1f0-0000-7000-8000-000000000010' },
    })
    expect(fetchProject.mock.calls[0]?.[0]).toBe(
      '/app/api/projects/0199a1f0-0000-7000-8000-000000000010',
    )
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ method: 'POST' })
  })

  it('encodes path parameters', async () => {
    const fetchMock = respondWith(200, {})
    await apiFetch('/app/api/projects/{id}', 'get', { path: { id: 'a/b' } })
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/app/api/projects/a%2Fb')
  })

  it('throws ApiRequestError on 401 with the body error token', async () => {
    respondWith(401, { error: 'unauthenticated', message: 'sign in' })
    await expect(apiFetch('/app/api/people', 'get')).rejects.toMatchObject({
      name: 'ApiRequestError',
      status: 401,
      message: 'unauthenticated',
    })
    await expect(apiFetch('/app/api/people', 'get')).rejects.toBeInstanceOf(ApiRequestError)
  })

  it('throws ApiRequestError on a gateway 500 without an error token', async () => {
    respondWith(500)
    await expect(apiFetch('/app/api/entities', 'get')).rejects.toMatchObject({
      status: 500,
      message: 'apiFetch GET /app/api/entities returned 500',
    })
  })

  it('rejects a 200 that is not JSON', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('not-json', { status: 200 })),
    )
    await expect(apiFetch('/app/api/people', 'get')).rejects.toThrow('non-JSON')
  })

  it('refuses an absolute or protocol-relative URL even if the type is widened', async () => {
    const fetchMock = respondWith(200, [])
    const forged = apiFetch as unknown as (path: string, method: string) => Promise<unknown>
    await expect(forged('https://evil.example/app/api/people', 'get')).rejects.toThrow(
      'relative /app/api paths',
    )
    await expect(forged('//cdn.example.com/app/api/people', 'get')).rejects.toThrow(
      'relative /app/api paths',
    )
    await expect(forged('/v2/people', 'get')).rejects.toThrow('/app/api paths')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('throws when a path parameter is missing at runtime', async () => {
    const fetchMock = respondWith(200, {})
    const loose = apiFetch as unknown as (
      path: string,
      method: string,
      options?: { path?: Record<string, string> },
    ) => Promise<unknown>
    await expect(loose('/app/api/projects/{id}', 'get', { path: {} })).rejects.toThrow(
      'missing path parameter id',
    )
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('keeps credentials same-origin even when init asks otherwise', async () => {
    const fetchMock = respondWith(200, [person()])
    await apiFetch('/app/api/people', 'get', {
      init: { credentials: 'omit', headers: { 'x-test': '1' } },
    })
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit | undefined
    expect(init?.credentials).toBe('same-origin')
    expect(new Headers(init?.headers).get('x-test')).toBe('1')
    expect(new Headers(init?.headers).get('accept')).toBe('application/json')
  })

  it('POSTs a template lint body', async () => {
    const fetchMock = respondWith(200, { path: 'trust.md', clean: true, violations: [] })
    await expect(
      apiFetch('/app/api/templates/validate', 'post', {
        body: { contents: '---\nkind: trust\n---\n', path: 'trust.md' },
      }),
    ).resolves.toEqual({ path: 'trust.md', clean: true, violations: [] })
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit | undefined
    expect(init?.method).toBe('POST')
    expect(init?.body).toBe(JSON.stringify({ contents: '---\nkind: trust\n---\n', path: 'trust.md' }))
  })
})

describe('API prefix and view-model assignability', () => {
  it('keeps the published prefix on /app/api', () => {
    expect(API_PREFIX).toBe('/app/api')
  })

  it('lets an API Person fill a PeopleList row', () => {
    const row: FormPerson = {
      id: person().id,
      name: person().name,
      email: person().email,
    }
    expect(row.email).toBe(LAWYER.email)
  })

  it('names the same roles the snapshot names', () => {
    const roles: SessionRole[] = ['owner', 'admin', 'lawyer', 'clerk', 'client']
    expect(roles).toHaveLength(5)
  })
})
