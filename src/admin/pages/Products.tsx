import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
import { ImageUploader } from '../components/products/ImageUploader'
import { RichTextEditor } from '../components/RichTextEditor'
import { zProductInput, type ProductImage, type ProductInput, type ProductWithId } from '@shared/models/product'
import { formatCNY } from '@shared/money'
import { createProduct, deleteProduct, listProducts, updateProduct } from '../services/products'

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

type AttrRow = { key: string; value: string }
type SkuRow = { skuId: string; priceYuan: string; stock: string; isActive: boolean }

type ProductDraft = {
  id?: string
  title: string
  subtitle: string
  description: string
  richDescription: string
  images: ProductImage[]
  categoryId: string
  spuId: string
  priceYuan: string
  stock: string
  isActive: boolean
  attributes: AttrRow[]
  skus: SkuRow[]
}

function createEmptyDraft(): ProductDraft {
  return {
    title: '',
    subtitle: '',
    description: '',
    richDescription: '',
    images: [],
    categoryId: '',
    spuId: '',
    priceYuan: '',
    stock: '',
    isActive: true,
    attributes: [],
    skus: [],
  }
}

function cloneImages(images: ProductImage[] | undefined): ProductImage[] {
  if (!images || images.length === 0) return []
  return images.map((image) => ({ ...image }))
}

function productToDraft(product: ProductWithId): ProductDraft {
  return {
    id: product.id,
    title: product.title,
    subtitle: product.subtitle || '',
    description: product.description || '',
    richDescription: product.richDescription || '',
    images: cloneImages(product.images),
    categoryId: product.categoryId || '',
    spuId: product.spuId || '',
    priceYuan: product.price.priceYuan.toString(),
    stock: product.stock.toString(),
    isActive: product.isActive,
    attributes: product.attributes
      ? Object.entries(product.attributes).map(([key, value]) => ({ key, value: String(value) }))
      : [],
    skus: product.skus
      ? product.skus.map((sku) => ({
          skuId: sku.skuId,
          priceYuan: sku.priceYuan.toString(),
          stock: sku.stock.toString(),
          isActive: sku.isActive,
        }))
      : [],
  }
}

function rowsToAttributes(rows: AttrRow[]): ProductInput['attributes'] {
  const out: Record<string, string | number | boolean> = {}
  for (const row of rows) {
    const key = row.key.trim()
    if (!key) continue
    const raw = row.value.trim()
    if (!raw) continue
    if (raw === 'true' || raw === 'false') out[key] = raw === 'true'
    else if (!Number.isNaN(Number(raw))) out[key] = Number(raw)
    else out[key] = raw
  }
  return Object.keys(out).length ? out : undefined
}

function rowsToSkus(rows: SkuRow[]): ProductInput['skus'] {
  const mapped = rows
    .map((row) => {
      const skuId = row.skuId.trim()
      if (!skuId) return null
      const price = Number.parseFloat(row.priceYuan || '0')
      if (!Number.isFinite(price) || price < 0) throw new Error(`Invalid price for SKU ${skuId}`)
      const stock = Number.parseInt(row.stock || '0', 10)
      if (!Number.isFinite(stock) || stock < 0) throw new Error(`Invalid stock for SKU ${skuId}`)
      return {
        skuId,
        priceYuan: Math.round(price * 100) / 100,
        stock,
        isActive: row.isActive,
      }
    })
    .filter(Boolean)
  return mapped.length ? (mapped as NonNullable<ProductInput['skus']>) : undefined
}

function normalizeImages(images: ProductDraft['images']): ProductImage[] {
  const result: ProductImage[] = []
  for (const image of images) {
    const url = image.url?.trim()
    const fileId = image.fileId?.trim()
    if (!url) continue
    result.push({ fileId: fileId || url, url })
  }
  return result
}

function draftToInput(draft: ProductDraft, fallbackSpu: string): ProductInput {
  if (!draft.title.trim()) throw new Error('Title is required')
  const priceNumber = Number.parseFloat(draft.priceYuan || '0')
  if (!Number.isFinite(priceNumber) || priceNumber < 0) throw new Error('Price must be a non-negative number')
  const stockNumber = Number.parseInt(draft.stock || '0', 10)
  if (!Number.isFinite(stockNumber) || stockNumber < 0) throw new Error('Stock must be a non-negative integer')
  return {
    title: draft.title.trim(),
    subtitle: draft.subtitle.trim() || undefined,
    description: draft.description.trim() || undefined,
    richDescription: draft.richDescription.trim() || undefined,
    images: normalizeImages(draft.images),
    categoryId: draft.categoryId.trim() || undefined,
    spuId: draft.spuId.trim() || fallbackSpu,
    price: { currency: 'CNY', priceYuan: Math.round(priceNumber * 100) / 100 },
    stock: stockNumber,
    isActive: draft.isActive,
    attributes: rowsToAttributes(draft.attributes),
    skus: rowsToSkus(draft.skus),
  }
}

function sortByUpdatedAt(list: ProductWithId[]) {
  return [...list].sort((a, b) => b.updatedAt - a.updatedAt)
}

function formatUpdated(ts: number) {
  return dateFormatter.format(ts)
}

type FormMode = 'create' | 'edit'

type StatusFilter = 'all' | 'active' | 'inactive'

export function Products() {
  const [items, setItems] = useState<ProductWithId[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [formMode, setFormMode] = useState<FormMode>('create')
  const [draft, setDraft] = useState<ProductDraft>(createEmptyDraft())
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [previewProduct, setPreviewProduct] = useState<ProductWithId | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ProductWithId | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const loadProducts = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const res = await listProducts()
      setItems(sortByUpdatedAt(res))
    } catch (err: any) {
      const message = err?.message || 'Failed to load products'
      setLoadError(typeof message === 'string' ? message : 'Failed to load products')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadProducts()
  }, [loadProducts])

  const nextSpu = useMemo(() => {
    const nums = items
      .map((p) => Number((p.spuId || '').replace(/^[^0-9]*/, '')))
      .filter((n) => Number.isFinite(n))
    const max = nums.length ? Math.max(...nums) : 1000
    return `SPU-${max + 1}`
  }, [items])

  const categories = useMemo(() => {
    const set = new Set<string>()
    for (const item of items) {
      if (item.categoryId) set.add(item.categoryId)
    }
    return Array.from(set).sort()
  }, [items])

  const stats = useMemo(() => {
    const active = items.filter((item) => item.isActive).length
    const inactive = items.length - active
    const inventory = items.reduce((sum, item) => sum + item.stock, 0)
    return { total: items.length, active, inactive, inventory }
  }, [items])

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase()
    return items.filter((item) => {
      const matchesQuery =
        !q ||
        item.title.toLowerCase().includes(q) ||
        (item.subtitle || '').toLowerCase().includes(q) ||
        (item.categoryId || '').toLowerCase().includes(q) ||
        (item.spuId || '').toLowerCase().includes(q)
      const matchesStatus =
        statusFilter === 'all' || (statusFilter === 'active' ? item.isActive : !item.isActive)
      const matchesCategory = categoryFilter === 'all' || item.categoryId === categoryFilter
      return matchesQuery && matchesStatus && matchesCategory
    })
  }, [items, query, statusFilter, categoryFilter])

  function closeDialog() {
    setOpen(false)
    setFormMode('create')
    setDraft(createEmptyDraft())
    setError(null)
    setSaving(false)
  }

  async function handleSubmit() {
    if (saving) return
    setSaving(true)
    setError(null)
    try {
      const payload = draftToInput(draft, nextSpu)
      const parsed = zProductInput.safeParse(payload)
      if (!parsed.success) throw new Error(parsed.error.issues[0]?.message || 'Invalid product')
      let saved: ProductWithId
      if (formMode === 'edit' && draft.id) {
        saved = await updateProduct(draft.id, parsed.data)
      } else {
        saved = await createProduct(parsed.data)
      }
      setItems((prev) => sortByUpdatedAt([saved, ...prev.filter((item) => item.id !== saved.id)]))
      closeDialog()
    } catch (err: any) {
      const message = err?.issues?.[0]?.message || err?.message || err?.code || 'Failed to save product'
      setError(typeof message === 'string' ? message : 'Failed to save product')
    } finally {
      setSaving(false)
    }
  }

  function startCreate() {
    setFormMode('create')
    setDraft(createEmptyDraft())
    setError(null)
    setOpen(true)
  }

  function startEdit(product: ProductWithId) {
    setFormMode('edit')
    setDraft(productToDraft(product))
    setError(null)
    setOpen(true)
  }

  function startPreview(product: ProductWithId) {
    setPreviewProduct(product)
  }

  function requestDelete(product: ProductWithId) {
    setDeleteTarget(product)
    setDeleteError(null)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    setDeleteError(null)
    try {
      await deleteProduct(deleteTarget.id)
      setItems((prev) => prev.filter((item) => item.id !== deleteTarget.id))
      setDeleteTarget(null)
    } catch (err: any) {
      const message = err?.message || err?.code || 'Failed to delete product'
      setDeleteError(typeof message === 'string' ? message : 'Failed to delete product')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Products</h2>
          <p className="text-sm text-muted-foreground">Manage your catalog, pricing, and availability.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => void loadProducts()} disabled={loading}>
            {loading ? 'Loading…' : 'Refresh'}
          </Button>
          <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : closeDialog())}>
            <DialogTrigger asChild>
              <Button onClick={startCreate}>Add Product</Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] w-full max-w-4xl overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{formMode === 'edit' ? 'Edit Product' : 'Add Product'}</DialogTitle>
                <DialogDescription>
                  {formMode === 'edit' ? 'Update product details and save changes.' : 'Enter product details and save.'}
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4 flex flex-col gap-6">
                <section className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={draft.title}
                      onChange={(event) => setDraft((prev) => ({ ...prev, title: event.target.value }))}
                      placeholder="Toy Car"
                      disabled={saving}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subtitle">Subtitle</Label>
                    <Input
                      id="subtitle"
                      value={draft.subtitle}
                      onChange={(event) => setDraft((prev) => ({ ...prev, subtitle: event.target.value }))}
                      placeholder="Mini racer"
                      disabled={saving}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="categoryId">Category ID</Label>
                    <Input
                      id="categoryId"
                      value={draft.categoryId}
                      onChange={(event) => setDraft((prev) => ({ ...prev, categoryId: event.target.value }))}
                      placeholder="toys"
                      disabled={saving}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="spuId">SPU ID</Label>
                    <Input
                      id="spuId"
                      value={draft.spuId}
                      onChange={(event) => setDraft((prev) => ({ ...prev, spuId: event.target.value }))}
                      placeholder={nextSpu}
                      disabled={saving}
                    />
                  </div>
                </section>

                <section className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price (¥)</Label>
                    <Input
                      id="price"
                      value={draft.priceYuan}
                      onChange={(event) => setDraft((prev) => ({ ...prev, priceYuan: event.target.value }))}
                      placeholder="39.90"
                      inputMode="decimal"
                      disabled={saving}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stock">Stock</Label>
                    <Input
                      id="stock"
                      value={draft.stock}
                      onChange={(event) => setDraft((prev) => ({ ...prev, stock: event.target.value }))}
                      placeholder="100"
                      inputMode="numeric"
                      disabled={saving}
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-2 md:col-span-2">
                    <input
                      id="active"
                      type="checkbox"
                      className="h-4 w-4"
                      checked={draft.isActive}
                      onChange={(event) => setDraft((prev) => ({ ...prev, isActive: event.target.checked }))}
                      disabled={saving}
                    />
                    <Label htmlFor="active">Active</Label>
                  </div>
                </section>

                <section className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="description">Short Description</Label>
                    <Textarea
                      id="description"
                      value={draft.description}
                      onChange={(event) => setDraft((prev) => ({ ...prev, description: event.target.value }))}
                      placeholder="Brief overview for listings"
                      disabled={saving}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Rich Description</Label>
                    <RichTextEditor
                      value={draft.richDescription}
                      onChange={(value) => setDraft((prev) => ({ ...prev, richDescription: value }))}
                      placeholder="Detailed marketing copy, formatting supported"
                      disabled={saving}
                    />
                  </div>
                </section>

                <section className="space-y-2">
                  <Label>Images</Label>
                  <ImageUploader
                    value={draft.images}
                    onChange={(images) => setDraft((prev) => ({ ...prev, images }))}
                    disabled={saving}
                  />
                </section>

                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Attributes</span>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        setDraft((prev) => ({ ...prev, attributes: [...prev.attributes, { key: '', value: '' }] }))
                      }
                      disabled={saving}
                    >
                      Add attribute
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {draft.attributes.length === 0 && (
                      <p className="text-sm text-muted-foreground">Add key/value pairs for product specifications.</p>
                    )}
                    {draft.attributes.map((attr, idx) => (
                      <div key={`attr-${idx}`} className="grid gap-2 sm:grid-cols-[1fr_2fr_auto]">
                        <Input
                          placeholder="Key"
                          value={attr.key}
                          onChange={(event) =>
                            setDraft((prev) => {
                              const copy = [...prev.attributes]
                              copy[idx] = { ...copy[idx], key: event.target.value }
                              return { ...prev, attributes: copy }
                            })
                          }
                          disabled={saving}
                        />
                        <Input
                          placeholder="Value"
                          value={attr.value}
                          onChange={(event) =>
                            setDraft((prev) => {
                              const copy = [...prev.attributes]
                              copy[idx] = { ...copy[idx], value: event.target.value }
                              return { ...prev, attributes: copy }
                            })
                          }
                          disabled={saving}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setDraft((prev) => ({
                              ...prev,
                              attributes: prev.attributes.filter((_, i) => i !== idx),
                            }))
                          }
                          disabled={saving}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">SKUs</span>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        setDraft((prev) => ({
                          ...prev,
                          skus: [...prev.skus, { skuId: '', priceYuan: '', stock: '', isActive: true }],
                        }))
                      }
                      disabled={saving}
                    >
                      Add SKU
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {draft.skus.length === 0 && (
                      <p className="text-sm text-muted-foreground">Define SKU-specific pricing or inventory if needed.</p>
                    )}
                    {draft.skus.map((sku, idx) => (
                      <div key={`sku-${idx}`} className="grid gap-2 sm:grid-cols-[2fr_1fr_1fr_auto]">
                        <Input
                          placeholder="SKU ID"
                          value={sku.skuId}
                          onChange={(event) =>
                            setDraft((prev) => {
                              const copy = [...prev.skus]
                              copy[idx] = { ...copy[idx], skuId: event.target.value }
                              return { ...prev, skus: copy }
                            })
                          }
                          disabled={saving}
                        />
                        <Input
                          placeholder="Price (¥)"
                          value={sku.priceYuan}
                          onChange={(event) =>
                            setDraft((prev) => {
                              const copy = [...prev.skus]
                              copy[idx] = { ...copy[idx], priceYuan: event.target.value }
                              return { ...prev, skus: copy }
                            })
                          }
                          inputMode="decimal"
                          disabled={saving}
                        />
                        <Input
                          placeholder="Stock"
                          value={sku.stock}
                          onChange={(event) =>
                            setDraft((prev) => {
                              const copy = [...prev.skus]
                              copy[idx] = { ...copy[idx], stock: event.target.value }
                              return { ...prev, skus: copy }
                            })
                          }
                          inputMode="numeric"
                          disabled={saving}
                        />
                        <div className="flex items-center gap-2">
                          <input
                            id={`sku-active-${idx}`}
                            type="checkbox"
                            className="h-4 w-4"
                            checked={sku.isActive}
                            onChange={(event) =>
                              setDraft((prev) => {
                                const copy = [...prev.skus]
                                copy[idx] = { ...copy[idx], isActive: event.target.checked }
                                return { ...prev, skus: copy }
                              })
                            }
                            disabled={saving}
                          />
                          <Label htmlFor={`sku-active-${idx}`}>Active</Label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setDraft((prev) => ({ ...prev, skus: prev.skus.filter((_, i) => i !== idx) }))
                            }
                            disabled={saving}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {error && <div className="text-sm text-destructive">{error}</div>}
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="ghost" disabled={saving}>
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="button" onClick={() => void handleSubmit()} disabled={saving}>
                  {saving ? 'Saving…' : formMode === 'edit' ? 'Save changes' : 'Create product'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Products</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Active</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{stats.active}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Inactive</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{stats.inactive}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{stats.inventory}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
        <div className="flex flex-col gap-2 rounded-md border bg-card p-3 lg:col-span-4 xl:col-span-1 xl:flex-row xl:items-center">
          <Input
            placeholder="Search by title, category, or SPU"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="xl:max-w-sm"
          />
          <div className="flex flex-col gap-2 sm:flex-row">
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="all">All categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            {(query || statusFilter !== 'all' || categoryFilter !== 'all') && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setQuery('')
                  setStatusFilter('all')
                  setCategoryFilter('all')
                }}
              >
                Clear filters
              </Button>
            )}
          </div>
        </div>
      </div>

      {deleteError && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {deleteError}
        </div>
      )}

      {loadError && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {loadError}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Catalog</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading products…</p>
          ) : filteredItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">No products match your filters.</p>
          ) : (
            <>
              <div className="grid gap-3 md:hidden">
                {filteredItems.map((item) => (
                  <div key={item.id} className="space-y-3 rounded-md border bg-card p-3 shadow-sm">
                    {item.images[0] && (
                      <img src={item.images[0].url} alt="Product" className="h-40 w-full rounded object-cover" />
                    )}
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-base font-semibold">{item.title}</p>
                          {item.subtitle && <p className="text-xs text-muted-foreground">{item.subtitle}</p>}
                        </div>
                        <span
                          className={
                            item.isActive
                              ? 'inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800'
                              : 'inline-flex items-center rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-700'
                          }
                        >
                          {item.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-sm font-medium">{formatCNY(item.price.priceYuan)}</p>
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <span>Stock: {item.stock}</span>
                        {item.categoryId && <span>Category: {item.categoryId}</span>}
                        {item.spuId && <span>SPU: {item.spuId}</span>}
                        <span>Updated: {formatUpdated(item.updatedAt)}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button className="flex-1" type="button" variant="ghost" onClick={() => startPreview(item)}>
                        Preview
                      </Button>
                      <Button className="flex-1" type="button" variant="outline" onClick={() => startEdit(item)}>
                        Edit
                      </Button>
                      <Button
                        className="flex-1"
                        type="button"
                        variant="destructive"
                        onClick={() => requestDelete(item)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="hidden md:block">
                <div className="overflow-x-auto">
                  <Table className="min-w-[720px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead className="hidden sm:table-cell">Category</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead className="hidden md:table-cell">Stock</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="hidden lg:table-cell">Updated</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{item.title}</span>
                              {item.subtitle && <span className="text-xs text-muted-foreground">{item.subtitle}</span>}
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">{item.categoryId || '—'}</TableCell>
                          <TableCell>{formatCNY(item.price.priceYuan)}</TableCell>
                          <TableCell className="hidden md:table-cell">{item.stock}</TableCell>
                          <TableCell>
                            <span
                              className={
                                item.isActive
                                  ? 'inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800'
                                  : 'inline-flex items-center rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-700'
                              }
                            >
                              {item.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">{formatUpdated(item.updatedAt)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button type="button" variant="ghost" size="sm" onClick={() => startPreview(item)}>
                                Preview
                              </Button>
                              <Button type="button" variant="outline" size="sm" onClick={() => startEdit(item)}>
                                Edit
                              </Button>
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => requestDelete(item)}
                              >
                                Delete
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={!!previewProduct}
        onOpenChange={(value) => {
          if (!value) setPreviewProduct(null)
        }}
      >
        {previewProduct && (
          <DialogContent className="max-h-[90vh] w-full max-w-3xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{previewProduct.title}</DialogTitle>
              <DialogDescription>
                {previewProduct.subtitle || 'Full product overview with pricing, inventory, and media.'}
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 grid gap-6 md:grid-cols-[1.2fr_1fr]">
              <div className="space-y-4">
                {previewProduct.images.length > 0 ? (
                  <div className="grid gap-3 md:grid-cols-2">
                    {previewProduct.images.map((image, idx) => (
                      <img
                        key={`${image.fileId}-${idx}`}
                        src={image.url}
                        alt={`Product ${idx + 1}`}
                        className="h-40 w-full rounded object-cover"
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex h-32 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
                    No images uploaded
                  </div>
                )}
                {previewProduct.description && (
                  <div>
                    <h4 className="text-sm font-semibold">Short description</h4>
                    <p className="mt-1 text-sm text-muted-foreground">{previewProduct.description}</p>
                  </div>
                )}
                {previewProduct.richDescription && (
                  <div>
                    <h4 className="text-sm font-semibold">Rich description</h4>
                    <div
                      className="space-y-2 text-sm leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: previewProduct.richDescription }}
                    />
                  </div>
                )}
              </div>
              <div className="space-y-4">
                <div className="rounded-md border bg-muted/30 p-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Price</span>
                    <span className="font-medium">{formatCNY(previewProduct.price.priceYuan)}</span>
                  </div>
                  <div className="mt-2 flex justify-between text-sm">
                    <span className="text-muted-foreground">Stock</span>
                    <span className="font-medium">{previewProduct.stock}</span>
                  </div>
                  <div className="mt-2 flex justify-between text-sm">
                    <span className="text-muted-foreground">Status</span>
                    <span className="font-medium">{previewProduct.isActive ? 'Active' : 'Inactive'}</span>
                  </div>
                  {previewProduct.categoryId && (
                    <div className="mt-2 flex justify-between text-sm">
                      <span className="text-muted-foreground">Category</span>
                      <span className="font-medium">{previewProduct.categoryId}</span>
                    </div>
                  )}
                  {previewProduct.spuId && (
                    <div className="mt-2 flex justify-between text-sm">
                      <span className="text-muted-foreground">SPU</span>
                      <span className="font-medium">{previewProduct.spuId}</span>
                    </div>
                  )}
                  <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                    <span>Created: {formatUpdated(previewProduct.createdAt)}</span>
                    <span>Updated: {formatUpdated(previewProduct.updatedAt)}</span>
                  </div>
                </div>

                {previewProduct.attributes && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Attributes</h4>
                    <div className="space-y-1 rounded-md border bg-background p-3 text-sm">
                      {Object.entries(previewProduct.attributes).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between gap-4">
                          <span className="text-muted-foreground">{key}</span>
                          <span className="font-medium">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {previewProduct.skus && previewProduct.skus.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">SKUs</h4>
                    <div className="space-y-2 rounded-md border bg-background p-3 text-sm">
                      {previewProduct.skus.map((sku) => (
                        <div key={sku.skuId} className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-medium">{sku.skuId}</span>
                          <span>{formatCNY(sku.priceYuan)}</span>
                          <span>Stock: {sku.stock}</span>
                          <span>{sku.isActive ? 'Active' : 'Inactive'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="ghost">
                  Close
                </Button>
              </DialogClose>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setPreviewProduct(null)
                  startEdit(previewProduct)
                }}
              >
                Edit product
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  setPreviewProduct(null)
                  requestDelete(previewProduct)
                }}
              >
                Delete product
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      <Dialog
        open={!!deleteTarget}
        onOpenChange={(value) => {
          if (!value && !deleting) {
            setDeleteTarget(null)
            setDeleteError(null)
          }
        }}
      >
        {deleteTarget && (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete {deleteTarget.title}?</DialogTitle>
              <DialogDescription>
                This action is permanent. The product will be removed from the catalog and cannot be recovered.
              </DialogDescription>
            </DialogHeader>
            {deleteError && <p className="text-sm text-destructive">{deleteError}</p>}
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="ghost" disabled={deleting}>
                  Cancel
                </Button>
              </DialogClose>
              <Button type="button" variant="destructive" onClick={() => void handleDelete()} disabled={deleting}>
                {deleting ? 'Deleting…' : 'Delete'}
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  )
}
