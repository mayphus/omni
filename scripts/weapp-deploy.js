#!/usr/bin/env node
const fs = require('node:fs')
const path = require('node:path')
const { execSync } = require('node:child_process')

function createWeappDeploy(options = {}) {
  const {
    fsModule = fs,
    exec = execSync,
    env = process.env,
    cwd = () => process.cwd(),
    logger = console,
    proc = process,
  } = options

  function resolveCli() {
    const configured = env.WECHAT_DEVTOOLS_CLI && env.WECHAT_DEVTOOLS_CLI.trim()
    if (configured) {
      if (fsModule.existsSync(configured)) {
        return configured
      }
      logger.warn(`WeApp preview skipped: configured WECHAT_DEVTOOLS_CLI not found at ${configured}`)
      return null
    }

    const candidates = [
      '/Applications/wechatwebdevtools.app/Contents/MacOS/cli',
      '/Applications/WeChatwebDevTools.app/Contents/MacOS/cli',
    ]

    return candidates.find((candidate) => fsModule.existsSync(candidate)) || null
  }

  function runPreview(cli, projectRoot) {
    logger.log(`Generating WeApp preview using DevTools CLI at ${cli}…`)
    exec(`"${cli}" preview --project "${projectRoot}"`, { stdio: 'inherit' })
    logger.log('Preview generated successfully')
  }

  async function main() {
    const root = cwd()
    const cli = resolveCli()

    if (!cli) {
      logger.log('WeApp preview skipped: DevTools CLI not installed.')
      return
    }

    try {
      runPreview(cli, path.resolve(root))
    } catch (error) {
      logger.error('Preview failed:', error.message)
      proc.exit(1)
    }
  }

  return { resolveCli, runPreview, main }
}

const deploy = createWeappDeploy()

if (require.main === module) {
  deploy
    .main()
    .catch((error) => {
      console.error('WeApp deploy failed:', error)
      process.exit(1)
    })
}

module.exports = {
  createWeappDeploy,
  resolveCli: deploy.resolveCli,
  runPreview: deploy.runPreview,
  main: deploy.main,
}
