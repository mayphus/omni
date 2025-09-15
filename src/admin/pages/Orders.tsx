import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'

const orders = [
  { id: 'ORD-1001', customer: 'Alice', total: '¥129.00', status: 'Paid' },
  { id: 'ORD-1002', customer: 'Bob', total: '¥89.50', status: 'Pending' },
  { id: 'ORD-1003', customer: 'Chen', total: '¥340.00', status: 'Paid' },
]

export function Orders() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Orders</h2>
      <Card>
        <CardHeader>
          <CardTitle>All Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
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

