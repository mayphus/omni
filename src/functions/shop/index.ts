/**
 * Cloud Function Router — shop
 *
 * Philosophy: keep handlers small, explicit, and well‑documented.
 * Each handler maps an input event to an output result. Side effects
 * (database calls, cloud context) are isolated and called out.
 */

import { z, type ZodIssue } from 'zod'

type ApiResponse = { success: true; [k: string]: any } | { success: false; error?: string; [k: string]: any }
const ok = (data: any = {}): ApiResponse => ({ success: true, timestamp: new Date().toISOString(), ...data })
const fail = (error: string, data: any = {}): ApiResponse => ({ success: false, timestamp: new Date().toISOString(), error, ...data })

// Shared schemas and helpers
import type { User, UserProfile, UserWithId } from '@shared/models/user'
import { zUser, zUserProfile, zUserWithId } from '@shared/models/user'
import type { Product, ProductImage, ProductInput, ProductWithId } from '@shared/models/product'
import { zProduct, zProductInput, zProductWithId } from '@shared/models/product'
import type { Order, OrderWithId } from '@shared/models/order'
import { zOrder, zOrderWithId } from '@shared/models/order'
import type {
  SystemBannerWithId,
  SystemCategoryWithId,
  SystemCouponWithId,
  SystemItem,
} from '@shared/models/system'
import {
  zSystemItemWithId,
} from '@shared/models/system'
import { Collections } from '@shared/collections'
import { fromServer, nowMs } from '@shared/base'

// Use wx-server-sdk directly for WeChat Mini Program cloud functions
// eslint-disable-next-line @typescript-eslint/no-var-requires
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const overrides = (globalThis as any).__SHOP_TEST_OVERRIDES__ as
  | undefined
  | {
      database?: () => ReturnType<typeof cloud.database>
      getWXContext?: () => Record<string, any>
    }

const db = overrides?.database ? overrides.database() : cloud.database()

/**
 * getWX — get WeChat context (OPENID/UNIONID)
 */
function getWX() {
  if (overrides?.getWXContext) return overrides.getWXContext()
  return cloud.getWXContext()
}

// Utilities — DB helpers kept tiny and explicit
const usersCol = () => db.collection(Collections.Users)
const productsCol = () => db.collection(Collections.Products)
const ordersCol = () => db.collection(Collections.Orders)
const systemCol = () => db.collection(Collections.System)

function sanitizeSkus(skus: ProductInput['skus']) {
  const normalized = skus
    ?.map((sku) => ({
      ...sku,
      skuId: sku.skuId.trim(),
      isActive: sku.isActive ?? true,
    }))
    .filter((sku) => !!sku.skuId)
  return normalized && normalized.length ? normalized : undefined
}

function buildProductFromInput(input: ProductInput, now: number, existing?: Product) {
  const updatedAt = existing ? Math.max(now, existing.updatedAt + 1) : now
  const base: Product = {
    ...input,
    skus: sanitizeSkus(input.skus),
    createdAt: existing?.createdAt ?? now,
    updatedAt,
  }
  return zProduct.parse(base)
}

function getAdminContext() {
  const ctx = getWX() as any
  if (ctx?.TCB_UUID || ctx?.OPENID) return ctx

  const envUuid = process.env.TCB_UUID || process.env.TCB_CUSTOM_USER_ID
  const envOpenid = process.env.OPENID || process.env.TCB_OPENID
  if (envUuid || envOpenid) {
    return { ...ctx, TCB_UUID: envUuid, OPENID: envOpenid }
  }

  return null
}

function parseOrderDocument(doc: any) {
  return zOrderWithId.safeParse(fromServer<Order>(doc as any))
}

function parseUserDocument(doc: any) {
  return zUserWithId.safeParse(fromServer<User>(doc as any))
}

function parseSystemDocument(doc: any) {
  return zSystemItemWithId.safeParse(fromServer<SystemItem>(doc as any))
}

function parseProductDocument(doc: any) {
  return zProductWithId.safeParse(fromServer<Product>(doc as any))
}

const zOrderItemInput = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(999),
})

const zOrderCreateInput = z.object({
  items: z.array(zOrderItemInput).min(1),
  notes: z.string().max(500).optional(),
  address: z
    .object({
      contact: z.string().min(1).optional(),
      phone: z.string().min(1).optional(),
      detail: z.string().min(1).optional(),
    })
    .optional(),
})

async function fetchOrdersForStats(limit = 1000): Promise<OrderWithId[]> {
  const pageSize = 100
  const maxDocs = Math.max(0, limit)
  const results: OrderWithId[] = []

  const countRes = (await ordersCol().count().catch(() => ({ total: 0 }))) as { total?: number }
  const totalOrders = typeof countRes.total === 'number' ? countRes.total : 0
  if (totalOrders === 0 || maxDocs === 0) return []

  const cappedTotal = Math.min(totalOrders, maxDocs)
  for (let offset = 0; offset < cappedTotal; offset += pageSize) {
    const snapshot = await ordersCol()
      .orderBy('createdAt', 'desc')
      .skip(offset)
      .limit(Math.min(pageSize, cappedTotal - offset))
      .get()

    for (const doc of snapshot.data || []) {
      const parsed = parseOrderDocument(doc)
      if (!parsed.success) {
        const issue = parsed.error.issues?.[0]
        throw new Error(issue?.message || 'Invalid order data')
      }
      results.push(parsed.data)
    }

    if (!snapshot.data || snapshot.data.length < pageSize) break
  }

  return results
}

type StoreFeaturedProduct = {
  id: string
  title: string
  subtitle?: string
  priceYuan: number
  currency: 'CNY'
  imageUrl?: string
  hasStock: boolean
}

type StoreCategoryNode = {
  id: string
  name: string
  slug: string
  imageUrl?: string
  description?: string
  children: Array<{ id: string; name: string; slug: string; imageUrl?: string; description?: string }>
}

function getPrimaryProductImage(product: Product): ProductImage | undefined {
  return product.images && product.images.length > 0 ? product.images[0] : undefined
}

function getProductMinPrice(product: Product) {
  const skuPrices = product.skus
    ?.filter((sku) => sku.isActive !== false)
    .map((sku) => sku.priceYuan)
    .filter((price) => typeof price === 'number')
  if (skuPrices && skuPrices.length > 0) {
    return Math.min(...skuPrices)
  }
  return product.price.priceYuan
}

function roundToTwo(amount: number): number {
  return Math.round(amount * 100) / 100
}

function toFeaturedProduct(id: string, product: Product): StoreFeaturedProduct {
  return {
    id,
    title: product.title,
    subtitle: product.subtitle,
    priceYuan: getProductMinPrice(product),
    currency: product.price.currency,
    imageUrl: getPrimaryProductImage(product)?.url,
    hasStock: (product.stock ?? 0) > 0 || Boolean(product.skus?.some((sku) => (sku.stock ?? 0) > 0 && sku.isActive !== false)),
  }
}

function sortCategories<T extends { sort?: number; name: string }>(a: T, b: T) {
  const aSort = typeof a.sort === 'number' ? a.sort : 0
  const bSort = typeof b.sort === 'number' ? b.sort : 0
  if (aSort !== bSort) return aSort - bSort
  return a.name.localeCompare(b.name)
}

function toCategoryNode(category: SystemCategoryWithId, children: SystemCategoryWithId[]): StoreCategoryNode {
  const nextChildren = [...children].sort(sortCategories).map((child) => ({
    id: child.id,
    name: child.name,
    slug: child.slug,
    imageUrl: child.imageUrl,
    description: child.description,
  }))
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    imageUrl: category.imageUrl,
    description: category.description,
    children: nextChildren,
  }
}

/**
 * ensureUserByOpenid
 * Given an openid/unionid, fetch the user; if it does not exist, create it.
 * Returns a tuple of the user and whether it was newly created.
 */
async function ensureUserByOpenid(openid: string, unionid?: string): Promise<{ user: User & { id: string }; isNew: boolean }>
{
  const col = usersCol()
  const found = await col.where({ openid }).get()
  if (found.data && found.data.length > 0) {
    const doc = found.data[0]
    return { user: fromServer<User>(doc), isNew: false }
  }

  const now = nowMs()
  const base: User = zUser.parse({
    openid,
    unionid,
    roles: ['user'],
    profile: { nickname: 'WeChat User', avatarUrl: '' },
    wallet: { currency: 'CNY', balanceYuan: 0, frozenYuan: 0 },
    createdAt: now,
    updatedAt: now,
  })
  const addRes = await col.add({ data: base })
  return { user: { ...base, id: addRes._id }, isNew: true }
}

/**
 * updateUserProfile
 * Update the profile for the user identified by openid and return the updated document.
 */
async function updateUserProfile(openid: string, profile: UserProfile, unionid?: string): Promise<User & { id: string }>
{
  // Ensure the user document exists before attempting to update the profile.
  await ensureUserByOpenid(openid, unionid)

  const col = usersCol()
  const now = nowMs()
  await col.where({ openid }).update({ data: { profile, updatedAt: now } })
  const reget = await col.where({ openid }).get()
  if (!reget.data || reget.data.length === 0) throw new Error('User not found after update')
  return fromServer<User>(reget.data[0])
}

// Handlers (single-action router)
const handlers: Record<string, (event: any) => Promise<ApiResponse> | ApiResponse> = {
  // v1.system.* — baseline health
  'v1.system.ping': async () => ok({ message: 'pong' }),

  /**
   * v1.auth.login
   * Input: none (identity comes from cloud.getWXContext())
   * Output: { user, isNew }
   */
  'v1.auth.login': async () => {
    const { OPENID, UNIONID } = getWX() as any
    if (!OPENID) return fail('Missing OPENID in WX context')
    const { user, isNew } = await ensureUserByOpenid(OPENID, UNIONID)
    return ok({ user, isNew })
  },

  /**
   * v1.auth.profile.update
   * Input: { profile }
   * Output: { user }
   */
  'v1.auth.profile.update': async (event: any) => {
    const { OPENID, UNIONID } = getWX() as any
    if (!OPENID) return fail('Missing OPENID in WX context')
    const input = zUserProfile.safeParse(event?.profile)
    if (!input.success) return fail('Invalid profile payload', { issues: input.error.issues })
    const user = await updateUserProfile(OPENID, input.data, UNIONID)
    return ok({ user })
  },

  /**
   * v1.store.home
   * Input: none
   * Output: { featuredProducts }
   */
  'v1.store.home': async () => {
    const FEATURED_LIMIT = 8
    const snapshot = await productsCol().orderBy('updatedAt', 'desc').limit(FEATURED_LIMIT * 3).get()
    const featured: StoreFeaturedProduct[] = []

    for (const doc of snapshot.data || []) {
      const { _id, ...rest } = doc as any
      const parsed = zProduct.safeParse(rest)
      if (!parsed.success) {
        return fail('Invalid product data', { issues: parsed.error.issues, productId: _id })
      }
      const product = parsed.data
      if (product.isActive === false) continue
      featured.push(toFeaturedProduct(_id, product))
      if (featured.length >= FEATURED_LIMIT) break
    }

    return ok({ featuredProducts: featured })
  },

  /**
   * v1.store.products.search
   * Input: { keyword?, limit? }
   * Output: { products }
   */
  'v1.store.products.search': async (event: any) => {
    const keyword = typeof event?.keyword === 'string' ? event.keyword.trim() : ''
    const rawLimit = Number(event?.limit)
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 100) : 50

    const fetchLimit = keyword ? Math.max(limit, 100) : limit
    const snapshot = await productsCol().orderBy('updatedAt', 'desc').limit(fetchLimit).get()
    const products: ProductWithId[] = []
    const normalizedKeyword = keyword.toLowerCase()

    for (const doc of snapshot.data || []) {
      const parsed = parseProductDocument(doc)
      if (!parsed.success) return fail('Invalid product data', { issues: parsed.error.issues })
      const product = parsed.data
      if (product.isActive === false) continue
      if (!keyword) {
        products.push(product)
      } else {
        const haystack = [product.title, product.subtitle, product.description]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        if (haystack.includes(normalizedKeyword)) {
          products.push(product)
        }
      }
      if (products.length >= limit) break
    }

    return ok({ products })
  },

  /**
   * v1.store.product.detail
   * Input: { productId }
   * Output: { product }
   */
  'v1.store.product.detail': async (event: any) => {
    const productId = typeof event?.productId === 'string' ? event.productId.trim() : ''
    if (!productId) return fail('Missing productId')
    const snapshot = await productsCol().where({ _id: productId }).limit(1).get()
    const doc = snapshot.data?.[0]
    if (!doc) return fail('Product not found')
    const parsed = parseProductDocument(doc)
    if (!parsed.success) return fail('Invalid product data', { issues: parsed.error.issues })
    const product = parsed.data
    if (product.isActive === false) return fail('Product unavailable', { productId })
    return ok({ product })
  },

  /**
   * v1.store.products.byCategory
   * Input: { category }
   * Output: { products }
   */
  'v1.store.products.byCategory': async (event: any) => {
    const category = typeof event?.category === 'string' ? event.category.trim() : ''
    if (!category) return fail('Missing category')
    const snapshot = await productsCol().orderBy('updatedAt', 'desc').where({ category }).limit(100).get()
    const products: ProductWithId[] = []
    for (const doc of snapshot.data || []) {
      const parsed = parseProductDocument(doc)
      if (!parsed.success) return fail('Invalid product data', { issues: parsed.error.issues })
      if (parsed.data.isActive === false) continue
      products.push(parsed.data)
    }
    return ok({ products })
  },

  /**
   * v1.store.order.create
   * Input: { items, notes?, address? }
   * Output: { order }
   */
  'v1.store.order.create': async (event: any) => {
    const { OPENID, UNIONID } = getWX() as any
    if (!OPENID) return fail('Missing OPENID in WX context')
    const parsedInput = zOrderCreateInput.safeParse(event)
    if (!parsedInput.success) return fail('Invalid order payload', { issues: parsedInput.error.issues })

    const aggregated = new Map<string, number>()
    for (const { productId, quantity } of parsedInput.data.items) {
      const trimmedId = productId.trim()
      if (!trimmedId) continue
      aggregated.set(trimmedId, (aggregated.get(trimmedId) || 0) + quantity)
    }
    if (aggregated.size === 0) return fail('No valid items provided')

    const productMap = new Map<string, ProductWithId>()
    for (const [productId] of aggregated) {
      const snapshot = await productsCol().where({ _id: productId }).limit(1).get()
      const doc = snapshot.data?.[0]
      if (!doc) return fail('Product not found', { productId })
      const productParsed = parseProductDocument(doc)
      if (!productParsed.success) return fail('Invalid product data', { issues: productParsed.error.issues, productId })
      if (productParsed.data.isActive === false) return fail('Product unavailable', { productId })
      productMap.set(productId, productParsed.data)
    }

    let subtotal = 0
    const orderItems = Array.from(aggregated.entries()).map(([productId, quantity]) => {
      const product = productMap.get(productId)!
      const unitPrice = getProductMinPrice(product)
      subtotal += unitPrice * quantity
      return {
        productId,
        title: product.title,
        qty: quantity,
        priceYuan: unitPrice,
      }
    })

    const notesValue = parsedInput.data.notes?.trim() || undefined
    const addressValue = parsedInput.data.address
      ? {
          contact: parsedInput.data.address.contact?.trim() || undefined,
          phone: parsedInput.data.address.phone?.trim() || undefined,
          detail: parsedInput.data.address.detail?.trim() || undefined,
        }
      : undefined

    const now = nowMs()
    const subtotalYuan = roundToTwo(subtotal)
    await ensureUserByOpenid(OPENID, UNIONID)
    const orderData = zOrder.parse({
      userId: OPENID,
      items: orderItems,
      subtotalYuan,
      shippingYuan: 0,
      discountYuan: 0,
      totalYuan: subtotalYuan,
      status: 'pending',
      payment: undefined,
      address: addressValue,
      notes: notesValue,
      createdAt: now,
      updatedAt: now,
    })

    const addRes = await ordersCol().add({ data: orderData })
    const order: OrderWithId = { ...orderData, id: addRes._id }
    return ok({ order })
  },

  /**
   * v1.store.categories.list
   * Input: none
   * Output: { categories }
   */
  'v1.store.categories.list': async () => {
    const snapshot = await systemCol().where({ kind: 'category' }).limit(500).get()
    const allCategories: SystemCategoryWithId[] = []
    const invalidCategories: Array<{ docId?: string; issues: ZodIssue[] }> = []

    for (const doc of snapshot.data || []) {
      const parsed = parseSystemDocument(doc)
      if (!parsed.success) {
        invalidCategories.push({ docId: (doc as any)?._id, issues: parsed.error.issues })
        continue
      }
      if (parsed.data.kind !== 'category') continue
      allCategories.push(parsed.data)
    }

    if (invalidCategories.length > 0) {
      const summary = invalidCategories.slice(0, 5).map(({ docId, issues }) => ({
        docId,
        issues: issues.map((issue) => ({ path: issue.path, message: issue.message })),
      }))
      const remaining = invalidCategories.length - summary.length
      if (remaining > 0) {
        console.warn('[shop] skipped invalid category documents', summary, { truncated: remaining })
      } else {
        console.warn('[shop] skipped invalid category documents', summary)
      }
    }

    const invalidProducts: Array<{ docId?: string; issues: ZodIssue[] }> = []
    const productCategorySlugs = new Set<string>()
    const pageSize = 100
    const maxDocs = 1000
    for (let offset = 0; offset < maxDocs; offset += pageSize) {
      const productSnapshot = await productsCol()
        .orderBy('updatedAt', 'desc')
        .skip(offset)
        .limit(pageSize)
        .get()

      const docs = productSnapshot.data || []
      if (docs.length === 0) break

      for (const doc of docs) {
        const parsed = parseProductDocument(doc)
        if (!parsed.success) {
          invalidProducts.push({ docId: (doc as any)?._id, issues: parsed.error.issues })
          continue
        }

        if (parsed.data.isActive === false) continue
        const slug = parsed.data.category?.trim()
        if (slug) productCategorySlugs.add(slug)
      }

      if (docs.length < pageSize) break
    }

    if (invalidProducts.length > 0) {
      const summary = invalidProducts.slice(0, 5).map(({ docId, issues }) => ({
        docId,
        issues: issues.map((issue) => ({ path: issue.path, message: issue.message })),
      }))
      const remaining = invalidProducts.length - summary.length
      if (remaining > 0) {
        console.warn('[shop] skipped invalid product documents while building categories', summary, {
          truncated: remaining,
        })
      } else {
        console.warn('[shop] skipped invalid product documents while building categories', summary)
      }
    }

    const matchedSlugs = new Set<string>()

    const active = allCategories.filter((category) => category.isActive !== false)
    const childrenMap = new Map<string, SystemCategoryWithId[]>()
    for (const category of active) {
      if (category.parentId) {
        const list = childrenMap.get(category.parentId) || []
        list.push(category)
        childrenMap.set(category.parentId, list)
      }
    }

    const roots = active.filter((category) => !category.parentId).sort(sortCategories)
    const categories: Array<ReturnType<typeof toCategoryNode>> = []
    const fallbackCategories: Array<ReturnType<typeof toCategoryNode>> = []

    for (const root of roots) {
      const rawChildren = childrenMap.get(root.id) || []
      const filteredChildren = rawChildren.filter((child) => {
        if (productCategorySlugs.has(child.slug)) {
          matchedSlugs.add(child.slug)
          return true
        }
        return false
      })

      const includeRoot = productCategorySlugs.has(root.slug) || filteredChildren.length > 0
      if (!includeRoot) continue

      if (productCategorySlugs.has(root.slug)) matchedSlugs.add(root.slug)
      categories.push(toCategoryNode(root, filteredChildren))
    }

    for (const slug of productCategorySlugs) {
      if (matchedSlugs.has(slug)) continue
      fallbackCategories.push({
        id: slug,
        name: slug,
        slug,
        imageUrl: undefined,
        description: undefined,
        children: [] as ReturnType<typeof toCategoryNode>['children'],
      })
    }

    fallbackCategories.sort((a, b) => a.name.localeCompare(b.name))
    categories.push(...fallbackCategories)

    return ok({ categories })
  },

  /**
   * v1.store.profile.overview
   * Input: none (identity from context)
   * Output: { orderCounts }
   */
  'v1.store.profile.overview': async () => {
    const { OPENID } = getWX() as any
    if (!OPENID) return fail('Missing OPENID in WX context')

    const counts = {
      toPay: 0,
      toShip: 0,
      toReceive: 0,
      afterSale: 0,
    }

    const statusToKey: Array<{ status: string; key: keyof typeof counts }> = [
      { status: 'pending', key: 'toPay' },
      { status: 'paid', key: 'toShip' },
      { status: 'shipped', key: 'toReceive' },
      { status: 'refunded', key: 'afterSale' },
      { status: 'canceled', key: 'afterSale' },
    ]

    await Promise.all(
      statusToKey.map(async ({ status, key }) => {
        const res = (await ordersCol().where({ userId: OPENID, status }).count().catch(() => ({ total: 0 }))) as { total?: number }
        if (typeof res.total === 'number') {
          counts[key] += res.total
        }
      }),
    )

    return ok({ orderCounts: counts })
  },

  /**
   * v1.store.orders.list
   * Input: { status?, limit? }
   * Output: { orders }
   */
  'v1.store.orders.list': async (event: any) => {
    const { OPENID } = getWX() as any
    if (!OPENID) return fail('Missing OPENID in WX context')
    const status = typeof event?.status === 'string' ? event.status.trim() : ''
    const rawLimit = Number(event?.limit)
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 100) : 50

    const criteria = status ? { userId: OPENID, status } : { userId: OPENID }
    const snapshot = await ordersCol().where(criteria).orderBy('createdAt', 'desc').limit(limit).get()
    const orders: OrderWithId[] = []
    for (const doc of snapshot.data || []) {
      const parsed = parseOrderDocument(doc)
      if (!parsed.success) return fail('Invalid order data', { issues: parsed.error.issues })
      orders.push(parsed.data)
    }
    return ok({ orders })
  },

  /**
   * v1.admin.products.list
   * Input: none
   * Output: { products }
   */
  'v1.admin.products.list': async () => {
    if (!getAdminContext()) return fail('Not authenticated')
    const snapshot = await productsCol().orderBy('updatedAt', 'desc').limit(200).get()
    const products: Array<Product & { id: string }> = []
    for (const doc of snapshot.data) {
      const { _id, ...rest } = doc as any
      const parsed = zProduct.safeParse(rest)
      if (!parsed.success) {
        return fail('Invalid product data', { issues: parsed.error.issues })
      }
      products.push({ ...parsed.data, id: _id })
    }
    return ok({ products })
  },

  /**
   * v1.admin.products.create
   * Input: { product }
   * Output: { product }
   */
  'v1.admin.products.create': async (event: any) => {
    if (!getAdminContext()) return fail('Not authenticated')
    const input = zProductInput.safeParse(event?.product)
    if (!input.success) return fail('Invalid product payload', { issues: input.error.issues })
    const now = nowMs()
    const next = buildProductFromInput(input.data, now)
    const res = await productsCol().add({ data: next })
    return ok({ product: { ...next, id: res._id } })
  },

  /**
   * v1.admin.products.update
   * Input: { productId, product }
   * Output: { product }
   */
  'v1.admin.products.update': async (event: any) => {
    if (!getAdminContext()) return fail('Not authenticated')
    const productId = typeof event?.productId === 'string' ? event.productId.trim() : ''
    if (!productId) return fail('Missing productId')
    const input = zProductInput.safeParse(event?.product)
    if (!input.success) return fail('Invalid product payload', { issues: input.error.issues })

    const existingSnap = await productsCol().where({ _id: productId }).limit(1).get()
    const existingDoc = existingSnap.data?.[0]
    if (!existingDoc) return fail('Product not found')
    const { _id: _ignored, ...rest } = existingDoc as any
    const existing = zProduct.safeParse(rest)
    if (!existing.success) return fail('Stored product invalid', { issues: existing.error.issues })

    const now = nowMs()
    const next = buildProductFromInput(input.data, now, existing.data)
    await productsCol().where({ _id: productId }).update({ data: next })
    return ok({ product: { ...next, id: productId } })
  },

  /**
   * v1.admin.products.delete
   * Input: { productId }
   * Output: { productId }
   */
  'v1.admin.products.delete': async (event: any) => {
    if (!getAdminContext()) return fail('Not authenticated')
    const productId = typeof event?.productId === 'string' ? event.productId.trim() : ''
    if (!productId) return fail('Missing productId')

    const existingSnap = await productsCol().where({ _id: productId }).limit(1).get()
    const existingDoc = existingSnap.data?.[0]
    if (!existingDoc) return fail('Product not found')

    await productsCol().where({ _id: productId }).remove()
    return ok({ productId })
  },

  /**
   * v1.admin.orders.list
   * Input: none
   * Output: { orders }
   */
  'v1.admin.orders.list': async () => {
    if (!getAdminContext()) return fail('Not authenticated')
    const snapshot = await ordersCol().orderBy('createdAt', 'desc').limit(200).get()
    const orders: OrderWithId[] = []
    for (const doc of snapshot.data || []) {
      const parsed = parseOrderDocument(doc)
      if (!parsed.success) return fail('Invalid order data', { issues: parsed.error.issues })
      orders.push(parsed.data)
    }
    return ok({ orders })
  },

  /**
   * v1.admin.users.list
   * Input: none
   * Output: { users }
   */
  'v1.admin.users.list': async () => {
    if (!getAdminContext()) return fail('Not authenticated')
    const snapshot = await usersCol().orderBy('createdAt', 'desc').limit(200).get()
    const users: UserWithId[] = []
    for (const doc of snapshot.data || []) {
      const parsed = parseUserDocument(doc)
      if (!parsed.success) return fail('Invalid user data', { issues: parsed.error.issues })
      users.push(parsed.data)
    }
    return ok({ users })
  },

  /**
   * v1.admin.system.list
   * Input: none
   * Output: { categories, coupons, banners }
   */
  'v1.admin.system.list': async () => {
    if (!getAdminContext()) return fail('Not authenticated')
    const snapshot = await systemCol().orderBy('updatedAt', 'desc').limit(200).get()
    const categories: SystemCategoryWithId[] = []
    const coupons: SystemCouponWithId[] = []
    const banners: SystemBannerWithId[] = []
    for (const doc of snapshot.data || []) {
      const parsed = parseSystemDocument(doc)
      if (!parsed.success) return fail('Invalid system data', { issues: parsed.error.issues })
      const item = parsed.data
      switch (item.kind) {
        case 'category':
          categories.push(item)
          break
        case 'coupon':
          coupons.push(item)
          break
        case 'banner':
          banners.push(item)
          break
        default:
          return fail('Unknown system item kind')
      }
    }
    return ok({ categories, coupons, banners })
  },

  /**
   * v1.admin.dashboard.summary
   * Input: none
   * Output: { summary, recentOrders }
   */
  'v1.admin.dashboard.summary': async () => {
    if (!getAdminContext()) return fail('Not authenticated')

    let ordersForStats: OrderWithId[] = []
    try {
      ordersForStats = await fetchOrdersForStats(1000)
    } catch (error) {
      return fail((error as Error)?.message || 'Failed to load orders for summary')
    }

    const paidStatuses = new Set(['paid', 'shipped', 'completed'])
    let totalRevenueYuan = 0
    let paidOrders = 0
    let pendingOrders = 0
    for (const order of ordersForStats) {
      if (paidStatuses.has(order.status)) {
        paidOrders += 1
        totalRevenueYuan += order.totalYuan
      }
      if (order.status === 'pending') pendingOrders += 1
    }

    const countRes = (await ordersCol().count().catch(() => ({ total: 0 }))) as { total?: number }
    const totalOrders = typeof countRes.total === 'number' ? countRes.total : ordersForStats.length

    const userCountRes = (await usersCol().count().catch(() => ({ total: 0 }))) as { total?: number }
    const customerCount = typeof userCountRes.total === 'number' ? userCountRes.total : 0

    const recentSnapshot = await ordersCol().orderBy('createdAt', 'desc').limit(5).get()
    const recentOrders: OrderWithId[] = []
    for (const doc of recentSnapshot.data || []) {
      const parsed = parseOrderDocument(doc)
      if (!parsed.success) return fail('Invalid order data', { issues: parsed.error.issues })
      recentOrders.push(parsed.data)
    }

    return ok({
      summary: {
        totalRevenueYuan,
        totalOrders,
        paidOrders,
        pendingOrders,
        customerCount,
      },
      recentOrders,
    })
  },
}

export const main = async (event: any) => {
  const start = Date.now()
  try {
    if (!event?.action) return fail('Missing action parameter')
    const handler = handlers[event.action]
    if (!handler) return fail(`Unknown action: ${event.action}`, { availableActions: Object.keys(handlers).sort() })
    const result = await handler(event)
    return { ...result, action: event.action, executionTime: Date.now() - start }
  } catch (e: any) {
    return fail(`Internal error: ${e?.message || e}`)
  }
}
