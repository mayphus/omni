import { useCallback, useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { Button } from '../components/ui/button'
import { fetchDashboardSummary } from '../services/dashboard'
import { listUsers } from '../services/users'
import type { OrderWithId } from '@shared/models/order'
import type { UserWithId } from '@shared/models/user'
import { formatCNY } from '@shared/money'

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

function formatOrderDate(order: OrderWithId) {
  return dateFormatter.format(order.createdAt)
}

export function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [orders, setOrders] = useState<OrderWithId[]>([])
  const [summary, setSummary] = useState<{
    totalRevenueYuan: number
    totalOrders: number
    paidOrders: number
    pendingOrders: number
    customerCount: number
  } | null>(null)
  const [users, setUsers] = useState<UserWithId[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [dashboard, userList] = await Promise.all([fetchDashboardSummary(), listUsers()])
      setSummary(dashboard.summary)
      setOrders(dashboard.recentOrders)
      setUsers(userList)
    } catch (err: any) {
      const message = err?.message || err?.code || 'Failed to load dashboard'
      setError(typeof message === 'string' ? message : 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const userMap = useMemo(() => {
    const map = new Map<string, UserWithId>()
    for (const user of users) {
      map.set(user.id, user)
    }
    return map
  }, [users])

  const cards = useMemo(() => {
    if (!summary) return []
    return [
      { label: 'Total Revenue', value: formatCNY(summary.totalRevenueYuan) },
      { label: 'Total Orders', value: summary.totalOrders.toString() },
      { label: 'Pending Orders', value: summary.pendingOrders.toString() },
      { label: 'Customers', value: summary.customerCount.toString() },
    ]
  }, [summary])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Dashboard</h2>
        <Button variant="outline" onClick={() => void load()} disabled={loading}>
          {loading ? 'Loading…' : 'Refresh'}
        </Button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="pb-2">
              <CardDescription>{card.label}</CardDescription>
              <CardTitle className="text-3xl">{card.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
        {loading && cards.length === 0 &&
          Array.from({ length: 4 }).map((_, idx) => (
            <Card key={`placeholder-${idx}`}>
              <CardHeader className="pb-2">
                <CardDescription className="text-transparent">Placeholder</CardDescription>
                <CardTitle className="text-3xl text-muted-foreground">—</CardTitle>
              </CardHeader>
            </Card>
          ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
          <CardDescription>Latest activity from the store</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableCaption>{loading ? 'Loading orders…' : orders.length ? `Showing ${orders.length} most recent orders` : 'No orders found'}</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Placed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => {
                const user = userMap.get(order.userId)
                return (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.id}</TableCell>
                    <TableCell>{user?.profile.nickname || order.userId}</TableCell>
                    <TableCell className="text-right">{formatCNY(order.totalYuan)}</TableCell>
                    <TableCell className="capitalize">{order.status}</TableCell>
                    <TableCell>{formatOrderDate(order)}</TableCell>
                  </TableRow>
                )
              })}
              {!loading && orders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                    No orders found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
