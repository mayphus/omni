#!/usr/bin/env node
const path = require('node:path')
const fs = require('node:fs')
const ci = require('miniprogram-ci')

async function main() {
  const root = process.cwd()
  const projectConfig = JSON.parse(fs.readFileSync(path.join(root, 'project.config.json'), 'utf-8'))
  const appid = process.env.WECHAT_APP_ID || projectConfig.appid
  const projectPath = path.join(root, 'weapp')

  const privateKeyPath = process.env.WECHAT_PRIVATE_KEY_PATH || path.join(root, '.private-wx.key')
  if (!fs.existsSync(privateKeyPath)) {
    console.error('Private key not found. Set WECHAT_PRIVATE_KEY_PATH or place .private-wx.key at repo root.')
    process.exit(1)
  }

  const version = process.env.WX_VERSION || new Date().toISOString().replace(/[-:TZ]/g, '').slice(0, 12)
  const desc = process.env.WX_DESC || `Automated upload ${new Date().toISOString()}`

  const project = new ci.Project({
    appid,
    type: 'miniProgram',
    projectPath,
    privateKeyPath,
    ignores: ['node_modules/**/*', '**/.git/**/*']
  })

  console.log('Uploading WeApp…', { appid, projectPath, version })
  const result = await ci.upload({
    project,
    version,
    desc,
    robot: 1,
    setting: {
      es6: true,
      enhance: true,
      minifyJS: true,
      minifyWXML: true,
      minifyWXSS: true,
    },
    onProgressUpdate: console.log,
  })
  console.log('Upload done:', result)
}

main().catch((e) => {
  console.error('WeApp deploy failed:', e)
  process.exit(1)
})

