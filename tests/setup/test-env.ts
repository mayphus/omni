if (typeof window !== 'undefined') {
  await import('@testing-library/jest-dom/vitest')
}

// Polyfill minimal matchMedia for components relying on it in tests.
if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
  window.matchMedia = ((query: string) => {
    const listeners = new Set<(ev: MediaQueryListEvent) => void>()
    const mql: MediaQueryList = {
      matches: false,
      media: query,
      onchange: null,
      addEventListener: (_event, callback: (ev: MediaQueryListEvent) => void) => {
        listeners.add(callback)
      },
      removeEventListener: (_event, callback: (ev: MediaQueryListEvent) => void) => {
        listeners.delete(callback)
      },
      addListener: (callback: (ev: MediaQueryListEvent) => void) => {
        listeners.add(callback)
      },
      removeListener: (callback: (ev: MediaQueryListEvent) => void) => {
        listeners.delete(callback)
      },
      dispatchEvent: (event: Event) => {
        listeners.forEach((listener) => listener(event as MediaQueryListEvent))
        return true
      },
    }
    return mql
  }) as typeof window.matchMedia
}
