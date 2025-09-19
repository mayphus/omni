#!/usr/bin/env node
const { spawn } = require('node:child_process')

const defaultTasks = [
  { label: 'weapp', script: 'deploy:weapp' },
  { label: 'functions', script: 'deploy:functions' },
  { label: 'admin', script: 'deploy:admin' },
]

const reset = '\u001b[0m'
const colors = {
  weapp: '\u001b[36m',
  functions: '\u001b[35m',
  admin: '\u001b[32m',
}

function createDeployManager(options = {}) {
  const {
    taskList = defaultTasks,
    spawnFn = spawn,
    proc = process,
    logger = console,
  } = options

  const isWindows = proc.platform === 'win32'
  const children = new Map()
  let shuttingDown = false
  let exitCode = 0
  let pending = taskList.length

  function formatLabel(label) {
    const color = colors[label] || ''
    return `${color}[${label}]${reset}`
  }

  function forwardStream(stream, label, printer) {
    if (!stream) return

    const prefix = formatLabel(label)
    let buffer = ''
    stream.setEncoding('utf8')

    stream.on('data', (chunk) => {
      buffer += chunk
      let newlineIndex
      while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, newlineIndex).replace(/\r$/, '')
        buffer = buffer.slice(newlineIndex + 1)
        printer(`${prefix} ${line}`)
      }
    })

    stream.on('end', () => {
      if (buffer.length > 0) {
        printer(`${prefix} ${buffer.replace(/\r$/, '')}`)
      }
    })
  }

  function finishIfDone() {
    if (pending === 0) {
      proc.exit(exitCode)
    }
  }

  function shutdown(signal, code = exitCode || 1) {
    if (shuttingDown) return
    shuttingDown = true
    exitCode = code
    for (const child of children.values()) {
      if (!child.killed) {
        child.kill(signal || 'SIGTERM')
      }
    }
  }

  function runTask(task) {
    const child = spawnFn('pnpm', ['run', task.script], {
      stdio: ['inherit', 'pipe', 'pipe'],
      shell: isWindows,
      env: proc.env,
    })

    children.set(task.label, child)

    forwardStream(child.stdout, task.label, logger.log)
    forwardStream(child.stderr, task.label, logger.error)

    child.on('exit', (code, signal) => {
      children.delete(task.label)
      pending -= 1

      if (signal && shuttingDown) {
        finishIfDone()
        return
      }

      if (code === 0) {
        logger.log(`${formatLabel(task.label)} completed successfully`)
        finishIfDone()
        return
      }

      const finalCode = code ?? 1
      logger.error(`${formatLabel(task.label)} failed with code ${finalCode}${signal ? ` (${signal})` : ''}`)
      exitCode = finalCode
      shutdown('SIGTERM', exitCode)
      finishIfDone()
    })

    child.on('error', (error) => {
      children.delete(task.label)
      pending -= 1
      logger.error(`${formatLabel(task.label)} failed to start:`, error)
      exitCode = exitCode || 1
      shutdown('SIGTERM', exitCode)
      finishIfDone()
    })
  }

  function runAll() {
    proc.on('SIGINT', () => {
      logger.log('Received SIGINT, terminating deploy tasks...')
      exitCode = exitCode || 130
      shutdown('SIGINT', exitCode)
    })

    proc.on('SIGTERM', () => {
      exitCode = exitCode || 143
      shutdown('SIGTERM', exitCode)
    })

    for (const task of taskList) {
      runTask(task)
    }
  }

  return {
    formatLabel,
    forwardStream,
    runTask,
    runAll,
    shutdown,
    finishIfDone,
    state: () => ({ children, shuttingDown, exitCode, pending }),
    tasks: taskList,
  }
}

const manager = createDeployManager()

if (require.main === module) {
  manager.runAll()
}

module.exports = {
  createDeployManager,
  formatLabel: manager.formatLabel,
  forwardStream: manager.forwardStream,
  runTask: manager.runTask,
  runAll: manager.runAll,
  shutdown: manager.shutdown,
  tasks: manager.tasks,
}
