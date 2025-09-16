import { beforeEach, describe, expect, it } from 'vitest'
import { Collections } from '@shared/collections'
import { importShop, testCloud } from './helpers/cloud'

const { main } = await importShop()

beforeEach(() => {
  testCloud.reset()
})

describe('functions: auth', () => {
  it('logs in and creates a user document when missing', async () => {
    testCloud.setContext({ OPENID: 'login-openid', TCB_UUID: 'login-admin' })
    const res = await main({ action: 'v1.auth.login' })
    expect(res.success).toBe(true)
    expect(res.user).toBeDefined()
    expect(res.user.openid).toBe('login-openid')

    const users = testCloud.getData(Collections.Users)
    expect(users).toHaveLength(1)
    expect(users[0]._id).toBeDefined()
    expect(users[0].profile.nickname).toBeTruthy()
  })

  it('updates profile even if the user has not logged in before', async () => {
    testCloud.setContext({ OPENID: 'profile-openid', UNIONID: 'profile-union', TCB_UUID: 'profile-admin' })
    const res = await main({
      action: 'v1.auth.profile.update',
      profile: { nickname: 'Tester', avatarUrl: 'https://example.com/avatar.png' },
    })

    expect(res.success).toBe(true)
    expect(res.user).toBeDefined()
    expect(res.user.openid).toBe('profile-openid')
    expect(res.user.profile.nickname).toBe('Tester')

    const users = testCloud.getData(Collections.Users)
    expect(users).toHaveLength(1)
    expect(users[0].openid).toBe('profile-openid')
    expect(users[0].profile.nickname).toBe('Tester')
  })
})

