#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Skip validation if explicitly requested (e.g., during Docker/App Runner build)
if (process.env.SKIP_ENV_VALIDATION === 'true') {
  console.log('⏭️  Skipping environment validation (SKIP_ENV_VALIDATION=true)');
  process.exit(0);
}

const requiredEnvVars = [
  'MONGO_URI',
  'PORT',
  'JWT_SECRET',
  'JWT_EXPIRES_IN',
  'NODE_ENV',
  'CORS_ORIGIN',
  'FRONTEND_URL',
  'LOG_LEVEL'
];

function validateEnvironment() {
  console.log('🔍 Validating environment variables...\n');
  
  const missing = [];
  const invalid = [];
  
  for (const envVar of requiredEnvVars) {
    const value = process.env[envVar];
    
    if (!value) {
      missing.push(envVar);
      continue;
    }
    
    // Specific validations
    switch (envVar) {
      case 'PORT':
        if (isNaN(Number(value)) || Number(value) <= 0) {
          invalid.push(`${envVar}: must be a positive number`);
        }
        break;
      case 'NODE_ENV':
        if (!['development', 'production', 'test'].includes(value)) {
          invalid.push(`${envVar}: must be 'development', 'production', or 'test'`);
        }
        break;
      case 'LOG_LEVEL':
        if (!['error', 'warn', 'info', 'debug'].includes(value)) {
          invalid.push(`${envVar}: must be 'error', 'warn', 'info', or 'debug'`);
        }
        break;
      case 'MONGO_URI':
        if (!value.startsWith('mongodb://') && !value.startsWith('mongodb+srv://')) {
          invalid.push(`${envVar}: must be a valid MongoDB connection string`);
        }
        break;
      case 'CORS_ORIGIN':
      case 'FRONTEND_URL':
        if (!value.startsWith('http://') && !value.startsWith('https://')) {
          invalid.push(`${envVar}: must be a valid URL starting with http:// or https://`);
        }
        break;
    }
  }
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(envVar => console.error(`   - ${envVar}`));
    console.error('');
  }
  
  if (invalid.length > 0) {
    console.error('❌ Invalid environment variable values:');
    invalid.forEach(error => console.error(`   - ${error}`));
    console.error('');
  }
  
  if (missing.length > 0 || invalid.length > 0) {
    console.error('Please check your .env file and fix the issues above.');
    process.exit(1);
  }
  
  console.log('✅ All environment variables are properly configured!');
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🚀 Port: ${process.env.PORT}`);
  console.log(`📝 Log Level: ${process.env.LOG_LEVEL}`);
  console.log('');
}

// Load environment variables
require('dotenv').config();

validateEnvironment();