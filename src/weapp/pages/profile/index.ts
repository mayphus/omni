import { login } from '../../utils/auth'
import { fetchStoreProfileOverview } from '../../utils/api'
import { getAvailableLocales, setLocale, withI18nPage } from '../../utils/i18n'

type StoredUser = {
  nickname?: string
  avatarUrl?: string
  isVIP?: boolean
  profile?: { nickname?: string; avatarUrl?: string }
}

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
      if (user) {
        this.loadProfileOverview()
      } else {
        this.resetOrderCounts()
      }
    } catch {
      this.updateUserState(null)
      this.resetOrderCounts()
    }
  },

  updateUserState(user: StoredUser | null) {
    const profile = (user as any)?.profile || {}
    this.setData({
      user,
      isLoggedIn: !!user,
      nickname: user?.nickname || profile.nickname || '',
      avatarUrl: user?.avatarUrl || profile.avatarUrl || '',
      isVIP: !!user?.isVIP,
    })
  },

  resetOrderCounts() {
    this.setData({
      orderCounts: {
        toPay: 0,
        toShip: 0,
        toReceive: 0,
        afterSale: 0,
      },
      loading: false,
    })
  },

  async loadProfileOverview() {
    const { isLoggedIn } = this.data as any
    if (!isLoggedIn) {
      this.resetOrderCounts()
      return
    }
    this.setData({ loading: true })
    try {
      const { orderCounts } = await fetchStoreProfileOverview()
      if (orderCounts) {
        this.setData({ orderCounts })
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load'
      wx.showToast({ title: message, icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  /**
   * onSignIn — perform cloud login and refresh local user
   */
  async onSignIn() {
    const toast = ((this.data as any).i18n?.toast) || {}
    const res = await login()
    if (res?.success && res.user) {
      this.updateUserState(res.user)
      this.loadProfileOverview()
      wx.showToast({ title: res.isNew ? toast.welcome || 'Welcome!' : toast.signedIn || 'Signed in', icon: 'success' })
    } else {
      wx.showToast({ title: res?.error || toast.loginFailed || 'Login failed', icon: 'none' })
    }
  },

  /**
   * onProfileAction — login if needed; otherwise open profile editor
   */
  onProfileAction() {
    const { isLoggedIn } = this.data as any
    if (!isLoggedIn) {
      void this.onSignIn()
      return
    }
    wx.navigateTo({ url: '/pages/profile/edit/index' })
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
