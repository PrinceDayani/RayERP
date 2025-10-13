// Simple test script to check backend endpoints
const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testEndpoints() {
  console.log('🧪 Testing Backend Endpoints...\n');

  const tests = [
    { name: 'Health Check', url: `${API_BASE}/test` },
    { name: 'Socket Health', url: `${API_BASE}/socket-health` },
    { name: 'Order Stats', url: `${API_BASE}/orders/stats` },
    { name: 'Customer Stats', url: `${API_BASE}/customers/stats` },
    { name: 'Inventory Summary', url: `${API_BASE}/inventory/summary` }
  ];

  for (const test of tests) {
    try {
      console.log(`Testing ${test.name}...`);
      const response = await axios.get(test.url, { timeout: 5000 });
      console.log(`✅ ${test.name}: ${response.status} - ${response.statusText}`);
      if (test.name === 'Health Check') {
        console.log(`   Response: ${JSON.stringify(response.data)}`);
      }
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.log(`❌ ${test.name}: Backend server not running`);
      } else if (error.response) {
        console.log(`❌ ${test.name}: ${error.response.status} - ${error.response.statusText}`);
      } else {
        console.log(`❌ ${test.name}: ${error.message}`);
      }
    }
    console.log('');
  }
}

testEndpoints().catch(console.error);