#!/usr/bin/env node
const { spawn } = require('node:child_process')

const stages = [
  {
    name: 'Plan',
    tasks: [
      { label: 'typecheck', args: ['run', 'typecheck'] },
    ],
  },
  {
    name: 'Execute',
    tasks: [
      { label: 'build:functions', args: ['run', 'build:functions'] },
      { label: 'build:weapp', args: ['run', 'build:weapp'] },
      { label: 'build:admin', args: ['run', 'build:admin'] },
    ],
  },
  {
    name: 'Verify',
    tasks: [
      { label: 'test:ci', args: ['run', 'test:ci'] },
      { label: 'test:e2e', args: ['run', 'test:e2e'], optional: !hasAutomatorCli() },
    ],
  },
]

const colors = {
  reset: '\u001b[0m',
  stage: '\u001b[36m',
  success: '\u001b[32m',
  failure: '\u001b[31m',
  warn: '\u001b[33m',
}

function hasAutomatorCli() {
  return Boolean(
    process.env.WECHAT_DEVTOOLS_CLI ||
      process.env.WECHAT_DEVTOOLS_CLI_PATH ||
      process.env.MINIPROGRAM_AUTOMATOR_CLI ||
      process.env.SHOP_AUTOMATOR_CLI,
  )
}

async function runTask(task, stageName) {
  return new Promise((resolve, reject) => {
    const child = spawn('pnpm', task.args, {
      stdio: 'inherit',
      env: process.env,
    })

    child.on('exit', (code) => {
      if (code === 0) {
        resolve()
      } else {
        const prefix = `${colors.failure}[${stageName}:${task.label}]${colors.reset}`
        console.error(`${prefix} exited with code ${code}`)
        reject(new Error(`Task ${task.label} failed`))
      }
    })

    child.on('error', (error) => {
      const prefix = `${colors.failure}[${stageName}:${task.label}]${colors.reset}`
      console.error(`${prefix} failed to start:`, error)
      reject(error)
    })
  })
}

async function runStage(stage) {
  const stageHeader = `${colors.stage}» ${stage.name.toUpperCase()}${colors.reset}`
  console.log(stageHeader)

  for (const task of stage.tasks) {
    if (task.optional) {
      const prefix = `${colors.warn}[${stage.name}:${task.label}]${colors.reset}`
      console.warn(`${prefix} skipped (missing WeChat DevTools CLI).`)
      continue
    }
    const prefix = `[${stage.name}:${task.label}]`
    console.log(`${prefix} starting...`)
    await runTask(task, stage.name)
    console.log(`${prefix} ${colors.success}completed${colors.reset}`)
  }
}

async function main() {
  try {
    for (const stage of stages) {
      await runStage(stage)
    }
    console.log(`${colors.success}Plan–Execute–Verify pipeline completed successfully.${colors.reset}`)
  } catch (error) {
    process.exit(1)
  }
}

main()
