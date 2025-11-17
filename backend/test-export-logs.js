const fetch = require('node-fetch');

const API_URL = 'http://localhost:5000';

async function testExportLogs() {
  try {
    console.log('Testing export logs functionality...');
    
    // Test without authentication (should fail)
    console.log('\n1. Testing without authentication...');
    const unauthResponse = await fetch(`${API_URL}/api/admin/export-logs?format=text`);
    console.log(`Status: ${unauthResponse.status} - ${unauthResponse.statusText}`);
    
    // Test with invalid format
    console.log('\n2. Testing with invalid format...');
    const invalidFormatResponse = await fetch(`${API_URL}/api/admin/export-logs?format=invalid`);
    console.log(`Status: ${invalidFormatResponse.status} - ${invalidFormatResponse.statusText}`);
    
    // Test OPTIONS request (CORS preflight)
    console.log('\n3. Testing OPTIONS request...');
    const optionsResponse = await fetch(`${API_URL}/api/admin/export-logs`, {
      method: 'OPTIONS'
    });
    console.log(`Status: ${optionsResponse.status} - ${optionsResponse.statusText}`);
    console.log('CORS Headers:', {
      'Access-Control-Allow-Origin': optionsResponse.headers.get('Access-Control-Allow-Origin'),
      'Access-Control-Allow-Methods': optionsResponse.headers.get('Access-Control-Allow-Methods'),
      'Access-Control-Allow-Headers': optionsResponse.headers.get('Access-Control-Allow-Headers')
    });
    
    console.log('\nTest completed. For authenticated tests, use the frontend admin panel.');
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testExportLogs();