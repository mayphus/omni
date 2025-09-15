import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'

const stats = [
  { label: 'Sales', value: '¥2,340' },
  { label: 'Orders', value: '128' },
  { label: 'Customers', value: '76' },
  { label: 'Revenue', value: '¥18,920' },
]

const orders = [
  { id: 'ORD-1001', customer: 'Alice', total: '¥129.00', status: 'Paid' },
  { id: 'ORD-1002', customer: 'Bob', total: '¥89.50', status: 'Pending' },
  { id: 'ORD-1003', customer: 'Chen', total: '¥340.00', status: 'Paid' },
  { id: 'ORD-1004', customer: 'Diana', total: '¥45.00', status: 'Refunded' },
]

export function Dashboard() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Dashboard</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader className="pb-2">
              <CardDescription>{s.label}</CardDescription>
              <CardTitle className="text-3xl">{s.value}</CardTitle>
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
            <TableCaption>Showing 4 most recent orders</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-medium">{o.id}</TableCell>
                  <TableCell>{o.customer}</TableCell>
                  <TableCell className="text-right">{o.total}</TableCell>
                  <TableCell>{o.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
