import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { shared } from '../../gallery/content/catalog'
import { NeonSite } from '../../gallery/neon-site'

/*
 * The public pages must render the sentences the pinned catalog publishes.
 *
 * This drives the real component tree — router, YAML/Markdown load, shared
 * resolution, React render — rather than comparing two values that came from
 * the same import. Change a value in Navigator's catalog, re-export, and this
 * is what notices that the rendered page changed with it.
 */
function renderAt(path: string) {
  window.history.replaceState({}, '', path)
  render(<NeonSite />)
  return document.body.textContent ?? ''
}

afterEach(cleanup)

describe('the public pages render the pinned catalog', () => {
  it.each([
    ['/neon', ['home.need_prompt', 'home.mission_heading', 'home.mission_north_star', 'home.mission_promise', 'services.subscriptions_heading', 'services.catalog_heading', 'litigation.cta']],
    ['/neon/services', ['services.eyebrow', 'services.title', 'services.lede']],
    ['/neon/litigation', ['litigation.eyebrow', 'litigation.title', 'litigation.lede', 'litigation.cta', 'litigation.cases_help_others']],
    ['/neon/fractional-gc', ['fractional_gc.eyebrow', 'fractional_gc.title', 'fractional_gc.lede', 'fractional_gc.price', 'fractional_gc.included.response_window', 'fractional_gc.included.ownership']],
    ['/neon/personal-plan', ['personal_plan.eyebrow', 'personal_plan.title', 'personal_plan.price', 'personal_plan.included.credit_monitoring']],
  ])('%s publishes the shared copy it references', (path, keys) => {
    const text = renderAt(path)
    for (const key of keys) {
      expect(text, `${path} must publish ${key}`).toContain(shared(key))
    }
  })

  it('never leaks an unresolved reference to a reader', () => {
    for (const path of ['/neon', '/neon/services', '/neon/litigation', '/neon/fractional-gc', '/neon/personal-plan']) {
      expect(renderAt(path)).not.toContain('{shared:')
      cleanup()
    }
  })

  it('keeps the home heading as the one the catalog authors', () => {
    renderAt('/neon')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(shared('home.need_prompt'))
  })

  it('publishes the four home practice doors with decorative glyphs', () => {
    renderAt('/neon')
    expect(document.querySelectorAll('.neon-site__practice-card')).toHaveLength(4)
    expect(document.querySelectorAll('.neon-site__practice-card .nav-card__icon[aria-hidden="true"]')).toHaveLength(4)
  })
})
