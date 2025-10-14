// Test authentication with your token
const token = process.argv[2];

if (!token) {
  console.log('Usage: node testAuth.js YOUR_TOKEN');
  process.exit(1);
}

const fetch = require('node-fetch');

async function testAuth() {
  try {
    console.log('Testing with token:', token.substring(0, 20) + '...');
    
    const response = await fetch('http://localhost:5000/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    console.log('\nResponse status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));

    if (data.user) {
      console.log('\n✅ User authenticated:');
      console.log('  Email:', data.user.email);
      console.log('  Role:', data.user.role);
      console.log('  Role (lowercase):', data.user.role.toLowerCase());
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testAuth();
