#!/usr/bin/env node

/**
 * RayERP Secure Setup Script
 * Automates the secure installation and configuration of RayERP
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

class SecureSetup {
  constructor() {
    this.projectRoot = __dirname;
    this.backendPath = path.join(this.projectRoot, 'backend');
    this.frontendPath = path.join(this.projectRoot, 'frontend');
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

  // Generate secure JWT secret
  generateJWTSecret() {
    return crypto.randomBytes(64).toString('hex');
  }

  // Setup environment files
  setupEnvironmentFiles() {
    this.log('Setting up environment files...', 'info');

    // Backend environment
    const backendEnvPath = path.join(this.backendPath, '.env');
    const backendEnvExamplePath = path.join(this.backendPath, '.env.example');

    if (!fs.existsSync(backendEnvPath) && fs.existsSync(backendEnvExamplePath)) {
      let envContent = fs.readFileSync(backendEnvExamplePath, 'utf8');
      
      // Replace placeholders with actual values
      const jwtSecret = this.generateJWTSecret();
      envContent = envContent.replace('<your-jwt-secret-key>', jwtSecret);
      envContent = envContent.replace('<your-mongodb-connection-string>', 'mongodb://localhost:27017/rayerp');
      
      fs.writeFileSync(backendEnvPath, envContent);
      this.log('✓ Backend .env file created with secure defaults', 'success');
    }

    // Frontend environment
    const frontendEnvPath = path.join(this.frontendPath, '.env');
    const frontendEnvExamplePath = path.join(this.frontendPath, '.env.example');

    if (!fs.existsSync(frontendEnvPath) && fs.existsSync(frontendEnvExamplePath)) {
      const envContent = fs.readFileSync(frontendEnvExamplePath, 'utf8');
      fs.writeFileSync(frontendEnvPath, envContent);
      this.log('✓ Frontend .env file created', 'success');
    }
  }

  // Install dependencies
  installDependencies() {
    this.log('Installing dependencies...', 'info');

    try {
      // Backend dependencies
      this.log('Installing backend dependencies...', 'info');
      process.chdir(this.backendPath);
      execSync('npm install', { stdio: 'inherit' });

      // Frontend dependencies
      this.log('Installing frontend dependencies...', 'info');
      process.chdir(this.frontendPath);
      execSync('npm install', { stdio: 'inherit' });

      process.chdir(this.projectRoot);
      this.log('✓ All dependencies installed successfully', 'success');
    } catch (error) {
      this.log(`✗ Error installing dependencies: ${error.message}`, 'error');
      throw error;
    }
  }

  // Create necessary directories
  createDirectories() {
    this.log('Creating necessary directories...', 'info');

    const directories = [
      path.join(this.backendPath, 'uploads'),
      path.join(this.backendPath, 'uploads', 'journal-entries'),
      path.join(this.backendPath, 'uploads', 'projects'),
      path.join(this.backendPath, 'uploads', 'chat'),
      path.join(this.backendPath, 'logs')
    ];

    directories.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        this.log(`✓ Created directory: ${dir}`, 'success');
      }
    });
  }

  // Set file permissions (Unix-like systems)
  setFilePermissions() {
    if (process.platform !== 'win32') {
      this.log('Setting secure file permissions...', 'info');

      try {
        // Secure environment files
        const envFiles = [
          path.join(this.backendPath, '.env'),
          path.join(this.frontendPath, '.env')
        ];

        envFiles.forEach(file => {
          if (fs.existsSync(file)) {
            execSync(`chmod 600 "${file}"`);
            this.log(`✓ Secured permissions for ${file}`, 'success');
          }
        });

        // Secure upload directories
        const uploadDir = path.join(this.backendPath, 'uploads');
        if (fs.existsSync(uploadDir)) {
          execSync(`chmod 755 "${uploadDir}"`);
          this.log(`✓ Set permissions for uploads directory`, 'success');
        }
      } catch (error) {
        this.log(`Warning: Could not set file permissions: ${error.message}`, 'warning');
      }
    }
  }

  // Build the application
  buildApplication() {
    this.log('Building application...', 'info');

    try {
      // Build backend
      this.log('Building backend...', 'info');
      process.chdir(this.backendPath);
      execSync('npm run build', { stdio: 'inherit' });

      // Build frontend
      this.log('Building frontend...', 'info');
      process.chdir(this.frontendPath);
      execSync('npm run build', { stdio: 'inherit' });

      process.chdir(this.projectRoot);
      this.log('✓ Application built successfully', 'success');
    } catch (error) {
      this.log(`✗ Error building application: ${error.message}`, 'error');
      throw error;
    }
  }

  // Run security tests
  runSecurityTests() {
    this.log('Running security tests...', 'info');

    try {
      process.chdir(this.projectRoot);
      execSync('node test-security-fixes.js', { stdio: 'inherit' });
      this.log('✓ All security tests passed', 'success');
    } catch (error) {
      this.log('✗ Security tests failed', 'error');
      throw error;
    }
  }

  // Display setup completion message
  displayCompletionMessage() {
    this.log('=====================================', 'info');
    this.log('🎉 RayERP Setup Complete!', 'success');
    this.log('=====================================', 'info');
    this.log('', 'info');
    this.log('Next steps:', 'info');
    this.log('1. Configure your MongoDB connection in backend/.env', 'info');
    this.log('2. Update CORS_ORIGIN and FRONTEND_URL for production', 'info');
    this.log('3. Start the backend: cd backend && npm start', 'info');
    this.log('4. Start the frontend: cd frontend && npm start', 'info');
    this.log('', 'info');
    this.log('Security features enabled:', 'success');
    this.log('✓ Environment variables secured', 'success');
    this.log('✓ Input validation middleware', 'success');
    this.log('✓ CSRF protection', 'success');
    this.log('✓ File upload security', 'success');
    this.log('✓ Authentication & authorization', 'success');
    this.log('✓ Security headers configured', 'success');
    this.log('', 'info');
    this.log('For more information, see SECURITY_GUIDE.md', 'info');
  }

  // Main setup process
  async run() {
    try {
      this.log('Starting RayERP Secure Setup...', 'info');
      this.log('=====================================', 'info');

      this.setupEnvironmentFiles();
      this.createDirectories();
      this.installDependencies();
      this.setFilePermissions();
      this.buildApplication();
      this.runSecurityTests();
      this.displayCompletionMessage();

    } catch (error) {
      this.log(`Setup failed: ${error.message}`, 'error');
      process.exit(1);
    }
  }
}

// Run setup if called directly
if (require.main === module) {
  const setup = new SecureSetup();
  setup.run();
}

module.exports = SecureSetup;