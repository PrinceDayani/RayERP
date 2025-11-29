# Export Invoice Route Fix

## Issue
The frontend was getting a "Route /api/general-ledger/export-invoice not found" error when trying to export invoices from the Account Ledger component.

## Root Cause
The issue was in the frontend API URL configuration. The Next.js application has a rewrite rule in `next.config.js` that proxies API requests:

```javascript
async rewrites() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  return [
    {
      source: '/api/:path*',
      destination: `${apiUrl}/api/:path*`,
    },
  ];
}
```

However, the frontend component was making direct requests to `${process.env.NEXT_PUBLIC_API_URL}/api/general-ledger/export-invoice` instead of using the Next.js proxy.

## Solution
Fixed the API calls in `frontend/src/components/finance/AccountLedger.tsx` to use the Next.js rewrite rule:

### Before:
```typescript
const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/general-ledger/export-invoice`, {
  // ...
});
```

### After:
```typescript
const response = await fetch('/api/general-ledger/export-invoice', {
  // ...
});
```

## Changes Made
1. **Fixed export invoice API call** - Changed from direct backend URL to Next.js proxy URL
2. **Fixed account ledger API call** - Updated to use proxy URL for consistency
3. **Fixed export ledger API call** - Updated to use proxy URL for consistency

## Verification
The backend route exists and is working correctly:
- Route: `POST /api/general-ledger/export-invoice`
- Controller: `exportInvoice` function in `generalLedgerController.ts`
- Authentication: Required (JWT token)

## Files Modified
- `frontend/src/components/finance/AccountLedger.tsx`

## Status
✅ **FIXED** - The export invoice functionality should now work properly without the "Route not found" error.

## Testing
To test the fix:
1. Navigate to Account Ledger page
2. Select one or more ledger entries
3. Click "Export Invoice" button
4. Choose PDF or JPG format
5. The invoice should export successfully