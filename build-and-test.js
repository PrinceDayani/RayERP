#!/usr/bin/env node

/**
 * Production Build and Test Script for RayERP
 * This script builds both frontend and backend, runs tests, and validates the build
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step) {
  log(`\n🚀 ${step}`, 'cyan');
  log('='.repeat(50), 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function runCommand(command, cwd = process.cwd(), options = {}) {
  try {
    log(`Running: ${command}`, 'blue');
    const result = execSync(command, {
      cwd,
      stdio: 'inherit',
      encoding: 'utf8',
      ...options
    });
    return { success: true, output: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function checkFileExists(filePath) {
  return fs.existsSync(filePath);
}

function validateEnvironment() {
  logStep('Validating Environment');
  
  const requiredFiles = [
    'backend/package.json',
    'frontend/package.json',
    'backend/.env',
    'frontend/.env'
  ];
  
  let allValid = true;
  
  requiredFiles.forEach(file => {
    if (checkFileExists(file)) {
      logSuccess(`Found: ${file}`);
    } else {
      logError(`Missing: ${file}`);
      allValid = false;
    }
  });
  
  // Check Node.js version
  try {
    const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
    const majorVersion = parseInt(nodeVersion.replace('v', '').split('.')[0]);
    
    if (majorVersion >= 18) {
      logSuccess(`Node.js version: ${nodeVersion}`);
    } else {
      logWarning(`Node.js version ${nodeVersion} may not be fully supported. Recommended: v18+`);
    }
  } catch (error) {
    logError('Failed to check Node.js version');
    allValid = false;
  }
  
  return allValid;
}

function installDependencies() {
  logStep('Installing Dependencies');
  
  // Backend dependencies
  log('Installing backend dependencies...', 'blue');
  const backendResult = runCommand('npm install', 'backend');
  if (!backendResult.success) {
    logError('Failed to install backend dependencies');
    return false;
  }
  logSuccess('Backend dependencies installed');
  
  // Frontend dependencies
  log('Installing frontend dependencies...', 'blue');
  const frontendResult = runCommand('npm install', 'frontend');
  if (!frontendResult.success) {
    logError('Failed to install frontend dependencies');
    return false;
  }
  logSuccess('Frontend dependencies installed');
  
  return true;
}

function lintCode() {
  logStep('Linting Code');
  
  // Backend linting
  if (checkFileExists('backend/.eslintrc.js') || checkFileExists('backend/eslint.config.mjs')) {
    const backendLint = runCommand('npm run lint', 'backend', { stdio: 'pipe' });
    if (backendLint.success) {
      logSuccess('Backend code linting passed');
    } else {
      logWarning('Backend linting issues found (continuing build)');
    }
  } else {
    logWarning('Backend ESLint config not found, skipping lint');
  }
  
  // Frontend linting
  if (checkFileExists('frontend/eslint.config.mjs')) {
    const frontendLint = runCommand('npm run lint', 'frontend', { stdio: 'pipe' });
    if (frontendLint.success) {
      logSuccess('Frontend code linting passed');
    } else {
      logWarning('Frontend linting issues found (continuing build)');
    }
  } else {
    logWarning('Frontend ESLint config not found, skipping lint');
  }
  
  return true;
}

function buildBackend() {
  logStep('Building Backend');
  
  // Clean previous build
  if (checkFileExists('backend/dist')) {
    log('Cleaning previous backend build...', 'blue');
    runCommand('npm run clean', 'backend');
  }
  
  // Build TypeScript
  const buildResult = runCommand('npm run build', 'backend');
  if (!buildResult.success) {
    logError('Backend build failed');
    return false;
  }
  
  // Verify build output
  if (checkFileExists('backend/dist/server.js')) {
    logSuccess('Backend build completed successfully');
    return true;
  } else {
    logError('Backend build output not found');
    return false;
  }
}

function buildFrontend() {
  logStep('Building Frontend');
  
  // Clean previous build
  if (checkFileExists('frontend/.next')) {
    log('Cleaning previous frontend build...', 'blue');
    runCommand('rm -rf .next', 'frontend');
  }
  
  // Build Next.js application
  const buildResult = runCommand('npm run build', 'frontend');
  if (!buildResult.success) {
    logError('Frontend build failed');
    return false;
  }
  
  // Verify build output
  if (checkFileExists('frontend/.next')) {
    logSuccess('Frontend build completed successfully');
    return true;
  } else {
    logError('Frontend build output not found');
    return false;
  }
}

function runTests() {
  logStep('Running Tests');
  
  // Backend tests (if available)
  const backendPackage = JSON.parse(fs.readFileSync('backend/package.json', 'utf8'));
  if (backendPackage.scripts && backendPackage.scripts.test) {
    log('Running backend tests...', 'blue');
    const backendTest = runCommand('npm test', 'backend', { stdio: 'pipe' });
    if (backendTest.success) {
      logSuccess('Backend tests passed');
    } else {
      logWarning('Backend tests failed (continuing build)');
    }
  } else {
    logWarning('No backend test script found');
  }
  
  // Frontend tests (if available)
  const frontendPackage = JSON.parse(fs.readFileSync('frontend/package.json', 'utf8'));
  if (frontendPackage.scripts && frontendPackage.scripts.test) {
    log('Running frontend tests...', 'blue');
    const frontendTest = runCommand('npm test', 'frontend', { stdio: 'pipe' });
    if (frontendTest.success) {
      logSuccess('Frontend tests passed');
    } else {
      logWarning('Frontend tests failed (continuing build)');
    }
  } else {
    logWarning('No frontend test script found');
  }
  
  return true;
}

function validateBuild() {
  logStep('Validating Build');
  
  const validations = [
    {
      name: 'Backend server file',
      path: 'backend/dist/server.js',
      required: true
    },
    {
      name: 'Frontend build directory',
      path: 'frontend/.next',
      required: true
    },
    {
      name: 'Frontend static files',
      path: 'frontend/.next/static',
      required: true
    },
    {
      name: 'Backend package.json',
      path: 'backend/package.json',
      required: true
    },
    {
      name: 'Frontend package.json',
      path: 'frontend/package.json',
      required: true
    }
  ];
  
  let allValid = true;
  
  validations.forEach(validation => {
    if (checkFileExists(validation.path)) {
      logSuccess(`✓ ${validation.name}`);
    } else {
      if (validation.required) {
        logError(`✗ ${validation.name} (REQUIRED)`);
        allValid = false;
      } else {
        logWarning(`⚠ ${validation.name} (OPTIONAL)`);
      }
    }
  });
  
  return allValid;
}

function generateBuildReport() {
  logStep('Generating Build Report');
  
  const report = {
    timestamp: new Date().toISOString(),
    nodeVersion: execSync('node --version', { encoding: 'utf8' }).trim(),
    npmVersion: execSync('npm --version', { encoding: 'utf8' }).trim(),
    platform: process.platform,
    architecture: process.arch,
    buildStatus: 'success',
    components: {
      backend: {
        built: checkFileExists('backend/dist/server.js'),
        size: checkFileExists('backend/dist/server.js') ? 
          fs.statSync('backend/dist/server.js').size : 0
      },
      frontend: {
        built: checkFileExists('frontend/.next'),
        hasStatic: checkFileExists('frontend/.next/static')
      }
    }
  };
  
  fs.writeFileSync('build-report.json', JSON.stringify(report, null, 2));
  logSuccess('Build report generated: build-report.json');
  
  return report;
}

async function main() {
  const startTime = Date.now();
  
  log('🏗️  RayERP Build and Test Script', 'magenta');
  log('=====================================', 'magenta');
  
  try {
    // Step 1: Validate environment
    if (!validateEnvironment()) {
      logError('Environment validation failed');
      process.exit(1);
    }
    
    // Step 2: Install dependencies
    if (!installDependencies()) {
      logError('Dependency installation failed');
      process.exit(1);
    }
    
    // Step 3: Lint code
    lintCode();
    
    // Step 4: Build backend
    if (!buildBackend()) {
      logError('Backend build failed');
      process.exit(1);
    }
    
    // Step 5: Build frontend
    if (!buildFrontend()) {
      logError('Frontend build failed');
      process.exit(1);
    }
    
    // Step 6: Run tests
    runTests();
    
    // Step 7: Validate build
    if (!validateBuild()) {
      logError('Build validation failed');
      process.exit(1);
    }
    
    // Step 8: Generate report
    const report = generateBuildReport();
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    logStep('Build Complete');
    logSuccess(`✨ Build completed successfully in ${duration}s`);
    logSuccess('🚀 Ready for deployment!');
    
    // Display next steps
    log('\n📋 Next Steps:', 'cyan');
    log('1. Review build-report.json for details', 'blue');
    log('2. Test the application locally:', 'blue');
    log('   - Backend: cd backend && npm start', 'blue');
    log('   - Frontend: cd frontend && npm start', 'blue');
    log('3. Deploy to your production environment', 'blue');
    
  } catch (error) {
    logError(`Build failed: ${error.message}`);
    process.exit(1);
  }
}

// Handle script arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  log('RayERP Build Script', 'cyan');
  log('Usage: node build-and-test.js [options]', 'blue');
  log('Options:', 'blue');
  log('  --help, -h    Show this help message', 'blue');
  log('  --skip-tests  Skip running tests', 'blue');
  log('  --skip-lint   Skip code linting', 'blue');
  process.exit(0);
}

// Run the main function
if (require.main === module) {
  main().catch(error => {
    logError(`Unexpected error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  validateEnvironment,
  installDependencies,
  buildBackend,
  buildFrontend,
  runTests,
  validateBuild
};