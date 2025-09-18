#!/usr/bin/env node
const { spawn } = require('node:child_process')

const isWindows = process.platform === 'win32'
const reset = '\u001b[0m'
const colors = {
  weapp: '\u001b[36m',
  functions: '\u001b[35m',
  admin: '\u001b[32m',
}

const tasks = [
  { label: 'weapp', script: 'deploy:weapp' },
  { label: 'functions', script: 'deploy:functions' },
  { label: 'admin', script: 'deploy:admin' },
]

const children = new Map()
let shuttingDown = false
let exitCode = 0
let pending = tasks.length

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

function finishIfDone() {
  if (pending === 0) {
    process.exit(exitCode)
  }
}

function runTask(task) {
  const child = spawn('pnpm', ['run', task.script], {
    stdio: ['inherit', 'pipe', 'pipe'],
    shell: isWindows,
    env: process.env,
  })

  children.set(task.label, child)

  forwardStream(child.stdout, task.label, console.log)
  forwardStream(child.stderr, task.label, console.error)

  child.on('exit', (code, signal) => {
    children.delete(task.label)
    pending -= 1

    if (signal && shuttingDown) {
      finishIfDone()
      return
    }

    if (code === 0) {
      console.log(`${formatLabel(task.label)} completed successfully`)
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
    children.delete(task.label)
    pending -= 1
    console.error(`${formatLabel(task.label)} failed to start:`, error)
    exitCode = exitCode || 1
    shutdown('SIGTERM', exitCode)
    finishIfDone()
  })
}

process.on('SIGINT', () => {
  console.log('Received SIGINT, terminating deploy tasks...')
  exitCode = exitCode || 130
  shutdown('SIGINT', exitCode)
})

process.on('SIGTERM', () => {
  exitCode = exitCode || 143
  shutdown('SIGTERM', exitCode)
})

for (const task of tasks) {
  runTask(task)
}
