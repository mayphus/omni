import path from 'node:path'
import { describe, expect, it, beforeEach, vi } from 'vitest'

import { createWeappNpmManager } from '../../scripts/weapp-npm.js'

type FsState = {
  records: Set<string>
  fs: {
    existsSync: (target: string) => boolean
    mkdirSync: (target: string, options?: any) => void
    rmSync: (target: string, options?: any) => void
    cpSync: (from: string, to: string, options?: any) => void
  }
}

type Logger = { log: ReturnType<typeof vi.fn>; warn: ReturnType<typeof vi.fn> }

function createFs(initialFiles: string[] = []): FsState {
  const records = new Set(initialFiles.map((file) => path.resolve(file)))

  function normalise(target: string) {
    return path.resolve(target)
  }

  function addDirectory(target: string) {
    const resolved = normalise(target)
    records.add(resolved)
  }

  return {
    records,
    fs: {
      existsSync(target: string) {
        return records.has(normalise(target))
      },
      mkdirSync(target: string) {
        addDirectory(target)
      },
      rmSync(target: string) {
        const resolved = normalise(target)
        for (const entry of [...records]) {
          if (entry === resolved || entry.startsWith(`${resolved}${path.sep}`)) {
            records.delete(entry)
          }
        }
      },
      cpSync(from: string, to: string) {
        if (!records.has(normalise(from))) return
        addDirectory(to)
        records.add(normalise(path.join(to, 'search', 'index.js')))
      },
    },
  }
}

function createLogger(): Logger {
  return {
    log: vi.fn(),
    warn: vi.fn(),
  }
}

describe('scripts/weapp-npm', () => {
  const rootDir = '/project'
  const targetSearchFile = path.join(rootDir, 'weapp', 'miniprogram_npm', '@vant', 'weapp', 'search', 'index.js')
  const sourceDir = path.join(rootDir, 'src', 'weapp', 'node_modules', '@vant', 'weapp', 'dist')

  let logger: Logger

  beforeEach(() => {
    logger = createLogger()
  })

  it('skips packaging when components are already available', () => {
    const fsState = createFs([targetSearchFile])
    const exec = vi.fn()

    const manager = createWeappNpmManager({
      fsModule: fsState.fs,
      exec,
      logger,
      rootDir,
    })

    manager.ensureMiniprogramNpm()

    expect(exec).not.toHaveBeenCalled()
    expect(logger.log).toHaveBeenCalledWith('Vant components already prepared.')
  })

  it('runs build:weapp:npm when components are missing and build succeeds', () => {
    const fsState = createFs([sourceDir])
    const exec = vi.fn(() => {
      fsState.records.add(targetSearchFile)
    })

    const manager = createWeappNpmManager({
      fsModule: fsState.fs,
      exec,
      logger,
      rootDir,
    })

    manager.ensureMiniprogramNpm()

    expect(exec).toHaveBeenCalledWith('pnpm run build:weapp:npm', { stdio: 'inherit' })
    expect(fsState.fs.existsSync(targetSearchFile)).toBe(true)
  })

  it('falls back to copying when build fails and source exists', () => {
    const fsState = createFs([sourceDir])
    const exec = vi.fn(() => {
      throw new Error('mock failure')
    })

    const manager = createWeappNpmManager({
      fsModule: fsState.fs,
      exec,
      logger,
      rootDir,
    })

    manager.ensureMiniprogramNpm()

    expect(exec).toHaveBeenCalled()
    expect(logger.warn).toHaveBeenCalledWith('build:weapp:npm failed, attempting to copy Vant components locally.')
    expect(fsState.fs.existsSync(targetSearchFile)).toBe(true)
    expect(logger.log).toHaveBeenCalledWith('Copied Vant components into miniprogram_npm.')
  })

  it('throws when neither build nor copy can prepare components', () => {
    const fsState = createFs()
    const exec = vi.fn(() => {
      throw new Error('mock failure')
    })

    const manager = createWeappNpmManager({
      fsModule: fsState.fs,
      exec,
      logger,
      rootDir,
    })

    expect(() => manager.ensureMiniprogramNpm()).toThrow('Failed to prepare Vant components for miniprogram_npm.')
  })
})
