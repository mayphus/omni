import * as React from 'react'
import { Layout } from './components/layout/Layout'
import { Dashboard } from './pages/Dashboard'
import { Products } from './pages/Products'
import { Orders } from './pages/Orders'
import { Users } from './pages/Users'
import { System } from './pages/System'
import { useHashRoute } from './lib/router'
import { Login } from './pages/Login'
import { ensureLoginState, signOut, type CloudbaseUser } from './lib/cloudbase'

export default function App() {
  const { route } = useHashRoute()
  const [user, setUser] = React.useState<CloudbaseUser | null | undefined>(undefined)

  React.useEffect(() => {
    let alive = true
    ensureLoginState()
      .then((currentUser) => alive && setUser(currentUser))
      .catch(() => alive && setUser(null))
    return () => {
      alive = false
    }
  }, [])

  const handleSignOut = React.useCallback(async () => {
    try {
      await signOut()
    } catch (err) {
      console.error('Failed to sign out', err)
    } finally {
      setUser(null)
    }
  }, [])

  if (user === undefined) return null
  if (!user) return <Login onSuccess={(nextUser) => setUser(nextUser)} />

  return (
    <Layout user={user} onSignOut={handleSignOut}>
      {route === 'dashboard' && <Dashboard />}
      {route === 'products' && <Products />}
      {route === 'orders' && <Orders />}
      {route === 'users' && <Users />}
      {route === 'system' && <System />}
    </Layout>
  )
}
