import { useId, type ChangeEvent } from 'react'

import { en } from './content/load'
import { neonFindHref, readBrandId } from './routes'

/**
 * The McMaster-style find strip. Copy is `find` in `gallery/content/en.yaml` —
 * lift both when a consuming app takes this layout.
 */
export function FindNeed({
  headingLevel = 1,
  query,
  onQueryChange,
}: {
  headingLevel?: 1 | 2
  query?: string
  onQueryChange?: (value: string) => void
}) {
  const promptId = useId()
  const Heading = headingLevel === 1 ? 'h1' : 'h2'
  const copy = en.find
  const live = onQueryChange !== undefined

  return (
    <section className="neon-site__find">
      <Heading id={promptId}>{copy.prompt}</Heading>
      <p className="neon-site__find-lede">{copy.lede}</p>
      <form className="neon-site__find-form" role="search" method="get" action={neonFindHref('')}>
        <input type="hidden" name="brand" value={readBrandId()} />
        <input
          className="nav-input neon-site__find-input"
          type="search"
          name="q"
          aria-labelledby={promptId}
          placeholder={copy.placeholder}
          autoComplete="off"
          {...(live
            ? {
                value: query ?? '',
                onChange: (event: ChangeEvent<HTMLInputElement>) => onQueryChange(event.target.value),
              }
            : { defaultValue: query })}
        />
      </form>
      <p className="neon-site__find-examples">
        {copy.examples.map((example) =>
          live ? (
            <button
              type="button"
              className="neon-site__chip"
              key={example.label}
              onClick={() => onQueryChange(example.query)}
            >
              {example.label}
            </button>
          ) : (
            <a className="neon-site__chip" href={neonFindHref(example.query)} key={example.label}>
              {example.label}
            </a>
          ),
        )}
      </p>
    </section>
  )
}
