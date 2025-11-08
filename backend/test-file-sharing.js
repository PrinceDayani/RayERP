// Test script for Project File Sharing feature
// Run with: node test-file-sharing.js

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5000/api';
let authToken = '';
let projectId = '';
let fileId = '';
let userId = '';
let departmentId = '';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ ${message}`, 'blue');
}

function logWarning(message) {
  log(`⚠ ${message}`, 'yellow');
}

// Test 1: Login
async function testLogin() {
  try {
    logInfo('Test 1: User Login');
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@example.com', // Update with your test credentials
      password: 'password123'
    });
    
    authToken = response.data.token;
    userId = response.data.user._id;
    logSuccess('Login successful');
    return true;
  } catch (error) {
    logError(`Login failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// Test 2: Get or Create Project
async function testGetProject() {
  try {
    logInfo('Test 2: Get Project');
    const response = await axios.get(`${BASE_URL}/projects`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (response.data.length > 0) {
      projectId = response.data[0]._id;
      logSuccess(`Using existing project: ${projectId}`);
    } else {
      logWarning('No projects found. Please create a project first.');
      return false;
    }
    return true;
  } catch (error) {
    logError(`Get project failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// Test 3: Get Department
async function testGetDepartment() {
  try {
    logInfo('Test 3: Get Department');
    const response = await axios.get(`${BASE_URL}/departments`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (response.data.length > 0) {
      departmentId = response.data[0]._id;
      logSuccess(`Using department: ${departmentId}`);
    } else {
      logWarning('No departments found. Will test without department sharing.');
    }
    return true;
  } catch (error) {
    logError(`Get department failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// Test 4: Upload File with Department Sharing
async function testUploadFileWithDepartment() {
  try {
    logInfo('Test 4: Upload File with Department Sharing');
    
    // Create a test file
    const testFilePath = path.join(__dirname, 'test-upload.txt');
    fs.writeFileSync(testFilePath, 'This is a test file for file sharing feature.');
    
    const formData = new FormData();
    formData.append('file', fs.createReadStream(testFilePath));
    formData.append('shareType', 'department');
    
    if (departmentId) {
      formData.append('sharedWithDepartments', JSON.stringify([departmentId]));
    }
    
    const response = await axios.post(
      `${BASE_URL}/projects/${projectId}/files`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bearer ${authToken}`
        }
      }
    );
    
    fileId = response.data._id;
    logSuccess(`File uploaded: ${response.data.originalName}`);
    logInfo(`  File ID: ${fileId}`);
    logInfo(`  Share Type: ${response.data.shareType}`);
    
    // Cleanup test file
    fs.unlinkSync(testFilePath);
    
    return true;
  } catch (error) {
    logError(`Upload file failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// Test 5: Get Project Files
async function testGetProjectFiles() {
  try {
    logInfo('Test 5: Get Project Files');
    const response = await axios.get(`${BASE_URL}/projects/${projectId}/files`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    logSuccess(`Retrieved ${response.data.length} file(s)`);
    response.data.forEach((file, index) => {
      logInfo(`  File ${index + 1}: ${file.originalName}`);
      logInfo(`    Share Type: ${file.shareType}`);
      logInfo(`    Departments: ${file.sharedWithDepartments.length}`);
      logInfo(`    Users: ${file.sharedWithUsers.length}`);
    });
    
    return true;
  } catch (error) {
    logError(`Get files failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// Test 6: Update File Sharing to User-specific
async function testUpdateSharingToUser() {
  try {
    logInfo('Test 6: Update File Sharing to User-specific');
    const response = await axios.put(
      `${BASE_URL}/projects/${projectId}/files/${fileId}/share`,
      {
        shareType: 'user',
        userIds: [userId]
      },
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    logSuccess('File sharing updated to user-specific');
    logInfo(`  Share Type: ${response.data.shareType}`);
    logInfo(`  Shared with ${response.data.sharedWithUsers.length} user(s)`);
    
    return true;
  } catch (error) {
    logError(`Update sharing failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// Test 7: Update File Sharing to Both
async function testUpdateSharingToBoth() {
  try {
    logInfo('Test 7: Update File Sharing to Both (Department + User)');
    
    const payload = {
      shareType: 'both',
      userIds: [userId]
    };
    
    if (departmentId) {
      payload.departmentIds = [departmentId];
    }
    
    const response = await axios.put(
      `${BASE_URL}/projects/${projectId}/files/${fileId}/share`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    logSuccess('File sharing updated to both department and user');
    logInfo(`  Share Type: ${response.data.shareType}`);
    logInfo(`  Departments: ${response.data.sharedWithDepartments.length}`);
    logInfo(`  Users: ${response.data.sharedWithUsers.length}`);
    
    return true;
  } catch (error) {
    logError(`Update sharing failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// Test 8: Get Shared Files
async function testGetSharedFiles() {
  try {
    logInfo('Test 8: Get Files Shared With Me');
    const response = await axios.get(`${BASE_URL}/projects/shared/files`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    logSuccess(`Retrieved ${response.data.length} shared file(s)`);
    response.data.forEach((file, index) => {
      logInfo(`  File ${index + 1}: ${file.originalName}`);
      logInfo(`    Project: ${file.project.name}`);
      logInfo(`    Share Type: ${file.shareType}`);
    });
    
    return true;
  } catch (error) {
    logError(`Get shared files failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// Test 9: Download File
async function testDownloadFile() {
  try {
    logInfo('Test 9: Download File');
    const response = await axios.get(
      `${BASE_URL}/projects/${projectId}/files/${fileId}/download`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
        responseType: 'arraybuffer'
      }
    );
    
    logSuccess(`File downloaded successfully (${response.data.byteLength} bytes)`);
    return true;
  } catch (error) {
    logError(`Download file failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// Test 10: Delete File
async function testDeleteFile() {
  try {
    logInfo('Test 10: Delete File');
    await axios.delete(`${BASE_URL}/projects/${projectId}/files/${fileId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    logSuccess('File deleted successfully');
    return true;
  } catch (error) {
    logError(`Delete file failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// Run all tests
async function runTests() {
  log('\n========================================', 'blue');
  log('Project File Sharing Feature Tests', 'blue');
  log('========================================\n', 'blue');
  
  const tests = [
    testLogin,
    testGetProject,
    testGetDepartment,
    testUploadFileWithDepartment,
    testGetProjectFiles,
    testUpdateSharingToUser,
    testUpdateSharingToBoth,
    testGetSharedFiles,
    testDownloadFile,
    testDeleteFile
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    const result = await test();
    if (result) {
      passed++;
    } else {
      failed++;
      // Stop on critical failures
      if (test === testLogin || test === testGetProject) {
        logError('\nCritical test failed. Stopping tests.');
        break;
      }
    }
    console.log(''); // Empty line between tests
  }
  
  log('\n========================================', 'blue');
  log('Test Summary', 'blue');
  log('========================================', 'blue');
  logSuccess(`Passed: ${passed}`);
  if (failed > 0) {
    logError(`Failed: ${failed}`);
  }
  log('========================================\n', 'blue');
}

// Run the tests
runTests().catch(error => {
  logError(`Test suite failed: ${error.message}`);
  process.exit(1);
});
