import { beforeEach, describe, expect, it } from 'vitest'
import { importShop, testCloud } from './helpers/cloud'

const { main } = await importShop()

beforeEach(() => {
  testCloud.reset()
})

describe('functions: ping', () => {
  it('returns pong', async () => {
    const res = await main({ action: 'v1.system.ping' })
    expect(res).toHaveProperty('success', true)
    expect(res).toHaveProperty('message', 'pong')
    expect(res).toHaveProperty('action', 'v1.system.ping')
  })
})
