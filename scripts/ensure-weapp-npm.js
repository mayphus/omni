#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const miniprogram_npm = path.join(__dirname, '..', 'weapp', 'miniprogram_npm');

if (!fs.existsSync(miniprogram_npm)) {
  console.log('miniprogram_npm not found, running build:weapp:npm...');
  execSync('npm run build:weapp:npm', { stdio: 'inherit' });
} else {
  console.log('miniprogram_npm already exists, skipping build.');
}