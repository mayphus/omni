import { renderHook, act, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useHashRoute } from '../../src/admin/lib/router'

describe('admin router hook', () => {
  beforeEach(() => {
    // Reset hash between tests for deterministic behaviour
    location.hash = ''
  })

  it('defaults to dashboard and normalises the hash', async () => {
    const { result, unmount } = renderHook(() => useHashRoute())
    expect(result.current.route).toBe('dashboard')

    await waitFor(() => {
      expect(location.hash).toBe('#/dashboard')
    })

    unmount()
  })

  it('responds to hash changes', () => {
    location.hash = '#/orders'
    const { result, unmount } = renderHook(() => useHashRoute())

    expect(result.current.route).toBe('orders')

    act(() => {
      location.hash = '#/users'
      window.dispatchEvent(new HashChangeEvent('hashchange'))
    })

    expect(result.current.route).toBe('users')

    unmount()
  })

  it('navigate updates the hash only when the destination differs', () => {
    location.hash = '#/orders'
    const { result, unmount } = renderHook(() => useHashRoute())

    expect(result.current.route).toBe('orders')

    act(() => {
      result.current.navigate('orders')
    })
    expect(location.hash).toBe('#/orders')

    act(() => {
      result.current.navigate('system')
    })
    expect(location.hash).toBe('#/system')

    unmount()
  })
})
