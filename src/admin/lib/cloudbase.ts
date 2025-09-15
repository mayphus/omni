import cloudbase from '@cloudbase/js-sdk'

const ENV_ID = (import.meta as any).env?.VITE_TCB_ENV_ID as string | undefined

// Lazily initialize CloudBase to avoid issues in non-browser contexts
let app: ReturnType<typeof cloudbase.init> | null = null

export function getCloudBaseApp() {
  if (!app) {
    // Allow missing env at compile-time; UI will warn if missing
    app = cloudbase.init({ env: (ENV_ID || '') as any })
  }
  return app
}

export function getAuth() {
  return getCloudBaseApp().auth({ persistence: 'local' })
}

export async function ensureLoginState() {
  const auth = getAuth()
  const state = await auth.getLoginState()
  return !!state
}

export async function signInWithUsernamePassword(username: string, password: string) {
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
