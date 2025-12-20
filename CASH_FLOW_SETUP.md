# Cash Flow System - Quick Setup Guide

## 1. Add Routes to Server

Add this line to your `backend/src/server.ts` or main app file:

```typescript
import cashFlowManagementRoutes from './routes/cashFlowManagement.routes';

// Add with other routes
app.use('/api/cash-flow-management', cashFlowManagementRoutes);
```

## 2. Add Migration Script to package.json

```json
{
  "scripts": {
    "migrate:cashflow": "ts-node src/scripts/migrateCashFlowCategories.ts",
    "seed:cashflow": "ts-node src/scripts/seedCashFlowData.ts"
  }
}
```

## 3. Run Migration

```bash
cd backend
npm run migrate:cashflow
```

## 4. Test APIs

```bash
# Get entries needing review
curl http://localhost:5000/api/cash-flow-management/entries/needs-review

# Get reconciliation
curl "http://localhost:5000/api/cash-flow-management/reconciliation?startDate=2024-01-01&endDate=2024-12-31"

# Get statistics
curl http://localhost:5000/api/cash-flow-management/statistics

# Get cash flow (indirect method)
curl "http://localhost:5000/api/financial-reports/cash-flow?startDate=2024-01-01&endDate=2024-12-31"

# Get cash flow (direct method)
curl "http://localhost:5000/api/financial-reports/cash-flow?startDate=2024-01-01&endDate=2024-12-31&method=direct"
```

## 5. Create Your First Rule

```bash
curl -X POST http://localhost:5000/api/cash-flow-management/rules \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Salary Payments = Operating",
    "category": "OPERATING",
    "priority": 10,
    "conditions": {
      "descriptionContains": ["salary", "wage", "payroll"]
    }
  }'
```

## 6. Override a Category

```bash
curl -X PATCH http://localhost:5000/api/cash-flow-management/entries/LEDGER_ID/override \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "category": "INVESTING",
    "reason": "Equipment purchase, not operating expense"
  }'
```

## Done! 🎉

Your cash flow system is now production-ready with:
- ✅ Smart auto-categorization
- ✅ Manual override capability
- ✅ Rules engine
- ✅ Reconciliation
- ✅ Both Direct & Indirect methods
- ✅ Full audit trail
