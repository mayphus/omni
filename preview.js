import ci from 'miniprogram-ci';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment variables from .env.local
const envConfig = dotenv.parse(fs.readFileSync(path.join(__dirname, '.env.local')));

const project = new ci.Project({
  appid: envConfig.WECHAT_APP_ID || envConfig.VITE_WECHAT_APP_ID || 'wxc83ef584aa609be0',
  type: 'miniProgram',
  projectPath: path.join(__dirname, 'weapp'),
  privateKeyPath: path.join(__dirname, envConfig.WECHAT_PRIVATE_KEY_PATH || '.private-wx.key'),
  ignores: ['node_modules/**'],
});

const previewResult = await ci.preview({
  project,
  desc: 'ClojureScript version preview',
  setting: {
    es6: true,
    minify: false,
  },
  qrcodeFormat: 'image',
  qrcodeOutputDest: path.join(__dirname, 'preview.jpg'),
  onProgressUpdate: console.log,
});

console.log('Preview Result:', previewResult);
