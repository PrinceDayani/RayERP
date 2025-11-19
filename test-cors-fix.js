const axios = require('axios');

async function testCORSConnection() {
  console.log('🧪 Testing CORS and Backend Connection...\n');

  try {
    // Test 1: Health check
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get('http://localhost:5000/api/health');
    console.log('✅ Health check passed:', healthResponse.data.message);

    // Test 2: Test CORS preflight
    console.log('\n2. Testing CORS preflight...');
    const corsResponse = await axios.options('http://localhost:5000/api/health', {
      headers: {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type,Authorization'
      }
    });
    console.log('✅ CORS preflight passed');

    // Test 3: Test with Origin header
    console.log('\n3. Testing with Origin header...');
    const originResponse = await axios.get('http://localhost:5000/api/health', {
      headers: {
        'Origin': 'http://localhost:3000'
      }
    });
    console.log('✅ Origin header test passed');

    console.log('\n🎉 All CORS tests passed! Backend is accessible.');

  } catch (error) {
    console.error('\n❌ CORS/Connection test failed:');
    
    if (error.code === 'ECONNREFUSED') {
      console.error('🔴 Backend server is not running on port 5000');
      console.error('💡 Solution: Start the backend server with "npm run dev"');
    } else if (error.response) {
      console.error('🔴 HTTP Error:', error.response.status, error.response.statusText);
      console.error('🔍 Response:', error.response.data);
    } else {
      console.error('🔴 Network Error:', error.message);
    }
  }
}

testCORSConnection();