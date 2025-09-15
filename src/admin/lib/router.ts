import { useEffect, useState } from 'react'

export type Route = 'dashboard' | 'products' | 'orders' | 'users' | 'system'

function parseHash(): Route {
  const raw = (location.hash || '').replace(/^#\/?/, '')
  const seg = (raw.split('/')[0] || 'dashboard') as Route
  const allowed: Route[] = ['dashboard', 'products', 'orders', 'users', 'system']
  return allowed.includes(seg) ? seg : 'dashboard'
}

export function useHashRoute() {
  const [route, setRoute] = useState<Route>(parseHash())

  useEffect(() => {
    const onChange = () => setRoute(parseHash())
    window.addEventListener('hashchange', onChange)
    // ensure default hash
    if (!location.hash) {
      location.hash = '#/dashboard'
    }
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  const navigate = (to: Route) => {
    if (parseHash() !== to) {
      location.hash = `#/` + to
    }
  }

  return { route, navigate }
}

