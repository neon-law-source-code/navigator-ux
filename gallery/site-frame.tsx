import type { ReactNode } from 'react'

import { SiteFooter, SiteHeader } from '../src/index'
import {
  COMPONENTS_HREF,
  LICENSE_HREF,
  VERIFY_HREF,
  pageHref,
  readGalleryLocation,
} from './routes'

/*
 * The GitHub Pages site is one site, not two: the component gallery and the
 * sample pages used to ship different bars (a marketing header on one, an
 * authenticated navbar on the other). This frame is the public chrome for
 * every view, so a reader can move from a component to a specimen without
 * losing the map.
 */

const BUSL_LEGAL = (
  <>
    <p>
      Navigator UX is source-available under the{' '}
      <a href={LICENSE_HREF}>Business Source License 1.1</a> (BUSL-1.1). Production use
      defaults to AGPL-3.0-only. The shipped typeface stays under SIL OFL 1.1 and is
      not BUSL. This site is a specimen with invented data, not legal advice.
    </p>
    <p>© 2026 Shook Law PLLC. The Neon Law name is not licensed with the code.</p>
  </>
)

export function GalleryFrame({ children }: { children: ReactNode }) {
  const { view, pageId } = readGalleryLocation()
  const onPages = view === 'home' || (view === 'page' && pageId !== 'verify-the-record')

  return (
    <div className="public-shell nav-theme gallery-shell">
      <SiteHeader
        brand="Navigator UX"
        brandHref={COMPONENTS_HREF}
        links={[
          { label: 'Components', href: COMPONENTS_HREF, current: view === 'components' },
          { label: 'Sample pages', href: pageHref('home'), current: onPages },
          { label: 'Councils', href: pageHref('councils'), current: view === 'councils' },
          {
            label: 'Verify the record',
            href: VERIFY_HREF,
            current: view === 'page' && pageId === 'verify-the-record',
          },
        ]}
        utility={[
          { label: 'License (BUSL)', href: LICENSE_HREF, current: view === 'license' },
          { label: 'Source', href: 'https://github.com/neon-law-source-code/navigator-ux' },
        ]}
      />
      <main className="public-shell__main">{children}</main>
      <SiteFooter
        links={[
          { label: 'Components', href: COMPONENTS_HREF },
          { label: 'Sample pages', href: pageHref('home') },
          { label: 'Councils', href: pageHref('councils') },
          { label: 'Verify the record', href: VERIFY_HREF },
          { label: 'License', href: LICENSE_HREF },
        ]}
        legal={BUSL_LEGAL}
      />
    </div>
  )
}
