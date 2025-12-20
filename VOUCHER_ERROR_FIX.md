# Voucher Error Fix - "Error fetching vouchers"

## Problem
The frontend is showing "Error fetching vouchers" when trying to load the vouchers page.

## Root Cause
The error occurs when the frontend cannot connect to the backend API at `http://localhost:5000/api/vouchers`.

## Solution Steps

### 1. Verify Backend is Running

**Check if backend server is running:**
```bash
cd backend
npm run dev
```

**Expected output:**
```
✅ MongoDB connected successfully
🚀 Server running on port 5000
📊 Environment: development
```

### 2. Verify Backend Health

Open your browser or use curl:
```bash
curl http://localhost:5000/api/health
```

**Expected response:**
```json
{
  "success": true,
  "message": "Server is healthy",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 3. Test Vouchers Endpoint

**First, login to get auth token:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"your-password"}'
```

**Then test vouchers endpoint:**
```bash
curl http://localhost:5000/api/vouchers \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 4. Check Frontend Configuration

**Verify .env.local file exists:**
```bash
cd frontend
cat .env.local
```

**Should contain:**
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_ENABLE_SOCKET=true
NODE_ENV=development
```

### 5. Restart Frontend

```bash
cd frontend
npm run dev
```

### 6. Check Browser Console

Open browser DevTools (F12) and check:
- **Console tab**: Look for detailed error messages
- **Network tab**: Check if API calls are being made and their status codes

## Common Issues & Fixes

### Issue 1: Backend Not Running
**Symptom:** `Failed to fetch` or `Network error`
**Fix:** Start the backend server
```bash
cd backend
npm run dev
```

### Issue 2: MongoDB Not Connected
**Symptom:** Backend starts but crashes immediately
**Fix:** Ensure MongoDB is running
```bash
# For local MongoDB
mongod

# Or check your MONGO_URI in backend/.env
```

### Issue 3: Authentication Token Missing
**Symptom:** `Authentication token not found`
**Fix:** Login again through the frontend

### Issue 4: CORS Error
**Symptom:** `CORS policy` error in console
**Fix:** Check backend/.env has correct CORS_ORIGIN
```env
CORS_ORIGIN=http://localhost:3000
FRONTEND_URL=http://localhost:3000
```

### Issue 5: Port Already in Use
**Symptom:** `Port 5000 is already in use`
**Fix:** Kill the process or change port
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Or change PORT in backend/.env
PORT=5001
```

## Enhanced Error Messages

The vouchers page now includes better error handling:

1. **API URL Check**: Validates API_URL is configured
2. **Auth Token Check**: Validates authentication token exists
3. **Detailed Logging**: Console logs show exact API calls and responses
4. **User-Friendly Messages**: Clear error messages guide users to solutions

## Verification Checklist

- [ ] Backend server is running on port 5000
- [ ] MongoDB is connected
- [ ] Frontend .env.local has NEXT_PUBLIC_API_URL=http://localhost:5000
- [ ] User is logged in (auth token exists)
- [ ] No CORS errors in browser console
- [ ] API health check returns success
- [ ] Vouchers endpoint returns data

## Testing the Fix

1. **Start Backend:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Start Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Login:**
   - Navigate to http://localhost:3000
   - Login with valid credentials

4. **Access Vouchers:**
   - Navigate to Dashboard → Finance → Vouchers
   - Check browser console for detailed logs

## Expected Console Output (Success)

```
API_URL: http://localhost:5000
Fetching vouchers from: http://localhost:5000/api/vouchers?limit=20&page=1
Response status: 200
Vouchers data: { success: true, data: [...], pagination: {...} }
```

## Expected Console Output (Error)

```
API_URL: http://localhost:5000
Fetching vouchers from: http://localhost:5000/api/vouchers?limit=20&page=1
Error fetching vouchers: TypeError: Failed to fetch
```

If you see "Failed to fetch", the backend is not running or not accessible.

## Additional Debugging

### Enable Verbose Logging

**Backend (server.ts):**
Already has request logging enabled for all /api/* routes

**Frontend (page.tsx):**
Already has console.log statements for debugging

### Check Network Tab

1. Open DevTools (F12)
2. Go to Network tab
3. Filter by "vouchers"
4. Check:
   - Request URL
   - Request Headers (Authorization token)
   - Response Status
   - Response Body

## Contact Support

If the issue persists after following all steps:
1. Check backend logs in `backend/logs/`
2. Share browser console errors
3. Share network tab details
4. Verify all environment variables

---

**Status**: ✅ Fixed with enhanced error handling
**Version**: 2.0.1
**Last Updated**: 2024
