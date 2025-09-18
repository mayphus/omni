import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog'
import { deleteBanner, listSystemItems, pingSystem, saveBanner, type SystemOverview } from '../services/system'
import { getEnvId } from '../lib/cloudbase'
import { formatCNY } from '@shared/money'
import type { SystemBannerWithId } from '@shared/models/system'
import { uploadBannerImage } from '../services/media'

function formatTimestamp(ts: number | null) {
  if (!ts) return '—'
  return new Date(ts).toLocaleString()
}

type BannerFormState = {
  id?: string
  imageUrl: string
  title: string
  linkUrl: string
  sort: number
  isActive: boolean
  startAt: string
  endAt: string
}

function createEmptyBannerForm(): BannerFormState {
  return {
    imageUrl: '',
    title: '',
    linkUrl: '',
    sort: 0,
    isActive: true,
    startAt: '',
    endAt: '',
  }
}

function toInputDate(value?: number | null): string {
  if (!value) return ''
  const date = new Date(value)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function parseInputDate(value: string): number | undefined {
  if (!value) return undefined
  const timestamp = Date.parse(value)
  return Number.isNaN(timestamp) ? undefined : timestamp
}

function formatScheduleRange(start?: number | null, end?: number | null): string {
  if (!start && !end) return 'Always on'
  const startText = start ? new Date(start).toLocaleString() : 'Immediate'
  const endText = end ? new Date(end).toLocaleString() : 'No end'
  return `${startText} → ${endText}`
}

export function System() {
  const [overview, setOverview] = useState<SystemOverview>({ categories: [], coupons: [], banners: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastPing, setLastPing] = useState<number | null>(null)
  const [pingMessage, setPingMessage] = useState<string | undefined>(undefined)
  const [bannerDialogOpen, setBannerDialogOpen] = useState(false)
  const [bannerForm, setBannerForm] = useState<BannerFormState>(createEmptyBannerForm)
  const [bannerError, setBannerError] = useState<string | null>(null)
  const [bannerSaving, setBannerSaving] = useState(false)
  const [bannerUploading, setBannerUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

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

  const handleBannerDialogChange = (open: boolean) => {
    setBannerDialogOpen(open)
    if (!open) {
      setBannerError(null)
      setBannerSaving(false)
      setBannerUploading(false)
      setBannerForm(createEmptyBannerForm())
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const openCreateBanner = () => {
    setBannerForm(createEmptyBannerForm())
    setBannerError(null)
    setBannerDialogOpen(true)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const openEditBanner = (banner: SystemBannerWithId) => {
    setBannerForm({
      id: banner.id,
      imageUrl: banner.imageUrl,
      title: banner.title || '',
      linkUrl: banner.linkUrl || '',
      sort: banner.sort ?? 0,
      isActive: banner.isActive !== false,
      startAt: toInputDate(banner.startAt),
      endAt: toInputDate(banner.endAt),
    })
    setBannerError(null)
    setBannerDialogOpen(true)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleBannerSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setBannerSaving(true)
    setBannerError(null)
    try {
      const payload = {
        id: bannerForm.id,
        imageUrl: bannerForm.imageUrl.trim(),
        title: bannerForm.title.trim() ? bannerForm.title.trim() : undefined,
        linkUrl: bannerForm.linkUrl.trim() ? bannerForm.linkUrl.trim() : undefined,
        sort: Number.isFinite(bannerForm.sort) ? bannerForm.sort : 0,
        isActive: bannerForm.isActive,
        startAt: parseInputDate(bannerForm.startAt),
        endAt: parseInputDate(bannerForm.endAt),
      }
      await saveBanner(payload)
      handleBannerDialogChange(false)
      await load()
    } catch (err: any) {
      const message = err?.message || err?.code || 'Failed to save banner'
      setBannerError(typeof message === 'string' ? message : 'Failed to save banner')
    } finally {
      setBannerSaving(false)
    }
  }

  const handleBannerDelete = async (banner: SystemBannerWithId) => {
    const name = banner.title || banner.imageUrl
    if (!window.confirm(`Delete banner “${name}”?`)) return
    try {
      await deleteBanner(banner.id)
      await load()
    } catch (err: any) {
      const message = err?.message || err?.code || 'Failed to delete banner'
      window.alert(typeof message === 'string' ? message : 'Failed to delete banner')
    }
  }

  const handleBannerFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setBannerUploading(true)
    setBannerError(null)
    try {
      const { url } = await uploadBannerImage(file)
      setBannerForm((prev) => ({ ...prev, imageUrl: url }))
    } catch (err: any) {
      const message = err?.message || err?.code || 'Failed to upload image'
      setBannerError(typeof message === 'string' ? message : 'Failed to upload image')
    } finally {
      setBannerUploading(false)
    }
  }

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
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Banners</CardTitle>
          <Button size="sm" onClick={openCreateBanner} disabled={loading}>
            Add Banner
          </Button>
        </CardHeader>
        <CardContent>
          {overview.banners.length ? (
            <ul className="space-y-3 text-sm">
              {overview.banners.map((banner) => (
                <li key={banner.id} className="space-y-2 rounded border border-border p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium">{banner.title || 'Untitled banner'}</p>
                      <p className="text-xs text-muted-foreground">
                        Sort {banner.sort ?? 0} • {formatScheduleRange(banner.startAt, banner.endAt)}
                      </p>
                    </div>
                    <span className={`text-sm ${banner.isActive ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                      {banner.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="break-all text-xs text-muted-foreground">Image: {banner.imageUrl}</p>
                  {banner.linkUrl && <p className="break-all text-xs text-muted-foreground">Link: {banner.linkUrl}</p>}
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button size="sm" variant="outline" onClick={() => openEditBanner(banner)}>
                      Edit
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleBannerDelete(banner)}>
                      Delete
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No banners configured.</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={bannerDialogOpen} onOpenChange={handleBannerDialogChange}>
        <DialogContent className="max-h-[90vh] w-full max-w-xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{bannerForm.id ? 'Edit Banner' : 'Add Banner'}</DialogTitle>
            <DialogDescription>Configure homepage banners shown in the mini program.</DialogDescription>
          </DialogHeader>
          {bannerError && <p className="text-sm text-red-600">{bannerError}</p>}
          <form className="space-y-4" onSubmit={handleBannerSubmit}>
            <div>
              <Label htmlFor="banner-image">Image URL</Label>
              <Input
                id="banner-image"
                required
                placeholder="https://…"
                value={bannerForm.imageUrl}
                onChange={(event) => setBannerForm((prev) => ({ ...prev, imageUrl: event.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="banner-file">Or upload image</Label>
              <Input
                id="banner-file"
                ref={fileInputRef}
                type="file"
                accept="image/*"
                disabled={bannerUploading || bannerSaving}
                onChange={handleBannerFileChange}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {bannerUploading ? 'Uploading…' : 'We store the uploaded image and fill the URL automatically.'}
              </p>
            </div>
            <div>
              <Label htmlFor="banner-title">Title</Label>
              <Input
                id="banner-title"
                placeholder="Optional headline"
                value={bannerForm.title}
                onChange={(event) => setBannerForm((prev) => ({ ...prev, title: event.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="banner-link">Link URL or path</Label>
              <Input
                id="banner-link"
                placeholder="https://… or /pages/product/detail?id=…"
                value={bannerForm.linkUrl}
                onChange={(event) => setBannerForm((prev) => ({ ...prev, linkUrl: event.target.value }))}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="banner-sort">Sort order</Label>
                <Input
                  id="banner-sort"
                  type="number"
                  min={0}
                  max={999}
                  value={bannerForm.sort}
                  onChange={(event) => {
                    const raw = Number.parseInt(event.target.value || '0', 10)
                    const safe = Number.isNaN(raw) ? 0 : Math.min(999, Math.max(0, raw))
                    setBannerForm((prev) => ({ ...prev, sort: safe }))
                  }}
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <input
                  id="banner-active"
                  type="checkbox"
                  className="h-4 w-4"
                  checked={bannerForm.isActive}
                  onChange={(event) => setBannerForm((prev) => ({ ...prev, isActive: event.target.checked }))}
                />
                <Label htmlFor="banner-active">Active</Label>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="banner-start">Start time</Label>
                <Input
                  id="banner-start"
                  type="datetime-local"
                  value={bannerForm.startAt}
                  onChange={(event) => setBannerForm((prev) => ({ ...prev, startAt: event.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="banner-end">End time</Label>
                <Input
                  id="banner-end"
                  type="datetime-local"
                  value={bannerForm.endAt}
                  onChange={(event) => setBannerForm((prev) => ({ ...prev, endAt: event.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={bannerSaving || bannerUploading}>
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={bannerSaving || bannerUploading}>
                {bannerSaving || bannerUploading ? 'Saving…' : 'Save banner'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
