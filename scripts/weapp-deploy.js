#!/usr/bin/env node
const { execSync } = require('node:child_process')

async function main() {
  const root = process.cwd()
  const cli = process.env.WECHAT_DEVTOOLS_CLI || '/Applications/wechatwebdevtools.app/Contents/MacOS/cli'

  console.log('Generating WeApp preview using DevTools CLI…')

  try {
    execSync(`"${cli}" preview --project ${root}`, { stdio: 'inherit' })
    console.log('Preview generated successfully')
  } catch (error) {
    console.error('Preview failed:', error.message)
    process.exit(1)
  }
}

main().catch((e) => {
  console.error('WeApp deploy failed:', e)
  process.exit(1)
})

