import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '../components/ui/dialog'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
import { zProductInput, type ProductInput, type ProductWithId } from '@shared/models/product'
import { formatCNY } from '@shared/money'
import { createProduct, listProducts } from '../services/products'

type AttrRow = { key: string; value: string }
type SkuRow = { skuId: string; priceYuan: string; stock: string; isActive: boolean }

export function Products() {
  const [items, setItems] = useState<ProductWithId[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

  // form state
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [description, setDescription] = useState('')
  const [richDescription, setRichDescription] = useState('')
  const [imagesText, setImagesText] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [spuId, setSpuId] = useState('')
  const [priceYuan, setPriceYuan] = useState('')
  const [stock, setStock] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [attrs, setAttrs] = useState<AttrRow[]>([])
  const [skus, setSkus] = useState<SkuRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const loadProducts = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const res = await listProducts()
      setItems(res)
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

  function resetForm() {
    setTitle('')
    setSubtitle('')
    setDescription('')
    setRichDescription('')
    setImagesText('')
    setCategoryId('')
    setSpuId('')
    setPriceYuan('')
    setStock('')
    setIsActive(true)
    setAttrs([])
    setSkus([])
    setError(null)
    setSaving(false)
  }

  function parseImages(input: string): string[] {
    return input
      .split(/\n|,/)
      .map((s) => s.trim())
      .filter(Boolean)
  }

  function toAttrRecord(rows: AttrRow[]): Record<string, string | number | boolean> | undefined {
    const out: Record<string, string | number | boolean> = {}
    for (const r of rows) {
      if (!r.key) continue
      const v = r.value.trim()
      if (v === '') continue
      if (v === 'true' || v === 'false') out[r.key] = v === 'true'
      else if (!isNaN(Number(v))) out[r.key] = Number(v)
      else out[r.key] = v
    }
    return Object.keys(out).length ? out : undefined
  }

  async function onSave() {
    if (saving) return
    setError(null)
    setSaving(true)
    try {
      if (!title.trim()) throw new Error('Title is required')
      const priceNumber = parseFloat(priceYuan)
      const stockNumber = parseInt(stock, 10)
      if (!Number.isFinite(priceNumber) || priceNumber < 0) throw new Error('Price must be a non-negative number')
      if (!Number.isFinite(stockNumber) || stockNumber < 0) throw new Error('Stock must be a non-negative integer')

      const formattedPrice = Math.round(priceNumber * 100) / 100
      const productInput: ProductInput = {
        title: title.trim(),
        subtitle: subtitle.trim() || undefined,
        description: description.trim() || undefined,
        richDescription: richDescription.trim() || undefined,
        images: parseImages(imagesText),
        categoryId: categoryId.trim() || undefined,
        spuId: spuId.trim() || nextSpu,
        price: { currency: 'CNY', priceYuan: formattedPrice },
        stock: stockNumber,
        isActive,
        attributes: toAttrRecord(attrs),
        skus: skus
          .map((row) => ({
            skuId: row.skuId.trim(),
            priceYuan: Math.round(parseFloat(row.priceYuan || '0') * 100) / 100,
            stock: parseInt(row.stock || '0', 10) || 0,
            isActive: row.isActive,
          }))
          .filter((sku) => sku.skuId),
      }

      const check = zProductInput.safeParse(productInput)
      if (!check.success) {
        throw new Error(check.error.issues[0]?.message || 'Invalid product')
      }

      const created = await createProduct(check.data)
      setItems((prev) => [created, ...prev.filter((item) => item.id !== created.id)])
      setOpen(false)
      resetForm()
    } catch (err: any) {
      const message = err?.issues?.[0]?.message || err?.message || err?.code || 'Failed to save product'
      setError(typeof message === 'string' ? message : 'Failed to save product')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold">Products</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => void loadProducts()} disabled={loading}>
            {loading ? 'Loading…' : 'Refresh'}
          </Button>
          <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); setOpen(v) }}>
            <DialogTrigger asChild>
              <Button>Add Product</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Product</DialogTitle>
                <DialogDescription>Enter product details and save.</DialogDescription>
              </DialogHeader>
              <div className="mt-4 grid grid-cols-1 gap-3">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Toy Car" />
                </div>
                <div>
                  <Label htmlFor="subtitle">Subtitle</Label>
                  <Input id="subtitle" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="Mini racer" />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description" />
                </div>
                <div>
                  <Label htmlFor="rich">Rich Description</Label>
                  <Textarea id="rich" value={richDescription} onChange={(e) => setRichDescription(e.target.value)} placeholder="Longer content (markdown/html)" />
                </div>
                <div>
                  <Label htmlFor="images">Images (URLs, comma or newline)</Label>
                  <Textarea id="images" value={imagesText} onChange={(e) => setImagesText(e.target.value)} placeholder="https://..." />
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <Label htmlFor="categoryId">Category ID</Label>
                    <Input id="categoryId" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} placeholder="toys" />
                  </div>
                  <div>
                    <Label htmlFor="spuId">SPU ID</Label>
                    <Input id="spuId" value={spuId} onChange={(e) => setSpuId(e.target.value)} placeholder={nextSpu} />
                  </div>
                  <div className="flex items-end gap-2">
                    <div className="w-full">
                      <Label htmlFor="price">Price (¥)</Label>
                      <Input id="price" value={priceYuan} onChange={(e) => setPriceYuan(e.target.value)} placeholder="39.90" inputMode="decimal" />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <Label htmlFor="stock">Stock</Label>
                    <Input id="stock" value={stock} onChange={(e) => setStock(e.target.value)} placeholder="100" inputMode="numeric" />
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <input id="active" type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                    <Label htmlFor="active">Active</Label>
                  </div>
                </div>

                <div className="mt-2">
                  <div className="mb-2 text-sm font-medium">Attributes</div>
                  <div className="space-y-2">
                    {attrs.map((r, idx) => (
                      <div key={idx} className="grid grid-cols-5 gap-2">
                        <Input placeholder="key" value={r.key} onChange={(e) => {
                          const v = [...attrs]; v[idx] = { ...v[idx], key: e.target.value }; setAttrs(v)
                        }} />
                        <div className="col-span-3">
                          <Input placeholder="value" value={r.value} onChange={(e) => {
                            const v = [...attrs]; v[idx] = { ...v[idx], value: e.target.value }; setAttrs(v)
                          }} />
                        </div>
                        <Button variant="ghost" onClick={() => setAttrs(attrs.filter((_, i) => i !== idx))}>Remove</Button>
                      </div>
                    ))}
                    <Button variant="secondary" onClick={() => setAttrs([...attrs, { key: '', value: '' }])}>Add attribute</Button>
                  </div>
                </div>

                <div className="mt-2">
                  <div className="mb-2 text-sm font-medium">SKUs</div>
                  <div className="space-y-2">
                    {skus.map((r, idx) => (
                      <div key={idx} className="grid grid-cols-12 items-end gap-2">
                        <div className="col-span-4">
                          <Input placeholder="skuId" value={r.skuId} onChange={(e) => {
                            const v = [...skus]; v[idx] = { ...v[idx], skuId: e.target.value }; setSkus(v)
                          }} />
                        </div>
                        <div className="col-span-3">
                          <Input placeholder="price (¥)" value={r.priceYuan} onChange={(e) => {
                            const v = [...skus]; v[idx] = { ...v[idx], priceYuan: e.target.value }; setSkus(v)
                          }} inputMode="decimal" />
                        </div>
                        <div className="col-span-2">
                          <Input placeholder="stock" value={r.stock} onChange={(e) => {
                            const v = [...skus]; v[idx] = { ...v[idx], stock: e.target.value }; setSkus(v)
                          }} inputMode="numeric" />
                        </div>
                        <div className="col-span-2 flex items-center gap-2">
                          <input id={`sku-active-${idx}`} type="checkbox" checked={r.isActive} onChange={(e) => {
                            const v = [...skus]; v[idx] = { ...v[idx], isActive: e.target.checked }; setSkus(v)
                          }} />
                          <Label htmlFor={`sku-active-${idx}`}>Active</Label>
                        </div>
                        <div className="col-span-1">
                          <Button variant="ghost" onClick={() => setSkus(skus.filter((_, i) => i !== idx))}>X</Button>
                        </div>
                      </div>
                    ))}
                    <Button
                      variant="secondary"
                      onClick={() => setSkus([...skus, { skuId: '', priceYuan: '', stock: '', isActive: true }])}
                    >
                      Add SKU
                    </Button>
                  </div>
                </div>

                {error && <div className="text-sm text-destructive">{error}</div>}
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="ghost" disabled={saving}>Cancel</Button>
                </DialogClose>
                <Button onClick={() => void onSave()} disabled={saving}>
                  {saving ? 'Saving…' : 'Save'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loadError && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {loadError}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Products</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading products…</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No products yet. Add one to get started.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.title}</TableCell>
                    <TableCell className="text-right">{formatCNY(p.price.priceYuan)}</TableCell>
                    <TableCell className="text-right">{p.stock}</TableCell>
                    <TableCell>{p.isActive ? 'Active' : 'Inactive'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
