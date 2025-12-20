# Advanced P&L Features - Complete Guide

## 🎉 New Features Implemented

### 1. **Budget vs Actual Comparison** ✅
Compare actual P&L performance against budgeted amounts.

### 2. **Transaction Drill-Down** ✅
View underlying transactions for each account line item.

### 3. **Multi-Period Comparison** ✅
Compare P&L across multiple periods (monthly, quarterly, yearly).

### 4. **Department/Segment P&L** ✅
Generate P&L reports by department or business unit.

---

## 📊 Feature 1: Budget vs Actual Comparison

### API Endpoint
```http
GET /api/financial-reports/profit-loss?startDate=2024-01-01&endDate=2024-12-31&includeBudget=true
```

### Request Parameters
- `startDate` (required): Start date
- `endDate` (required): End date
- `includeBudget=true` (required): Enable budget comparison

### Response Structure
```json
{
  "success": true,
  "data": {
    "revenue": { "total": 1000000, ... },
    "netIncome": 150000,
    "budget": {
      "revenue": 1200000,
      "expenses": 1000000,
      "netIncome": 200000,
      "variance": {
        "revenue": -200000,
        "revenuePercent": -16.67,
        "netIncome": -50000,
        "netIncomePercent": -25.00
      }
    }
  }
}
```

### Usage Example
```bash
curl "http://localhost:5000/api/financial-reports/profit-loss?startDate=2024-01-01&endDate=2024-12-31&includeBudget=true" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Interpretation
- **Positive variance**: Actual > Budget (Good for revenue, bad for expenses)
- **Negative variance**: Actual < Budget (Bad for revenue, good for expenses)
- **Percentage**: Shows how much actual differs from budget

---

## 🔍 Feature 2: Transaction Drill-Down

### API Endpoint
```http
GET /api/financial-reports/profit-loss?startDate=2024-01-01&endDate=2024-12-31&includeTransactions=true
```

### Request Parameters
- `startDate` (required): Start date
- `endDate` (required): End date
- `includeTransactions=true` (required): Include transaction details

### Response Structure
```json
{
  "success": true,
  "data": {
    "revenue": {
      "items": [
        {
          "accountId": "507f1f77bcf86cd799439011",
          "account": "Sales Revenue",
          "code": "4000",
          "amount": 500000,
          "transactionCount": 150,
          "transactions": [
            {
              "_id": "507f1f77bcf86cd799439012",
              "date": "2024-01-15",
              "description": "Invoice #INV-001",
              "debit": 0,
              "credit": 5000,
              "reference": "INV-001"
            }
          ]
        }
      ]
    }
  }
}
```

### Usage Example
```bash
curl "http://localhost:5000/api/financial-reports/profit-loss?startDate=2024-01-01&endDate=2024-01-31&includeTransactions=true" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Benefits
- Verify account balances
- Audit trail for each line item
- Quick access to supporting documents
- Identify specific transactions

### Note
- Limited to 100 transactions per account for performance
- Use account-transactions endpoint for full list

---

## 📈 Feature 3: Multi-Period Comparison

### API Endpoint
```http
GET /api/financial-reports/profit-loss/multi-period?startDate=2024-01-01&endDate=2024-12-31&periodType=monthly
```

### Request Parameters
- `startDate` (required): Start date
- `endDate` (required): End date
- `periodType` (optional): `monthly`, `quarterly`, or `yearly` (default: monthly)

### Response Structure
```json
{
  "success": true,
  "data": {
    "periodType": "monthly",
    "periods": [
      {
        "period": "Jan 2024",
        "startDate": "2024-01-01",
        "endDate": "2024-01-31",
        "totalRevenue": 80000,
        "totalCOGS": 32000,
        "grossProfit": 48000,
        "ebitda": 20000,
        "netIncome": 12000,
        "change": null
      },
      {
        "period": "Feb 2024",
        "startDate": "2024-02-01",
        "endDate": "2024-02-29",
        "totalRevenue": 90000,
        "totalCOGS": 36000,
        "grossProfit": 54000,
        "ebitda": 24000,
        "netIncome": 15000,
        "change": {
          "revenue": 10000,
          "revenuePercent": 12.5,
          "netIncome": 3000,
          "netIncomePercent": 25.0
        }
      }
    ]
  }
}
```

### Usage Examples

#### Monthly Comparison
```bash
curl "http://localhost:5000/api/financial-reports/profit-loss/multi-period?startDate=2024-01-01&endDate=2024-12-31&periodType=monthly" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Quarterly Comparison
```bash
curl "http://localhost:5000/api/financial-reports/profit-loss/multi-period?startDate=2024-01-01&endDate=2024-12-31&periodType=quarterly" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Yearly Comparison
```bash
curl "http://localhost:5000/api/financial-reports/profit-loss/multi-period?startDate=2020-01-01&endDate=2024-12-31&periodType=yearly" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Benefits
- Identify trends over time
- Spot seasonal patterns
- Track growth rates
- Period-over-period analysis

---

## 🏢 Feature 4: Department/Segment P&L

### API Endpoint
```http
GET /api/financial-reports/profit-loss/by-department?startDate=2024-01-01&endDate=2024-12-31
```

### Request Parameters
- `startDate` (required): Start date
- `endDate` (required): End date

### Response Structure
```json
{
  "success": true,
  "data": {
    "departments": [
      {
        "departmentId": "507f1f77bcf86cd799439011",
        "departmentName": "Sales",
        "revenue": 600000,
        "expenses": 400000,
        "netIncome": 200000,
        "margin": 33.33
      },
      {
        "departmentId": "507f1f77bcf86cd799439012",
        "departmentName": "Marketing",
        "revenue": 200000,
        "expenses": 180000,
        "netIncome": 20000,
        "margin": 10.00
      },
      {
        "departmentId": "507f1f77bcf86cd799439013",
        "departmentName": "Operations",
        "revenue": 400000,
        "expenses": 350000,
        "netIncome": 50000,
        "margin": 12.50
      }
    ],
    "totals": {
      "revenue": 1200000,
      "expenses": 930000,
      "netIncome": 270000
    },
    "period": {
      "startDate": "2024-01-01",
      "endDate": "2024-12-31"
    }
  }
}
```

### Usage Example
```bash
curl "http://localhost:5000/api/financial-reports/profit-loss/by-department?startDate=2024-01-01&endDate=2024-12-31" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Single Department P&L
```bash
curl "http://localhost:5000/api/financial-reports/profit-loss?startDate=2024-01-01&endDate=2024-12-31&departmentId=507f1f77bcf86cd799439011" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Benefits
- Evaluate department performance
- Identify profitable/unprofitable units
- Resource allocation decisions
- Performance benchmarking

---

## 🔄 Combined Features

### Example: Full-Featured P&L Request
```bash
curl "http://localhost:5000/api/financial-reports/profit-loss?\
startDate=2024-01-01&\
endDate=2024-12-31&\
compareYoY=true&\
includeBudget=true&\
includeTransactions=true&\
departmentId=507f1f77bcf86cd799439011" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

This returns:
- ✅ Complete P&L structure
- ✅ Year-over-year comparison
- ✅ Budget vs actual variance
- ✅ Transaction details
- ✅ Filtered by department

---

## 📊 Frontend Integration Examples

### React Component: Budget vs Actual
```typescript
import { useState, useEffect } from 'react';

export default function BudgetComparison() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('/api/financial-reports/profit-loss?startDate=2024-01-01&endDate=2024-12-31&includeBudget=true', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(result => setData(result.data));
  }, []);

  if (!data) return <div>Loading...</div>;

  return (
    <div>
      <h2>Budget vs Actual</h2>
      <table>
        <thead>
          <tr>
            <th>Metric</th>
            <th>Actual</th>
            <th>Budget</th>
            <th>Variance</th>
            <th>%</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Revenue</td>
            <td>${data.revenue.total.toLocaleString()}</td>
            <td>${data.budget.revenue.toLocaleString()}</td>
            <td className={data.budget.variance.revenue >= 0 ? 'positive' : 'negative'}>
              ${data.budget.variance.revenue.toLocaleString()}
            </td>
            <td>{data.budget.variance.revenuePercent.toFixed(2)}%</td>
          </tr>
          <tr>
            <td>Net Income</td>
            <td>${data.netIncome.toLocaleString()}</td>
            <td>${data.budget.netIncome.toLocaleString()}</td>
            <td className={data.budget.variance.netIncome >= 0 ? 'positive' : 'negative'}>
              ${data.budget.variance.netIncome.toLocaleString()}
            </td>
            <td>{data.budget.variance.netIncomePercent.toFixed(2)}%</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
```

### React Component: Multi-Period Trend
```typescript
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

export default function PLTrend() {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch('/api/financial-reports/profit-loss/multi-period?startDate=2024-01-01&endDate=2024-12-31&periodType=monthly', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(result => setData(result.data.periods));
  }, []);

  return (
    <LineChart width={800} height={400} data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="period" />
      <YAxis />
      <Tooltip />
      <Legend />
      <Line type="monotone" dataKey="totalRevenue" stroke="#8884d8" name="Revenue" />
      <Line type="monotone" dataKey="netIncome" stroke="#82ca9d" name="Net Income" />
      <Line type="monotone" dataKey="ebitda" stroke="#ffc658" name="EBITDA" />
    </LineChart>
  );
}
```

### React Component: Department Performance
```typescript
export default function DepartmentPL() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('/api/financial-reports/profit-loss/by-department?startDate=2024-01-01&endDate=2024-12-31', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(result => setData(result.data));
  }, []);

  if (!data) return <div>Loading...</div>;

  return (
    <div>
      <h2>Department Performance</h2>
      <table>
        <thead>
          <tr>
            <th>Department</th>
            <th>Revenue</th>
            <th>Expenses</th>
            <th>Net Income</th>
            <th>Margin %</th>
          </tr>
        </thead>
        <tbody>
          {data.departments.map(dept => (
            <tr key={dept.departmentId}>
              <td>{dept.departmentName}</td>
              <td>${dept.revenue.toLocaleString()}</td>
              <td>${dept.expenses.toLocaleString()}</td>
              <td className={dept.netIncome >= 0 ? 'positive' : 'negative'}>
                ${dept.netIncome.toLocaleString()}
              </td>
              <td>{dept.margin.toFixed(2)}%</td>
            </tr>
          ))}
          <tr className="totals">
            <td><strong>Total</strong></td>
            <td><strong>${data.totals.revenue.toLocaleString()}</strong></td>
            <td><strong>${data.totals.expenses.toLocaleString()}</strong></td>
            <td><strong>${data.totals.netIncome.toLocaleString()}</strong></td>
            <td></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
```

---

## 🎯 Use Cases

### Use Case 1: Monthly Performance Review
```bash
# Get monthly P&L with YoY comparison
curl "http://localhost:5000/api/financial-reports/profit-loss/multi-period?\
startDate=2024-01-01&endDate=2024-12-31&periodType=monthly" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Use Case 2: Budget Variance Analysis
```bash
# Compare Q1 actual vs budget
curl "http://localhost:5000/api/financial-reports/profit-loss?\
startDate=2024-01-01&endDate=2024-03-31&includeBudget=true" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Use Case 3: Department Profitability
```bash
# Identify most profitable departments
curl "http://localhost:5000/api/financial-reports/profit-loss/by-department?\
startDate=2024-01-01&endDate=2024-12-31" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Use Case 4: Transaction Audit
```bash
# Verify revenue accounts with transactions
curl "http://localhost:5000/api/financial-reports/profit-loss?\
startDate=2024-01-01&endDate=2024-01-31&includeTransactions=true" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🔧 Setup Requirements

### 1. Database Schema Updates
Ensure Ledger model has department and costCenter fields:
```javascript
db.ledgers.updateMany({}, { $set: { department: null, costCenter: null } })
```

### 2. Create Indexes
```javascript
db.ledgers.createIndex({ department: 1, date: 1 })
db.ledgers.createIndex({ costCenter: 1, date: 1 })
```

### 3. Budget Data
Ensure Budget collection exists with proper structure:
```javascript
{
  accountType: 'revenue' | 'expense',
  amount: Number,
  startDate: Date,
  endDate: Date,
  isActive: Boolean
}
```

---

## 📈 Performance Considerations

### Caching
- Budget data is fetched per request (consider caching)
- Transaction drill-down limited to 100 per account
- Multi-period uses sequential queries (consider parallel)

### Optimization Tips
1. Use date range indexes
2. Limit transaction drill-down to specific accounts
3. Cache department list
4. Use summary endpoint for dashboards

---

## ✅ Feature Summary

| Feature | Endpoint | Key Benefit |
|---------|----------|-------------|
| Budget vs Actual | `?includeBudget=true` | Performance tracking |
| Transaction Drill-Down | `?includeTransactions=true` | Audit trail |
| Multi-Period | `/multi-period` | Trend analysis |
| Department P&L | `/by-department` | Unit performance |

**All features are production-ready and fully integrated!** 🎉
