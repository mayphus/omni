import { Layout } from './components/layout/Layout'
import { Dashboard } from './pages/Dashboard'
import { Products } from './pages/Products'
import { Orders } from './pages/Orders'
import { Users } from './pages/Users'
import { System } from './pages/System'
import { useHashRoute } from './lib/router'
import * as React from 'react'
import { Login } from './pages/Login'
import { ensureLoginState } from './lib/cloudbase'

export default function App() {
  const { route } = useHashRoute()
  const [authed, setAuthed] = React.useState<boolean | null>(null)

  React.useEffect(() => {
    let alive = true
    ensureLoginState()
      .then((ok) => alive && setAuthed(ok))
      .catch(() => alive && setAuthed(false))
    return () => {
      alive = false
    }
  }, [])

  if (authed === null) return null
  if (!authed) return <Login onSuccess={() => setAuthed(true)} />

  return (
    <Layout>
      {route === 'dashboard' && <Dashboard />}
      {route === 'products' && <Products />}
      {route === 'orders' && <Orders />}
      {route === 'users' && <Users />}
      {route === 'system' && <System />}
    </Layout>
  )
}
