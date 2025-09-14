import { describe, it, expect } from 'vitest'
import { nowMs, zSystemItem } from '../../src/shared'

describe('system collection items', () => {
  const base = () => ({ createdAt: nowMs(), updatedAt: nowMs() })

  it('validates category item', () => {
    const c = zSystemItem.parse({ kind: 'category', name: 'Toys', slug: 'toys', sort: 1, isActive: true, ...base() })
    expect(c.kind).toBe('category')
  })

  it('validates coupon item', () => {
    const c = zSystemItem.parse({ kind: 'coupon', code: 'SAVE10', type: 'percent', value: 10, minOrderYuan: 0, isActive: true, ...base() })
    expect(c.kind).toBe('coupon')
  })

  it('validates banner item', () => {
    const b = zSystemItem.parse({ kind: 'banner', imageUrl: 'https://example.com/b.jpg', sort: 0, isActive: true, ...base() })
    expect(b.kind).toBe('banner')
  })
})

