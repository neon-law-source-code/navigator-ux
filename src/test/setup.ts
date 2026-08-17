import '@testing-library/jest-dom/vitest'

// jsdom has no matchMedia, which ThemeProvider consults for the OS preference.
if (!window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia
}

// Node 26 exposes its own `localStorage` global, which shadows the jsdom
// implementation and is inert unless the runtime is started with
// --localstorage-file. Browsers always have real storage, so this shim exists
// purely so the suite exercises the same code path the browser will.
if (!window.localStorage) {
  const store = new Map<string, string>()
  const storage: Storage = {
    get length() {
      return store.size
    },
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, String(value)),
    removeItem: (key: string) => void store.delete(key),
    clear: () => store.clear(),
  }
  Object.defineProperty(window, 'localStorage', { value: storage, configurable: true })
}
