# API Testing Guide

## Test if backend is running

Open browser console on http://localhost:3000 and run:

```javascript
// Test 1: Check if API is accessible
fetch('http://localhost:5000/api/health')
  .then(r => r.json())
  .then(d => console.log('API Health:', d))
  .catch(e => console.error('API Error:', e));

// Test 2: Check authentication
const token = localStorage.getItem('token');
console.log('Token exists:', !!token);

// Test 3: Try to fetch accounts
fetch('http://localhost:5000/api/general-ledger/accounts', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
})
  .then(r => r.json())
  .then(d => console.log('Accounts Response:', d))
  .catch(e => console.error('Accounts Error:', e));

// Test 4: Check journal entries
fetch('http://localhost:5000/api/general-ledger/journal-entries?limit=10&page=1', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
})
  .then(r => r.json())
  .then(d => console.log('Journal Entries Response:', d))
  .catch(e => console.error('Journal Entries Error:', e));
```

## Common Issues

### 1. CORS Error
- Check backend .env has: `CORS_ORIGIN=http://localhost:3000`
- Check backend .env has: `FRONTEND_URL=http://localhost:3000`

### 2. 401 Unauthorized
- User not logged in
- Token expired
- Check: `localStorage.getItem('token')`

### 3. 404 Not Found
- Route not registered
- Check: backend/src/routes/index.ts includes generalLedgerRoutes

### 4. 500 Server Error
- Check backend console for errors
- Database connection issue
- Model/Controller error

## Quick Fixes

### Fix 1: Clear localStorage and re-login
```javascript
localStorage.clear();
// Then login again
```

### Fix 2: Check if models are properly imported
The controller needs these imports:
```typescript
import { Account } from '../models/Account';
import { JournalEntry } from '../models/JournalEntry';
import { Ledger } from '../models/Ledger';
```

### Fix 3: Verify route permissions
Check if user has `finance.view` and `finance.manage` permissions.
