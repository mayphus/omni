/** Minimal WeApp App */

App({
  onLaunch() {
    if (!wx.cloud) {
      console.error('Please use base library 2.2.3 or above.')
      return
    }
    wx.cloud.init({ traceUser: true })
  },
})

