#!/usr/bin/env node
const { spawn } = require('node:child_process')

// All deploy tasks to run in parallel
const tasks = [
  { name: 'Functions', command: 'pnpm', args: ['run', 'deploy:functions'] },
  { name: 'WeApp', command: 'pnpm', args: ['run', 'deploy:weapp'] },
  { name: 'Admin', command: 'pnpm', args: ['run', 'deploy:admin'] },
]

// ANSI colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  dim: '\x1b[2m',
}

// Run a single task and capture its result
function runTask(task) {
  const startTime = Date.now()
  console.log(`${colors.yellow}[${task.name}]${colors.reset} Deploying...`)

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
      const status = code === 0 ? 'deployed' : 'failed'
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
  console.log(`${colors.yellow}━━━ Deploying All Services (${tasks.length} in parallel) ━━━${colors.reset}\n`)
  console.log(`${colors.dim}This will build and deploy all services to production.${colors.reset}\n`)

  const startTime = Date.now()

  // Run all tasks in parallel
  const results = await Promise.all(tasks.map(runTask))

  const totalDuration = ((Date.now() - startTime) / 1000).toFixed(1)
  const successful = results.filter(r => r.success)
  const failed = results.filter(r => !r.success)

  // Print summary
  console.log(`\n${colors.yellow}━━━ Deployment Summary ━━━${colors.reset}`)
  console.log(`Total time: ${totalDuration}s`)
  console.log(`${colors.green}Deployed: ${successful.length}/${tasks.length}${colors.reset}`)

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
    console.log(`\n${colors.red}━━━ Deployment Errors ━━━${colors.reset}`)
    failed.forEach(task => {
      console.log(`\n${colors.red}[${task.name}]${colors.reset}`)
      console.log(colors.dim + task.output.slice(0, 500) + colors.reset) // Show first 500 chars of error
      if (task.output.length > 500) {
        console.log(colors.dim + '... (truncated)' + colors.reset)
      }
    })

    console.log(`\n${colors.red}⚠ Deployment failed! Some services were not deployed.${colors.reset}`)
    process.exit(1)
  } else {
    console.log(`\n${colors.green}✓ All services deployed successfully!${colors.reset}`)
  }
}

main().catch(error => {
  console.error(`${colors.red}Unexpected error:${colors.reset}`, error)
  process.exit(1)
})