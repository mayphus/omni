import { Layout } from './components/layout/Layout'
import { Dashboard } from './pages/Dashboard'
import { Products } from './pages/Products'
import { Orders } from './pages/Orders'
import { Users } from './pages/Users'
import { System } from './pages/System'
import { useHashRoute } from './lib/router'

export default function App() {
  const { route } = useHashRoute()
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
