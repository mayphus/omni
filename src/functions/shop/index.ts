/**
 * Cloud Function Router — shop
 *
 * Philosophy: keep handlers small, explicit, and well‑documented.
 * Each handler maps an input event to an output result. Side effects
 * (database calls, cloud context) are isolated and called out.
 */

type ApiResponse = { success: true; [k: string]: any } | { success: false; error?: string; [k: string]: any }
const ok = (data: any = {}): ApiResponse => ({ success: true, timestamp: new Date().toISOString(), ...data })
const fail = (error: string, data: any = {}): ApiResponse => ({ success: false, timestamp: new Date().toISOString(), error, ...data })

// Shared schemas and helpers
import type { User, UserProfile } from '@shared/models/user'
import { zUser, zUserProfile } from '@shared/models/user'
import type { Product } from '@shared/models/product'
import { zProduct, zProductInput } from '@shared/models/product'
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
async function updateUserProfile(openid: string, profile: UserProfile): Promise<User & { id: string }>
{
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
    const { OPENID } = getWX() as any
    if (!OPENID) return fail('Missing OPENID in WX context')
    const input = zUserProfile.safeParse(event?.profile)
    if (!input.success) return fail('Invalid profile payload', { issues: input.error.issues })
    const user = await updateUserProfile(OPENID, input.data)
    return ok({ user })
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
    const sanitizedSkus = input.data.skus
      ?.map((sku) => ({
        ...sku,
        skuId: sku.skuId.trim(),
        isActive: sku.isActive ?? true,
      }))
      .filter((sku) => !!sku.skuId)
    const base: Product = {
      ...input.data,
      skus: sanitizedSkus && sanitizedSkus.length ? sanitizedSkus : undefined,
      createdAt: now,
      updatedAt: now,
    }
    const next = zProduct.parse(base)
    const res = await productsCol().add({ data: next })
    return ok({ product: { ...next, id: res._id } })
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
