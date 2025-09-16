import { useCallback, useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { Button } from '../components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { listOrders } from '../services/orders'
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

type StatusFilter = 'all' | OrderWithId['status']

function formatOrderDate(ts: number) {
  return dateFormatter.format(ts)
}

function orderStatusLabel(status: OrderWithId['status']) {
  return status.replace(/_/g, ' ')
}

export function Orders() {
  const [orders, setOrders] = useState<OrderWithId[]>([])
  const [users, setUsers] = useState<UserWithId[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [query, setQuery] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<OrderWithId | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [orderList, userList] = await Promise.all([listOrders(), listUsers()])
      setOrders(orderList)
      setUsers(userList)
    } catch (err: any) {
      const message = err?.message || err?.code || 'Failed to load orders'
      setError(typeof message === 'string' ? message : 'Failed to load orders')
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

  const stats = useMemo(() => {
    if (!orders.length) {
      return {
        totalRevenue: 0,
        averageValue: 0,
        paidCount: 0,
        pendingCount: 0,
      }
    }
    const paidStatuses = new Set(['paid', 'shipped', 'completed'])
    let revenue = 0
    let paidCount = 0
    let pendingCount = 0
    for (const order of orders) {
      if (paidStatuses.has(order.status)) {
        revenue += order.totalYuan
        paidCount += 1
      }
      if (order.status === 'pending') pendingCount += 1
    }
    return {
      totalRevenue: revenue,
      averageValue: orders.length ? revenue / orders.length : 0,
      paidCount,
      pendingCount,
    }
  }, [orders])

  const filteredOrders = useMemo(() => {
    const q = query.trim().toLowerCase()
    return orders.filter((order) => {
      const matchesQuery =
        !q ||
        order.id.toLowerCase().includes(q) ||
        order.userId.toLowerCase().includes(q) ||
        (userMap.get(order.userId)?.profile.nickname || '').toLowerCase().includes(q)
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter
      return matchesQuery && matchesStatus
    })
  }, [orders, query, statusFilter, userMap])

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Orders</h2>
          <p className="text-sm text-muted-foreground">Track payments, fulfillment, and customer activity.</p>
        </div>
        <Button variant="outline" onClick={() => void load()} disabled={loading}>
          {loading ? 'Loading…' : 'Refresh'}
        </Button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-3xl">{formatCNY(stats.totalRevenue)}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Revenue from paid orders</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-3xl">{orders.length}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Orders loaded</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-3xl">{stats.pendingCount}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Pending fulfillment</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-3xl">
              {stats.averageValue > 0 ? formatCNY(stats.averageValue) : '—'}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Average order value</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>All Orders</CardTitle>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by order or customer"
              className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="shipped">Shipped</option>
              <option value="completed">Completed</option>
              <option value="canceled">Canceled</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => {
                const user = userMap.get(order.userId)
                return (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.id}</TableCell>
                    <TableCell>{user?.profile.nickname || order.userId}</TableCell>
                    <TableCell className="text-right">{formatCNY(order.totalYuan)}</TableCell>
                    <TableCell className="capitalize">{orderStatusLabel(order.status)}</TableCell>
                    <TableCell>{order.items.length}</TableCell>
                    <TableCell>{formatOrderDate(order.updatedAt)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedOrder(order)}>
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
              {!loading && filteredOrders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-sm text-muted-foreground">
                    No orders found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="max-h-[85vh] w-full max-w-2xl overflow-y-auto">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle>Order {selectedOrder.id}</DialogTitle>
                <DialogDescription>
                  {selectedOrder.status === 'pending' ? 'Awaiting payment or fulfillment.' : `Status: ${orderStatusLabel(selectedOrder.status)}.`}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4 text-sm">
                <div className="grid gap-2 sm:grid-cols-2">
                  <div>
                    <p className="font-medium">Customer</p>
                    <p>
                      {userMap.get(selectedOrder.userId)?.profile.nickname || selectedOrder.userId}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Placed</p>
                    <p>{formatOrderDate(selectedOrder.createdAt)}</p>
                  </div>
                  <div>
                    <p className="font-medium">Subtotal</p>
                    <p>{formatCNY(selectedOrder.subtotalYuan)}</p>
                  </div>
                  <div>
                    <p className="font-medium">Total</p>
                    <p>{formatCNY(selectedOrder.totalYuan)}</p>
                  </div>
                </div>
                {selectedOrder.address && (
                  <div>
                    <p className="font-medium">Shipping Address</p>
                    <p>
                      {[selectedOrder.address.contact, selectedOrder.address.phone, selectedOrder.address.detail]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  </div>
                )}
                <div>
                  <p className="font-medium">Items</p>
                  <ul className="list-disc space-y-1 pl-5">
                    {selectedOrder.items.map((item) => (
                      <li key={`${item.productId}-${item.title}`}>
                        <span className="font-medium">{item.title}</span> × {item.qty} — {formatCNY(item.priceYuan)}
                      </li>
                    ))}
                  </ul>
                </div>
                {selectedOrder.notes && (
                  <div>
                    <p className="font-medium">Notes</p>
                    <p>{selectedOrder.notes}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
