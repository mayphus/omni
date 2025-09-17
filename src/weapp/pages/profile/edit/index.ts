import { login, updateProfile } from '../../../utils/auth'
import { withI18nPage } from '../../../utils/i18n'

type AnyUser = Record<string, any> | null

type PageData = {
  loading: boolean
  saving: boolean
  nickname: string
  nicknameDraft: string
  avatarUrl: string
}

type ChooseAvatarEvent = { detail?: { avatarUrl?: string } }

type NicknameEvent = { detail?: any }

function resolveEventValue(event: NicknameEvent): string {
  const detail = event?.detail
  if (typeof detail === 'string') return detail
  if (detail && typeof detail.value !== 'undefined') return detail.value
  return ''
}

function extractUserProfile(user: AnyUser | undefined) {
  if (!user) {
    return { nickname: '', avatarUrl: '' }
  }
  const profile = (user as any).profile || {}
  const nickname = (user as any).nickname || profile.nickname || ''
  const avatarUrl = (user as any).avatarUrl || profile.avatarUrl || ''
  return { nickname, avatarUrl }
}

const initialData: PageData = {
  loading: true,
  saving: false,
  nickname: '',
  nicknameDraft: '',
  avatarUrl: '',
}

const NICKNAME_TIMER_FIELD = '__nicknameUpdateTimer'

type NicknameTimerHost = {
  [NICKNAME_TIMER_FIELD]?: number
}

Page(withI18nPage({
  data: initialData,

  async onShow() {
    await this.bootstrap()
  },

  async bootstrap() {
    const toast = ((this.data as any).i18n?.toast) || {}
    this.setData({ loading: true })
    try {
      let user: AnyUser | undefined
      try {
        user = wx.getStorageSync('user')
      } catch {
        user = undefined
      }
      if (!user) {
        const res = await login()
        if (!res?.success || !res.user) {
          wx.showToast({ title: res?.error || toast.loginFailed || 'Login failed', icon: 'none' })
          this.setData({ loading: false })
          return
        }
        user = res.user
      }
      const { nickname, avatarUrl } = extractUserProfile(user)
      this.setData({ nickname, nicknameDraft: nickname, avatarUrl })
    } finally {
      this.setData({ loading: false })
    }
  },

  async applyProfileUpdate(profile: { nickname: string; avatarUrl?: string }) {
    const toast = ((this.data as any).i18n?.toast) || {}
    const payload = {
      nickname: (profile.nickname || '').trim(),
      avatarUrl: profile.avatarUrl ? profile.avatarUrl.trim() : undefined,
    }
    if (!payload.nickname) {
      wx.showToast({ title: toast.updateFailed || 'Update failed', icon: 'none' })
      return false
    }
    if (
      payload.nickname === this.data.nickname &&
      (payload.avatarUrl || '') === (this.data.avatarUrl || '')
    ) {
      return false
    }
    this.setData({ saving: true })
    try {
      const res = await updateProfile(payload)
      if (res?.success && res.user) {
        const updated = extractUserProfile(res.user)
        this.setData({ nickname: updated.nickname, nicknameDraft: updated.nickname, avatarUrl: updated.avatarUrl })
        wx.showToast({ title: toast.updated || 'Updated', icon: 'success' })
        return true
      }
      wx.showToast({ title: res?.error || toast.updateFailed || 'Update failed', icon: 'none' })
      return false
    } catch (error) {
      const message = error instanceof Error ? error.message : ''
      wx.showToast({ title: message || toast.updateFailed || 'Update failed', icon: 'none' })
      return false
    } finally {
      this.setData({ saving: false })
    }
  },

  async onChooseAvatar(event: ChooseAvatarEvent) {
    if ((this.data as any).saving) return
    const avatarUrl = event?.detail?.avatarUrl
    if (!avatarUrl) return
    const context = this.data as any
    const toast = (context.i18n?.toast) || {}
    const currentNickname = (context.nicknameDraft || context.nickname || '').trim() || toast.defaultNickname || 'WeChat User'
    await this.applyProfileUpdate({ nickname: currentNickname, avatarUrl })
  },

  onNicknameInput(event: NicknameEvent) {
    const value = resolveEventValue(event)
    this.setData({ nicknameDraft: value })
    this.scheduleNicknameUpdate(value)
  },

  async onNicknameBlur(event: NicknameEvent) {
    this.clearPendingNicknameUpdate()
    await this.handleNicknameInput(event)
  },

  async onNicknameConfirm(event: NicknameEvent) {
    this.clearPendingNicknameUpdate()
    await this.handleNicknameInput(event)
  },

  async handleNicknameInput(event: NicknameEvent) {
    if ((this.data as any).saving) return
    const toast = ((this.data as any).i18n?.toast) || {}
    const next = resolveEventValue(event).trim()
    if (!next) {
      this.setData({ nicknameDraft: this.data.nickname })
      wx.showToast({ title: toast.updateFailed || 'Update failed', icon: 'none' })
      return
    }
    await this.applyProfileUpdate({ nickname: next, avatarUrl: this.data.avatarUrl })
  },

  scheduleNicknameUpdate(value: string) {
    const host = this as unknown as NicknameTimerHost
    this.clearPendingNicknameUpdate()
    if ((this.data as any).saving) return
    const trimmed = (value || '').trim()
    if (!trimmed || trimmed === this.data.nickname) {
      return
    }
    const timer = setTimeout(() => {
      host[NICKNAME_TIMER_FIELD] = undefined
      void this.applyProfileUpdate({ nickname: trimmed, avatarUrl: this.data.avatarUrl })
    }, 400) as unknown as number
    host[NICKNAME_TIMER_FIELD] = timer
  },

  clearPendingNicknameUpdate() {
    const host = this as unknown as NicknameTimerHost
    const timer = host[NICKNAME_TIMER_FIELD]
    if (typeof timer === 'number') {
      clearTimeout(timer)
      host[NICKNAME_TIMER_FIELD] = undefined
    }
  },

  onUnload() {
    this.clearPendingNicknameUpdate()
  },
}, ({ messages }) => ({
  profileEdit: messages.profileEdit,
  toast: messages.toast,
})))
