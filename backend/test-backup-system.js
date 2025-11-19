const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
let authToken = '';

// Test user credentials (adjust as needed)
const testUser = {
  email: 'admin@rayerp.com',
  password: 'admin123'
};

async function login() {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, testUser);
    authToken = response.data.token;
    console.log('✅ Login successful');
    return true;
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testBackupDownload() {
  try {
    console.log('\n🔄 Testing backup download...');
    const response = await axios.get(`${BASE_URL}/backup/download?backupType=full&modules=hr,projects&encrypt=false`, {
      headers: { Authorization: `Bearer ${authToken}` },
      responseType: 'stream'
    });
    
    console.log('✅ Backup download initiated successfully');
    console.log('📊 Response headers:', {
      'content-type': response.headers['content-type'],
      'content-disposition': response.headers['content-disposition']
    });
    return true;
  } catch (error) {
    console.error('❌ Backup download failed:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testBackupLogs() {
  try {
    console.log('\n🔄 Testing backup logs...');
    const response = await axios.get(`${BASE_URL}/backup/logs?page=1&limit=5`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Backup logs fetched successfully');
    console.log('📊 Found', response.data.logs.length, 'backup logs');
    
    if (response.data.logs.length > 0) {
      const log = response.data.logs[0];
      console.log('📋 Latest backup:', {
        id: log.backupId,
        type: log.backupType,
        status: log.status,
        size: log.size,
        createdBy: log.createdBy?.name
      });
    }
    return true;
  } catch (error) {
    console.error('❌ Backup logs failed:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testBackupSchedules() {
  try {
    console.log('\n🔄 Testing backup schedules...');
    
    // Create a test schedule
    const scheduleData = {
      name: 'Test Daily Backup',
      description: 'Automated test backup',
      frequency: 'daily',
      time: '02:00',
      backupType: 'full',
      modules: ['hr', 'projects'],
      isEncrypted: false,
      storageLocation: 'local',
      retentionDays: 30,
      nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Tomorrow
    };
    
    const createResponse = await axios.post(`${BASE_URL}/backup/schedules`, scheduleData, {
      headers: { 
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Backup schedule created successfully');
    const scheduleId = createResponse.data.schedule._id;
    
    // Fetch schedules
    const fetchResponse = await axios.get(`${BASE_URL}/backup/schedules`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Backup schedules fetched successfully');
    console.log('📊 Found', fetchResponse.data.schedules.length, 'schedules');
    
    // Clean up - delete the test schedule
    await axios.delete(`${BASE_URL}/backup/schedules/${scheduleId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Test schedule cleaned up');
    return true;
  } catch (error) {
    console.error('❌ Backup schedules failed:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testBackupVerification() {
  try {
    console.log('\n🔄 Testing backup verification...');
    
    // First get a backup ID from logs
    const logsResponse = await axios.get(`${BASE_URL}/backup/logs?page=1&limit=1`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (logsResponse.data.logs.length === 0) {
      console.log('⚠️ No backup logs found, skipping verification test');
      return true;
    }
    
    const backupId = logsResponse.data.logs[0].backupId;
    
    const response = await axios.get(`${BASE_URL}/backup/verify/${backupId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Backup verification completed');
    console.log('📊 Verification result:', response.data.message);
    return true;
  } catch (error) {
    console.error('❌ Backup verification failed:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testRestoreEndpoint() {
  try {
    console.log('\n🔄 Testing restore endpoint...');
    const response = await axios.post(`${BASE_URL}/backup/restore`, {}, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Restore endpoint accessible');
    console.log('📊 Response:', response.data.message);
    return true;
  } catch (error) {
    console.error('❌ Restore endpoint failed:', error.response?.data?.message || error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Starting Backup System Tests...\n');
  
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('\n❌ Cannot proceed without authentication');
    return;
  }
  
  const tests = [
    { name: 'Backup Download', fn: testBackupDownload },
    { name: 'Backup Logs', fn: testBackupLogs },
    { name: 'Backup Schedules', fn: testBackupSchedules },
    { name: 'Backup Verification', fn: testBackupVerification },
    { name: 'Restore Endpoint', fn: testRestoreEndpoint }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.error(`❌ ${test.name} test threw an error:`, error.message);
      failed++;
    }
  }
  
  console.log('\n📊 Test Results:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All backup system tests passed! The system is fully functional.');
  } else {
    console.log('\n⚠️ Some tests failed. Please check the error messages above.');
  }
}

// Run the tests
runAllTests().catch(console.error);