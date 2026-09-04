import { useState } from 'react'

import { apiFetch, ApiRequestError } from '../../src/api/client'
import type { components } from '../../src/api/schema'
import { Callout } from '../../src/components/Primitives'
import { DataTable } from '../../src/components/DataTable'
import { PeopleList } from '../../src/components/Form'
import { PageHeader } from '../../src/components/Chrome'

type ApiPerson = components['schemas']['Person']
type ValidateResponse = components['schemas']['ValidateResponse']

const SESSION = 'navigator_session=e2e'

function formatError(error: unknown): string {
  if (error instanceof ApiRequestError) return `${error.status} ${error.message}`
  if (error instanceof Error) return error.message
  return String(error)
}

export function App() {
  const [people, setPeople] = useState<ApiPerson[]>([])
  const [projects, setProjects] = useState<{ id: string; name: string; code: string }[]>([])
  const [lint, setLint] = useState<ValidateResponse | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function run(label: string, work: () => Promise<void>) {
    setError(null)
    setMessage(null)
    try {
      await work()
      setMessage(label)
    } catch (cause) {
      setError(formatError(cause))
    }
  }

  return (
    <main>
      <PageHeader title="API harness" summary="Typed client against the fake OpenAPI backend." />

      <div className="button-row">
        <button
          type="button"
          data-testid="sign-in"
          onClick={() => {
            document.cookie = `${SESSION}; path=/`
            setMessage('signed in')
            setError(null)
          }}
        >
          Sign in
        </button>
        <button
          type="button"
          data-testid="sign-out"
          onClick={() => {
            document.cookie = 'navigator_session=; path=/; max-age=0'
            setMessage('signed out')
          }}
        >
          Sign out
        </button>
        <button
          type="button"
          data-testid="load-people"
          onClick={() =>
            run('people loaded', async () => {
              setPeople(await apiFetch('/app/api/people', 'get'))
            })
          }
        >
          Load people
        </button>
        <button
          type="button"
          data-testid="load-projects"
          onClick={() =>
            run('projects loaded', async () => {
              const rows = await apiFetch('/app/api/projects', 'get')
              setProjects(
                (rows as unknown as { id: string; name: string; code: string }[]).map((row) => ({
                  id: row.id,
                  name: row.name,
                  code: row.code,
                })),
              )
            })
          }
        >
          Load projects
        </button>
        <button
          type="button"
          data-testid="create-person"
          onClick={() =>
            run('person created', async () => {
              await apiFetch('/app/api/people', 'post', {
                body: {
                  name: 'Tobias Lindqvist',
                  email: 'tobias@example.com',
                  role: 'clerk',
                },
              })
              setPeople(await apiFetch('/app/api/people', 'get'))
            })
          }
        >
          Create person
        </button>
        <button
          type="button"
          data-testid="validate-clean"
          onClick={() =>
            run('lint clean', async () => {
              setLint(
                await apiFetch('/app/api/templates/validate', 'post', {
                  body: { contents: '---\nkind: trust\n---\nBody.\n', path: 'trust.md' },
                }),
              )
            })
          }
        >
          Validate clean
        </button>
        <button
          type="button"
          data-testid="validate-broken"
          onClick={() =>
            run('lint broken', async () => {
              setLint(
                await apiFetch('/app/api/templates/validate', 'post', {
                  body: { contents: 'BROKEN', path: 'broken.md' },
                }),
              )
            })
          }
        >
          Validate broken
        </button>
        <button
          type="button"
          data-testid="post-message"
          onClick={() =>
            run('message posted', async () => {
              await apiFetch('/app/api/projects/{id}/conversation/messages', 'post', {
                path: { id: '0199a1f0-0000-7000-8000-000000000010' },
                body: { body: 'Ready for the Northwind review.' },
              })
            })
          }
        >
          Post message
        </button>
      </div>

      {error ? (
        <div data-testid="error">
          <Callout tone="danger">{error}</Callout>
        </div>
      ) : null}
      {message ? (
        <p data-testid="status">{message}</p>
      ) : null}

      <section data-testid="people">
        <PeopleList legend="Directory" name="people" people={people} />
      </section>

      <section data-testid="projects">
        <DataTable
          rows={projects}
          rowKey={(row) => row.id}
          columns={[
            { key: 'name', header: 'Matter', cell: (row) => row.name },
            { key: 'code', header: 'Code', cell: (row) => row.code },
          ]}
        />
      </section>

      <section data-testid="lint">
        {lint ? (
          <Callout tone={lint.clean ? 'success' : 'warning'}>
            {lint.clean ? `${lint.path} is clean` : lint.violations.map((row) => row.message).join('; ')}
          </Callout>
        ) : null}
      </section>
    </main>
  )
}
