// Quick test script to verify enterprise features are working
// Run with: node test-enterprise-features.js

const API_URL = process.env.API_URL || 'http://localhost:5000';

async function testEndpoint(name, url, method = 'GET') {
  try {
    const response = await fetch(`${API_URL}${url}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        // Add your auth token here for authenticated endpoints
        // 'Authorization': 'Bearer YOUR_TOKEN'
      }
    });
    
    const data = await response.json();
    console.log(`✅ ${name}: ${response.status} - ${data.success ? 'SUCCESS' : 'FAILED'}`);
    return true;
  } catch (error) {
    console.log(`❌ ${name}: ERROR - ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('🧪 Testing Enterprise Features Connection...\n');
  console.log(`API URL: ${API_URL}\n`);
  
  let passed = 0;
  let failed = 0;
  
  // Test health endpoints
  console.log('📡 Testing Health Endpoints:');
  if (await testEndpoint('Health Check', '/api/health')) passed++; else failed++;
  if (await testEndpoint('API Test', '/api/test')) passed++; else failed++;
  console.log('');
  
  // Test enhanced endpoints (will fail without auth, but should return 401 not 404)
  console.log('🚀 Testing Enhanced Endpoints (expect 401 without auth):');
  if (await testEndpoint('P&L Budget', '/api/financial-reports-enhanced/profit-loss-budget?startDate=2024-01-01&endDate=2024-12-31')) passed++; else failed++;
  if (await testEndpoint('P&L Waterfall', '/api/financial-reports-enhanced/profit-loss-waterfall?startDate=2024-01-01&endDate=2024-12-31')) passed++; else failed++;
  if (await testEndpoint('P&L Ratios', '/api/financial-reports-enhanced/profit-loss-ratios?startDate=2024-01-01&endDate=2024-12-31')) passed++; else failed++;
  if (await testEndpoint('P&L Scenarios', '/api/financial-reports-enhanced/profit-loss-scenarios?startDate=2024-01-01&endDate=2024-12-31')) passed++; else failed++;
  if (await testEndpoint('P&L Insights', '/api/financial-reports-enhanced/profit-loss-insights?startDate=2024-01-01&endDate=2024-12-31')) passed++; else failed++;
  console.log('');
  
  console.log('📊 Test Summary:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! Backend is properly configured.');
  } else {
    console.log('\n⚠️  Some tests failed. Check if backend is running and routes are registered.');
  }
}

// Run tests
runTests().catch(console.error);
