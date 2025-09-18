#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.join(__dirname, '..');
const miniprogramNpmDir = path.join(root, 'weapp', 'miniprogram_npm');
const vantTargetDir = path.join(miniprogramNpmDir, '@vant', 'weapp');
const vantSourceDir = path.join(root, 'src', 'weapp', 'node_modules', '@vant', 'weapp', 'dist');

function hasVantComponents() {
  const searchEntry = path.join(vantTargetDir, 'search', 'index.js');
  return fs.existsSync(searchEntry);
}

function copyVantComponents() {
  if (!fs.existsSync(vantSourceDir)) return false;
  fs.rmSync(vantTargetDir, { recursive: true, force: true });
  fs.mkdirSync(vantTargetDir, { recursive: true });
  fs.cpSync(vantSourceDir, vantTargetDir, { recursive: true });
  return hasVantComponents();
}

function ensureMiniprogramNpm() {
  if (!fs.existsSync(miniprogramNpmDir)) {
    fs.mkdirSync(miniprogramNpmDir, { recursive: true });
  }

  if (hasVantComponents()) {
    console.log('Vant components already prepared.');
    return;
  }

  try {
    console.log('miniprogram_npm missing components, running build:weapp:npm...');
    execSync('npm run build:weapp:npm', { stdio: 'inherit' });
    if (hasVantComponents()) return;
    console.warn('build:weapp:npm completed but Vant components still missing.');
  } catch (error) {
    console.warn('build:weapp:npm failed, attempting to copy Vant components locally.');
  }

  if (!copyVantComponents()) {
    throw new Error('Failed to prepare Vant components for miniprogram_npm.');
  }
  console.log('Copied Vant components into miniprogram_npm.');
}

ensureMiniprogramNpm();
