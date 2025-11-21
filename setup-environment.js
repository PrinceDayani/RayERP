#!/usr/bin/env node

/**
 * Environment Setup Script for RayERP
 * This script helps configure environment variables for different deployment scenarios
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function setupEnvironment() {
  console.log('🚀 RayERP Environment Setup');
  console.log('=====================================\n');

  // Get deployment type
  const deploymentType = await question('Select deployment type:\n1. Local Development\n2. Docker Compose\n3. Production\nEnter choice (1-3): ');

  let config = {};

  switch (deploymentType) {
    case '1':
      console.log('\n📝 Setting up for Local Development...');
      config = {
        FRONTEND_HOST: 'http://localhost:3000',
        BACKEND_HOST: 'http://localhost:5000',
        API_HOST: 'http://localhost',
        API_PORT: '5000',
        DB_HOST: 'localhost',
        DB_PORT: '27017'
      };
      break;

    case '2':
      console.log('\n🐳 Setting up for Docker Compose...');
      config = {
        FRONTEND_HOST: 'http://localhost:3000',
        BACKEND_HOST: 'http://localhost:5000',
        API_HOST: 'http://localhost',
        API_PORT: '5000',
        DB_HOST: 'mongodb',
        DB_PORT: '27017'
      };
      break;

    case '3':
      console.log('\n🌐 Setting up for Production...');
      const frontendDomain = await question('Enter your frontend domain (e.g., https://myapp.com): ');
      const backendDomain = await question('Enter your backend domain (e.g., https://api.myapp.com): ');
      const dbHost = await question('Enter your database host (e.g., cluster.mongodb.net): ');
      
      config = {
        FRONTEND_HOST: frontendDomain,
        BACKEND_HOST: backendDomain,
        API_HOST: backendDomain.replace(/:\d+$/, ''),
        API_PORT: '443',
        DB_HOST: dbHost,
        DB_PORT: '27017'
      };
      break;

    default:
      console.log('❌ Invalid choice. Exiting...');
      rl.close();
      return;
  }

  // Generate backend .env
  const backendEnv = `# Database Configuration
MONGO_URI=mongodb://${config.DB_HOST}:${config.DB_PORT}/rayerp

# Server Configuration
PORT=5000
NODE_ENV=${deploymentType === '3' ? 'production' : 'development'}

# JWT Configuration
JWT_SECRET=88efc1e90fdab0a26b8bc1f017ba3b52b0e6a2b1e752d1a0b360f12a32bf4c1e9d97547af3f24d48765a9ae03183fd5d950ce9ef828e1b6fe0ec2dc83b049ab91c7c4a21cd533ccd6d2df49e804c8f1435166a508488cc13c5ba709ad1230af1fc1caa1fc42d51e4db199a3929a00a7b58c2490ec1ffac211ab6407219f67be28679e4624f3c78c12cd7becf4f401f579da281d9577fcf4935aa93a660e2e73aee07ffa7aa97c0d459dcbb0ea530c208f6a13c939ef3fe0d19572840bb64d2ef88304d228ea11684ec0e81d57eb54c457520dfe32eea6359e472f9637b8b2288bde60c991e86f69c32c6ad43ff7f4ce736c9ac9474540c23c4e57e578afcc711
JWT_EXPIRES_IN=30d

# CORS Configuration
CORS_ORIGIN=${config.FRONTEND_HOST}
FRONTEND_URL=${config.FRONTEND_HOST}
FRONTEND_HOST=${config.FRONTEND_HOST}
BACKEND_HOST=${config.BACKEND_HOST}

# Logging Configuration
LOG_LEVEL=${deploymentType === '3' ? 'warn' : 'info'}
`;

  // Generate frontend .env
  const frontendEnv = `NEXT_PUBLIC_API_URL=${config.BACKEND_HOST}
BACKEND_URL=${config.BACKEND_HOST}
NEXT_PUBLIC_DEFAULT_API_URL=${config.BACKEND_HOST}
NEXT_PUBLIC_ENABLE_SOCKET=true
NODE_ENV=${deploymentType === '3' ? 'production' : 'development'}

# Host Configuration
BACKEND_HOST=${config.BACKEND_HOST}
FRONTEND_HOST=${config.FRONTEND_HOST}
API_HOST=${config.API_HOST}
API_PORT=${config.API_PORT}
`;

  // Write files
  try {
    fs.writeFileSync(path.join(__dirname, 'backend', '.env'), backendEnv);
    fs.writeFileSync(path.join(__dirname, 'frontend', '.env'), frontendEnv);
    
    console.log('\n✅ Environment files created successfully!');
    console.log('📁 Backend .env: ./backend/.env');
    console.log('📁 Frontend .env: ./frontend/.env');
    
    if (deploymentType === '3') {
      console.log('\n⚠️  Production Notes:');
      console.log('- Update JWT_SECRET with a secure random string');
      console.log('- Configure your database connection string');
      console.log('- Set up SSL certificates');
      console.log('- Configure your reverse proxy/load balancer');
    }
    
  } catch (error) {
    console.error('❌ Error writing environment files:', error.message);
  }

  rl.close();
}

// Run the setup
setupEnvironment().catch(console.error);