// Quick diagnostic script to check project management issues
const axios = require('axios');

const API_URL = 'http://localhost:5000';

async function diagnose() {
  console.log('🔍 Diagnosing Project Management Issues...\n');
  
  // 1. Check if backend is running
  console.log('1️⃣ Checking backend server...');
  try {
    const healthCheck = await axios.get(`${API_URL}/api/health`, { timeout: 3000 });
    console.log('✅ Backend is running:', healthCheck.data);
  } catch (error) {
    console.log('❌ Backend is NOT running or not accessible');
    console.log('   Error:', error.message);
    console.log('\n💡 Solution: Start the backend server with:');
    console.log('   cd backend && npm run dev\n');
    return;
  }

  // 2. Check if auth token exists
  console.log('\n2️⃣ Checking authentication...');
  console.log('⚠️  Note: This script cannot check localStorage from browser');
  console.log('   Please check browser console for auth token');
  console.log('   Run: localStorage.getItem("auth-token")\n');

  // 3. Test projects endpoint without auth
  console.log('3️⃣ Testing projects endpoint (without auth)...');
  try {
    const response = await axios.get(`${API_URL}/api/projects`, { timeout: 3000 });
    console.log('✅ Projects endpoint accessible (no auth required?)');
    console.log('   Projects found:', response.data?.length || 0);
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ Projects endpoint requires authentication (expected)');
    } else {
      console.log('❌ Projects endpoint error:', error.message);
      console.log('   Status:', error.response?.status);
      console.log('   Data:', error.response?.data);
    }
  }

  // 4. Check CORS configuration
  console.log('\n4️⃣ Checking CORS configuration...');
  console.log('   Frontend URL: http://localhost:3000');
  console.log('   Backend URL:', API_URL);
  console.log('   ⚠️  Check backend .env for CORS_ORIGIN setting\n');

  // 5. Recommendations
  console.log('📋 Troubleshooting Steps:');
  console.log('   1. Ensure backend is running: cd backend && npm run dev');
  console.log('   2. Ensure frontend is running: cd frontend && npm run dev');
  console.log('   3. Check browser console for errors (F12)');
  console.log('   4. Check Network tab in DevTools for failed requests');
  console.log('   5. Verify you are logged in (check localStorage for auth-token)');
  console.log('   6. Check backend logs for any errors');
  console.log('\n📝 Common Issues:');
  console.log('   - Backend not running → Start with: cd backend && npm run dev');
  console.log('   - Not logged in → Go to /login and sign in');
  console.log('   - CORS error → Check backend CORS_ORIGIN in .env');
  console.log('   - Network error → Check if ports 3000 and 5000 are available');
  console.log('   - Empty projects → Create a project first\n');
}

diagnose().catch(console.error);
