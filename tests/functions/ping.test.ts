import { describe, it, expect } from 'vitest'
import { main } from '../../src/functions/shop/index'

describe('functions: ping', () => {
  it('returns pong', async () => {
    const res = await main({ action: 'v1.system.ping' })
    expect(res).toHaveProperty('success', true)
    expect(res).toHaveProperty('message', 'pong')
    expect(res).toHaveProperty('action', 'v1.system.ping')
  })
})

