import { useCallback, useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { listSystemItems, pingSystem, type SystemOverview } from '../services/system'
import { getEnvId } from '../lib/cloudbase'
import { formatCNY } from '@shared/money'

function formatTimestamp(ts: number | null) {
  if (!ts) return '—'
  return new Date(ts).toLocaleString()
}

export function System() {
  const [overview, setOverview] = useState<SystemOverview>({ categories: [], coupons: [], banners: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastPing, setLastPing] = useState<number | null>(null)
  const [pingMessage, setPingMessage] = useState<string | undefined>(undefined)

  const envId = getEnvId()

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [items, message] = await Promise.all([listSystemItems(), pingSystem()])
      setOverview(items)
      setPingMessage(message)
      setLastPing(Date.now())
    } catch (err: any) {
      const message = err?.message || err?.code || 'Failed to load system data'
      setError(typeof message === 'string' ? message : 'Failed to load system data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const totals = useMemo(
    () => ({
      categories: overview.categories.length,
      coupons: overview.coupons.length,
      banners: overview.banners.length,
    }),
    [overview],
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">System</h2>
          <p className="text-sm text-muted-foreground">Inspect configuration collections and service health.</p>
        </div>
        <Button variant="outline" onClick={() => void load()} disabled={loading}>
          {loading ? 'Loading…' : 'Refresh'}
        </Button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-3xl">{envId || 'N/A'}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">CloudBase environment</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-3xl">{totals.categories}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Categories</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-3xl">{totals.coupons}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Coupons</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-3xl">{totals.banners}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Banners</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Environment</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="font-medium">Ping</dt>
              <dd>{pingMessage || 'pong'}</dd>
            </div>
            <div>
              <dt className="font-medium">Last Ping</dt>
              <dd>{formatTimestamp(lastPing)}</dd>
            </div>
            <div>
              <dt className="font-medium">Categories</dt>
              <dd>{totals.categories}</dd>
            </div>
            <div>
              <dt className="font-medium">Coupons</dt>
              <dd>{totals.coupons}</dd>
            </div>
            <div>
              <dt className="font-medium">Banners</dt>
              <dd>{totals.banners}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
        </CardHeader>
        <CardContent>
          {overview.categories.length ? (
            <ul className="space-y-2 text-sm">
              {overview.categories.map((category) => (
                <li key={category.id} className="flex items-center justify-between rounded border border-border px-3 py-2">
                  <div>
                    <p className="font-medium">{category.name}</p>
                    <p className="text-muted-foreground">{category.slug}</p>
                  </div>
                  <span className={`text-sm ${category.isActive ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                    {category.isActive ? 'Active' : 'Inactive'}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No categories configured.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Coupons</CardTitle>
        </CardHeader>
        <CardContent>
          {overview.coupons.length ? (
            <ul className="space-y-2 text-sm">
              {overview.coupons.map((coupon) => (
                <li key={coupon.id} className="flex items-center justify-between rounded border border-border px-3 py-2">
                  <div>
                    <p className="font-medium">{coupon.code}</p>
                    <p className="text-muted-foreground">
                      {coupon.type === 'percent' ? `${coupon.value}% off` : `${formatCNY(coupon.value)} off`}
                    </p>
                  </div>
                  <span className={`text-sm ${coupon.isActive ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                    {coupon.isActive ? 'Active' : 'Inactive'}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No coupons configured.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Banners</CardTitle>
        </CardHeader>
        <CardContent>
          {overview.banners.length ? (
            <ul className="space-y-2 text-sm">
              {overview.banners.map((banner) => (
                <li key={banner.id} className="flex items-center justify-between rounded border border-border px-3 py-2">
                  <div>
                    <p className="font-medium">{banner.title || banner.imageUrl}</p>
                    <p className="text-muted-foreground">{banner.imageUrl}</p>
                  </div>
                  <span className={`text-sm ${banner.isActive ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                    {banner.isActive ? 'Active' : 'Inactive'}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No banners configured.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
