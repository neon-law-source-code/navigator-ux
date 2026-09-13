import { useId } from 'react'

import { Hero, NavButton, type HeroImage } from '../src/index'
import { en } from './content/load'
import { neonFindHref, readBrandId } from './routes'

/** One question shared by the public home and the service search. */
export function FindNeed({
  headingLevel = 1,
  query,
  onQueryChange,
  heroImage,
}: {
  headingLevel?: 1 | 2
  query?: string
  onQueryChange?: (value: string) => void
  heroImage?: HeroImage
}) {
  const promptId = useId()
  const Heading = headingLevel === 1 ? 'h1' : 'h2'
  const copy = en.find
  const live = onQueryChange !== undefined

  return (
    <section className="neon-site__find">
      {heroImage ? (
        <Hero id={promptId} level={headingLevel} image={heroImage} title={copy.prompt} lede={copy.lede} />
      ) : (
        <>
          <Heading id={promptId}>{copy.prompt}</Heading>
          <p className="neon-site__find-lede">{copy.lede}</p>
        </>
      )}
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
                onChange: (event) => onQueryChange(event.target.value),
              }
            : { defaultValue: query })}
        />
        <NavButton size="lg" variant="primary" type="submit">{copy.submit}</NavButton>
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
      <p className="neon-site__find-help">
        {copy.help} <a href={`mailto:${en.email}`}>{copy.help_cta}</a>
      </p>
    </section>
  )
}
