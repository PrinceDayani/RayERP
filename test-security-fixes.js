#!/usr/bin/env node

/**
 * RayERP Security Test Suite
 * Tests all security fixes and validates system security
 */

const fs = require('fs');
const path = require('path');

class SecurityTester {
  constructor() {
    this.baseUrl = process.env.API_URL || 'http://localhost:5000';
    this.results = {
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const colors = {
      info: '\x1b[36m',
      success: '\x1b[32m',
      error: '\x1b[31m',
      warning: '\x1b[33m',
      reset: '\x1b[0m'
    };
    
    console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
  }

  async test(name, testFn) {
    try {
      this.log(`Testing: ${name}`, 'info');
      await testFn();
      this.results.passed++;
      this.results.tests.push({ name, status: 'PASSED' });
      this.log(`✓ ${name}`, 'success');
    } catch (error) {
      this.results.failed++;
      this.results.tests.push({ name, status: 'FAILED', error: error.message });
      this.log(`✗ ${name}: ${error.message}`, 'error');
    }
  }

  // Test 1: Environment Variables Security
  async testEnvironmentSecurity() {
    await this.test('Environment Variables Security', async () => {
      const backendEnv = path.join(__dirname, 'backend', '.env');
      const frontendEnv = path.join(__dirname, 'frontend', '.env');
      
      // Check if .env files exist and don't contain hardcoded credentials
      if (fs.existsSync(backendEnv)) {
        const content = fs.readFileSync(backendEnv, 'utf8');
        if (content.includes('princedayani10') || content.includes('90901010Pp')) {
          throw new Error('Hardcoded credentials found in backend .env');
        }
      }
      
      // Check if .env.example files exist
      const backendExample = path.join(__dirname, 'backend', '.env.example');
      const frontendExample = path.join(__dirname, 'frontend', '.env.example');
      
      if (!fs.existsSync(backendExample)) {
        throw new Error('Backend .env.example file missing');
      }
      
      if (!fs.existsSync(frontendExample)) {
        throw new Error('Frontend .env.example file missing');
      }
    });
  }

  // Test 2: File Structure Security
  async testFileStructureSecurity() {
    await this.test('File Structure Security', async () => {
      const securityFiles = [
        'backend/src/middleware/validation.middleware.ts',
        'backend/src/middleware/csrf.middleware.ts',
        'SECURITY_GUIDE.md'
      ];
      
      for (const file of securityFiles) {
        const filePath = path.join(__dirname, file);
        if (!fs.existsSync(filePath)) {
          throw new Error(`Security file missing: ${file}`);
        }
      }
    });
  }

  // Test 3: Code Security (Static Analysis)
  async testCodeSecurity() {
    await this.test('Code Security Analysis', async () => {
      const routesDir = path.join(__dirname, 'backend', 'src', 'routes');
      
      if (!fs.existsSync(routesDir)) {
        throw new Error('Routes directory not found');
      }
      
      const routeFiles = fs.readdirSync(routesDir).filter(f => f.endsWith('.ts'));
      
      for (const file of routeFiles) {
        const filePath = path.join(routesDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Check for dangerous patterns (ignore comments)
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          if (line.includes('eval(') && !line.startsWith('//') && !line.startsWith('*')) {
            throw new Error(`Dangerous eval() found in ${file} at line ${i + 1}`);
          }
        }
        
        if (content.includes('process.env.NODE_ENV === \'development\'') && 
            content.includes('req.user = {')) {
          throw new Error(`Dangerous development bypass found in ${file}`);
        }
        
        // Check for proper authentication
        if (!content.includes('authenticateToken') && !content.includes('auth.middleware')) {
          this.log(`Warning: ${file} may be missing authentication`, 'warning');
        }
      }
    });
  }

  // Test 4: API Security Configuration
  async testAPISecurityConfiguration() {
    await this.test('API Security Configuration', async () => {
      const serverFile = path.join(__dirname, 'backend', 'src', 'server.ts');
      
      if (!fs.existsSync(serverFile)) {
        throw new Error('Server configuration file not found');
      }
      
      const content = fs.readFileSync(serverFile, 'utf8');
      
      // Check for helmet configuration
      if (!content.includes('helmet')) {
        this.log('Warning: Helmet security middleware not configured', 'warning');
      }
      
      // Check for CORS configuration
      if (!content.includes('cors')) {
        throw new Error('CORS configuration missing');
      }
    });
  }

  // Test 5: Input Validation
  async testInputValidation() {
    await this.test('Input Validation Implementation', async () => {
      const validationFile = path.join(__dirname, 'backend', 'src', 'middleware', 'validation.middleware.ts');
      
      if (!fs.existsSync(validationFile)) {
        throw new Error('Validation middleware file not found');
      }
      
      const content = fs.readFileSync(validationFile, 'utf8');
      
      // Check for validation functions
      const requiredValidations = [
        'validateJournalEntry',
        'validateMongoId',
        'sanitizeInput',
        'handleValidationErrors'
      ];
      
      for (const validation of requiredValidations) {
        if (!content.includes(validation)) {
          throw new Error(`Missing validation function: ${validation}`);
        }
      }
    });
  }

  // Test 6: CSRF Protection
  async testCSRFProtection() {
    await this.test('CSRF Protection Implementation', async () => {
      const csrfFile = path.join(__dirname, 'backend', 'src', 'middleware', 'csrf.middleware.ts');
      
      if (!fs.existsSync(csrfFile)) {
        throw new Error('CSRF middleware file not found');
      }
      
      const content = fs.readFileSync(csrfFile, 'utf8');
      
      // Check for CSRF functions
      const requiredFunctions = [
        'csrfProtection',
        'generateCSRFToken',
        'provideCSRFToken'
      ];
      
      for (const func of requiredFunctions) {
        if (!content.includes(func)) {
          throw new Error(`Missing CSRF function: ${func}`);
        }
      }
    });
  }

  // Test 7: File Upload Security
  async testFileUploadSecurity() {
    await this.test('File Upload Security', async () => {
      const journalRoutes = path.join(__dirname, 'backend', 'src', 'routes', 'journalEntry.routes.ts');
      
      if (!fs.existsSync(journalRoutes)) {
        throw new Error('Journal entry routes file not found');
      }
      
      const content = fs.readFileSync(journalRoutes, 'utf8');
      
      // Check for secure file upload implementation
      if (!content.includes('validateFileUpload')) {
        throw new Error('File upload validation missing');
      }
      
      if (!content.includes('fileFilter')) {
        throw new Error('File type filtering missing');
      }
      
      if (!content.includes('limits:')) {
        throw new Error('File size limits missing');
      }
    });
  }

  // Test 8: Package Security
  async testPackageSecurity() {
    await this.test('Package Security', async () => {
      const backendPackage = path.join(__dirname, 'backend', 'package.json');
      const frontendPackage = path.join(__dirname, 'frontend', 'package.json');
      
      // Check if package.json files exist
      if (!fs.existsSync(backendPackage)) {
        throw new Error('Backend package.json not found');
      }
      
      if (!fs.existsSync(frontendPackage)) {
        throw new Error('Frontend package.json not found');
      }
      
      // Check for security-related packages
      const backendPkg = JSON.parse(fs.readFileSync(backendPackage, 'utf8'));
      
      const securityPackages = ['helmet', 'express-rate-limit', 'express-validator'];
      for (const pkg of securityPackages) {
        if (!backendPkg.dependencies[pkg] && !backendPkg.devDependencies[pkg]) {
          this.log(`Warning: Security package ${pkg} not found`, 'warning');
        }
      }
    });
  }

  // Test 9: Configuration Security
  async testConfigurationSecurity() {
    await this.test('Configuration Security', async () => {
      const serverFile = path.join(__dirname, 'backend', 'src', 'server.ts');
      
      if (!fs.existsSync(serverFile)) {
        throw new Error('Server configuration file not found');
      }
      
      const content = fs.readFileSync(serverFile, 'utf8');
      
      // Check for security configurations
      if (!content.includes('helmet')) {
        this.log('Warning: Helmet security middleware not found', 'warning');
      }
      
      if (!content.includes('cors')) {
        throw new Error('CORS configuration missing');
      }
      
      if (!content.includes('express.json({ limit:')) {
        this.log('Warning: Request size limits not configured', 'warning');
      }
    });
  }

  // Test 10: Documentation Security
  async testDocumentationSecurity() {
    await this.test('Security Documentation', async () => {
      const securityGuide = path.join(__dirname, 'SECURITY_GUIDE.md');
      
      if (!fs.existsSync(securityGuide)) {
        throw new Error('Security guide documentation missing');
      }
      
      const content = fs.readFileSync(securityGuide, 'utf8');
      
      // Check for essential security topics
      const requiredTopics = [
        'Environment Variables',
        'Authentication',
        'Input Validation',
        'CSRF Protection',
        'File Upload Security'
      ];
      
      for (const topic of requiredTopics) {
        if (!content.includes(topic)) {
          throw new Error(`Security guide missing topic: ${topic}`);
        }
      }
    });
  }

  // Run all tests
  async runAllTests() {
    this.log('Starting RayERP Security Test Suite', 'info');
    this.log('=====================================', 'info');
    
    await this.testEnvironmentSecurity();
    await this.testFileStructureSecurity();
    await this.testCodeSecurity();
    await this.testAPISecurityConfiguration();
    await this.testInputValidation();
    await this.testCSRFProtection();
    await this.testFileUploadSecurity();
    await this.testPackageSecurity();
    await this.testConfigurationSecurity();
    await this.testDocumentationSecurity();
    
    this.log('=====================================', 'info');
    this.log(`Test Results: ${this.results.passed} passed, ${this.results.failed} failed`, 
             this.results.failed > 0 ? 'error' : 'success');
    
    if (this.results.failed > 0) {
      this.log('Failed Tests:', 'error');
      this.results.tests
        .filter(t => t.status === 'FAILED')
        .forEach(t => this.log(`  - ${t.name}: ${t.error}`, 'error'));
    }
    
    return this.results.failed === 0;
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new SecurityTester();
  tester.runAllTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test suite failed:', error);
      process.exit(1);
    });
}

module.exports = SecurityTester;