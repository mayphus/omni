/** Minimal WeApp App */
import { VITE_TCB_ENV_ID } from './config/cloud'
import { patchSystemInfo } from './utils/system-info'
import { initI18n } from './utils/i18n'
import { login, updateProfile } from './utils/auth'

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
    const locale = initI18n()
    ;(this as any).globalData ||= {}
    ;(this as any).globalData.locale = locale
    if (!wx.cloud) {
      console.error('Please use base library 2.2.3 or above.')
      return
    }
    wx.cloud.init({ env: VITE_TCB_ENV_ID, traceUser: true })
    void bootstrapAuth()
  },
})
