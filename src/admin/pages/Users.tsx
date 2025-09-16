import { useCallback, useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { Button } from '../components/ui/button'
import { listUsers } from '../services/users'
import type { UserWithId } from '@shared/models/user'
import { formatCNY } from '@shared/money'

export function Users() {
  const [users, setUsers] = useState<UserWithId[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await listUsers()
      setUsers(result)
    } catch (err: any) {
      const message = err?.message || err?.code || 'Failed to load users'
      setError(typeof message === 'string' ? message : 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const stats = useMemo(() => {
    if (!users.length) {
      return {
        admins: 0,
        averageBalance: 0,
        totalBalance: 0,
      }
    }
    let admins = 0
    let totalBalance = 0
    for (const user of users) {
      if (user.roles.includes('admin')) admins += 1
      totalBalance += user.wallet.balanceYuan
    }
    return {
      admins,
      averageBalance: totalBalance / users.length,
      totalBalance,
    }
  }, [users])

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return users
    return users.filter((user) => {
      const nickname = user.profile.nickname.toLowerCase()
      const id = user.id.toLowerCase()
      const openid = user.openid.toLowerCase()
      return nickname.includes(q) || id.includes(q) || openid.includes(q)
    })
  }, [users, query])

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Users</h2>
          <p className="text-sm text-muted-foreground">Inspect account roles, balances, and activity.</p>
        </div>
        <Button variant="outline" onClick={() => void load()} disabled={loading}>
          {loading ? 'Loading…' : 'Refresh'}
        </Button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-3xl">{users.length}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Users loaded</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-3xl">{stats.admins}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Admins</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-3xl">{formatCNY(stats.totalBalance)}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Wallet balance</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-3xl">
              {stats.averageBalance > 0 ? formatCNY(stats.averageBalance) : '—'}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Average balance</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>All Users</CardTitle>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by id or nickname"
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:w-64"
          />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Nickname</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Wallet</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.id}</TableCell>
                  <TableCell>{user.profile.nickname}</TableCell>
                  <TableCell className="capitalize">{user.roles.join(', ')}</TableCell>
                  <TableCell>{formatCNY(user.wallet.balanceYuan)}</TableCell>
                  <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
              {!loading && filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                    No users found.
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
