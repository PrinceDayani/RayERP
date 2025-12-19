// Test Document API
const API_URL = 'http://localhost:5000';

// Test 1: Health Check
console.log('Test 1: Health Check');
fetch(`${API_URL}/api/health`)
  .then(res => res.json())
  .then(data => console.log('✅ Health:', data.message))
  .catch(err => console.error('❌ Health check failed:', err));

// Test 2: Documents endpoint (should require auth)
console.log('\nTest 2: Documents endpoint (no auth)');
fetch(`${API_URL}/api/finance-advanced/documents`)
  .then(res => res.json())
  .then(data => {
    if (data.success === false && data.message.includes('Authentication')) {
      console.log('✅ Auth required (expected):', data.message);
    } else {
      console.log('⚠️ Unexpected response:', data);
    }
  })
  .catch(err => console.error('❌ Request failed:', err));

// Test 3: Stats endpoint (should require auth)
console.log('\nTest 3: Stats endpoint (no auth)');
fetch(`${API_URL}/api/finance-advanced/documents/stats`)
  .then(res => res.json())
  .then(data => {
    if (data.success === false && data.message.includes('Authentication')) {
      console.log('✅ Auth required (expected):', data.message);
    } else {
      console.log('⚠️ Unexpected response:', data);
    }
  })
  .catch(err => console.error('❌ Request failed:', err));

console.log('\n📝 To test with authentication:');
console.log('1. Login at http://localhost:3001/login');
console.log('2. Open browser console (F12)');
console.log('3. Run: localStorage.getItem("auth-token")');
console.log('4. Copy the token');
console.log('5. Test upload in the UI');
