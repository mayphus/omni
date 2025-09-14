import { describe, it, expect } from 'vitest'
import { execSync } from 'node:child_process'
import fs from 'node:fs'

function run(cmd: string) {
  execSync(cmd, { stdio: 'pipe' })
}

describe('build pipeline', () => {
  it('builds weapp output', () => {
    run('npm run -s build:weapp')
    run('npm run -s build:weapp:npm')
    expect(fs.existsSync('weapp/app.json')).toBe(true)
    expect(fs.existsSync('weapp/pages/index/index.js')).toBe(true)
    const json = fs.readFileSync('weapp/pages/index/index.json', 'utf-8')
    expect(json).toContain('van-button')
    // Ensure NPM prebuild exists for Vant components
    expect(fs.existsSync('weapp/miniprogram_npm/@vant/weapp/button/index.js')).toBe(true)
  })

  it('builds functions output', () => {
    run('npm run -s build:functions')
    expect(fs.existsSync('functions/shop/index.js')).toBe(true)
    expect(fs.existsSync('functions/shop/package.json')).toBe(true)
  })

  it('builds admin output', () => {
    run('npm run -s build:admin')
    expect(fs.existsSync('admin/index.html')).toBe(true)
  })
})
