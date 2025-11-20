const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';
const FAST_API_BASE = 'http://localhost:5000/api/fast';

async function testPerformance() {
  console.log('🚀 Performance Test Starting...\n');

  // Test regular vs fast endpoints
  const tests = [
    { name: 'Regular Projects API', url: `${API_BASE}/projects` },
    { name: 'Fast Projects API', url: `${FAST_API_BASE}/projects` },
    { name: 'Health Check', url: `${API_BASE}/health` }
  ];

  for (const test of tests) {
    const start = Date.now();
    try {
      const response = await axios.get(test.url, { timeout: 5000 });
      const duration = Date.now() - start;
      console.log(`✅ ${test.name}: ${duration}ms (${response.status})`);
    } catch (error) {
      const duration = Date.now() - start;
      console.log(`❌ ${test.name}: ${duration}ms (Error: ${error.message})`);
    }
  }

  console.log('\n🏁 Performance Test Complete');
}

testPerformance();