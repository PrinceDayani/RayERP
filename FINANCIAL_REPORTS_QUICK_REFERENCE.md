# Financial Reports - Quick Reference

## 🚀 Quick Start

### 1. Start Backend
```bash
cd backend
npm run dev
```

### 2. Start Frontend
```bash
cd frontend
npm run dev
```

### 3. Access Reports
```
http://localhost:3000/dashboard/finance/reports
```

---

## 📋 Report Types

| Report | Endpoint | Use Case |
|--------|----------|----------|
| Profit & Loss | `/profit-loss` | Income statement, profitability |
| Balance Sheet | `/balance-sheet` | Financial position, assets/liabilities |
| Cash Flow | `/cash-flow` | Cash movements, liquidity |
| Trial Balance | `/trial-balance` | Account balances verification |
| General Ledger | `/general-ledger` | Detailed transactions |
| Accounts Receivable | `/accounts-receivable` | Customer invoices, aging |
| Accounts Payable | `/accounts-payable` | Vendor bills, aging |
| Expense Report | `/expense-report` | Expense analysis by category |
| Revenue Report | `/revenue-report` | Revenue analysis by category |

---

## 🔑 Common Query Parameters

```
?startDate=2024-01-01          # Start date
?endDate=2024-12-31            # End date
?asOfDate=2024-12-31           # Point-in-time date
?costCenterId=xxx              # Filter by cost center
?departmentId=xxx              # Filter by department
?includeBudget=true            # Include budget comparison
?includeTransactions=true      # Include transaction details
?compareYoY=true               # Year-over-year comparison
?page=1&limit=100              # Pagination
```

---

## 💡 Common Tasks

### Generate Current Year P&L
```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5000/api/financial-reports/profit-loss?startDate=2024-01-01&endDate=2024-12-31"
```

### Export Balance Sheet to CSV
```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5000/api/financial-reports/export?reportType=balance-sheet&asOfDate=2024-12-31&format=csv" \
  -o balance-sheet.csv
```

### Get Department P&L
```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5000/api/financial-reports/profit-loss/by-department?startDate=2024-01-01&endDate=2024-12-31"
```

### Clear Report Cache
```bash
curl -X POST -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5000/api/financial-reports/clear-cache"
```

---

## 🐛 Troubleshooting

### Issue: "No data received from server"
**Solution**: Check if backend is running and MongoDB is connected
```bash
curl http://localhost:5000/api/health
```

### Issue: "Aggregation pipeline error"
**Solution**: Ensure chartofaccounts collection exists
```bash
mongosh rayerp --eval "db.chartofaccounts.countDocuments()"
```

### Issue: "Trial Balance out of balance"
**Solution**: Check for unposted journal entries
```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5000/api/financial-reports/trial-balance?asOfDate=2024-12-31"
```

### Issue: "Export fails"
**Solution**: Check file permissions and disk space
```bash
df -h
ls -la backend/exports/
```

---

## 📊 Response Structure

### Profit & Loss
```json
{
  "success": true,
  "data": {
    "revenue": {
      "accounts": [{ "_id": "...", "name": "...", "code": "...", "balance": 0 }],
      "total": 0
    },
    "expenses": {
      "accounts": [...],
      "total": 0
    },
    "netIncome": 0,
    "margins": {
      "gross": 0,
      "ebitda": 0,
      "operating": 0,
      "net": 0
    }
  }
}
```

### Balance Sheet
```json
{
  "success": true,
  "data": {
    "assets": {
      "current": [...],
      "nonCurrent": {...},
      "total": 0
    },
    "liabilities": {
      "current": [...],
      "longTerm": [...],
      "total": 0
    },
    "equity": {
      "total": 0
    },
    "balanced": true
  }
}
```

---

## 🎨 Frontend Components

### Import
```typescript
import FinancialReports from '@/components/finance/FinancialReports';
```

### Usage
```tsx
<FinancialReports />
```

### Props (if needed)
```typescript
interface FinancialReportsProps {
  defaultReportType?: string;
  defaultDateRange?: { start: string; end: string };
}
```

---

## 🔐 Authentication

All endpoints require JWT token:
```typescript
const token = localStorage.getItem('auth-token');
const headers = { 'Authorization': `Bearer ${token}` };
```

---

## 📈 Performance Tips

1. **Use Caching**: Reports are cached for 5 minutes
2. **Pagination**: Use `page` and `limit` for large datasets
3. **Date Ranges**: Smaller date ranges = faster queries
4. **Filters**: Use `departmentId` or `costCenterId` to reduce data
5. **Clear Cache**: Clear cache after posting new transactions

---

## 🔄 Data Flow

```
User Action → Frontend Component → API Call → Backend Controller → 
MongoDB Aggregation → Cache → Response → Frontend Display
```

---

## 📝 Code Locations

| Component | File |
|-----------|------|
| Frontend | `frontend/src/components/finance/FinancialReports.tsx` |
| Backend Controller | `backend/src/controllers/financialReportController.ts` |
| Routes | `backend/src/routes/financialReport.routes.ts` |
| Models | `backend/src/models/ChartOfAccount.ts`, `Ledger.ts` |

---

## ✅ Testing Checklist

- [ ] Generate P&L report
- [ ] Generate Balance Sheet
- [ ] Export to CSV
- [ ] Export to JSON
- [ ] Test date presets
- [ ] Test comparison periods
- [ ] Test drill-down
- [ ] Test pagination
- [ ] Test filters (department, cost center)
- [ ] Verify Trial Balance balances
- [ ] Check AR aging
- [ ] Check AP aging

---

## 🆘 Emergency Commands

### Restart Services
```bash
# Backend
cd backend && npm run dev

# Frontend
cd frontend && npm run dev
```

### Check Logs
```bash
tail -f backend/logs/error.log
tail -f backend/logs/combined.log
```

### Database Check
```bash
mongosh rayerp
> db.chartofaccounts.countDocuments()
> db.ledgers.countDocuments()
```

---

**Quick Help**: See `FINANCIAL_REPORTS_PRODUCTION_READY.md` for full documentation
