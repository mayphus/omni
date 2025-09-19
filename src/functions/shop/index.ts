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
import type { Order, OrderWithId, Payment, PaymentStatus, OrderStatus } from '@shared/models/order'
import { zOrder, zOrderStatus, zOrderWithId } from '@shared/models/order'
import type {
  SystemBannerWithId,
  SystemCategoryWithId,
  SystemCouponWithId,
  SystemItem,
} from '@shared/models/system'
import {
  zSystemBanner,
  zSystemCategory,
  zSystemItemWithId,
} from '@shared/models/system'
import { Collections } from '@shared/collections'
import { fromServer, nowMs } from '@shared/base'
import { yuanToCents } from '@shared/money'

// Use wx-server-sdk directly for WeChat Mini Program cloud functions
// eslint-disable-next-line @typescript-eslint/no-var-requires
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// Test harnesses can inject faux database/context/cloud pay clients to model
// end-to-end flows without touching Tencent Cloud. Production relies on the
// default wx-server-sdk implementations.
const overrides = (globalThis as any).__SHOP_TEST_OVERRIDES__ as
  | undefined
  | {
      database?: () => ReturnType<typeof cloud.database>
      getWXContext?: () => Record<string, any>
      cloudPay?: () => {
        unifiedOrder: (payload: Record<string, any>) => Promise<any>
        queryOrder: (payload: Record<string, any>) => Promise<any>
        refund?: (payload: Record<string, any>) => Promise<any>
      }
    }

const db = overrides?.database ? overrides.database() : cloud.database()
type CloudPayApi = {
  unifiedOrder: (payload: Record<string, any>) => Promise<any>
  queryOrder: (payload: Record<string, any>) => Promise<any>
  refund?: (payload: Record<string, any>) => Promise<any>
} | null

const cloudPay: CloudPayApi = overrides?.cloudPay ? overrides.cloudPay() : cloud.cloudPay || null

type PaymentConfig = {
  envId?: string
  functionName: string
  subMchId: string
  description: string
  spbillCreateIp: string
}

function getPaymentConfig(): PaymentConfig {
  // All WeChat Pay requests must echo these identifiers so Tencent can route
  // callbacks and settlements correctly. We tolerate missing optional fields
  // but block execution if the sub-merchant id is absent to avoid silent
  // payment failures.
  const envId = process.env.WECHAT_PAY_ENV_ID || process.env.TCB_ENV || process.env.TENCENTCLOUD_ENV
  const functionName = process.env.WECHAT_PAY_NOTIFY_FUNCTION || 'shop'
  const subMchId = process.env.WECHAT_PAY_SUB_MCH_ID || ''
  const description = process.env.WECHAT_PAY_BODY || 'Shop order payment'
  const spbillCreateIp = process.env.WECHAT_PAY_IP || '127.0.0.1'

  if (!subMchId) {
    throw new Error('Missing WECHAT_PAY_SUB_MCH_ID environment variable')
  }

  return { envId, functionName, subMchId, description, spbillCreateIp }
}

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

async function findUserByOpenid(openid: string): Promise<UserWithId | null> {
  const snapshot = await usersCol().where({ openid }).limit(1).get()
  const doc = snapshot.data?.[0]
  if (!doc) return null
  const parsed = parseUserDocument(doc)
  if (!parsed.success) {
    const issue = parsed.error.issues?.[0]
    throw new Error(issue?.message || 'Invalid user data')
  }
  return parsed.data
}

function parseOptionalString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed ? trimmed : undefined
}


function getAdminUuidAllowlist(): string[] {
  return (process.env.SHOP_ADMIN_UUIDS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
}

type AdminPrincipal = {
  context: Record<string, any>
  user?: UserWithId
}

async function resolveAdminPrincipal(): Promise<AdminPrincipal | null> {
  // Admin calls may arrive from WeChat Mini Program (openid) or from the
  // Tencent Cloud console (UUID). We resolve both so operations can automate
  // tasks without creating separate API keys.
  const ctx = getWX() as any
  const openid =
    parseOptionalString(ctx?.OPENID) || parseOptionalString(process.env.OPENID) || parseOptionalString(process.env.TCB_OPENID)

  if (openid) {
    const user = await findUserByOpenid(openid)
    if (user && Array.isArray(user.roles) && user.roles.includes('admin')) {
      return { context: ctx, user }
    }
  }

  const uuidCandidates = [ctx?.TCB_UUID, ctx?.TCB_CUSTOM_USER_ID, process.env.TCB_UUID, process.env.TCB_CUSTOM_USER_ID]
  const uuid = uuidCandidates.map(parseOptionalString).find(Boolean)

  const allowlist = getAdminUuidAllowlist()
  if (uuid && allowlist.length > 0) {
    if (allowlist.includes(uuid)) {
      return { context: ctx }
    }
  }

  return null
}

async function requireAdminAccess(): Promise<AdminPrincipal | null> {
  // We swallow errors here and return null so the handler can respond with a
  // clean auth error rather than leaking internal resolution issues.
  try {
    return await resolveAdminPrincipal()
  } catch (error) {
    console.error('[shop] failed to resolve admin principal', error)
    return null
  }
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
  skuId: z.string().min(1).optional(),
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

const zOrderIdPayload = z.object({
  orderId: z.string().min(1),
})

const zAdminOrderUpdateInput = z.object({
  orderId: z.string().min(1),
  status: zOrderStatus,
})

const zOptionalTrimmedString = z
  .string()
  .trim()
  .transform((value) => (value ? value : undefined))
  .optional()

const zAdminBannerSaveInput = z.object({
  id: z.string().trim().min(1).optional(),
  imageUrl: z.string().trim().url(),
  title: zOptionalTrimmedString,
  linkUrl: zOptionalTrimmedString,
  sort: z.number().int().optional(),
  isActive: z.boolean().optional(),
  startAt: z.number().int().min(0).optional(),
  endAt: z.number().int().min(0).optional(),
})

const zAdminBannerDeleteInput = z.object({
  id: z.string().trim().min(1),
})

const zAdminCategorySaveInput = z.object({
  id: z.string().trim().min(1).optional(),
  name: z.string().trim().min(1),
  slug: z.string().trim().min(1),
  parentId: z.string().trim().min(1).optional(),
  sort: z.number().int().optional(),
  isActive: z.boolean().optional(),
  imageUrl: zOptionalTrimmedString,
  description: zOptionalTrimmedString,
})

const zAdminCategoryDeleteInput = z.object({
  id: z.string().trim().min(1),
})

// Pulls a recent slice of orders to feed dashboards and revenue analytics.
// We paginate manually because the database SDK does not support offsets with
// `count` natively, and we want predictable bounds for admin queries.
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

async function findOrderById(orderId: string): Promise<OrderWithId | null> {
  if (!orderId) return null
  const snapshot = await ordersCol().where({ _id: orderId }).limit(1).get()
  const doc = snapshot.data?.[0]
  if (!doc) return null
  const parsed = parseOrderDocument(doc)
  if (!parsed.success) {
    const issue = parsed.error.issues?.[0]
    throw new Error(issue?.message || 'Invalid order data')
  }
  return parsed.data
}

async function requireOrderById(orderId: string): Promise<OrderWithId> {
  const order = await findOrderById(orderId)
  if (!order) throw new Error('Order not found')
  return order
}

function buildOutTradeNo(orderId: string, now: number): string {
  return `${orderId}-${now}`
}

function pickString(source: any, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = source?.[key]
    if (typeof value === 'string' && value.trim()) {
      return value
    }
  }
  return undefined
}

function pickNumber(source: any, keys: string[]): number | undefined {
  for (const key of keys) {
    const value = source?.[key]
    if (typeof value === 'string' && value.trim()) {
      const parsed = Number(value)
      if (Number.isFinite(parsed)) return parsed
    }
    if (typeof value === 'number' && Number.isFinite(value)) return value
  }
  return undefined
}

function normalizeTradeState(source: any): string {
  const state = pickString(source, ['tradeState', 'trade_state'])
  return state ? state.toUpperCase() : ''
}

function normalizeCode(source: any, keys: string[]): string {
  const value = pickString(source, keys)
  return value ? value.toUpperCase() : ''
}

function isPaymentQuerySuccessful(result: any): boolean {
  const tradeState = normalizeTradeState(result)
  if (tradeState) return tradeState === 'SUCCESS'
  const resultCode = normalizeCode(result, ['resultCode', 'result_code'])
  const returnCode = normalizeCode(result, ['returnCode', 'return_code'])
  return returnCode === 'SUCCESS' && resultCode === 'SUCCESS'
}

function buildPaymentUpdate(
  payment: Payment,
  updates: Partial<Payment> & { status?: PaymentStatus },
): Payment {
  return {
    ...payment,
    ...updates,
    status: updates.status ?? payment.status,
  }
}

function ensureOrderOwner(order: OrderWithId, openid: string) {
  if (!openid || order.userId !== openid) {
    const error = new Error('Order not found')
    ;(error as any).code = 'NOT_OWNER'
    throw error
  }
}

function sanitizePaymentPackage(pkg: any): Payment['paymentPackage'] | undefined {
  if (!pkg || typeof pkg !== 'object') return undefined
  const allowed = ['timeStamp', 'nonceStr', 'package', 'signType', 'paySign']
  const result: Record<string, string> = {}
  for (const key of allowed) {
    const value = pkg[key]
    if (typeof value === 'string' && value) {
      result[key] = value
    }
  }
  return Object.keys(result).length > 0 ? (result as Payment['paymentPackage']) : undefined
}

const ORDER_STATUS_TRANSITIONS: Record<string, Set<string>> = {
  pending: new Set(['paid', 'canceled']),
  paid: new Set(['shipped', 'canceled', 'refunded']),
  shipped: new Set(['completed', 'refunded']),
  completed: new Set(['refunded']),
  canceled: new Set(),
  refunded: new Set(),
}

function canTransitionOrderStatus(current: string, next: string): boolean {
  if (current === next) return true
  const allowed = ORDER_STATUS_TRANSITIONS[current]
  if (!allowed) return false
  return allowed.has(next)
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

function createPendingPayment(amountYuan: number): Payment {
  const total = roundToTwo(amountYuan)
  return {
    method: 'wechat_pay',
    status: 'pending',
    amountYuan: total,
    currency: 'CNY',
  }
}

function buildCartKey(productId: string, skuId?: string): string {
  return skuId ? `${productId}__${skuId}` : productId
}

function optionalTrimmed(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed ? trimmed : undefined
}

function isValidLinkTarget(value: string): boolean {
  return value.startsWith('/') || /^https?:\/\//i.test(value)
}

function isValidUrl(value: string): boolean {
  try {
    // eslint-disable-next-line no-new
    new URL(value)
    return true
  } catch {
    return false
  }
}

type ProductSku = NonNullable<Product['skus']>[number]

function buildOrderItemTitle(productTitle: string, sku: ProductSku): string {
  const attributes = sku.attributes
    ? Object.entries(sku.attributes).filter(([key, value]) => {
        if (!key) return false
        return value !== undefined && value !== null && value !== ''
      })
    : []
  if (attributes.length === 0) {
    return `${productTitle} (${sku.skuId.trim()})`
  }
  const attributeText = attributes
    .map(([key, value]) => `${key}: ${formatSkuAttributeValue(value)}`)
    .filter(Boolean)
    .join(' / ')
  return attributeText ? `${productTitle} (${attributeText})` : `${productTitle} (${sku.skuId.trim()})`
}

function formatSkuAttributeValue(value: unknown): string {
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (value === null || value === undefined) return ''
  return String(value)
}

const STOCK_ERROR_CODE = 'STOCK_ERROR'

type StockMutationType = 'decrement' | 'increment'

type StockMutation = {
  productId: string
  skuId?: string
  quantity: number
  type: StockMutationType
}

type SkuStockEntry = {
  value: number
  changed: boolean
}

type ProductStockUpdate = {
  product: ProductWithId
  stock: number
  stockChanged: boolean
  skuStocks: Map<string, SkuStockEntry>
  expectedUpdatedAt?: number
}

function createProductStockUpdate(product: ProductWithId): ProductStockUpdate {
  const skuStocks = new Map<string, SkuStockEntry>()
  if (Array.isArray(product.skus)) {
    for (const sku of product.skus) {
      if (!sku) continue
      const skuId = sku.skuId.trim()
      if (!skuId) continue
      skuStocks.set(skuId, { value: sku.stock ?? 0, changed: false })
    }
  }
  return {
    product,
    stock: product.stock ?? 0,
    stockChanged: false,
    skuStocks,
    expectedUpdatedAt: typeof product.updatedAt === 'number' ? product.updatedAt : undefined,
  }
}

function createStockError(message: string, details: { productId: string; skuId?: string }) {
  const error = new Error(message)
  ;(error as any).code = STOCK_ERROR_CODE
  ;(error as any).details = details
  return error
}

// Flattens a batch of stock mutations into the minimal set of product updates.
// We validate eagerly so the order flow fails before committing any writes,
// keeping inventory consistent even under concurrent purchases.
function collectStockUpdates(
  mutations: StockMutation[],
  productMap: Map<string, ProductWithId>,
): Map<string, ProductStockUpdate> {
  const updates = new Map<string, ProductStockUpdate>()

  for (const mutation of mutations) {
    const product = productMap.get(mutation.productId)
    if (!product) throw createStockError('Product not found', { productId: mutation.productId })

    let existing = updates.get(product.id)
    if (!existing) {
      existing = createProductStockUpdate(product)
      updates.set(product.id, existing)
    }

    if (mutation.quantity <= 0) continue

    if (mutation.skuId) {
      const skuId = mutation.skuId.trim()
      if (!skuId) throw createStockError('SKU not found', { productId: product.id })
      const matchedSku = product.skus?.find((sku) => sku && sku.skuId.trim() === skuId)
      if (!matchedSku) throw createStockError('SKU not found', { productId: product.id, skuId })
      const entry = existing.skuStocks.get(skuId) ?? { value: matchedSku.stock ?? 0, changed: false }
      const nextValue = mutation.type === 'decrement' ? entry.value - mutation.quantity : entry.value + mutation.quantity
      if (nextValue < 0) throw createStockError('Insufficient stock', { productId: product.id, skuId })
      existing.skuStocks.set(skuId, { value: nextValue, changed: true })
    } else {
      const current = existing.stock
      const nextValue = mutation.type === 'decrement' ? current - mutation.quantity : current + mutation.quantity
      if (nextValue < 0) throw createStockError('Insufficient stock', { productId: product.id })
      existing.stock = nextValue
      existing.stockChanged = true
    }
  }

  return updates
}

// Persists the pre-validated stock adjustments. Each write includes an
// optimistic lock on `updatedAt` so racing orders trigger a retry instead of
// overselling.
async function applyProductStockUpdates(
  updates: Map<string, ProductStockUpdate>,
  timestamp: number,
): Promise<void> {
  for (const update of updates.values()) {
    const hasSkuChange = Array.from(update.skuStocks.values()).some((entry) => entry.changed)
    if (!update.stockChanged && !hasSkuChange) {
      continue
    }

    const data: Record<string, any> = {}
    const nextUpdatedAt = Math.max(timestamp, (update.product.updatedAt ?? timestamp) + 1)
    data.updatedAt = nextUpdatedAt

    if (update.stockChanged) {
      data.stock = Math.max(0, Math.trunc(update.stock))
    }

    if (Array.isArray(update.product.skus) && update.product.skus.length > 0) {
      let skuChanged = false
      const nextSkus = update.product.skus.map((sku) => {
        const skuId = sku?.skuId.trim()
        if (!skuId) return sku
        const entry = update.skuStocks.get(skuId)
        if (entry && entry.changed) {
          skuChanged = true
          return {
            ...sku,
            stock: Math.max(0, Math.trunc(entry.value)),
          }
        }
        return sku
      })
      if (skuChanged) {
        data.skus = nextSkus
      }
    }

    const condition: Record<string, any> = { _id: update.product.id }
    if (typeof update.expectedUpdatedAt === 'number') {
      condition.updatedAt = update.expectedUpdatedAt
    }

    const result = await productsCol().where(condition).update({ data })
    const updatedCount = typeof (result as any)?.stats?.updated === 'number' ? (result as any).stats.updated : 0
    if (updatedCount === 0) {
      const conflict = new Error('Product stock update conflict')
      ;(conflict as any).code = STOCK_ERROR_CODE
      ;(conflict as any).details = { productId: update.product.id, reason: 'conflict' }
      throw conflict
    }

    update.expectedUpdatedAt = nextUpdatedAt
  }
}

// If the order write fails we build a mirror update to roll inventory back to
// its previous values. This keeps finance reports aligned with actual stock on
// shelves even when the last DB write throws.
function buildRevertStockUpdates(updates: Map<string, ProductStockUpdate>): Map<string, ProductStockUpdate> {
  const revert = new Map<string, ProductStockUpdate>()
  for (const update of updates.values()) {
    const base = createProductStockUpdate(update.product)
    base.stockChanged = update.stockChanged
    base.expectedUpdatedAt = undefined
    if (update.stockChanged) {
      base.stock = update.product.stock ?? 0
    }
    for (const [skuId, entry] of update.skuStocks.entries()) {
      if (!entry.changed) continue
      const original = base.skuStocks.get(skuId)
      const originalValue = original ? original.value : 0
      base.skuStocks.set(skuId, { value: originalValue, changed: true })
    }
    revert.set(update.product.id, base)
  }
  return revert
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

function sortBanners(a: SystemBannerWithId, b: SystemBannerWithId) {
  const aSort = typeof a.sort === 'number' ? a.sort : 0
  const bSort = typeof b.sort === 'number' ? b.sort : 0
  if (aSort !== bSort) return aSort - bSort
  return (b.updatedAt ?? 0) - (a.updatedAt ?? 0)
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
// Naming convention mirrors the client requests. Segments roughly map to
// business capabilities:
// - v1.system.* → health checks for monitoring/CI probes
// - v1.auth.*   → identity bootstrap from the mini program session
// - v1.store.*  → customer-facing catalogue, cart, checkout
// - v1.admin.*  → back-office tools for merchandising and operations
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
   * v1.store.order.payment.confirm
   * Input: { orderId }
   * Output: { order }
   */
  'v1.store.order.payment.confirm': async (event: any) => {
    const { OPENID } = getWX() as any
    if (!OPENID) return fail('Missing OPENID in WX context')
    if (!cloudPay || typeof cloudPay.queryOrder !== 'function') {
      return fail('Payment service unavailable')
    }
    const parsed = zOrderIdPayload.safeParse(event)
    if (!parsed.success) return fail('Invalid order payload', { issues: parsed.error.issues })

    let order: OrderWithId
    try {
      order = await requireOrderById(parsed.data.orderId.trim())
    } catch (error) {
      if ((error as Error).message === 'Order not found') return fail('Order not found')
      throw error
    }

    try {
      ensureOrderOwner(order, OPENID)
    } catch {
      return fail('Order not found')
    }

    if (!order.payment) return fail('Order missing payment information')
    if (!order.payment.outTradeNo) return fail('Payment not initialised for order')

    // This call double-checks with WeChat Pay so customer support can trust
    // that a "paid" status reflects the provider's source of truth, not just
    // the client signalling success.
    const paymentConfig = getPaymentConfig()
    let queryResult: any
    try {
      queryResult = await cloudPay.queryOrder({
        subMchId: paymentConfig.subMchId,
        outTradeNo: order.payment.outTradeNo,
      })
    } catch (error: any) {
      return fail('Failed to verify payment', { message: error?.message || String(error) })
    }

    const tradeState = normalizeTradeState(queryResult)
    const tradeDesc = pickString(queryResult, ['tradeStateDesc', 'trade_state_desc'])

    if (!isPaymentQuerySuccessful(queryResult)) {
      if (tradeState === 'NOTPAY' || tradeState === 'USERPAYING') {
        return fail('Payment still pending', { tradeState, description: tradeDesc })
      }

      const updatedPayment = buildPaymentUpdate(order.payment, {
        status: tradeState === 'REFUND' ? 'refunded' : 'failed',
        lastError: tradeDesc || tradeState || 'Payment not completed',
      })
      const now = nowMs()
      const updateData: Record<string, any> = {
        payment: updatedPayment,
        updatedAt: now,
      }
      if (tradeState === 'REFUND') {
        updateData.status = 'refunded'
      }
      await ordersCol().where({ _id: order.id }).update({ data: updateData })
      return fail('Payment not completed', { tradeState, description: tradeDesc })
    }

    const totalFee = pickNumber(queryResult, ['totalFee', 'total_fee'])
    const expectedCents = yuanToCents(order.payment.amountYuan)
    if (typeof totalFee === 'number' && totalFee !== expectedCents) {
      return fail('Payment amount mismatch', { totalFee, expected: expectedCents })
    }

    const transactionId = pickString(queryResult, ['transactionId', 'transaction_id'])
    const now = nowMs()
    const updatedPayment = buildPaymentUpdate(order.payment, {
      status: 'succeeded',
      transactionId: transactionId || order.payment.transactionId,
      paidAt: now,
      lastError: undefined,
    })

    await ordersCol()
      .where({ _id: order.id })
      .update({
        data: {
          payment: updatedPayment,
          status: 'paid',
          updatedAt: now,
        },
      })

    return ok({
      order: {
        ...order,
        status: 'paid',
        payment: updatedPayment,
        updatedAt: now,
      },
    })
  },

  /**
   * v1.store.order.cancel
   * Input: { orderId }
   * Output: { order }
   */
  'v1.store.order.cancel': async (event: any) => {
    const { OPENID } = getWX() as any
    if (!OPENID) return fail('Missing OPENID in WX context')
    const parsed = zOrderIdPayload.safeParse(event)
    if (!parsed.success) return fail('Invalid order payload', { issues: parsed.error.issues })

    const orderId = parsed.data.orderId.trim()
    let order: OrderWithId
    try {
      order = await requireOrderById(orderId)
    } catch (error) {
      if ((error as Error).message === 'Order not found') return fail('Order not found')
      throw error
    }

    try {
      ensureOrderOwner(order, OPENID)
    } catch {
      return fail('Order not found')
    }

    const cancelableStatuses = new Set<OrderStatus>(['pending', 'paid'])
    if (!cancelableStatuses.has(order.status)) {
      return fail('Order cannot be canceled', { status: order.status })
    }

    const paymentStatus = order.payment?.status
    const requiresRefund = order.status === 'paid' && paymentStatus === 'succeeded'
    if (requiresRefund && (!cloudPay || typeof cloudPay.refund !== 'function')) {
      return fail('Paid orders require manual refund')
    }

    const productIds = Array.from(new Set(order.items.map((item) => item.productId)))
    const productMap = new Map<string, ProductWithId>()
    for (const productId of productIds) {
      const snapshot = await productsCol().where({ _id: productId }).limit(1).get()
      const doc = snapshot.data?.[0]
      if (!doc) {
        console.warn('[shop] missing product while canceling order', { orderId: order.id, productId })
        continue
      }
      const parsedProduct = parseProductDocument(doc)
      if (!parsedProduct.success) {
        console.warn('[shop] invalid product while canceling order', {
          orderId: order.id,
          productId,
          issues: parsedProduct.error.issues,
        })
        continue
      }
      productMap.set(productId, parsedProduct.data)
    }

    const restockMutations: StockMutation[] = []
    for (const item of order.items) {
      const product = productMap.get(item.productId)
      if (!product) continue
      const skuId = item.skuId?.trim()
      if (skuId) {
        const hasSku = product.skus?.some((sku) => sku && sku.skuId.trim() === skuId)
        if (!hasSku) {
          console.warn('[shop] missing sku while canceling order', {
            orderId: order.id,
            productId: item.productId,
            skuId,
          })
          continue
        }
      }
      restockMutations.push({
        productId: item.productId,
        skuId,
        quantity: item.qty,
        type: 'increment',
      })
    }

    let restockUpdates: Map<string, ProductStockUpdate> | null = null
    if (restockMutations.length > 0) {
      // Cancelling should return inventory back to shelves so other customers
      // can purchase immediately. We reuse the stock update pipeline to keep
      // the business rules identical to order creation.
      try {
        restockUpdates = collectStockUpdates(restockMutations, productMap)
      } catch (error: any) {
        if (error?.code === STOCK_ERROR_CODE) {
          console.warn('[shop] failed to prepare restock while canceling order', {
            orderId: order.id,
            details: error.details,
            message: error.message,
          })
          restockUpdates = null
        } else {
          throw error
        }
      }
    }

    if (requiresRefund) {
      const paymentConfig = getPaymentConfig()
      const payment = order.payment!
      const totalFee = yuanToCents(typeof payment.amountYuan === 'number' ? payment.amountYuan : order.totalYuan)
      const refundPayloadEntries = Object.entries({
        subMchId: paymentConfig.subMchId,
        outTradeNo: payment.outTradeNo,
        transactionId: payment.transactionId,
        totalFee,
        refundFee: totalFee,
      }).filter(([, value]) => value !== undefined && value !== null)
      try {
        await cloudPay!.refund!(Object.fromEntries(refundPayloadEntries))
      } catch (error: any) {
        return fail('Failed to refund order', { message: error?.message || String(error) })
      }
    }

    const now = nowMs()
    let restockApplied = false
    if (restockUpdates && restockUpdates.size > 0) {
      try {
        await applyProductStockUpdates(restockUpdates, now)
        restockApplied = true
      } catch (error) {
        return fail('Failed to restock inventory', { message: error instanceof Error ? error.message : String(error) })
      }
    }

    const update: Record<string, any> = {
      status: requiresRefund ? 'refunded' : 'canceled',
      updatedAt: now,
    }

    if (order.payment) {
      const paymentUpdates: Partial<Payment> & { status?: PaymentStatus } = {}
      if (requiresRefund) {
        paymentUpdates.status = 'refunded'
        paymentUpdates.lastError = undefined
      } else if (order.payment.status !== 'failed' && order.payment.status !== 'refunded') {
        paymentUpdates.status = 'failed'
        paymentUpdates.lastError = 'Order canceled by user'
      }
      if (Object.keys(paymentUpdates).length > 0) {
        update.payment = buildPaymentUpdate(order.payment, paymentUpdates)
      }
    }

    try {
      await ordersCol().where({ _id: order.id }).update({ data: update })
    } catch (error) {
      if (restockApplied && restockUpdates && restockUpdates.size > 0) {
        try {
          const revertUpdates = buildRevertStockUpdates(restockUpdates)
          await applyProductStockUpdates(revertUpdates, nowMs())
        } catch (revertError) {
          console.error('[shop] failed to revert restock after cancel error', revertError)
        }
      }
      throw error
    }

    return ok({
      order: {
        ...order,
        ...update,
      },
    })
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
   * Output: { featuredProducts, banners }
   */
  'v1.store.home': async () => {
    const FEATURED_LIMIT = 8
    // Merchandising wants the freshest active inventory on the landing page,
    // but we fetch extra rows so we can filter out inactive or low-stock
    // products before returning the curated list to the client.
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

    const now = nowMs()
    const bannerSnapshot = await systemCol().where({ kind: 'banner' }).limit(100).get()
    const banners: SystemBannerWithId[] = []
    const invalidBanners: Array<{ docId?: string; issues: ZodIssue[] }> = []

    for (const doc of bannerSnapshot.data || []) {
      const parsed = parseSystemDocument(doc)
      if (!parsed.success) {
        invalidBanners.push({ docId: (doc as any)?._id, issues: parsed.error.issues })
        continue
      }
      if (parsed.data.kind !== 'banner') continue
      if (parsed.data.isActive === false) continue
      // Scheduled banners let operations configure campaigns without new code.
      // We discard ones outside the active window so the client receives only
      // timely promotions.
      if (typeof parsed.data.startAt === 'number' && parsed.data.startAt > now) continue
      if (typeof parsed.data.endAt === 'number' && parsed.data.endAt < now) continue
      banners.push(parsed.data)
    }

    if (invalidBanners.length > 0) {
      const summary = invalidBanners.slice(0, 5).map(({ docId, issues }) => ({
        docId,
        issues: issues.map((issue) => ({ path: issue.path, message: issue.message })),
      }))
      const remaining = invalidBanners.length - summary.length
      if (remaining > 0) {
        console.warn('[shop] skipped invalid banner documents', summary, { truncated: remaining })
      } else {
        console.warn('[shop] skipped invalid banner documents', summary)
      }
    }

    banners.sort(sortBanners)

    return ok({ featuredProducts: featured, banners })
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

    const products: ProductWithId[] = []
    const normalizedKeyword = keyword.toLowerCase()
    const pageSize = 100
    // Firestore-style queries lack full-text search, so we scan batches ordered
    // by `updatedAt`. This keeps results fresh while still letting customers
    // find catalogue text matches.

    for (let offset = 0; products.length < limit; offset += pageSize) {
      const snapshot = await productsCol().orderBy('updatedAt', 'desc').skip(offset).limit(pageSize).get()
      const docs = snapshot.data || []
      if (docs.length === 0) break

      for (const doc of docs) {
        const parsed = parseProductDocument(doc)
        if (!parsed.success) return fail('Invalid product data', { issues: parsed.error.issues })
        const product = parsed.data
        if (product.isActive === false) continue

        let matches = true
        if (keyword) {
          const haystack = [product.title, product.subtitle, product.description]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
          matches = haystack.includes(normalizedKeyword)
        }

        if (matches) {
          products.push(product)
          if (products.length >= limit) break
        }
      }

      if (docs.length < pageSize) break
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

    // Checkout flow in a nutshell:
    // 1. Aggregate cart items to collapse duplicates sent by the client.
    // 2. Load the latest product/SKU snapshots to validate price and stock.
    // 3. Reserve inventory optimistically, aborting on any constraint breach.
    // 4. Persist the order with a pending payment so the client can trigger
    //    the WeChat Pay handoff in a follow-up call.
    const aggregated = new Map<
      string,
      {
        productId: string
        skuId?: string
        quantity: number
      }
    >()
    for (const { productId, skuId, quantity } of parsedInput.data.items) {
      const trimmedProductId = productId.trim()
      if (!trimmedProductId) continue
      const trimmedSkuId = typeof skuId === 'string' ? skuId.trim() : ''
      const key = buildCartKey(trimmedProductId, trimmedSkuId || undefined)
      const existing = aggregated.get(key)
      if (existing) {
        existing.quantity += quantity
      } else {
        aggregated.set(key, {
          productId: trimmedProductId,
          skuId: trimmedSkuId || undefined,
          quantity,
        })
      }
    }
    if (aggregated.size === 0) return fail('No valid items provided')

    const productIds = Array.from(new Set(Array.from(aggregated.values()).map((item) => item.productId)))
    const productMap = new Map<string, ProductWithId>()
    for (const productId of productIds) {
      const snapshot = await productsCol().where({ _id: productId }).limit(1).get()
      const doc = snapshot.data?.[0]
      if (!doc) return fail('Product not found', { productId })
      const productParsed = parseProductDocument(doc)
      if (!productParsed.success) return fail('Invalid product data', { issues: productParsed.error.issues, productId })
      if (productParsed.data.isActive === false) return fail('Product unavailable', { productId })
      productMap.set(productId, productParsed.data)
    }

    let stockUpdates: Map<string, ProductStockUpdate> | null = null
    try {
      const stockMutations: StockMutation[] = Array.from(aggregated.values()).map((item) => ({
        productId: item.productId,
        skuId: item.skuId,
        quantity: item.quantity,
        type: 'decrement',
      }))
      stockUpdates = collectStockUpdates(stockMutations, productMap)
    } catch (error: any) {
      if (error?.code === STOCK_ERROR_CODE) {
        const details = typeof error.details === 'object' && error.details ? error.details : {}
        return fail(error.message || 'Insufficient stock', details)
      }
      throw error
    }

    let subtotal = 0
    const orderItems: Order['items'] = []
    for (const item of aggregated.values()) {
      const product = productMap.get(item.productId)!
      let unitPrice = roundToTwo(product.price.priceYuan)
      let title = product.title
      let skuId = item.skuId
      if (skuId) {
        const matchedSku = (product.skus || []).find((sku) => sku && sku.skuId.trim() === skuId)
        if (!matchedSku) return fail('SKU not found', { productId: item.productId, skuId })
        if (matchedSku.isActive === false) return fail('SKU unavailable', { productId: item.productId, skuId })
        unitPrice = roundToTwo(typeof matchedSku.priceYuan === 'number' ? matchedSku.priceYuan : product.price.priceYuan)
        title = buildOrderItemTitle(product.title, matchedSku)
        skuId = matchedSku.skuId.trim()
      }
      subtotal += unitPrice * item.quantity
      orderItems.push({
        productId: item.productId,
        skuId,
        title,
        qty: item.quantity,
        priceYuan: unitPrice,
      })
    }

    const notesValue = parsedInput.data.notes?.trim() || undefined
    const addressValue = parsedInput.data.address
      ? {
          contact: parsedInput.data.address.contact?.trim() || undefined,
          phone: parsedInput.data.address.phone?.trim() || undefined,
          detail: parsedInput.data.address.detail?.trim() || undefined,
        }
      : undefined

    await ensureUserByOpenid(OPENID, UNIONID)
    const now = nowMs()

    if (stockUpdates && stockUpdates.size > 0) {
      try {
        await applyProductStockUpdates(stockUpdates, now)
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return fail('Failed to update stock', { message })
      }
    }

    const subtotalYuan = roundToTwo(subtotal)
    const payment = createPendingPayment(subtotalYuan)
    const orderData = zOrder.parse({
      userId: OPENID,
      items: orderItems,
      subtotalYuan,
      shippingYuan: 0,
      discountYuan: 0,
      totalYuan: subtotalYuan,
      status: 'pending',
      payment,
      address: addressValue,
      notes: notesValue,
      createdAt: now,
      updatedAt: now,
    })

    let addRes: { _id: string }
    try {
      addRes = await ordersCol().add({ data: orderData })
    } catch (error) {
      if (stockUpdates && stockUpdates.size > 0) {
        try {
          const revertUpdates = buildRevertStockUpdates(stockUpdates)
          await applyProductStockUpdates(revertUpdates, nowMs())
        } catch (revertError) {
          console.error('[shop] failed to revert stock after order creation error', revertError)
        }
      }
      throw error
    }

    const order: OrderWithId = { ...orderData, id: addRes._id }
    return ok({ order })
  },

  /**
   * v1.store.order.payment.prepare
   * Input: { orderId }
   * Output: { orderId, paymentPackage, payment }
   */
  'v1.store.order.payment.prepare': async (event: any) => {
    const { OPENID } = getWX() as any
    if (!OPENID) return fail('Missing OPENID in WX context')
    if (!cloudPay || typeof cloudPay.unifiedOrder !== 'function') {
      return fail('Payment service unavailable')
    }
    const parsed = zOrderIdPayload.safeParse(event)
    if (!parsed.success) return fail('Invalid order payload', { issues: parsed.error.issues })

    let order: OrderWithId
    try {
      order = await requireOrderById(parsed.data.orderId.trim())
    } catch (error) {
      if ((error as Error).message === 'Order not found') return fail('Order not found')
      throw error
    }

    try {
      ensureOrderOwner(order, OPENID)
    } catch {
      return fail('Order not found')
    }

    if (order.status !== 'pending') {
      return fail('Order already processed', { status: order.status })
    }
    if (!order.payment) {
      return fail('Order missing payment information')
    }

    // unifiedOrder hands back a prepay package used by the mini program to
    // open the WeChat Pay sheet. We persist identifiers immediately so the
    // later confirmation call can correlate the payment provider response to
    // the same order without re-querying stateful services.
    const now = nowMs()
    const paymentConfig = getPaymentConfig()
    const totalFee = yuanToCents(order.payment.amountYuan)
    const outTradeNo = order.payment.outTradeNo || buildOutTradeNo(order.id, now)

    let unifiedResult: any
    try {
      unifiedResult = await cloudPay.unifiedOrder({
        envId: paymentConfig.envId,
        functionName: paymentConfig.functionName,
        subMchId: paymentConfig.subMchId,
        body: paymentConfig.description,
        outTradeNo,
        totalFee,
        tradeType: 'JSAPI',
        openId: OPENID,
        spbillCreateIp: paymentConfig.spbillCreateIp,
      })
    } catch (error: any) {
      return fail('Failed to prepare payment', { message: error?.message || String(error) })
    }

    const prepayId = pickString(unifiedResult, ['prepayId', 'prepay_id'])
    const paymentPackage = sanitizePaymentPackage(
      unifiedResult?.payment || unifiedResult?.paymentData || unifiedResult?.paymentParams || unifiedResult,
    )
    const updatedPayment = buildPaymentUpdate(order.payment, {
      status: 'ready',
      outTradeNo,
      prepayId: prepayId || order.payment.prepayId,
      preparedAt: now,
      paymentPackage,
      lastError: undefined,
    })

    await ordersCol()
      .where({ _id: order.id })
      .update({
        data: {
          payment: updatedPayment,
          updatedAt: now,
        },
      })

    return ok({
      orderId: order.id,
      payment: {
        status: updatedPayment.status,
        amountYuan: updatedPayment.amountYuan,
        currency: updatedPayment.currency,
        prepayId: updatedPayment.prepayId,
        outTradeNo: updatedPayment.outTradeNo,
        preparedAt: updatedPayment.preparedAt,
      },
      paymentPackage: paymentPackage || undefined,
    })
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
      completed: 0,
      afterSale: 0,
    }

    const statusToKey: Array<{ status: string; key: keyof typeof counts }> = [
      { status: 'pending', key: 'toPay' },
      { status: 'paid', key: 'toShip' },
      { status: 'shipped', key: 'toReceive' },
      { status: 'completed', key: 'completed' },
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
    // Orders tab in the mini program lets customers audit their purchase
    // history. Filtering happens client-side, so we allow an optional status to
    // reduce payload size for long-time customers with many orders.
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

  // Admin APIs back the React dashboard used by merchandising and support.
  // They intentionally reuse the same Zod models so the back office always
  // operates on validated data before hitting CloudBase.

  /**
   * v1.admin.products.list
   * Input: none
   * Output: { products }
  */
  'v1.admin.products.list': async () => {
    const admin = await requireAdminAccess()
    if (!admin) return fail('Not authenticated')
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
    const admin = await requireAdminAccess()
    if (!admin) return fail('Not authenticated')
    const input = zProductInput.safeParse(event?.product)
    if (!input.success) return fail('Invalid product payload', { issues: input.error.issues })
    // Creating a product from the dashboard seeds it with the current timestamp
    // so the storefront can surface it immediately among "new arrivals".
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
    const admin = await requireAdminAccess()
    if (!admin) return fail('Not authenticated')
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
    // Rebuilding via `buildProductFromInput` preserves SKU normalisation and
    // enforces monotonic `updatedAt` so inventory watchers see the change.
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
    const admin = await requireAdminAccess()
    if (!admin) return fail('Not authenticated')
    const productId = typeof event?.productId === 'string' ? event.productId.trim() : ''
    if (!productId) return fail('Missing productId')

    const existingSnap = await productsCol().where({ _id: productId }).limit(1).get()
    const existingDoc = existingSnap.data?.[0]
    if (!existingDoc) return fail('Product not found')

    // We hard-delete products for now. Historical orders keep their own copies
    // of title/price so customer receipts remain untouched.
    await productsCol().where({ _id: productId }).remove()
    return ok({ productId })
  },

  /**
   * v1.admin.orders.list
   * Input: none
   * Output: { orders }
  */
  'v1.admin.orders.list': async () => {
    const admin = await requireAdminAccess()
    if (!admin) return fail('Not authenticated')
    // Support staff triage newest orders first, so we default to reverse
    // chronological ordering and limit the payload to keep the UI responsive.
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
   * v1.admin.orders.updateStatus
   * Input: { orderId, status, note? }
   * Output: { order }
  */
  'v1.admin.orders.updateStatus': async (event: any) => {
    const admin = await requireAdminAccess()
    if (!admin) return fail('Not authenticated')
    const parsed = zAdminOrderUpdateInput.safeParse(event)
    if (!parsed.success) return fail('Invalid payload', { issues: parsed.error.issues })
    const { orderId, status } = parsed.data

    let order: OrderWithId
    try {
      order = await requireOrderById(orderId.trim())
    } catch (error) {
      if ((error as Error).message === 'Order not found') return fail('Order not found')
      throw error
    }

    // Operations can only move orders along predefined rails. This guards
    // against accidental regressions (e.g. jumping from shipped back to
    // pending) which would confuse customer notifications.
    if (!canTransitionOrderStatus(order.status, status)) {
      return fail('Invalid status transition', { current: order.status, next: status })
    }

    const now = nowMs()
    const update: Record<string, any> = {
      status,
      updatedAt: now,
    }

    if (order.payment) {
      if (status === 'refunded') {
        update.payment = buildPaymentUpdate(order.payment, {
          status: 'refunded',
          lastError: undefined,
        })
      } else if (status === 'paid' && order.payment.status !== 'succeeded') {
        // Manual overrides let support mark an order as paid after verifying
        // WeChat settlement out-of-band.
        update.payment = buildPaymentUpdate(order.payment, {
          status: 'succeeded',
          paidAt: now,
          lastError: undefined,
        })
      } else if (status === 'canceled' && order.payment.status !== 'refunded') {
        update.payment = buildPaymentUpdate(order.payment, {
          status: 'failed',
          lastError: order.payment.lastError,
        })
      }
    }

    await ordersCol().where({ _id: order.id }).update({ data: update })

    return ok({
      order: {
        ...order,
        ...update,
      },
    })
  },

  /**
   * v1.admin.users.list
   * Input: none
   * Output: { users }
  */
  'v1.admin.users.list': async () => {
    const admin = await requireAdminAccess()
    if (!admin) return fail('Not authenticated')
    // Used by support to troubleshoot customer issues. We surface the most
    // recent signups so they can quickly confirm onboarding success.
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
    const admin = await requireAdminAccess()
    if (!admin) return fail('Not authenticated')
    // Marketing dashboard expects a denormalised payload to populate tabs for
    // categories, coupons, and banners without extra round trips.
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
   * v1.admin.banners.save
   * Input: { id?, imageUrl, title?, linkUrl?, sort?, isActive?, startAt?, endAt? }
   * Output: { banner }
  */
  'v1.admin.banners.save': async (event: any) => {
    const admin = await requireAdminAccess()
    if (!admin) return fail('Not authenticated')
    const parsed = zAdminBannerSaveInput.safeParse(event)
    if (!parsed.success) return fail('Invalid banner payload', { issues: parsed.error.issues })

    const input = parsed.data
    const linkUrl = input.linkUrl
    if (linkUrl && !isValidLinkTarget(linkUrl)) {
      return fail('Invalid banner link', { linkUrl })
    }
    if (input.startAt && input.endAt && input.endAt < input.startAt) {
      return fail('Invalid schedule range', { startAt: input.startAt, endAt: input.endAt })
    }

    const now = nowMs()

    if (input.id) {
      const snapshot = await systemCol().where({ _id: input.id }).limit(1).get()
      const doc = snapshot.data?.[0]
      if (!doc) return fail('Banner not found')
      const parsedDoc = parseSystemDocument(doc)
      if (!parsedDoc.success || parsedDoc.data.kind !== 'banner') return fail('Banner not found')
      const existing = parsedDoc.data

      // Update path preserves original creation metadata so analytics can track
      // how long a campaign has been live while still nudging `updatedAt`.
      const banner = zSystemBanner.parse({
        kind: 'banner',
        imageUrl: input.imageUrl,
        title: input.title ?? existing.title,
        linkUrl: linkUrl ?? existing.linkUrl,
        sort: typeof input.sort === 'number' ? input.sort : existing.sort,
        isActive: typeof input.isActive === 'boolean' ? input.isActive : existing.isActive,
        startAt: input.startAt ?? existing.startAt,
        endAt: input.endAt ?? existing.endAt,
        createdAt: existing.createdAt,
        updatedAt: Math.max(now, existing.updatedAt + 1),
      })

      await systemCol().where({ _id: input.id }).update({ data: banner })
      return ok({ banner: { ...banner, id: input.id } })
    }

    // Insert path creates a fresh campaign ready to schedule. We default to
    // active so the operator can see it immediately in the admin preview.
    const banner = zSystemBanner.parse({
      kind: 'banner',
      imageUrl: input.imageUrl,
      title: input.title,
      linkUrl,
      sort: typeof input.sort === 'number' ? input.sort : 0,
      isActive: typeof input.isActive === 'boolean' ? input.isActive : true,
      startAt: input.startAt,
      endAt: input.endAt,
      createdAt: now,
      updatedAt: now,
    })

    const addRes = await systemCol().add({ data: banner })
    return ok({ banner: { ...banner, id: addRes._id } })
  },

  /**
   * v1.admin.banners.delete
   * Input: { id }
   * Output: { bannerId }
  */
  'v1.admin.banners.delete': async (event: any) => {
    const admin = await requireAdminAccess()
    if (!admin) return fail('Not authenticated')
    const parsed = zAdminBannerDeleteInput.safeParse(event)
    if (!parsed.success) return fail('Invalid banner payload', { issues: parsed.error.issues })

    const bannerId = parsed.data.id
    const snapshot = await systemCol().where({ _id: bannerId }).limit(1).get()
    const doc = snapshot.data?.[0]
    if (!doc) return fail('Banner not found')
    const parsedDoc = parseSystemDocument(doc)
    if (!parsedDoc.success || parsedDoc.data.kind !== 'banner') return fail('Banner not found')

    // Removing clears the slot immediately; landing page fetch ignores missing
    // banners, so the change reflects in the next customer refresh.
    await systemCol().where({ _id: bannerId }).remove()
    return ok({ bannerId })
  },

  /**
   * v1.admin.categories.save
   * Input: { id?, name, slug, parentId?, sort?, isActive?, imageUrl?, description? }
   * Output: { category }
  */
  'v1.admin.categories.save': async (event: any) => {
    const admin = await requireAdminAccess()
    if (!admin) return fail('Not authenticated')
    const parsed = zAdminCategorySaveInput.safeParse(event)
    if (!parsed.success) return fail('Invalid category payload', { issues: parsed.error.issues })

    const input = parsed.data
    const name = input.name.trim()
    const slug = input.slug.trim()
    const parentId = optionalTrimmed(input.parentId)
    const imageUrl = optionalTrimmed(input.imageUrl)
    const description = optionalTrimmed(input.description)

    // Slugs map directly to the `category` field on product documents, so we
    // validate links before writing to avoid orphaning merchandise.
    if (imageUrl && !isValidUrl(imageUrl)) {
      return fail('Invalid category image URL', { imageUrl })
    }
    if (input.id && parentId && parentId === input.id) {
      return fail('Category cannot be its own parent')
    }

    if (parentId) {
      const parentSnap = await systemCol().where({ _id: parentId }).limit(1).get()
      const parentDoc = parentSnap.data?.[0]
      if (!parentDoc) return fail('Parent category not found', { parentId })
      const parentParsed = parseSystemDocument(parentDoc)
      if (!parentParsed.success || parentParsed.data.kind !== 'category') {
        return fail('Parent category not found', { parentId })
      }
    }

    const now = nowMs()

    if (input.id) {
      const snapshot = await systemCol().where({ _id: input.id }).limit(1).get()
      const doc = snapshot.data?.[0]
      if (!doc) return fail('Category not found')
      const parsedDoc = parseSystemDocument(doc)
      if (!parsedDoc.success || parsedDoc.data.kind !== 'category') return fail('Category not found')
      const existing = parsedDoc.data

      // We keep createdAt stable so analytics can determine category lifetime,
      // but bump updatedAt to help cache invalidation in the admin app.
      const category = zSystemCategory.parse({
        kind: 'category',
        name,
        slug,
        parentId: parentId ?? undefined,
        sort: typeof input.sort === 'number' ? input.sort : existing.sort,
        isActive: typeof input.isActive === 'boolean' ? input.isActive : existing.isActive,
        imageUrl: imageUrl ?? existing.imageUrl,
        description: description ?? existing.description,
        createdAt: existing.createdAt,
        updatedAt: Math.max(now, existing.updatedAt + 1),
      })

      await systemCol().where({ _id: input.id }).update({ data: category })
      return ok({ category: { ...category, id: input.id } })
    }

    // New categories default to active so merchandisers can attach products
    // immediately. Draft behaviour can be layered on in the admin app.
    const category = zSystemCategory.parse({
      kind: 'category',
      name,
      slug,
      parentId: parentId ?? undefined,
      sort: typeof input.sort === 'number' ? input.sort : 0,
      isActive: typeof input.isActive === 'boolean' ? input.isActive : true,
      imageUrl,
      description,
      createdAt: now,
      updatedAt: now,
    })

    const addRes = await systemCol().add({ data: category })
    return ok({ category: { ...category, id: addRes._id } })
  },

  /**
   * v1.admin.categories.delete
   * Input: { id }
   * Output: { categoryId }
  */
  'v1.admin.categories.delete': async (event: any) => {
    const admin = await requireAdminAccess()
    if (!admin) return fail('Not authenticated')
    const parsed = zAdminCategoryDeleteInput.safeParse(event)
    if (!parsed.success) return fail('Invalid category payload', { issues: parsed.error.issues })

    const categoryId = parsed.data.id
    const snapshot = await systemCol().where({ _id: categoryId }).limit(1).get()
    const doc = snapshot.data?.[0]
    if (!doc) return fail('Category not found')
    const parsedDoc = parseSystemDocument(doc)
    if (!parsedDoc.success || parsedDoc.data.kind !== 'category') return fail('Category not found')
    const existing = parsedDoc.data

    const childSnapshot = await systemCol().where({ parentId: categoryId }).limit(1).get()
    if (childSnapshot.data && childSnapshot.data.length > 0) {
      return fail('Category has child categories')
    }

    const productSnapshot = await productsCol().where({ category: existing.slug }).limit(1).get()
    if (productSnapshot.data && productSnapshot.data.length > 0) {
      return fail('Category has products')
    }

    // Once a category is detached from products and sub-categories we can
    // safely remove it. Storefront listings fall back to uncategorised items.
    await systemCol().where({ _id: categoryId }).remove()
    return ok({ categoryId })
  },

  /**
   * v1.admin.dashboard.summary
   * Input: none
   * Output: { summary, recentOrders }
  */
  'v1.admin.dashboard.summary': async () => {
    const admin = await requireAdminAccess()
    if (!admin) return fail('Not authenticated')

    let ordersForStats: OrderWithId[] = []
    try {
      // Dashboard data should highlight recent performance. We cap the window
      // to ~1000 orders to keep latency predictable while still providing
      // actionable revenue trends for operators.
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

export const __test__ = {
  collectStockUpdates,
  applyProductStockUpdates,
  createProductStockUpdate,
}
