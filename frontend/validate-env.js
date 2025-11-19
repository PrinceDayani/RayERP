#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Load environment variables from .env files
function loadEnvFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    content.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          process.env[key] = valueParts.join('=');
        }
      }
    });
  } catch (error) {
    // File doesn't exist, ignore
  }
}

// Load .env files in order of precedence
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