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

// Admin shell orchestrates authentication and simple hash-based routing between
// dashboard areas. Once a CloudBase session is confirmed we render the
// corresponding management view.
export default function App() {
  const { route } = useHashRoute()
  const [user, setUser] = React.useState<CloudbaseUser | null | undefined>(undefined)

  React.useEffect(() => {
    let alive = true
    // CloudBase auto-refreshes sessions; we mirror that on mount so operators
    // land directly in the dashboard if they already logged in via another tab.
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
      // Force a re-render into the Login screen even if the network request
      // fails—the CloudBase SDK will clear local tokens as part of signOut.
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
