#!/usr/bin/env node
const fs = require('node:fs')
const path = require('node:path')
const { execSync } = require('node:child_process')

function resolveCli() {
  const configured = process.env.WECHAT_DEVTOOLS_CLI && process.env.WECHAT_DEVTOOLS_CLI.trim()
  if (configured) {
    if (fs.existsSync(configured)) {
      return configured
    }
    console.warn(`WeApp preview skipped: configured WECHAT_DEVTOOLS_CLI not found at ${configured}`)
    return null
  }

  const candidates = [
    '/Applications/wechatwebdevtools.app/Contents/MacOS/cli',
    '/Applications/WeChatwebDevTools.app/Contents/MacOS/cli',
  ]

  return candidates.find((candidate) => fs.existsSync(candidate)) || null
}

function runPreview(cli, projectRoot) {
  console.log(`Generating WeApp preview using DevTools CLI at ${cli}…`)
  execSync(`"${cli}" preview --project "${projectRoot}"`, { stdio: 'inherit' })
  console.log('Preview generated successfully')
}

async function main() {
  const root = process.cwd()
  const cli = resolveCli()

  if (!cli) {
    console.log('WeApp preview skipped: DevTools CLI not installed.')
    return
  }

  try {
    runPreview(cli, path.resolve(root))
  } catch (error) {
    console.error('Preview failed:', error.message)
    process.exit(1)
  }
}

main().catch((error) => {
  console.error('WeApp deploy failed:', error)
  process.exit(1)
})
