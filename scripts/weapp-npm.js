#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function createWeappNpmManager(options = {}) {
  const {
    fsModule = fs,
    exec = execSync,
    logger = console,
    rootDir = path.join(__dirname, '..'),
  } = options;

  const miniprogramNpmDir = path.join(rootDir, 'weapp', 'miniprogram_npm');
  const vantTargetDir = path.join(miniprogramNpmDir, '@vant', 'weapp');
  const vantSourceDir = path.join(rootDir, 'src', 'weapp', 'node_modules', '@vant', 'weapp', 'dist');

  function hasVantComponents() {
    const searchEntry = path.join(vantTargetDir, 'search', 'index.js');
    return fsModule.existsSync(searchEntry);
  }

  function copyVantComponents() {
    if (!fsModule.existsSync(vantSourceDir)) return false;
    fsModule.rmSync(vantTargetDir, { recursive: true, force: true });
    fsModule.mkdirSync(vantTargetDir, { recursive: true });
    fsModule.cpSync(vantSourceDir, vantTargetDir, { recursive: true });
    return hasVantComponents();
  }

  function ensureMiniprogramNpm() {
    if (!fsModule.existsSync(miniprogramNpmDir)) {
      fsModule.mkdirSync(miniprogramNpmDir, { recursive: true });
    }

    if (hasVantComponents()) {
      logger.log('Vant components already prepared.');
      return;
    }

    try {
      logger.log('miniprogram_npm missing components, running build:weapp:npm...');
      exec('pnpm run build:weapp:npm', { stdio: 'inherit' });
      if (hasVantComponents()) return;
      logger.warn('build:weapp:npm completed but Vant components still missing.');
    } catch (error) {
      logger.warn('build:weapp:npm failed, attempting to copy Vant components locally.');
    }

    if (!copyVantComponents()) {
      throw new Error('Failed to prepare Vant components for miniprogram_npm.');
    }
    logger.log('Copied Vant components into miniprogram_npm.');
  }

  return {
    ensureMiniprogramNpm,
    hasVantComponents,
    copyVantComponents,
    paths: {
      rootDir,
      miniprogramNpmDir,
      vantTargetDir,
      vantSourceDir,
    },
  };
}

const manager = createWeappNpmManager();

if (require.main === module) {
  manager.ensureMiniprogramNpm();
}

module.exports = {
  createWeappNpmManager,
  ensureMiniprogramNpm: manager.ensureMiniprogramNpm,
  hasVantComponents: manager.hasVantComponents,
  copyVantComponents: manager.copyVantComponents,
  paths: manager.paths,
};
