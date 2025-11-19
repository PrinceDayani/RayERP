const axios = require('axios');

const API_URL = 'http://localhost:5000';

async function testBackupScheduleAPI() {
  try {
    console.log('🧪 Testing Backup Schedule API...\n');

    // Test 1: Health check
    console.log('1. Testing server health...');
    const healthResponse = await axios.get(`${API_URL}/api/health`);
    console.log('✅ Server is healthy:', healthResponse.data.message);

    // Test 2: Try to access backup schedules without auth (should fail)
    console.log('\n2. Testing backup schedules without auth (should fail)...');
    try {
      await axios.get(`${API_URL}/api/backup/schedules`);
      console.log('❌ This should have failed - no auth required?');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Correctly requires authentication');
      } else {
        console.log('⚠️ Unexpected error:', error.response?.status, error.response?.data?.message);
      }
    }

    // Test 3: Try to create a test user and login
    console.log('\n3. Testing user creation and login...');
    
    // Create test user
    const testUser = {
      name: 'Test Admin',
      email: 'testadmin@test.com',
      password: 'testpass123',
      role: 'ROOT',
      department: 'IT'
    };

    try {
      const registerResponse = await axios.post(`${API_URL}/api/auth/register`, testUser);
      console.log('✅ Test user created');
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
        console.log('ℹ️ Test user already exists');
      } else {
        console.log('⚠️ User creation error:', error.response?.data?.message);
      }
    }

    // Login
    const loginResponse = await axios.post(`${API_URL}/api/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful, token received');

    // Test 4: Test backup schedules with auth
    console.log('\n4. Testing backup schedules with auth...');
    const schedulesResponse = await axios.get(`${API_URL}/api/backup/schedules`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Backup schedules fetched:', schedulesResponse.data.schedules?.length || 0, 'schedules');

    // Test 5: Create a test schedule
    console.log('\n5. Testing schedule creation...');
    const testSchedule = {
      name: 'Test Daily Backup',
      description: 'Test schedule for API verification',
      frequency: 'daily',
      time: '02:00',
      backupType: 'full',
      modules: ['hr', 'projects'],
      isEncrypted: false,
      storageLocation: 'local',
      retentionDays: 7,
      nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Tomorrow
    };

    const createResponse = await axios.post(`${API_URL}/api/backup/schedules`, testSchedule, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Schedule created successfully:', createResponse.data.schedule.name);

    const scheduleId = createResponse.data.schedule._id;

    // Test 6: Update the schedule
    console.log('\n6. Testing schedule update...');
    await axios.put(`${API_URL}/api/backup/schedules/${scheduleId}`, {
      ...testSchedule,
      name: 'Updated Test Schedule',
      isActive: false
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Schedule updated successfully');

    // Test 7: Delete the test schedule
    console.log('\n7. Testing schedule deletion...');
    await axios.delete(`${API_URL}/api/backup/schedules/${scheduleId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Schedule deleted successfully');

    console.log('\n🎉 All backup schedule API tests passed!');
    console.log('\n📋 Summary:');
    console.log('- Server health: ✅');
    console.log('- Authentication: ✅');
    console.log('- Schedule CRUD operations: ✅');
    console.log('\n✨ The backup schedule button should now work properly!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    console.log('\n🔧 Troubleshooting tips:');
    console.log('1. Make sure the backend server is running on port 5000');
    console.log('2. Check if MongoDB is connected');
    console.log('3. Verify environment variables are set');
    console.log('4. Check server logs for detailed errors');
  }
}

// Run the test
testBackupScheduleAPI();