/** Minimal WeApp App */
import { VITE_TCB_ENV_ID } from './config/cloud'
import { patchSystemInfo } from './utils/system-info'
import { initI18n } from './utils/i18n'
import { login, updateProfile } from './utils/auth'
import { bootstrapAutomatorBridge } from './utils/automator-bridge'

// Normalize system info before any pages mount so layout calculations (safe
// areas, notch detection) stay consistent.
patchSystemInfo()

async function bootstrapAuth() {
  try {
    const res = await login()
    if (!res?.success || !res.user) return

    const profile = (res.user as any)?.profile
    if (!profile || typeof profile.nickname !== 'string' || !profile.nickname.trim()) return

    await updateProfile({
      nickname: profile.nickname,
      avatarUrl: typeof profile.avatarUrl === 'string' ? profile.avatarUrl : undefined,
    })
  } catch (error) {
    console.warn('Silent auth failed', error)
  }
}

App({
  onLaunch() {
    // Automator bridge keeps end-to-end tests stable; we stash the reapply
    // callback on the app instance so later lifecycle hooks can trigger it.
    const reapplyAutomatorBridge = bootstrapAutomatorBridge()
    ;(this as any).reapplyAutomatorBridge = reapplyAutomatorBridge
    const locale = initI18n()
    ;(this as any).globalData ||= {}
    ;(this as any).globalData.locale = locale
    if (!wx.cloud) {
      console.error('Please use base library 2.2.3 or above.')
      return
    }
    reapplyAutomatorBridge?.()
    // Mini program and cloud function share the same env id for data reads.
    wx.cloud.init({ env: VITE_TCB_ENV_ID, traceUser: true })
    void bootstrapAuth()
  },

  onShow() {
    const reapplyAutomatorBridge = (this as any).reapplyAutomatorBridge as (() => boolean) | undefined
    reapplyAutomatorBridge?.()
  },
})
