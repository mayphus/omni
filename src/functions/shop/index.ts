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
import { Collections } from '@shared/collections'
import { fromServer, nowMs } from '@shared/base'

// Use wx-server-sdk directly for WeChat Mini Program cloud functions
// eslint-disable-next-line @typescript-eslint/no-var-requires
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

/**
 * getWX — get WeChat context (OPENID/UNIONID)
 */
function getWX() {
  return cloud.getWXContext()
}

// Utilities — DB helpers kept tiny and explicit
const usersCol = () => db.collection(Collections.Users)

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
