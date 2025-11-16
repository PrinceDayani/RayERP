const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const testBackendConnection = async () => {
  try {
    console.log('Testing backend connection...');
    
    // Test basic health endpoint
    const healthResponse = await fetch(`${API_URL}/api/health`);
    if (!healthResponse.ok) {
      throw new Error(`Health check failed: ${healthResponse.status}`);
    }
    
    const healthData = await healthResponse.json();
    console.log('✅ Backend health check passed:', healthData);
    
    // Test finance routes
    const token = localStorage.getItem('token');
    if (token) {
      const financeResponse = await fetch(`${API_URL}/api/general-ledger/accounts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (financeResponse.ok) {
        console.log('✅ Finance API connection verified');
      } else {
        console.log('⚠️ Finance API requires authentication');
      }
    }
    
    return { success: true, message: 'Backend connection successful' };
  } catch (error) {
    console.error('❌ Backend connection failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

export const getFinanceStats = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      return { accounts: 0, entries: 0, vouchers: 0 };
    }

    const [accountsRes, entriesRes] = await Promise.all([
      fetch(`${API_URL}/api/general-ledger/accounts`, { 
        headers: { Authorization: `Bearer ${token}` } 
      }),
      fetch(`${API_URL}/api/general-ledger/journal-entries?limit=1`, { 
        headers: { Authorization: `Bearer ${token}` } 
      })
    ]);

    const accountsData = accountsRes.ok ? await accountsRes.json() : { accounts: [] };
    const entriesData = entriesRes.ok ? await entriesRes.json() : { pagination: { total: 0 } };

    return {
      accounts: accountsData.accounts?.length || 0,
      entries: entriesData.pagination?.total || 0,
      vouchers: 0
    };
  } catch (error) {
    console.error('Error fetching finance stats:', error);
    return { accounts: 0, entries: 0, vouchers: 0 };
  }
};