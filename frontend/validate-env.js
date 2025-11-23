#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function loadEnvFile(filename) {
  try {
    const envPath = path.join(__dirname, filename);
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      envContent.split('\n').forEach(line => {
        line = line.trim();
        if (line && !line.startsWith('#') && !line.startsWith('//')) {
          const [key, ...valueParts] = line.split('=');
          if (key && valueParts.length > 0) {
            process.env[key.trim()] = valueParts.join('=').trim();
          }
        }
      });
    }
  } catch (error) {
    // Ignore errors
  }
}

loadEnvFile('.env');
loadEnvFile('.env.local');

// Environment validation script for frontend
const requiredEnvVars = [
  'NEXT_PUBLIC_API_URL'
];

const optionalEnvVars = [
  'BACKEND_URL',
  'NEXT_PUBLIC_ENABLE_SOCKET',
  'NODE_ENV'
];

console.log('🔍 Validating frontend environment variables...\n');

let hasErrors = false;

// Check required variables
requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (!value) {
    console.error(`❌ Missing required environment variable: ${varName}`);
    hasErrors = true;
  } else {
    console.log(`✅ ${varName}=${value}`);
  }
});

// Show optional variables
console.log('\n📋 Optional environment variables:');
optionalEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}=${value}`);
  } else {
    console.log(`⚪ ${varName}=<not set>`);
  }
});

// Environment-specific checks
const nodeEnv = process.env.NODE_ENV || 'development';
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

console.log(`\n🌍 Environment: ${nodeEnv}`);

if (apiUrl) {
  try {
    const url = new URL(apiUrl);
    console.log(`🔗 API Host: ${url.hostname}:${url.port || (url.protocol === 'https:' ? '443' : '80')}`);
    
    if (nodeEnv === 'development' && !['localhost', '127.0.0.1'].includes(url.hostname)) {
      console.warn(`⚠️  Warning: Using non-local API URL in development: ${url.hostname}`);
    }
  } catch (error) {
    console.error(`❌ Invalid API URL format: ${apiUrl}`);
    hasErrors = true;
  }
}

if (hasErrors) {
  console.error('\n❌ Environment validation failed. Please check your .env file.');
  process.exit(1);
} else {
  console.log('\n✅ Environment validation passed!');
}