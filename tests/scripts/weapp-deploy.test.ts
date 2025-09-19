import { describe, expect, it, beforeEach, vi } from 'vitest'

import { createWeappDeploy } from '../../scripts/weapp-deploy.js'

describe('scripts/weapp-deploy', () => {
  let fsMock: { existsSync: ReturnType<typeof vi.fn> }
  let execMock: ReturnType<typeof vi.fn>
  let logger: { log: ReturnType<typeof vi.fn>; warn: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> }
  let env: Record<string, string>
  let cwd: ReturnType<typeof vi.fn>
  let proc: { exit: ReturnType<typeof vi.fn> }

  beforeEach(() => {
    fsMock = { existsSync: vi.fn(() => false) }
    execMock = vi.fn()
    logger = { log: vi.fn(), warn: vi.fn(), error: vi.fn() }
    env = {}
    cwd = vi.fn(() => '/workspace')
    proc = { exit: vi.fn() } as any
  })

  it('returns configured cli when path exists', () => {
    env.WECHAT_DEVTOOLS_CLI = '/custom/cli'
    fsMock.existsSync.mockReturnValue(true)
    const deploy = createWeappDeploy({ fsModule: fsMock, exec: execMock, env, cwd, logger, proc })

    expect(deploy.resolveCli()).toBe('/custom/cli')
    expect(fsMock.existsSync).toHaveBeenCalledWith('/custom/cli')
  })

  it('falls back to default candidates when env is not set', () => {
    fsMock.existsSync.mockImplementation((candidate: string) => candidate.includes('wechatwebdevtools'))
    const deploy = createWeappDeploy({ fsModule: fsMock, exec: execMock, env, cwd, logger, proc })

    const cli = deploy.resolveCli()
    expect(cli).toMatch(/wechatwebdevtools\.app/)
  })

  it('warns and skips when configured cli is missing', async () => {
    env.WECHAT_DEVTOOLS_CLI = '/missing/cli'
    fsMock.existsSync.mockReturnValue(false)
    const deploy = createWeappDeploy({ fsModule: fsMock, exec: execMock, env, cwd, logger, proc })

    await deploy.main()

    expect(logger.warn).toHaveBeenCalledWith('WeApp preview skipped: configured WECHAT_DEVTOOLS_CLI not found at /missing/cli')
    expect(logger.log).toHaveBeenCalledWith('WeApp preview skipped: DevTools CLI not installed.')
  })

  it('runs preview when cli is detected', async () => {
    env.WECHAT_DEVTOOLS_CLI = '/cli/path'
    fsMock.existsSync.mockReturnValue(true)

    const deploy = createWeappDeploy({ fsModule: fsMock, exec: execMock, env, cwd, logger, proc })

    await deploy.main()

    expect(execMock).toHaveBeenCalledWith('"/cli/path" preview --project "/workspace"', { stdio: 'inherit' })
    expect(logger.log).toHaveBeenCalledWith('Preview generated successfully')
  })

  it('exits with failure when preview throws', async () => {
    env.WECHAT_DEVTOOLS_CLI = '/cli/path'
    fsMock.existsSync.mockReturnValue(true)
    execMock.mockImplementation(() => {
      throw new Error('boom')
    })

    const deploy = createWeappDeploy({ fsModule: fsMock, exec: execMock, env, cwd, logger, proc })

    await deploy.main()

    expect(logger.error).toHaveBeenCalledWith('Preview failed:', 'boom')
    expect(proc.exit).toHaveBeenCalledWith(1)
  })
})
