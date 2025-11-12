const axios = require('axios');

const API_URL = 'http://localhost:5000';

async function testRootAPI() {
  try {
    console.log('🔐 Testing Root User API Access...\n');

    // Step 1: Login as root
    console.log('Step 1: Logging in as root user...');
    const loginResponse = await axios.post(`${API_URL}/api/auth/login`, {
      email: 'princedayani10@gmail.com',
      password: 'your_password_here' // Replace with actual password
    });

    if (!loginResponse.data.success) {
      console.log('❌ Login failed:', loginResponse.data.message);
      return;
    }

    const token = loginResponse.data.token;
    console.log('✅ Login successful!');
    console.log(`   Token: ${token.substring(0, 20)}...`);
    console.log(`   User: ${loginResponse.data.user.name}`);
    console.log(`   Role: ${loginResponse.data.user.role.name}\n`);

    // Step 2: Test employees endpoint
    console.log('Step 2: Fetching employees...');
    try {
      const employeesResponse = await axios.get(`${API_URL}/api/employees`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log(`✅ Employees fetched: ${employeesResponse.data.data?.length || 0} employees`);
      if (employeesResponse.data.data?.length > 0) {
        console.log(`   Sample: ${employeesResponse.data.data[0].firstName} ${employeesResponse.data.data[0].lastName}\n`);
      }
    } catch (error) {
      console.log('❌ Failed to fetch employees:');
      console.log(`   Status: ${error.response?.status}`);
      console.log(`   Message: ${error.response?.data?.message || error.message}\n`);
    }

    // Step 3: Test projects endpoint
    console.log('Step 3: Fetching projects...');
    try {
      const projectsResponse = await axios.get(`${API_URL}/api/projects`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log(`✅ Projects fetched: ${projectsResponse.data.data?.length || projectsResponse.data.length || 0} projects`);
      if (projectsResponse.data.data?.length > 0 || projectsResponse.data.length > 0) {
        const projects = projectsResponse.data.data || projectsResponse.data;
        console.log(`   Sample: ${projects[0].name}\n`);
      }
    } catch (error) {
      console.log('❌ Failed to fetch projects:');
      console.log(`   Status: ${error.response?.status}`);
      console.log(`   Message: ${error.response?.data?.message || error.message}\n`);
    }

    // Step 4: Test tasks endpoint
    console.log('Step 4: Fetching tasks...');
    try {
      const tasksResponse = await axios.get(`${API_URL}/api/tasks`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log(`✅ Tasks fetched: ${tasksResponse.data.data?.length || tasksResponse.data.length || 0} tasks\n`);
    } catch (error) {
      console.log('❌ Failed to fetch tasks:');
      console.log(`   Status: ${error.response?.status}`);
      console.log(`   Message: ${error.response?.data?.message || error.message}\n`);
    }

    console.log('='.repeat(60));
    console.log('TEST SUMMARY');
    console.log('='.repeat(60));
    console.log('If all tests passed, the backend is working correctly.');
    console.log('If tests failed, check:');
    console.log('  1. Backend server is running (npm run dev)');
    console.log('  2. MongoDB is connected');
    console.log('  3. CORS is configured correctly');
    console.log('  4. Frontend is using correct API URL');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Response:', error.response.data);
    }
  }
}

// Run the test
testRootAPI();
