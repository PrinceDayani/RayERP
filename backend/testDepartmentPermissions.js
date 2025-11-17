/**
 * Test Department Permissions
 * 
 * This script tests the department permissions functionality
 * Run: node testDepartmentPermissions.js
 */

const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:5000/api';

let adminToken = '';
let departmentId = '';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'cyan');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

async function loginAsAdmin() {
  try {
    logInfo('Logging in as admin...');
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@example.com',
      password: 'admin123'
    });
    
    adminToken = response.data.token;
    logSuccess('Admin login successful');
    return true;
  } catch (error) {
    logError(`Admin login failed: ${error.response?.data?.message || error.message}`);
    logWarning('Please update the email/password in the script or create an admin user');
    return false;
  }
}

async function getDepartments() {
  try {
    logInfo('Fetching departments...');
    const response = await axios.get(`${API_URL}/departments`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    if (response.data.data && response.data.data.length > 0) {
      departmentId = response.data.data[0]._id;
      logSuccess(`Found ${response.data.data.length} departments`);
      logInfo(`Using department: ${response.data.data[0].name} (${departmentId})`);
      return true;
    } else {
      logWarning('No departments found. Please create a department first.');
      return false;
    }
  } catch (error) {
    logError(`Failed to fetch departments: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testGetPermissions() {
  try {
    logInfo('Testing GET department permissions...');
    const response = await axios.get(`${API_URL}/departments/${departmentId}/permissions`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    logSuccess('GET permissions successful');
    console.log('Current permissions:', response.data.data.permissions);
    return true;
  } catch (error) {
    logError(`GET permissions failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testUpdatePermissions() {
  try {
    logInfo('Testing PUT (update all) department permissions...');
    const testPermissions = [
      'projects.view',
      'projects.create',
      'tasks.view',
      'tasks.create',
      'reports.view'
    ];
    
    const response = await axios.put(
      `${API_URL}/departments/${departmentId}/permissions`,
      { permissions: testPermissions },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    
    logSuccess('PUT permissions successful');
    console.log('Updated permissions:', response.data.data.permissions);
    return true;
  } catch (error) {
    logError(`PUT permissions failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testAddPermission() {
  try {
    logInfo('Testing POST (add) single permission...');
    const response = await axios.post(
      `${API_URL}/departments/${departmentId}/permissions/add`,
      { permission: 'analytics.view' },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    
    logSuccess('POST add permission successful');
    console.log('Permissions after add:', response.data.data.permissions);
    return true;
  } catch (error) {
    logError(`POST add permission failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testRemovePermission() {
  try {
    logInfo('Testing POST (remove) single permission...');
    const response = await axios.post(
      `${API_URL}/departments/${departmentId}/permissions/remove`,
      { permission: 'analytics.view' },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    
    logSuccess('POST remove permission successful');
    console.log('Permissions after remove:', response.data.data.permissions);
    return true;
  } catch (error) {
    logError(`POST remove permission failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testDuplicatePermission() {
  try {
    logInfo('Testing duplicate permission (should fail)...');
    await axios.post(
      `${API_URL}/departments/${departmentId}/permissions/add`,
      { permission: 'projects.view' },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    
    logWarning('Duplicate permission was added (unexpected)');
    return false;
  } catch (error) {
    if (error.response?.status === 400) {
      logSuccess('Duplicate permission correctly rejected');
      return true;
    } else {
      logError(`Unexpected error: ${error.response?.data?.message || error.message}`);
      return false;
    }
  }
}

async function runTests() {
  log('\n========================================', 'blue');
  log('  Department Permissions Test Suite', 'blue');
  log('========================================\n', 'blue');

  const results = {
    passed: 0,
    failed: 0,
    total: 0
  };

  // Test 1: Login
  results.total++;
  if (await loginAsAdmin()) {
    results.passed++;
  } else {
    results.failed++;
    log('\n❌ Cannot proceed without admin login', 'red');
    return;
  }

  // Test 2: Get Departments
  results.total++;
  if (await getDepartments()) {
    results.passed++;
  } else {
    results.failed++;
    log('\n❌ Cannot proceed without departments', 'red');
    return;
  }

  console.log('');

  // Test 3: Get Permissions
  results.total++;
  if (await testGetPermissions()) {
    results.passed++;
  } else {
    results.failed++;
  }

  console.log('');

  // Test 4: Update Permissions
  results.total++;
  if (await testUpdatePermissions()) {
    results.passed++;
  } else {
    results.failed++;
  }

  console.log('');

  // Test 5: Add Permission
  results.total++;
  if (await testAddPermission()) {
    results.passed++;
  } else {
    results.failed++;
  }

  console.log('');

  // Test 6: Remove Permission
  results.total++;
  if (await testRemovePermission()) {
    results.passed++;
  } else {
    results.failed++;
  }

  console.log('');

  // Test 7: Duplicate Permission
  results.total++;
  if (await testDuplicatePermission()) {
    results.passed++;
  } else {
    results.failed++;
  }

  // Summary
  log('\n========================================', 'blue');
  log('  Test Results', 'blue');
  log('========================================', 'blue');
  log(`Total Tests: ${results.total}`, 'cyan');
  log(`Passed: ${results.passed}`, 'green');
  log(`Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'green');
  log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`, 
      results.failed === 0 ? 'green' : 'yellow');
  log('========================================\n', 'blue');

  if (results.failed === 0) {
    log('🎉 All tests passed! Department permissions are working correctly.', 'green');
  } else {
    log('⚠️  Some tests failed. Please check the errors above.', 'yellow');
  }
}

// Run the tests
runTests().catch(error => {
  logError(`Test suite failed: ${error.message}`);
  process.exit(1);
});
