# RayERP Troubleshooting Guide

## Current Issues Fixed

### 1. TypeScript Compilation Errors ✅ FIXED
All 10 TypeScript errors have been resolved:
- AllocationFilters.tsx - DateRange type compatibility
- InlineAllocationEditor.tsx - Type mismatch in allocation data
- SkillMatrixView.tsx - Non-existent property access
- api.ts - API client method signatures
- generalLedger.ts - API call parameter mismatches

### 2. Backend API 500 Error ✅ FIXED
**Issue**: GET `/api/general-ledger/journal-entries?limit=1000` returning 500 error

**Root Cause**: Controller was querying `date` field but schema uses `entryDate`

**Fix Applied**: Updated `getJournalEntries` controller to:
- Use `entryDate` instead of `date` in query
- Sort by `entryDate` instead of `date`
- Populate `createdBy` with correct fields (`firstName`, `lastName`, `email`)
- Added better error logging with stack traces in development

### 3. WebSocket Connection Failures ⚠️ ONGOING
**Issue**: WebSocket connections to `wss://jmrwe3zhia.us-east-1.awsapprunner.com/socket.io/` failing

**Possible Causes**:
1. AWS App Runner may not support WebSocket connections properly
2. Socket.IO server configuration issue
3. CORS or security group settings blocking WebSocket upgrade

**Impact**: Real-time features won't work, but REST API functionality is unaffected

**Recommended Solutions**:
1. Check AWS App Runner WebSocket support documentation
2. Verify Socket.IO server configuration in backend
3. Consider using AWS ECS/EKS or EC2 if WebSocket support is critical
4. Implement polling fallback for real-time features

## How to Restart Backend

If you need to restart the backend server:

```bash
cd backend
npm run dev
```

Or for production:

```bash
cd backend
npm run build:prod
npm run start:prod
```

## Verification Steps

1. **Check TypeScript compilation**:
   ```bash
   cd frontend
   npx tsc --noEmit
   ```
   Should show no errors.

2. **Test Journal Entries API**:
   ```bash
   curl https://jmrwe3zhia.us-east-1.awsapprunner.com/api/general-ledger/journal-entries?limit=10
   ```
   Should return 200 with journal entries data.

3. **Check Backend Logs**:
   Look for any error messages in the backend console or AWS CloudWatch logs.

## Next Steps

1. ✅ TypeScript errors - RESOLVED
2. ✅ Journal entries API - FIXED
3. ⚠️ WebSocket issues - Needs AWS configuration review
4. 🔄 Test the Master Ledger page in the frontend

## Files Modified

### Frontend
- `src/components/resources/AllocationFilters.tsx`
- `src/components/resources/InlineAllocationEditor.tsx`
- `src/components/resources/SkillMatrixView.tsx`
- `src/lib/api.ts`
- `src/lib/api/generalLedger.ts`

### Backend
- `src/controllers/generalLedgerController.ts`

## Contact

If issues persist, check:
1. Backend server logs
2. MongoDB connection status
3. AWS App Runner service health
4. Network connectivity between frontend and backend
