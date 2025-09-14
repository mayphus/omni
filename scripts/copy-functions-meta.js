#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const srcDir = path.resolve(__dirname, '../src/functions/shop')
const outDir = path.resolve(__dirname, '../functions/shop')

const filesToCopy = ['package.json']

for (const file of filesToCopy) {
  const src = path.join(srcDir, file)
  const dest = path.join(outDir, file)
  if (!fs.existsSync(src)) continue
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  fs.copyFileSync(src, dest)
  console.log(`Copied ${path.relative(process.cwd(), src)} -> ${path.relative(process.cwd(), dest)}`)
}

