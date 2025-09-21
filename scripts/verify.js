#!/usr/bin/env node
const { spawn } = require('node:child_process')

// All verification tasks to run in parallel
const tasks = [
  { name: 'TypeCheck', command: 'pnpm', args: ['run', 'typecheck'] },
  { name: 'Tests', command: 'pnpm', args: ['run', 'test'] },
  { name: 'Build Functions', command: 'pnpm', args: ['run', 'build:functions'] },
  { name: 'Build WeApp', command: 'pnpm', args: ['run', 'build:weapp'] },
  { name: 'Build Admin', command: 'pnpm', args: ['run', 'build:admin'] },
]

// ANSI colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
}

// Run a single task and capture its result
function runTask(task) {
  const startTime = Date.now()
  console.log(`${colors.cyan}[${task.name}]${colors.reset} Starting...`)

  return new Promise((resolve) => {
    const child = spawn(task.command, task.args, {
      stdio: 'pipe',
      env: process.env,
    })

    let output = ''

    child.stdout.on('data', (data) => {
      output += data.toString()
    })

    child.stderr.on('data', (data) => {
      output += data.toString()
    })

    child.on('exit', (code) => {
      const duration = ((Date.now() - startTime) / 1000).toFixed(1)
      const status = code === 0 ? 'success' : 'failed'
      const color = code === 0 ? colors.green : colors.red
      const icon = code === 0 ? '✓' : '✗'

      console.log(`${color}[${task.name}] ${icon} ${status} (${duration}s)${colors.reset}`)

      resolve({
        name: task.name,
        success: code === 0,
        duration,
        output: code !== 0 ? output : '', // Only keep output for failures
      })
    })

    child.on('error', (error) => {
      const duration = ((Date.now() - startTime) / 1000).toFixed(1)
      console.log(`${colors.red}[${task.name}] ✗ error (${duration}s)${colors.reset}`)
      resolve({
        name: task.name,
        success: false,
        duration,
        output: error.toString(),
      })
    })
  })
}

async function main() {
  console.log(`${colors.cyan}━━━ Running Verification (${tasks.length} tasks in parallel) ━━━${colors.reset}\n`)

  const startTime = Date.now()

  // Run all tasks in parallel
  const results = await Promise.all(tasks.map(runTask))

  const totalDuration = ((Date.now() - startTime) / 1000).toFixed(1)
  const successful = results.filter(r => r.success)
  const failed = results.filter(r => !r.success)

  // Print summary
  console.log(`\n${colors.cyan}━━━ Summary ━━━${colors.reset}`)
  console.log(`Total time: ${totalDuration}s`)
  console.log(`${colors.green}Passed: ${successful.length}/${tasks.length}${colors.reset}`)

  if (successful.length > 0) {
    successful.forEach(task => {
      console.log(`  ${colors.green}✓${colors.reset} ${task.name} ${colors.dim}(${task.duration}s)${colors.reset}`)
    })
  }

  if (failed.length > 0) {
    console.log(`${colors.red}Failed: ${failed.length}/${tasks.length}${colors.reset}`)
    failed.forEach(task => {
      console.log(`  ${colors.red}✗${colors.reset} ${task.name} ${colors.dim}(${task.duration}s)${colors.reset}`)
    })

    // Show error details for failed tasks
    console.log(`\n${colors.red}━━━ Error Details ━━━${colors.reset}`)
    failed.forEach(task => {
      console.log(`\n${colors.red}[${task.name}]${colors.reset}`)
      console.log(colors.dim + task.output.slice(0, 500) + colors.reset) // Show first 500 chars of error
      if (task.output.length > 500) {
        console.log(colors.dim + '... (truncated)' + colors.reset)
      }
    })

    process.exit(1)
  } else {
    console.log(`\n${colors.green}✓ All verification tasks passed!${colors.reset}`)
  }
}

main().catch(error => {
  console.error(`${colors.red}Unexpected error:${colors.reset}`, error)
  process.exit(1)
})