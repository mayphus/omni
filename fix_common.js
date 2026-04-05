const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'weapp', 'common.js');

let content = fs.readFileSync(file, 'utf8');

// Remove IIFE wrapper
if (content.startsWith('(function(){')) {
  content = content.replace(/^\(function\(\)\{/, '').replace(/\}\)\.call\(this\);$/, '').trim();
  fs.writeFileSync(file, content, 'utf8');
  console.log('Fixed common.js');
} else {
  console.log('common.js not wrapped in IIFE');
}
