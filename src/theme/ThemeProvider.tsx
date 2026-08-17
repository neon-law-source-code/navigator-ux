import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type Theme = 'light' | 'dark'

interface ThemeContextValue {
  /** The scheme the OS is currently asking for. */
  theme: Theme
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

const DARK_QUERY = '(prefers-color-scheme: dark)'

function systemTheme(): Theme {
  return window.matchMedia?.(DARK_QUERY).matches ? 'dark' : 'light'
}

export interface ThemeProviderProps {
  children: ReactNode
  /**
   * Scheme to assume before the media query can be read — server rendering and
   * the first paint of a test. The browser corrects it on mount.
   */
  defaultTheme?: Theme
}

/**
 * Reports the operating system's color scheme. It does not set one.
 *
 * The scheme follows `prefers-color-scheme` and nothing else: there is no
 * toggle, no stored choice, and no `data-theme` attribute. That is a deliberate
 * product decision, and it buys three things. The media query is resolved by
 * the browser before first paint, so there is no flash and no need for the
 * pre-paint inline script a stored choice would force. There is no state to
 * disagree with the OS after the reader changes it at lunchtime. And a portal
 * under a strict CSP needs no exception.
 *
 * So this provider owns no styling. `tokens.css` does all of it, in the media
 * query. What the provider adds is a way for a component to *branch* on the
 * scheme when CSS cannot express the difference — picking a light or dark
 * raster asset, say, or an inline SVG's `fill`. Anything expressible in CSS
 * should be a token, not a call to `useTheme()`.
 *
 * Mounting it is optional. A portal that never branches on the scheme renders
 * correctly without it.
 */
export function ThemeProvider({ children, defaultTheme }: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => defaultTheme ?? systemTheme())

  useEffect(() => {
    const query = window.matchMedia?.(DARK_QUERY)
    if (!query) return

    // Re-read on mount as well as on change: `defaultTheme` may have been
    // wrong, and the OS can flip between the initial render and this effect.
    setTheme(query.matches ? 'dark' : 'light')

    const onChange = (event: MediaQueryListEvent) => setTheme(event.matches ? 'dark' : 'light')
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  // A fresh object each render would re-render every consumer on any parent
  // render, for a value that changes about twice a day.
  const value = useMemo(() => ({ theme }), [theme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

/**
 * The resolved OS color scheme.
 *
 * Falls back to reading the media query directly when no provider is mounted,
 * because the provider is optional and a component that only wants to know the
 * scheme should not force one into the tree.
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)
  const [fallback, setFallback] = useState<Theme>(() =>
    typeof window === 'undefined' ? 'light' : systemTheme(),
  )
  const unprovided = context === null

  useEffect(() => {
    if (!unprovided) return
    const query = window.matchMedia?.(DARK_QUERY)
    if (!query) return
    setFallback(query.matches ? 'dark' : 'light')
    const onChange = (event: MediaQueryListEvent) => setFallback(event.matches ? 'dark' : 'light')
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [unprovided])

  return context ?? { theme: fallback }
}
