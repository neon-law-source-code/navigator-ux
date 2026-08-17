import { act, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { ThemeProvider, useTheme } from '../theme/ThemeProvider'

/**
 * A controllable `matchMedia`.
 *
 * The shim in `setup.ts` answers `matches: false` and drops its listeners on
 * the floor, which is enough for a component that merely consults the query but
 * not for one that has to notice the OS changing under it.
 */
function installMatchMedia(initial: boolean) {
  const listeners = new Set<(event: MediaQueryListEvent) => void>()
  let matches = initial

  const query = {
    get matches() {
      return matches
    },
    media: '(prefers-color-scheme: dark)',
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: (_: string, fn: (event: MediaQueryListEvent) => void) => {
      listeners.add(fn)
    },
    removeEventListener: (_: string, fn: (event: MediaQueryListEvent) => void) => {
      listeners.delete(fn)
    },
    dispatchEvent: () => false,
  }

  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: () => query,
  })

  return {
    /** Flip the OS preference and notify everyone listening. */
    set(next: boolean) {
      matches = next
      act(() => {
        for (const fn of listeners) fn({ matches: next } as MediaQueryListEvent)
      })
    },
    /** How many listeners are still attached — proves cleanup ran. */
    get listenerCount() {
      return listeners.size
    },
  }
}

function ThemeProbe() {
  const { theme } = useTheme()
  return <span data-testid="scheme">{theme}</span>
}

const scheme = () => screen.getByTestId('scheme').textContent

describe('ThemeProvider', () => {
  const original = Object.getOwnPropertyDescriptor(window, 'matchMedia')

  afterEach(() => {
    if (original) Object.defineProperty(window, 'matchMedia', original)
  })

  it('reports the operating system preference', () => {
    installMatchMedia(true)
    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    )
    expect(scheme()).toBe('dark')
  })

  it('corrects a defaultTheme that disagrees with the OS', () => {
    installMatchMedia(true)
    render(
      // A portal may render light-first for SSR; the browser gets the last word.
      <ThemeProvider defaultTheme="light">
        <ThemeProbe />
      </ThemeProvider>,
    )
    expect(scheme()).toBe('dark')
  })

  it('follows the OS when the reader changes it mid-session', () => {
    const media = installMatchMedia(false)
    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    )
    expect(scheme()).toBe('light')

    media.set(true)
    expect(scheme()).toBe('dark')

    media.set(false)
    expect(scheme()).toBe('light')
  })

  it('detaches its listener on unmount', () => {
    const media = installMatchMedia(false)
    const view = render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    )
    expect(media.listenerCount).toBe(1)
    view.unmount()
    expect(media.listenerCount).toBe(0)
  })

  it('sets no attribute on the document', () => {
    // The whole point of following the OS: nothing to write before first paint,
    // so no pre-paint script and no flash.
    installMatchMedia(true)
    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    )
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false)
  })

  it('survives a runtime with no matchMedia at all', () => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: undefined,
    })
    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    )
    expect(scheme()).toBe('light')
  })
})

describe('useTheme without a provider', () => {
  const original = Object.getOwnPropertyDescriptor(window, 'matchMedia')

  afterEach(() => {
    if (original) Object.defineProperty(window, 'matchMedia', original)
  })

  // The provider is optional, so the hook has to stand on its own rather than
  // throwing the way the session hook does.
  it('reads the media query directly', () => {
    installMatchMedia(true)
    render(<ThemeProbe />)
    expect(scheme()).toBe('dark')
  })

  it('still follows a mid-session change', () => {
    const media = installMatchMedia(false)
    render(<ThemeProbe />)
    expect(scheme()).toBe('light')
    media.set(true)
    expect(scheme()).toBe('dark')
  })

  it('detaches its listener on unmount', () => {
    const media = installMatchMedia(false)
    const view = render(<ThemeProbe />)
    expect(media.listenerCount).toBe(1)
    view.unmount()
    expect(media.listenerCount).toBe(0)
  })

  it('survives a runtime with no matchMedia at all', () => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: undefined,
    })
    render(<ThemeProbe />)
    expect(scheme()).toBe('light')
  })
})
