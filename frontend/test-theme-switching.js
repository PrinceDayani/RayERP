#!/usr/bin/env node

/**
 * Theme Switching Test Script
 * Tests the theme switching functionality in RayERP
 */

const fs = require('fs');
const path = require('path');

console.log('🎨 RayERP Theme Switching Test');
console.log('================================\n');

// Test files to check
const testFiles = [
  'src/components/ThemeSwitcher.tsx',
  'src/components/theme-enforcer.tsx',
  'src/app/layout.tsx',
  'src/app/globals.css'
];

let allTestsPassed = true;

// Test 1: Check if theme files exist
console.log('1. Checking theme files...');
testFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`   ✅ ${file} exists`);
  } else {
    console.log(`   ❌ ${file} missing`);
    allTestsPassed = false;
  }
});

// Test 2: Check ThemeSwitcher implementation
console.log('\n2. Checking ThemeSwitcher implementation...');
try {
  const themeSwitcherContent = fs.readFileSync(path.join(__dirname, 'src/components/ThemeSwitcher.tsx'), 'utf8');
  
  const checks = [
    { test: 'useTheme hook', pattern: /useTheme.*from.*next-themes/ },
    { test: 'Theme options (light/dark/system)', pattern: /light.*dark.*system/ },
    { test: 'Enhanced UI with tooltips', pattern: /TooltipProvider/ },
    { test: 'Proper theme enforcement', pattern: /handleThemeChange/ },
    { test: 'Visual indicators', pattern: /Badge.*variant.*outline/ }
  ];
  
  checks.forEach(({ test, pattern }) => {
    if (pattern.test(themeSwitcherContent)) {
      console.log(`   ✅ ${test}`);
    } else {
      console.log(`   ❌ ${test}`);
      allTestsPassed = false;
    }
  });
} catch (error) {
  console.log(`   ❌ Error reading ThemeSwitcher: ${error.message}`);
  allTestsPassed = false;
}

// Test 3: Check CSS theme variables
console.log('\n3. Checking CSS theme variables...');
try {
  const cssContent = fs.readFileSync(path.join(__dirname, 'src/app/globals.css'), 'utf8');
  
  const cssChecks = [
    { test: 'Light theme variables', pattern: /:root\s*{[\s\S]*--background.*--foreground/ },
    { test: 'Dark theme variables', pattern: /\.dark\s*{[\s\S]*--background.*--foreground/ },
    { test: 'Smooth transitions', pattern: /transition.*duration.*ease/ },
    { test: 'Enhanced ERP theme variables', pattern: /--bg-primary.*--text-primary/ },
    { test: 'Theme utility classes', pattern: /\.bg-theme-primary.*\.text-theme-primary/ }
  ];
  
  cssChecks.forEach(({ test, pattern }) => {
    if (pattern.test(cssContent)) {
      console.log(`   ✅ ${test}`);
    } else {
      console.log(`   ❌ ${test}`);
      allTestsPassed = false;
    }
  });
} catch (error) {
  console.log(`   ❌ Error reading CSS: ${error.message}`);
  allTestsPassed = false;
}

// Test 4: Check layout configuration
console.log('\n4. Checking layout configuration...');
try {
  const layoutContent = fs.readFileSync(path.join(__dirname, 'src/app/layout.tsx'), 'utf8');
  
  const layoutChecks = [
    { test: 'ThemeProvider from next-themes', pattern: /ThemeProvider.*from.*next-themes/ },
    { test: 'Theme initialization script', pattern: /dangerouslySetInnerHTML/ },
    { test: 'Theme enforcer component', pattern: /<ThemeEnforcer/ },
    { test: 'Proper theme attributes', pattern: /attribute.*class/ },
    { test: 'System theme support', pattern: /enableSystem/ }
  ];
  
  layoutChecks.forEach(({ test, pattern }) => {
    if (pattern.test(layoutContent)) {
      console.log(`   ✅ ${test}`);
    } else {
      console.log(`   ❌ ${test}`);
      allTestsPassed = false;
    }
  });
} catch (error) {
  console.log(`   ❌ Error reading layout: ${error.message}`);
  allTestsPassed = false;
}

// Test 5: Check theme enforcer
console.log('\n5. Checking theme enforcer...');
try {
  const enforcerContent = fs.readFileSync(path.join(__dirname, 'src/components/theme-enforcer.tsx'), 'utf8');
  
  const enforcerChecks = [
    { test: 'Proper theme detection', pattern: /resolvedTheme/ },
    { test: 'DOM manipulation', pattern: /classList.*add.*remove/ },
    { test: 'System theme listener', pattern: /matchMedia.*prefers-color-scheme/ },
    { test: 'Color scheme setting', pattern: /colorScheme/ },
    { test: 'Force repaint logic', pattern: /requestAnimationFrame/ }
  ];
  
  enforcerChecks.forEach(({ test, pattern }) => {
    if (pattern.test(enforcerContent)) {
      console.log(`   ✅ ${test}`);
    } else {
      console.log(`   ❌ ${test}`);
      allTestsPassed = false;
    }
  });
} catch (error) {
  console.log(`   ❌ Error reading theme enforcer: ${error.message}`);
  allTestsPassed = false;
}

// Final result
console.log('\n================================');
if (allTestsPassed) {
  console.log('🎉 All theme tests passed!');
  console.log('\n✨ Theme switching should work properly:');
  console.log('   • Light mode: Clean and bright interface');
  console.log('   • Dark mode: Easy on the eyes with proper contrast');
  console.log('   • System mode: Follows OS preference automatically');
  console.log('   • Smooth transitions between themes');
  console.log('   • Enhanced UI with tooltips and visual feedback');
  console.log('\n🚀 Ready to test in browser!');
} else {
  console.log('❌ Some theme tests failed. Please check the implementation.');
}

console.log('\n📋 Manual Testing Steps:');
console.log('1. Start the development server: npm run dev');
console.log('2. Navigate to the dashboard');
console.log('3. Click the theme toggle in the navbar');
console.log('4. Verify smooth transitions between light/dark modes');
console.log('5. Test system theme detection');
console.log('6. Check that all UI components adapt to theme changes');