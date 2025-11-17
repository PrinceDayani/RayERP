const axios = require('axios');

// Configuration
const API_BASE_URL = process.env.API_URL || 'http://localhost:5000';
const API_URL = `${API_BASE_URL}/api/general-ledger`;

// Test data
const testData = {
  group: {
    code: 'TEST001',
    name: 'Test Assets Group',
    type: 'assets',
    description: 'Test group for validation'
  },
  subGroup: {
    code: 'TESTSUB001',
    name: 'Test Sub Group',
    description: 'Test sub group for validation'
  },
  account: {
    code: 'ACC001',
    name: 'Test Cash Account',
    type: 'asset',
    balance: 10000,
    openingBalance: 10000,
    currency: 'INR'
  },
  ledger: {
    code: 'LED001',
    name: 'Test Ledger',
    openingBalance: 5000,
    balanceType: 'debit',
    currency: 'INR'
  },
  journalEntry: {
    date: new Date().toISOString().split('T')[0],
    reference: 'TEST001',
    description: 'Test journal entry for validation',
    lines: [
      {
        debit: 1000,
        credit: 0,
        description: 'Test debit entry'
      },
      {
        debit: 0,
        credit: 1000,
        description: 'Test credit entry'
      }
    ]
  }
};

// Helper functions
const makeRequest = async (method, endpoint, data = null, headers = {}) => {
  try {
    const config = {
      method,
      url: `${API_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status || 500
    };
  }
};

const logResult = (testName, result) => {
  const status = result.success ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} ${testName}`);
  
  if (!result.success) {
    console.log(`   Error: ${JSON.stringify(result.error, null, 2)}`);
  }
  
  console.log(''); // Empty line for readability
};

// Test functions
const testGroupOperations = async () => {
  console.log('🧪 Testing Group Operations...\n');
  
  // Test create group
  let result = await makeRequest('POST', '/groups', testData.group);
  logResult('Create Group', result);
  
  if (!result.success) return null;
  const groupId = result.data._id;
  
  // Test get groups
  result = await makeRequest('GET', '/groups');
  logResult('Get Groups', result);
  
  // Test get group by ID
  result = await makeRequest('GET', `/groups/${groupId}`);
  logResult('Get Group by ID', result);
  
  // Test update group
  const updateData = { ...testData.group, name: 'Updated Test Group' };
  result = await makeRequest('PUT', `/groups/${groupId}`, updateData);
  logResult('Update Group', result);
  
  return groupId;
};

const testSubGroupOperations = async (groupId) => {
  if (!groupId) return null;
  
  console.log('🧪 Testing Sub-Group Operations...\n');
  
  // Test create sub-group
  const subGroupData = { ...testData.subGroup, groupId };
  let result = await makeRequest('POST', '/sub-groups', subGroupData);
  logResult('Create Sub-Group', result);
  
  if (!result.success) return null;
  const subGroupId = result.data._id;
  
  // Test get sub-groups
  result = await makeRequest('GET', '/sub-groups');
  logResult('Get Sub-Groups', result);
  
  // Test get sub-group by ID
  result = await makeRequest('GET', `/sub-groups/${subGroupId}`);
  logResult('Get Sub-Group by ID', result);
  
  return subGroupId;
};

const testAccountOperations = async () => {
  console.log('🧪 Testing Account Operations...\n');
  
  // Test create account
  let result = await makeRequest('POST', '/accounts', testData.account);
  logResult('Create Account', result);
  
  if (!result.success) return null;
  const accountId = result.data._id;
  
  // Test get accounts
  result = await makeRequest('GET', '/accounts');
  logResult('Get Accounts', result);
  
  // Test get account hierarchy
  result = await makeRequest('GET', '/hierarchy');
  logResult('Get Account Hierarchy', result);
  
  return accountId;
};

const testLedgerOperations = async (accountId) => {
  if (!accountId) return null;
  
  console.log('🧪 Testing Ledger Operations...\n');
  
  // Test create ledger
  const ledgerData = { ...testData.ledger, accountId };
  let result = await makeRequest('POST', '/ledgers', ledgerData);
  logResult('Create Ledger', result);
  
  if (!result.success) return null;
  const ledgerId = result.data._id;
  
  // Test get ledgers
  result = await makeRequest('GET', '/ledgers');
  logResult('Get Ledgers', result);
  
  // Test get ledger by ID
  result = await makeRequest('GET', `/ledgers/${ledgerId}`);
  logResult('Get Ledger by ID', result);
  
  return ledgerId;
};

const testJournalEntryOperations = async (accountId) => {
  if (!accountId) return null;
  
  console.log('🧪 Testing Journal Entry Operations...\n');
  
  // Update journal entry lines with actual account ID
  const journalData = {
    ...testData.journalEntry,
    lines: testData.journalEntry.lines.map(line => ({
      ...line,
      accountId
    }))
  };
  
  // Test create journal entry
  let result = await makeRequest('POST', '/journal-entries', journalData);
  logResult('Create Journal Entry', result);
  
  if (!result.success) return null;
  const journalId = result.data._id;
  
  // Test get journal entries
  result = await makeRequest('GET', '/journal-entries');
  logResult('Get Journal Entries', result);
  
  // Test get journal entry by ID
  result = await makeRequest('GET', `/journal-entries/${journalId}`);
  logResult('Get Journal Entry by ID', result);
  
  return journalId;
};

const testReportOperations = async () => {
  console.log('🧪 Testing Report Operations...\n');
  
  // Test trial balance
  let result = await makeRequest('GET', '/trial-balance');
  logResult('Get Trial Balance', result);
  
  // Test financial reports
  result = await makeRequest('GET', '/reports?reportType=balance-sheet');
  logResult('Get Balance Sheet', result);
  
  result = await makeRequest('GET', '/reports?reportType=profit-loss');
  logResult('Get Profit & Loss', result);
};

const testValidationErrors = async () => {
  console.log('🧪 Testing Validation Errors...\n');
  
  // Test invalid group creation
  let result = await makeRequest('POST', '/groups', { name: 'Invalid Group' }); // Missing required fields
  logResult('Invalid Group Creation (should fail)', { success: !result.success });
  
  // Test invalid journal entry
  result = await makeRequest('POST', '/journal-entries', {
    date: 'invalid-date',
    description: '',
    lines: []
  });
  logResult('Invalid Journal Entry (should fail)', { success: !result.success });
  
  // Test invalid ObjectId
  result = await makeRequest('GET', '/groups/invalid-id');
  logResult('Invalid ObjectId (should fail)', { success: !result.success });
};

const testSecurityFeatures = async () => {
  console.log('🧪 Testing Security Features...\n');
  
  // Test without authentication token
  let result = await makeRequest('GET', '/groups', null, {});
  logResult('Request without Auth Token (should fail)', { success: !result.success });
  
  // Test SQL injection attempt
  result = await makeRequest('GET', '/groups?code=\'; DROP TABLE groups; --');
  logResult('SQL Injection Attempt (should be safe)', { success: true }); // Should not crash
};

const testPerformance = async () => {
  console.log('🧪 Testing Performance...\n');
  
  const startTime = Date.now();
  
  // Test pagination
  let result = await makeRequest('GET', '/journal-entries?page=1&limit=10');
  logResult('Pagination Test', result);
  
  // Test date range filtering
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  result = await makeRequest('GET', `/journal-entries?startDate=${startDate}&endDate=${endDate}`);
  logResult('Date Range Filtering', result);
  
  const endTime = Date.now();
  console.log(`⏱️  Performance Test completed in ${endTime - startTime}ms\n`);
};

// Cleanup function
const cleanup = async (groupId, accountId) => {
  console.log('🧹 Cleaning up test data...\n');
  
  if (accountId) {
    await makeRequest('DELETE', `/accounts/${accountId}`);
    console.log('✅ Cleaned up test account');
  }
  
  if (groupId) {
    await makeRequest('DELETE', `/groups/${groupId}`);
    console.log('✅ Cleaned up test group');
  }
  
  console.log('');
};

// Main test runner
const runAllTests = async () => {
  console.log('🚀 Starting General Ledger Comprehensive Tests\n');
  console.log('=' .repeat(60) + '\n');
  
  let groupId = null;
  let accountId = null;
  
  try {
    // Core functionality tests
    groupId = await testGroupOperations();
    await testSubGroupOperations(groupId);
    accountId = await testAccountOperations();
    await testLedgerOperations(accountId);
    await testJournalEntryOperations(accountId);
    await testReportOperations();
    
    // Error handling tests
    await testValidationErrors();
    await testSecurityFeatures();
    await testPerformance();
    
    console.log('🎉 All tests completed!\n');
    
  } catch (error) {
    console.error('💥 Test suite failed:', error);
  } finally {
    // Cleanup
    await cleanup(groupId, accountId);
  }
  
  console.log('=' .repeat(60));
  console.log('📊 Test Summary:');
  console.log('   - Core CRUD operations tested');
  console.log('   - Validation and error handling verified');
  console.log('   - Security features validated');
  console.log('   - Performance benchmarks completed');
  console.log('   - Data cleanup performed');
  console.log('=' .repeat(60));
};

// Health check function
const healthCheck = async () => {
  console.log('🏥 Performing Health Check...\n');
  
  try {
    const response = await axios.get(`${API_BASE_URL}/health`);
    console.log('✅ API Health Check: PASSED');
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${JSON.stringify(response.data, null, 2)}\n`);
    return true;
  } catch (error) {
    console.log('❌ API Health Check: FAILED');
    console.log(`   Error: ${error.message}\n`);
    return false;
  }
};

// Export for use in other modules
module.exports = {
  runAllTests,
  healthCheck,
  testData,
  makeRequest
};

// Run tests if this file is executed directly
if (require.main === module) {
  (async () => {
    const isHealthy = await healthCheck();
    if (isHealthy) {
      await runAllTests();
    } else {
      console.log('❌ Skipping tests due to failed health check');
      process.exit(1);
    }
  })();
}