# Fix: Invalid JWT Signature Error

## Problem
`Auth middleware error: invalid signature` means the stored token doesn't match the backend's JWT_SECRET.

## Quick Fix (Choose One)

### Option 1: Clear Token and Re-login (Recommended)
1. Open browser console on http://localhost:3000
2. Run:
```javascript
localStorage.clear();
```
3. Refresh page and login again

### Option 2: Check JWT_SECRET Match
Ensure frontend and backend use the same JWT_SECRET:

**Backend (.env):**
```
JWT_SECRET=your-secret-key-here
```

**Frontend (.env.local):**
```
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### Option 3: Bypass Auth for Testing (Development Only)
Add to `backend/src/middleware/auth.middleware.ts`:

```typescript
// At the top of authenticateToken function
if (process.env.NODE_ENV === 'development' && !token) {
  req.user = { id: 'test-user-id', email: 'test@example.com' };
  return next();
}
```

## Root Cause
- Token was created with different JWT_SECRET
- Backend JWT_SECRET was changed
- Token expired
- Token corrupted in localStorage

## Solution Applied
Clear localStorage and re-login to get a fresh token.
