// Run this in browser console on the vouchers page
console.log('Testing vouchers API...');
console.log('API URL:', 'http://localhost:5000');
console.log('Auth Token:', localStorage.getItem('auth-token'));

fetch('http://localhost:5000/api/vouchers?limit=20&page=1', {
  headers: { 
    'Authorization': `Bearer ${localStorage.getItem('auth-token')}` 
  }
})
.then(res => {
  console.log('Status:', res.status);
  console.log('OK:', res.ok);
  return res.json();
})
.then(data => {
  console.log('Success:', data.success);
  console.log('Data:', data);
})
.catch(err => {
  console.error('Fetch Error:', err);
  console.error('Error Type:', err.name);
  console.error('Error Message:', err.message);
});
