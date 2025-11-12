// Debug Helper Script for RayERP
// Copy and paste this into your browser console to diagnose issues

console.log('🔍 RayERP Debug Helper\n');

// 1. Check Authentication Token
const token = localStorage.getItem('auth-token');
if (token) {
  console.log('✅ Auth token found');
  console.log('   Token preview:', token.substring(0, 30) + '...');
  
  // Decode JWT (basic decode, not verification)
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    console.log('   Token payload:', payload);
    console.log('   User ID:', payload.id);
    console.log('   Role:', payload.role);
    
    // Check expiration
    if (payload.exp) {
      const expDate = new Date(payload.exp * 1000);
      const now = new Date();
      if (expDate < now) {
        console.log('   ❌ Token EXPIRED on:', expDate);
      } else {
        console.log('   ✅ Token valid until:', expDate);
      }
    }
  } catch (e) {
    console.log('   ⚠️  Could not decode token');
  }
} else {
  console.log('❌ No auth token found - you need to login');
}

// 2. Check API Configuration
console.log('\n📡 API Configuration:');
console.log('   NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL || 'Not set');

// 3. Test API Endpoints
async function testAPI() {
  if (!token) {
    console.log('\n❌ Cannot test API - no token found');
    return;
  }

  console.log('\n🧪 Testing API Endpoints...\n');

  const endpoints = [
    { name: 'Auth Check', url: '/api/auth/me' },
    { name: 'Employees', url: '/api/employees' },
    { name: 'Projects', url: '/api/projects' },
    { name: 'Tasks', url: '/api/tasks' }
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`Testing ${endpoint.name}...`);
      const response = await fetch(`http://localhost:5000${endpoint.url}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const count = data.data?.length || data.length || 0;
        console.log(`✅ ${endpoint.name}: ${response.status} - ${count} items`);
      } else {
        const error = await response.json().catch(() => ({}));
        console.log(`❌ ${endpoint.name}: ${response.status} - ${error.message || 'Error'}`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint.name}: Network error - ${error.message}`);
    }
  }
}

// 4. Check Local Storage
console.log('\n💾 Local Storage:');
const keys = Object.keys(localStorage);
console.log('   Total keys:', keys.length);
keys.forEach(key => {
  const value = localStorage.getItem(key);
  if (value && value.length > 50) {
    console.log(`   ${key}: ${value.substring(0, 30)}... (${value.length} chars)`);
  } else {
    console.log(`   ${key}: ${value}`);
  }
});

// 5. Check Current User from Context
console.log('\n👤 Current User (from React Context):');
console.log('   Check the React DevTools for AuthContext');

// 6. Network Requests
console.log('\n🌐 Network Monitoring:');
console.log('   Open Network tab in DevTools to see API calls');
console.log('   Filter by "XHR" or "Fetch" to see API requests');

// Run API tests
console.log('\n' + '='.repeat(60));
testAPI().then(() => {
  console.log('\n' + '='.repeat(60));
  console.log('DEBUG COMPLETE');
  console.log('='.repeat(60));
  console.log('\nQuick Fixes:');
  console.log('1. Clear token: localStorage.removeItem("auth-token")');
  console.log('2. Clear all: localStorage.clear()');
  console.log('3. Reload page: location.reload()');
  console.log('4. Login again: window.location.href = "/login"');
});

// Export helper functions
window.debugHelper = {
  clearToken: () => {
    localStorage.removeItem('auth-token');
    console.log('✅ Token cleared');
  },
  clearAll: () => {
    localStorage.clear();
    console.log('✅ All localStorage cleared');
  },
  testAPI: testAPI,
  getToken: () => localStorage.getItem('auth-token'),
  goToLogin: () => {
    window.location.href = '/login';
  }
};

console.log('\n💡 Helper functions available:');
console.log('   debugHelper.clearToken() - Clear auth token');
console.log('   debugHelper.clearAll() - Clear all localStorage');
console.log('   debugHelper.testAPI() - Test API endpoints');
console.log('   debugHelper.getToken() - Get current token');
console.log('   debugHelper.goToLogin() - Go to login page');
