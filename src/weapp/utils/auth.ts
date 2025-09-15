/**
 * Auth utilities — thin client for Cloud Functions
 * v1.* namespace: login + profile update
 */

export type CloudCall<T> = Promise<{ result?: T; errMsg: string }>

type LoginResult = {
  success: boolean
  user?: any
  isNew?: boolean
  error?: string
}

/**
 * login — calls v1.auth.login and caches the resulting user in storage and app globalData
 */
export async function login(): Promise<LoginResult> {
  const res = await wx.cloud.callFunction({
    name: 'shop',
    data: { action: 'v1.auth.login' },
  }) as any
  const { result } = res
  if (result?.success && result.user) {
    try {
      wx.setStorageSync('user', result.user)
      const app = getApp<{ globalData: Record<string, any> }>()
      app.globalData ||= {}
      app.globalData.user = result.user
    } catch {}
  }
  return result
}

/**
 * updateProfile — calls v1.auth.profile.update with { nickname, avatarUrl }
 */
export async function updateProfile(profile: { nickname: string; avatarUrl?: string }): Promise<LoginResult> {
  const res = await wx.cloud.callFunction({
    name: 'shop',
    data: { action: 'v1.auth.profile.update', profile },
  }) as any
  const { result } = res
  if (result?.success && result.user) {
    try {
      wx.setStorageSync('user', result.user)
      const app = getApp<{ globalData: Record<string, any> }>()
      app.globalData ||= {}
      app.globalData.user = result.user
    } catch {}
  }
  return result
}
