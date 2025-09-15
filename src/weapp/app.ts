/** Minimal WeApp App */
import { VITE_TCB_ENV_ID } from './config/cloud'
import { patchSystemInfo } from './utils/system-info'
import { initI18n } from './utils/i18n'

patchSystemInfo()

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
  },
})
