import { EventEmitter } from 'node:events'
import { PassThrough } from 'node:stream'
import { describe, expect, it, beforeEach, vi } from 'vitest'

import { createDeployManager } from '../../scripts/deploy-all.js'

type SpawnChild = EventEmitter & {
  stdout: PassThrough
  stderr: PassThrough
  kill: ReturnType<typeof vi.fn>
  killed: boolean
}

describe('scripts/deploy-all', () => {
  let spawnMock: ReturnType<typeof vi.fn>
  let logger: { log: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> }
  let proc: {
    platform: 'darwin'
    env: Record<string, string>
    exit: ReturnType<typeof vi.fn>
    on: ReturnType<typeof vi.fn>
  }

  function createChild(): SpawnChild {
    const child = new EventEmitter() as SpawnChild
    child.stdout = new PassThrough({ encoding: 'utf8' })
    child.stderr = new PassThrough({ encoding: 'utf8' })
    child.kill = vi.fn(() => {
      child.killed = true
    })
    child.killed = false
    return child
  }

  beforeEach(() => {
    spawnMock = vi.fn()
    logger = { log: vi.fn(), error: vi.fn() }
    proc = {
      platform: 'darwin',
      env: {},
      exit: vi.fn(),
      on: vi.fn(),
    }
  })

  it('formats labels with colour hints', () => {
    const manager = createDeployManager({ spawnFn: spawnMock, logger, proc, taskList: [] })
    expect(manager.formatLabel('weapp')).toBe('\u001b[36m[weapp]\u001b[0m')
    expect(manager.formatLabel('unknown')).toBe('[unknown]\u001b[0m')
  })

  it('forwards stream output line by line', async () => {
    const manager = createDeployManager({ spawnFn: spawnMock, logger, proc, taskList: [] })
    const output: string[] = []
    const stream = new PassThrough({ encoding: 'utf8' })

    manager.forwardStream(stream, 'weapp', (line) => output.push(line))

    stream.write('hello')
    stream.write(' world\nnext line')
    stream.end('\nfinal')

    await new Promise((resolve) => setImmediate(resolve))

    expect(output).toEqual([
      '\u001b[36m[weapp]\u001b[0m hello world',
      '\u001b[36m[weapp]\u001b[0m next line',
      '\u001b[36m[weapp]\u001b[0m final',
    ])
  })

  it('spawns deploy tasks and reports success', async () => {
    const child = createChild()
    spawnMock.mockReturnValue(child)
    const manager = createDeployManager({ spawnFn: spawnMock, logger, proc, taskList: [{ label: 'weapp', script: 'deploy:weapp' }] })

    manager.runTask({ label: 'weapp', script: 'deploy:weapp' })

    child.stdout.write('started\n')
    child.stdout.end()
    child.emit('exit', 0, null)

    await new Promise((resolve) => setImmediate(resolve))

    expect(spawnMock).toHaveBeenCalledWith('pnpm', ['run', 'deploy:weapp'], {
      stdio: ['inherit', 'pipe', 'pipe'],
      shell: false,
      env: proc.env,
    })
    expect(logger.log).toHaveBeenCalledWith('\u001b[36m[weapp]\u001b[0m completed successfully')
    expect(proc.exit).toHaveBeenCalledWith(0)
  })

  it('terminates other tasks when a task fails', async () => {
    const childSuccessor = createChild()
    const childFailing = createChild()
    spawnMock
      .mockReturnValueOnce(childFailing)
      .mockReturnValueOnce(childSuccessor)

    const manager = createDeployManager({
      spawnFn: spawnMock,
      logger,
      proc,
      taskList: [
        { label: 'weapp', script: 'deploy:weapp' },
        { label: 'admin', script: 'deploy:admin' },
      ],
    })

    manager.runTask({ label: 'weapp', script: 'deploy:weapp' })
    manager.runTask({ label: 'admin', script: 'deploy:admin' })

    childFailing.emit('exit', 2, null)

    await new Promise((resolve) => setImmediate(resolve))

    expect(logger.error).toHaveBeenCalledWith('\u001b[36m[weapp]\u001b[0m failed with code 2')
    expect(childSuccessor.kill).toHaveBeenCalledWith('SIGTERM')

    childSuccessor.emit('exit', 0, null)

    await new Promise((resolve) => setImmediate(resolve))

    expect(proc.exit).toHaveBeenCalledWith(2)
  })

  it('attaches signal handlers in runAll', () => {
    const child = createChild()
    spawnMock.mockReturnValue(child)

    const manager = createDeployManager({ spawnFn: spawnMock, logger, proc, taskList: [{ label: 'weapp', script: 'deploy:weapp' }] })

    manager.runAll()

    expect(proc.on).toHaveBeenCalledWith('SIGINT', expect.any(Function))
    expect(proc.on).toHaveBeenCalledWith('SIGTERM', expect.any(Function))
  })
})
