# P&L API Quick Reference Card

## 📡 All Endpoints

### 1. Basic P&L Report
```
GET /api/financial-reports/profit-loss
```
**Required**: `startDate`, `endDate`
**Optional**: `compareYoY`, `includeBudget`, `includeTransactions`, `departmentId`, `costCenterId`

**Returns**: Complete P&L with all sections

---

### 2. P&L Summary
```
GET /api/financial-reports/profit-loss/summary
```
**Required**: `startDate`, `endDate`

**Returns**: Key metrics only (revenue, COGS, gross profit, EBITDA, EBIT, net income, margins)

---

### 3. Multi-Period Comparison
```
GET /api/financial-reports/profit-loss/multi-period
```
**Required**: `startDate`, `endDate`
**Optional**: `periodType` (monthly, quarterly, yearly)

**Returns**: Array of periods with period-over-period changes

---

### 4. Department P&L
```
GET /api/financial-reports/profit-loss/by-department
```
**Required**: `startDate`, `endDate`

**Returns**: P&L for all departments with totals

---

### 5. Clear Cache
```
POST /api/financial-reports/clear-cache
```
**No parameters**

**Returns**: Success message

---

## 🎯 Common Use Cases

### Monthly Report
```bash
curl "http://localhost:5000/api/financial-reports/profit-loss?\
startDate=2024-01-01&endDate=2024-01-31" \
  -H "Authorization: Bearer TOKEN"
```

### Quarterly with YoY
```bash
curl "http://localhost:5000/api/financial-reports/profit-loss?\
startDate=2024-01-01&endDate=2024-03-31&compareYoY=true" \
  -H "Authorization: Bearer TOKEN"
```

### Annual with Budget
```bash
curl "http://localhost:5000/api/financial-reports/profit-loss?\
startDate=2024-01-01&endDate=2024-12-31&includeBudget=true" \
  -H "Authorization: Bearer TOKEN"
```

### With Transactions
```bash
curl "http://localhost:5000/api/financial-reports/profit-loss?\
startDate=2024-01-01&endDate=2024-01-31&includeTransactions=true" \
  -H "Authorization: Bearer TOKEN"
```

### By Department
```bash
curl "http://localhost:5000/api/financial-reports/profit-loss?\
startDate=2024-01-01&endDate=2024-12-31&departmentId=507f..." \
  -H "Authorization: Bearer TOKEN"
```

### 12-Month Trend
```bash
curl "http://localhost:5000/api/financial-reports/profit-loss/multi-period?\
startDate=2024-01-01&endDate=2024-12-31&periodType=monthly" \
  -H "Authorization: Bearer TOKEN"
```

### All Departments
```bash
curl "http://localhost:5000/api/financial-reports/profit-loss/by-department?\
startDate=2024-01-01&endDate=2024-12-31" \
  -H "Authorization: Bearer TOKEN"
```

---

## 📊 Response Keys

### Main P&L Response
```
revenue.total
revenue.byCategory
revenue.items
cogs.total
cogs.items
grossProfit
operatingExpenses.total
operatingExpenses.byCategory
operatingExpenses.items
ebitda
depreciation.total
depreciation.items
ebit
interestExpense.total
interestExpense.items
ebt
taxExpense.total
taxExpense.items
netIncome
margins.gross
margins.ebitda
margins.operating
margins.net
comparison (if compareYoY=true)
budget (if includeBudget=true)
period.startDate
period.endDate
filters.departmentId
filters.costCenterId
```

### Multi-Period Response
```
periodType
periods[].period
periods[].startDate
periods[].endDate
periods[].totalRevenue
periods[].totalCOGS
periods[].grossProfit
periods[].totalOperatingExpenses
periods[].ebitda
periods[].ebit
periods[].netIncome
periods[].change.revenue
periods[].change.revenuePercent
periods[].change.netIncome
periods[].change.netIncomePercent
```

### Department P&L Response
```
departments[].departmentId
departments[].departmentName
departments[].revenue
departments[].expenses
departments[].netIncome
departments[].margin
totals.revenue
totals.expenses
totals.netIncome
period.startDate
period.endDate
```

---

## ⚡ Quick Tips

1. **Cache**: First request ~300ms, cached ~10ms
2. **Transactions**: Limited to 100 per account
3. **Periods**: Use `periodType` for multi-period
4. **Budget**: Requires Budget collection data
5. **Department**: Requires department field in ledgers

---

## 🔍 Error Codes

| Code | Message | Solution |
|------|---------|----------|
| 400 | Start date and end date are required | Add both dates |
| 400 | Invalid date format | Use YYYY-MM-DD |
| 400 | Start date must be before end date | Fix date order |
| 401 | Unauthorized | Add valid token |
| 500 | Error generating P&L | Check logs |

---

## 📈 Performance

- **First Request**: 200-500ms
- **Cached Request**: <10ms
- **Cache TTL**: 5 minutes
- **Max Transactions**: 100 per account

---

## 🎯 Feature Matrix

| Feature | Endpoint | Parameter |
|---------|----------|-----------|
| Basic P&L | `/profit-loss` | - |
| YoY Comparison | `/profit-loss` | `compareYoY=true` |
| Budget vs Actual | `/profit-loss` | `includeBudget=true` |
| Transaction Details | `/profit-loss` | `includeTransactions=true` |
| Department Filter | `/profit-loss` | `departmentId=xxx` |
| Cost Center Filter | `/profit-loss` | `costCenterId=xxx` |
| Quick Summary | `/profit-loss/summary` | - |
| Multi-Period | `/profit-loss/multi-period` | `periodType=monthly` |
| All Departments | `/profit-loss/by-department` | - |
| Clear Cache | `/clear-cache` | POST |

---

**Print this card for quick reference!** 📋
