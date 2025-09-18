#!/usr/bin/env node
const { spawn } = require('node:child_process')

const isWindows = process.platform === 'win32'
const reset = '[0m'
const colors = {
  weapp: '[36m',
  admin: '[32m',
  functions: '[35m',
}

const tasks = [
  { label: 'weapp', command: 'pnpm', args: ['run', 'dev:weapp'] },
  { label: 'admin', command: 'pnpm', args: ['run', 'dev:admin'] },
  { label: 'functions', command: 'pnpm', args: ['run', 'dev:functions'], allowEarlyExit: true },
]

const children = new Map()
let shuttingDown = false

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
    while ((newlineIndex = buffer.indexOf('
')) !== -1) {
      const line = buffer.slice(0, newlineIndex).replace(/$/, '')
      buffer = buffer.slice(newlineIndex + 1)
      printer(`${prefix} ${line}`)
    }
  })

  stream.on('end', () => {
    if (buffer.length > 0) {
      printer(`${prefix} ${buffer.replace(/$/, '')}`)
    }
  })
}

function shutdown(signal, code = 0) {
  if (shuttingDown) return
  shuttingDown = true

  for (const child of children.values()) {
    if (!child.killed) {
      child.kill(signal || 'SIGTERM')
    }
  }

  // Give the processes a moment to exit cleanly
  setTimeout(() => process.exit(code), 200)
}

function runTask(task) {
  const child = spawn(task.command, task.args, {
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: isWindows,
    env: process.env,
  })

  children.set(task.label, child)

  forwardStream(child.stdout, task.label, console.log)
  forwardStream(child.stderr, task.label, console.error)

  child.on('exit', (code, signal) => {
    children.delete(task.label)
    if (shuttingDown) return

    if (task.allowEarlyExit && code === 0) {
      console.log(`${formatLabel(task.label)} exited without a persistent watcher; continuing...`)
      return
    }

    if (code === 0) {
      console.log(`${formatLabel(task.label)} exited cleanly${signal ? ` (${signal})` : ''}`)
      shutdown(signal || 'SIGTERM', 0)
    } else {
      console.error(`${formatLabel(task.label)} exited with code ${code}${signal ? ` (${signal})` : ''}`)
      shutdown(signal || 'SIGTERM', code ?? 1)
    }
  })

  child.on('error', (error) => {
    console.error(`${formatLabel(task.label)} failed to start:`, error)
    shutdown('SIGTERM', 1)
  })
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))

for (const task of tasks) {
  runTask(task)
}
