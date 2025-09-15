import cloudbase from '@cloudbase/js-sdk'

const ENV_ID = (import.meta as any).env?.VITE_TCB_ENV_ID as string | undefined

type CloudbaseApp = ReturnType<typeof cloudbase.init>
type CloudbaseAuth = ReturnType<CloudbaseApp['auth']>
type LoginState = Awaited<ReturnType<CloudbaseAuth['getLoginState']>>
type SignInResult = Awaited<ReturnType<CloudbaseAuth['signIn']>>
type NonNullableLoginState = NonNullable<LoginState>
export type CloudbaseUser = NonNullableLoginState['user']

function isAnonymousLogin(user: CloudbaseUser | null | undefined) {
  const loginType = (user?.loginType || '').toString().toUpperCase()
  return loginType === 'ANONYMOUS'
}

export function isValidAdminLogin(user: CloudbaseUser | null | undefined): user is CloudbaseUser {
  if (!user || !user.uid) return false
  if (isAnonymousLogin(user)) return false
  return true
}

export function getUserDisplayName(user: CloudbaseUser) {
  return user.username || user.email || user.customUserId || user.uid || 'Account'
}

// Lazily initialize CloudBase to avoid issues in non-browser contexts
let app: ReturnType<typeof cloudbase.init> | null = null
let authInstance: ReturnType<ReturnType<typeof cloudbase.init>['auth']> | null = null

export function getCloudBaseApp() {
  if (!app) {
    // Allow missing env at compile-time; UI will warn if missing
    app = cloudbase.init({ env: (ENV_ID || '') as any })
  }
  return app
}

export function getAuth() {
  if (!authInstance) {
    authInstance = getCloudBaseApp().auth({ persistence: 'local' })
  }
  return authInstance
}

export async function ensureLoginState(): Promise<CloudbaseUser | null> {
  const auth = getAuth()
  const state = await auth.getLoginState()
  const user = state?.user
  return isValidAdminLogin(user) ? user : null
}

export async function signInWithUsernamePassword(
  username: string,
  password: string,
): Promise<SignInResult> {
  const auth = getAuth()
  // CloudBase v3 auth: use unified signIn with username/password
  return auth.signIn({ username, password })
}

export async function signOut() {
  const auth = getAuth()
  await auth.signOut()
}

export function getEnvId() {
  return ENV_ID
}

type ShopPayload = Record<string, unknown>

export type ShopSuccess<T extends Record<string, unknown>> = {
  success: true
  action: string
  executionTime: number
  timestamp: string
} & T

export async function callShopFunction<T extends Record<string, unknown>>(
  action: string,
  payload: ShopPayload = {},
): Promise<ShopSuccess<T>> {
  const app = getCloudBaseApp()
  const { result } = await app.callFunction({ name: 'shop', data: { action, ...payload } })
  if (!result) {
    throw new Error('No response from cloud function')
  }
  if (result.success !== true) {
    const message = (result as any)?.error || (result as any)?.code || 'Cloud function request failed'
    throw new Error(typeof message === 'string' ? message : 'Cloud function request failed')
  }
  return result as ShopSuccess<T>
}
