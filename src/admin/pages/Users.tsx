import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'

const users = [
  { id: 'U-1001', name: 'Alice', email: 'alice@example.com' },
  { id: 'U-1002', name: 'Bob', email: 'bob@example.com' },
  { id: 'U-1003', name: 'Chen', email: 'chen@example.com' },
]

export function Users() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Users</h2>
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.id}</TableCell>
                  <TableCell>{u.name}</TableCell>
                  <TableCell>{u.email}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

