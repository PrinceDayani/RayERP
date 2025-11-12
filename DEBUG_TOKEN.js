// Run this in browser console to debug token issue

console.log('=== TOKEN DEBUG ===');
console.log('Token exists:', !!localStorage.getItem('token'));
console.log('Token value:', localStorage.getItem('token'));
console.log('Token length:', localStorage.getItem('token')?.length);

// Test API call
fetch('http://localhost:5000/api/general-ledger/accounts', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
})
.then(r => {
  console.log('Response status:', r.status);
  return r.json();
})
.then(d => console.log('Response data:', d))
.catch(e => console.error('Error:', e));

// Check if you're logged in
fetch('http://localhost:5000/api/auth/me', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
})
.then(r => r.json())
.then(d => console.log('Current user:', d))
.catch(e => console.error('Auth check failed:', e));
