import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import React from 'react'
import { Login } from '../../src/admin/pages/Login'

type SignInReturn = { user: any }

const mockSignIn = vi.fn<(username: string, password: string) => Promise<SignInReturn>>()
const mockIsValidAdminLogin = vi.fn<(user: any) => boolean>(() => true)
const mockGetEnvId = vi.fn<[], string | undefined>(() => 'env-test')

vi.mock('../../src/admin/lib/cloudbase', () => ({
  signInWithUsernamePassword: (username: string, password: string) => mockSignIn(username, password),
  isValidAdminLogin: (user: any) => mockIsValidAdminLogin(user),
  getEnvId: () => mockGetEnvId(),
}))

describe('admin login page', () => {
  beforeEach(() => {
    mockSignIn.mockReset()
    mockIsValidAdminLogin.mockReset()
    mockIsValidAdminLogin.mockReturnValue(true)
    mockGetEnvId.mockReset()
    mockGetEnvId.mockReturnValue('env-test')
  })

  it('displays the configured environment id', () => {
    mockGetEnvId.mockReturnValue('cloud1')
    render(<Login onSuccess={vi.fn()} />)
    expect(screen.getByText('Env: cloud1')).toBeInTheDocument()
  })

  it('requires both username and password', async () => {
    const user = userEvent.setup()
    render(<Login onSuccess={vi.fn()} />)
    const signInButtons = screen.getAllByRole('button', { name: /sign in/i })
    await user.click(signInButtons[0])
    expect(mockSignIn).not.toHaveBeenCalled()
    expect(await screen.findByText('Please enter username and password')).toBeInTheDocument()
  })

  it('submits credentials and validates the resolved user', async () => {
    const fakeUser = { uid: 'admin-1', loginType: 'CUSTOM', username: 'root' }
    mockSignIn.mockResolvedValue({ user: fakeUser })
    const onSuccess = vi.fn()
    const user = userEvent.setup()

    render(<Login onSuccess={onSuccess} />)

    await user.type(screen.getByLabelText('Username'), 'root')
    await user.type(screen.getByLabelText('Password'), 'secret')
    const [signInButton] = screen.getAllByRole('button', { name: /sign in/i })
    await user.click(signInButton)

    expect(mockSignIn).toHaveBeenCalledWith('root', 'secret')
    expect(mockSignIn.mock.results[0]?.type).toBe('return')
    await mockSignIn.mock.results[0]?.value
    await waitFor(() => {
      expect(mockIsValidAdminLogin).toHaveBeenCalledWith(fakeUser)
    })
    expect(mockIsValidAdminLogin.mock.results[0]?.value).toBe(true)
    expect(mockIsValidAdminLogin.mock.calls).toEqual([[fakeUser]])
    expect(screen.queryByText('Account is missing admin access')).not.toBeInTheDocument()
  })

  it('shows an error when the account lacks admin access', async () => {
    const invalidUser = { uid: 'anon', loginType: 'ANONYMOUS' }
    mockSignIn.mockResolvedValue({ user: invalidUser })
    mockIsValidAdminLogin.mockReturnValueOnce(false)
    const onSuccess = vi.fn()
    const user = userEvent.setup()

    render(<Login onSuccess={onSuccess} />)

    await user.type(screen.getByLabelText('Username'), 'anon')
    await user.type(screen.getByLabelText('Password'), 'pass')
    const [submitButton] = screen.getAllByRole('button', { name: /sign in/i })
    await user.click(submitButton)

    expect(onSuccess).not.toHaveBeenCalled()
    expect(await screen.findByText('Account is missing admin access')).toBeInTheDocument()
  })
})
