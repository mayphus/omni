import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'

import {
  fetchStoreHome,
  searchStoreProducts,
  fetchStoreOrderDetail,
  cancelStoreOrder,
} from '../../src/weapp/utils/api'

describe('weapp utils api', () => {
  const callFunctionMock = vi.fn()

  beforeEach(() => {
    callFunctionMock.mockReset()
    ;(globalThis as any).wx = {
      cloud: {
        callFunction: callFunctionMock,
      },
    }
  })

  afterEach(() => {
    delete (globalThis as any).wx
  })

  it('fetches store home successfully', async () => {
    callFunctionMock.mockResolvedValueOnce({
      result: {
        success: true,
        action: 'v1.store.home',
        timestamp: '2025-01-01T00:00:00.000Z',
        executionTime: 5,
        featuredProducts: [],
      },
    })

    const res = await fetchStoreHome()

    expect(callFunctionMock).toHaveBeenCalledWith({
      name: 'shop',
      data: { action: 'v1.store.home' },
    })
    expect(res).toMatchObject({ success: true, featuredProducts: [] })
  })

  it('passes keyword and limit to product search', async () => {
    callFunctionMock.mockResolvedValueOnce({
      result: {
        success: true,
        action: 'v1.store.products.search',
        timestamp: '2025-01-01T00:00:00.000Z',
        executionTime: 5,
        products: [{ id: 'p1', title: 'Product 1' }],
      },
    })

    const res = await searchStoreProducts('berry', 25)

    expect(callFunctionMock).toHaveBeenCalledWith({
      name: 'shop',
      data: { action: 'v1.store.products.search', keyword: 'berry', limit: 25 },
    })
    expect(res.products).toHaveLength(1)
  })

  it('falls back to list orders when detail action is unavailable', async () => {
    callFunctionMock
      .mockResolvedValueOnce({
        result: {
          success: false,
          action: 'v1.store.order.detail',
          error: 'Unknown action: v1.store.order.detail',
          timestamp: '2025-01-01T00:00:00.000Z',
          executionTime: 5,
        },
      })
      .mockResolvedValueOnce({
        result: {
          success: true,
          action: 'v1.store.orders.list',
          timestamp: '2025-01-01T00:00:05.000Z',
          executionTime: 7,
          orders: [{ id: 'order-1', status: 'paid' }],
        },
      })

    const res = await fetchStoreOrderDetail('order-1')

    expect(res.order.id).toBe('order-1')
    expect(res.action).toBe('fallback.store.order.detail')
    expect(callFunctionMock).toHaveBeenNthCalledWith(2, {
      name: 'shop',
      data: { action: 'v1.store.orders.list', limit: 200 },
    })
  })

  it('throws human readable error when order cancellation is not yet supported', async () => {
    callFunctionMock.mockResolvedValueOnce({
      result: {
        success: false,
        action: 'v1.store.order.cancel',
        error: 'Unknown action: v1.store.order.cancel',
        timestamp: '2025-01-01T00:00:00.000Z',
        executionTime: 5,
      },
    })

    await expect(cancelStoreOrder('order-1')).rejects.toThrow('Order cancellation is not yet available')
  })

  it('propagates empty responses as errors', async () => {
    callFunctionMock.mockResolvedValueOnce({})

    await expect(fetchStoreHome()).rejects.toThrow('Empty response from cloud function')
  })
})
