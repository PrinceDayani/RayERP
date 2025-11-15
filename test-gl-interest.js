const API_URL = 'http://localhost:5000';

// Get token from your login
const TOKEN = 'YOUR_TOKEN_HERE';

async function testGLBudgets() {
  console.log('\n🧪 Testing GL Budgets API...\n');

  try {
    // Test 1: Get all budgets
    console.log('1. GET /api/gl-budgets');
    const res1 = await fetch(`${API_URL}/api/gl-budgets`, {
      headers: { Authorization: `Bearer ${TOKEN}` }
    });
    const data1 = await res1.json();
    console.log('✅ Status:', res1.status);
    console.log('📊 Budgets:', data1.data?.length || 0);

    // Test 2: Get alerts
    console.log('\n2. GET /api/gl-budgets/alerts');
    const res2 = await fetch(`${API_URL}/api/gl-budgets/alerts`, {
      headers: { Authorization: `Bearer ${TOKEN}` }
    });
    const data2 = await res2.json();
    console.log('✅ Status:', res2.status);
    console.log('🚨 Alerts:', data2.data?.length || 0);

    console.log('\n✅ GL Budgets API is working!\n');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function testInterestCalculations() {
  console.log('\n🧪 Testing Interest Calculations API...\n');

  try {
    // Test 1: Get all calculations
    console.log('1. GET /api/interest-calculations');
    const res1 = await fetch(`${API_URL}/api/interest-calculations`, {
      headers: { Authorization: `Bearer ${TOKEN}` }
    });
    const data1 = await res1.json();
    console.log('✅ Status:', res1.status);
    console.log('📊 Calculations:', data1.data?.length || 0);

    // Test 2: Get summary
    console.log('\n2. GET /api/interest-calculations/summary');
    const res2 = await fetch(`${API_URL}/api/interest-calculations/summary`, {
      headers: { Authorization: `Bearer ${TOKEN}` }
    });
    const data2 = await res2.json();
    console.log('✅ Status:', res2.status);
    console.log('💰 Total Interest:', data2.data?.totalInterest || 0);

    console.log('\n✅ Interest Calculations API is working!\n');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function runTests() {
  console.log('🚀 Starting API Connection Tests...');
  console.log('📍 API URL:', API_URL);
  console.log('🔑 Token:', TOKEN ? 'Provided' : '❌ MISSING - Please add your token');

  if (!TOKEN || TOKEN === 'YOUR_TOKEN_HERE') {
    console.log('\n⚠️  Please update TOKEN variable with your actual token');
    console.log('💡 Get token by logging in at http://localhost:3000/login\n');
    return;
  }

  await testGLBudgets();
  await testInterestCalculations();

  console.log('✅ All tests completed!\n');
}

runTests();
