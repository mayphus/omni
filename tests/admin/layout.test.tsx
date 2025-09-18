import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import React from 'react'
import { Layout } from '../../src/admin/components/layout/Layout'

type MutableRouteHook = { route: string; navigate: (to: string) => void }
const hookState: MutableRouteHook = {
  route: 'orders',
  navigate: () => {},
}

vi.mock('../../src/admin/lib/router', () => ({
  useHashRoute: () => hookState,
}))

describe('admin layout', () => {
  beforeEach(() => {
    hookState.route = 'orders'
    hookState.navigate = vi.fn()
  })

  const baseUser = {
    uid: 'user-1',
    loginType: 'CUSTOM',
    username: 'alice',
    email: 'alice@example.com',
  } as any

  it('renders the active navigation state and propagates sign-out', async () => {
    const onSignOut = vi.fn()
    const user = userEvent.setup()

    render(
      <Layout user={baseUser} onSignOut={onSignOut}>
        <div>Dashboard Content</div>
      </Layout>,
    )

    expect(screen.getByText('Dashboard Content')).toBeInTheDocument()
    expect(screen.getByText(/Signed in as/i)).toHaveTextContent('Signed in as alice')

    const activeLink = screen.getByRole('link', { name: 'Orders' })
    expect(activeLink).toHaveAttribute('href', '#/orders')
    expect(activeLink).toHaveClass('bg-accent', { exact: false })

    const dashboardLink = screen.getByRole('link', { name: 'Dashboard' })
    expect(dashboardLink).not.toHaveClass('bg-accent')

    const signOutButtons = screen.getAllByRole('button', { name: /sign out/i })
    expect(signOutButtons.length).toBeGreaterThan(0)

    for (const button of signOutButtons) {
      await user.click(button)
    }

    expect(onSignOut).toHaveBeenCalledTimes(signOutButtons.length)
  })
})
