#!/usr/bin/env node
const { spawn } = require('node:child_process')

const isWindows = process.platform === 'win32'
const reset = '\u001b[0m'
const colors = {
  weapp: '\u001b[36m',
  'weapp-npm': '\u001b[36m',
  functions: '\u001b[35m',
  admin: '\u001b[32m',
}

const tasks = [
  { label: 'weapp', script: 'build:weapp' },
  { label: 'functions', script: 'build:functions' },
  { label: 'admin', script: 'build:admin' },
  { label: 'weapp-npm', script: 'build:weapp:npm', dependsOn: ['weapp'] },
]

const stateByLabel = new Map(
  tasks.map((task) => [task.label, { status: 'pending', child: null }]),
)

let shuttingDown = false
let exitCode = 0
let remaining = tasks.length

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

function allDependenciesDone(task) {
  const deps = task.dependsOn || []
  return deps.every((dep) => stateByLabel.get(dep)?.status === 'success')
}

function tryStartReadyTasks() {
  if (shuttingDown) return

  for (const task of tasks) {
    const state = stateByLabel.get(task.label)
    if (!state || state.status !== 'pending') continue
    if (allDependenciesDone(task)) {
      startTask(task)
    }
  }
}

function startTask(task) {
  if (shuttingDown) return

  const child = spawn('pnpm', ['run', task.script], {
    stdio: ['inherit', 'pipe', 'pipe'],
    shell: isWindows,
    env: process.env,
  })

  const state = stateByLabel.get(task.label)
  state.status = 'running'
  state.child = child

  forwardStream(child.stdout, task.label, console.log)
  forwardStream(child.stderr, task.label, console.error)

  child.on('exit', (code, signal) => {
    state.child = null
    state.status = code === 0 ? 'success' : 'failed'
    remaining -= 1

    if (signal && shuttingDown) {
      finishIfDone()
      return
    }

    if (code === 0) {
      console.log(`${formatLabel(task.label)} completed successfully`)
      tryStartReadyTasks()
      finishIfDone()
      return
    }

    const finalCode = code ?? 1
    console.error(`${formatLabel(task.label)} failed with code ${finalCode}${signal ? ` (${signal})` : ''}`)
    exitCode = finalCode
    shutdown('SIGTERM', exitCode)
    finishIfDone()
  })

  child.on('error', (error) => {
    state.child = null
    state.status = 'failed'
    remaining -= 1
    console.error(`${formatLabel(task.label)} failed to start:`, error)
    exitCode = exitCode || 1
    shutdown('SIGTERM', exitCode)
    finishIfDone()
  })
}

function shutdown(signal, code = exitCode || 1) {
  if (shuttingDown) return
  shuttingDown = true
  exitCode = code

  for (const [, state] of stateByLabel) {
    if (state.child && !state.child.killed) {
      state.child.kill(signal || 'SIGTERM')
    }
  }

  for (const [, state] of stateByLabel) {
    if (state.status === 'pending') {
      state.status = 'skipped'
      remaining -= 1
    }
  }
}

function finishIfDone() {
  if (remaining === 0) {
    process.exit(exitCode)
  }
}

process.on('SIGINT', () => {
  console.log('Received SIGINT, terminating build tasks...')
  exitCode = exitCode || 130
  shutdown('SIGINT', exitCode)
  finishIfDone()
})

process.on('SIGTERM', () => {
  exitCode = exitCode || 143
  shutdown('SIGTERM', exitCode)
  finishIfDone()
})

tryStartReadyTasks()
