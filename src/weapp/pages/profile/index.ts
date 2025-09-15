import { login, updateProfile } from '../../utils/auth'

Page({
  data: {
    user: null as any,
  },

  onShow() {
    const tabBar = (this as any).getTabBar?.()
    // @ts-ignore: WeChat runtime API
    tabBar?.setActiveByRoute?.('/pages/profile/index')

    try {
      const user = wx.getStorageSync('user')
      if (user) this.setData({ user })
    } catch {}
  },

  /**
   * onSignIn — perform cloud login and refresh local user
   */
  async onSignIn() {
    const res = await login()
    if (res?.success && res.user) {
      this.setData({ user: res.user })
      wx.showToast({ title: res.isNew ? 'Welcome!' : 'Signed in', icon: 'success' })
    } else {
      wx.showToast({ title: res?.error || 'Login failed', icon: 'none' })
    }
  },

  /**
   * onUpdateProfile — prompt user profile and sync to cloud
   */
  async onUpdateProfile() {
    try {
      // @ts-ignore: WeChat API
      const up = await wx.getUserProfile({ desc: 'Update your profile for better experience' })
      const nickname = up.userInfo?.nickName || 'WeChat User'
      const avatarUrl = up.userInfo?.avatarUrl || ''
      const res = await updateProfile({ nickname, avatarUrl })
      if (res?.success && res.user) {
        this.setData({ user: res.user })
        wx.showToast({ title: 'Updated', icon: 'success' })
      } else {
        wx.showToast({ title: res?.error || 'Update failed', icon: 'none' })
      }
    } catch (e) {
      wx.showToast({ title: 'Canceled', icon: 'none' })
    }
  },
})
