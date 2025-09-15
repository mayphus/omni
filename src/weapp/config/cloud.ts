/**
 * CloudBase environment configuration for Mini Program
 *
 * Preferred: set VITE_TCB_ENV_ID in your .env.local (public at build time).
 * Fallback: you may map by runtime envVersion (develop/trial/release).
 *
 * Note: VITE_* variables are public — do not place secrets here.
 */

type MiniEnv = 'develop' | 'trial' | 'release'

// Runtime environment from WeChat
export const RUNTIME_ENV: MiniEnv = (wx.getAccountInfoSync?.().miniProgram?.envVersion as MiniEnv) || 'develop'

// Build-time env injection (via weapp-vite / Vite)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const RAW_VITE_TCB_ENV_ID = (import.meta as any)?.env?.VITE_TCB_ENV_ID as string | undefined

// Optional mapping if you use different env IDs per channel
export const CLOUD_ENV_MAP: Record<MiniEnv, string | undefined> = {
  develop: RAW_VITE_TCB_ENV_ID,
  trial: RAW_VITE_TCB_ENV_ID,
  release: RAW_VITE_TCB_ENV_ID,
}

// Final CloudBase env id used by wx.cloud.init
export const VITE_TCB_ENV_ID: string | undefined = CLOUD_ENV_MAP[RUNTIME_ENV] || RAW_VITE_TCB_ENV_ID
