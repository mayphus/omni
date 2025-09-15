import { login, updateProfile } from '../../utils/auth'
import { getAvailableLocales, setLocale, withI18nPage } from '../../utils/i18n'

type StoredUser = { nickname?: string; avatarUrl?: string; isVIP?: boolean }

Page(withI18nPage({
  data: {
    user: null as any,
    loading: false,
    isLoggedIn: false,
    nickname: '',
    avatarUrl: '',
    isVIP: false,
    orderCounts: {
      toPay: 0,
      toShip: 0,
      toReceive: 0,
      afterSale: 0,
    },
  },

  onShow() {
    const tabBar = (this as any).getTabBar?.()
    // @ts-ignore: WeChat runtime API
    tabBar?.setActiveByRoute?.('/pages/profile/index')

    try {
      const user = wx.getStorageSync('user') as StoredUser | undefined
      this.updateUserState(user || null)
    } catch {
      this.updateUserState(null)
    }
  },

  updateUserState(user: StoredUser | null) {
    this.setData({
      user,
      isLoggedIn: !!user,
      nickname: user?.nickname || '',
      avatarUrl: user?.avatarUrl || '',
      isVIP: !!user?.isVIP,
    })
  },

  /**
   * onSignIn — perform cloud login and refresh local user
   */
  async onSignIn() {
    const toast = ((this.data as any).i18n?.toast) || {}
    const res = await login()
    if (res?.success && res.user) {
      this.updateUserState(res.user)
      wx.showToast({ title: res.isNew ? toast.welcome || 'Welcome!' : toast.signedIn || 'Signed in', icon: 'success' })
    } else {
      wx.showToast({ title: res?.error || toast.loginFailed || 'Login failed', icon: 'none' })
    }
  },

  /**
   * onUpdateProfile — prompt user profile and sync to cloud
   */
  async onUpdateProfile() {
    const toast = ((this.data as any).i18n?.toast) || {}
    try {
      // @ts-ignore: WeChat API
      const up = await wx.getUserProfile({ desc: toast.updateProfilePrompt || 'Update your profile' })
      const nickname = up.userInfo?.nickName || toast.defaultNickname || 'WeChat User'
      const avatarUrl = up.userInfo?.avatarUrl || ''
      const res = await updateProfile({ nickname, avatarUrl })
      if (res?.success && res.user) {
        this.updateUserState(res.user)
        wx.showToast({ title: toast.updated || 'Updated', icon: 'success' })
      } else {
        wx.showToast({ title: res?.error || toast.updateFailed || 'Update failed', icon: 'none' })
      }
    } catch (e) {
      const err = e as WechatMiniprogram.GeneralCallbackResult | undefined
      const message = err?.errMsg || ''
      if (!message || message.includes('fail cancel')) {
        wx.showToast({ title: toast.canceled || 'Canceled', icon: 'none' })
      } else {
        wx.showToast({ title: toast.updateFailed || 'Update failed', icon: 'none' })
      }
    }
  },

  onEditProfile() {
    this.onUpdateProfile()
  },

  onOpenSettings() {
    const i18n = (this.data as any).i18n || {}
    const options = i18n.languageOptions || []
    if (!options.length) return
    wx.showActionSheet({
      itemList: options.map((opt: any) => opt.label),
      alertText: i18n.profile?.languageAction?.description || '',
      success: (res) => {
        const option = options[res.tapIndex]
        if (!option || option.value === i18n.locale) return
        setLocale(option.value)
        try {
          const app = getApp<{ globalData: Record<string, any> }>()
          app.globalData ||= {}
          app.globalData.locale = option.value
        } catch {}
        wx.showToast({ title: i18n.profile?.languageAction?.success || 'Updated', icon: 'success' })
      },
    })
  },
}, ({ messages, locale }) => ({
  profile: messages.profile,
  toast: messages.toast,
  languageOptions: getAvailableLocales().map((value) => ({
    value,
    label: messages.languages[value] || value,
  })),
  locale,
  currentLanguageLabel: messages.languages[locale] || locale,
})))
