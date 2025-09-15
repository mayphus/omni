/** Minimal WeApp App */
import { VITE_TCB_ENV_ID } from './config/cloud'

App({
  onLaunch() {
    if (!wx.cloud) {
      console.error('Please use base library 2.2.3 or above.')
      return
    }
    wx.cloud.init({ env: VITE_TCB_ENV_ID, traceUser: true })
  },
})
