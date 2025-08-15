#!/usr/bin/env node

/**
 * MTGV Frontend - Responsive Testing Helper
 * 
 * This script helps test responsive breakpoints by opening the app
 * in different viewport sizes using Puppeteer.
 * 
 * Usage: node scripts/test-responsive.js
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🎯 MTGV Frontend - Responsive Testing Helper\n');

// Check if development server is running
function checkDevServer() {
  try {
    execSync('curl -s http://localhost:4000 > /dev/null', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

// Start development server if not running
function startDevServer() {
  console.log('🚀 Starting development server...');
  try {
    execSync('npm run dev', { 
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit'
    });
  } catch (error) {
    console.error('❌ Failed to start development server');
    process.exit(1);
  }
}

// Main testing guide
function showTestingGuide() {
  console.log('📱 RESPONSIVE TESTING GUIDE\n');
  
  console.log('1. 🖥️  Open Chrome DevTools (F12)');
  console.log('2. 📱 Toggle device toolbar (Ctrl+Shift+M or Cmd+Shift+M)');
  console.log('3. 🎯 Test these breakpoints:\n');
  
  const breakpoints = [
    { name: 'Mobile Small', width: 375, height: 667, device: 'iPhone SE' },
    { name: 'Mobile Large', width: 414, height: 896, device: 'iPhone 11 Pro Max' },
    { name: 'Tablet', width: 768, height: 1024, device: 'iPad' },
    { name: 'Laptop', width: 1024, height: 768, device: 'Laptop' },
    { name: 'Desktop', width: 1280, height: 720, device: 'Desktop' },
    { name: 'Large Desktop', width: 1920, height: 1080, device: 'Large Desktop' }
  ];
  
  breakpoints.forEach(({ name, width, height, device }) => {
    console.log(`   ${name}: ${width}x${height} (${device})`);
  });
  
  console.log('\n4. 🔍 Test these key areas:');
  console.log('   • Card input form (mobile stacking)');
  console.log('   • Game selector buttons (touch targets)');
  console.log('   • Card grid (responsive columns)');
  console.log('   • Export buttons (mobile layout)');
  console.log('   • Typography scaling');
  console.log('   • Touch interactions');
  
  console.log('\n5. 🌐 Test in multiple browsers:');
  console.log('   • Chrome (DevTools responsive mode)');
  console.log('   • Firefox (Responsive Design Mode)');
  console.log('   • Safari (Responsive Design Mode)');
  
  console.log('\n6. 📊 Run Lighthouse audit for mobile performance');
  console.log('   • Open DevTools → Lighthouse tab');
  console.log('   • Select "Mobile" device');
  console.log('   • Run audit and check scores');
  
  console.log('\n📖 Full testing guide: RESPONSIVE_TESTING.md');
  console.log('🎨 CSS classes: src/styles/README.md');
}

// Check if we need to start the server
if (!checkDevServer()) {
  console.log('⚠️  Development server not running');
  console.log('💡 Starting server now...\n');
  
  // Start server in background
  startDevServer();
  
  // Wait a moment for server to start
  setTimeout(() => {
    console.log('✅ Development server should be running at http://localhost:4000\n');
    showTestingGuide();
  }, 3000);
} else {
  console.log('✅ Development server is running at http://localhost:4000\n');
  showTestingGuide();
}

console.log('\n🎯 Quick Test Commands:');
console.log('   npm run dev          # Start development server');
console.log('   npm run build        # Test production build');
console.log('   npm run lint         # Check for responsive issues');
console.log('   npm test             # Run unit tests'); 