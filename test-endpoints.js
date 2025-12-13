// Quick endpoint test
const endpoints = [
  'http://localhost:5000/api/health',
  'http://localhost:5000/api/notifications?limit=100',
  'http://localhost:5000/api/dashboard/analytics',
  'http://localhost:5000/api/dashboard/trends',
  'http://localhost:5000/api/general-ledger/journal-entries?limit=1'
];

console.log('Testing endpoints...\n');

endpoints.forEach(async (url) => {
  try {
    const response = await fetch(url);
    console.log(`${response.status} - ${url}`);
  } catch (error) {
    console.log(`ERROR - ${url}: ${error.message}`);
  }
});
