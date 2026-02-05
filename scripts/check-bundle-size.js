#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const DIST_DIR = 'dist/shopping-cart/browser';
const MAX_INITIAL_BUNDLE = 1 * 1024 * 1024; // 1MB
const MAX_WARNING_BUNDLE = 500 * 1024; // 500KB

console.log('📊 Analyzing bundle size...\n');

if (!fs.existsSync(DIST_DIR)) {
  console.error('❌ Error: Build output not found. Run build first.');
  process.exit(1);
}

const files = fs.readdirSync(DIST_DIR);
let totalSize = 0;
let hasError = false;
let hasWarning = false;

files.forEach(file => {
  if (file.endsWith('.js')) {
    const filePath = path.join(DIST_DIR, file);
    const stats = fs.statSync(filePath);
    const sizeKB = (stats.size / 1024).toFixed(2);
    
    totalSize += stats.size;
    
    let status = '✅';
    if (stats.size > MAX_INITIAL_BUNDLE) {
      status = '❌';
      hasError = true;
    } else if (stats.size > MAX_WARNING_BUNDLE) {
      status = '⚠️ ';
      hasWarning = true;
    }
    
    console.log(`${status} ${file}: ${sizeKB} KB`);
  }
});

console.log('\n' + '='.repeat(60));
console.log(`Total JavaScript size: ${(totalSize / 1024).toFixed(2)} KB (${(totalSize / (1024 * 1024)).toFixed(2)} MB)`);
console.log('='.repeat(60) + '\n');

if (hasError) {
  console.error('❌ Bundle size exceeds maximum limit (1MB per file)');
  console.error('   Consider code splitting or removing unused dependencies\n');
  process.exit(1);
} else if (hasWarning) {
  console.warn('⚠️  Bundle size exceeds warning threshold (500KB per file)');
  console.warn('   Consider optimizing bundle size\n');
} else {
  console.log('✅ Bundle size is within acceptable limits\n');
}

process.exit(0);
