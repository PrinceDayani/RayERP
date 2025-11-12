# Department Budget Management

## Overview
The Department Budget feature allows organizations to allocate, track, and manage budgets for each department with fiscal year tracking, category-wise allocation, and expense monitoring.

## Features

### Budget Management
- Create budgets for departments by fiscal year
- Define budget categories with allocated amounts
- Track spent amounts per category
- Monitor remaining budget in real-time
- Budget approval workflow

### Budget Tracking
- Total budget allocation
- Category-wise budget breakdown
- Expense tracking per category
- Utilization rate calculation
- Budget summary per department

## API Endpoints

Base URL: `http://localhost:5000/api/department-budgets`

### Get All Budgets
```
GET /
Query Parameters:
  - departmentId: Filter by department
  - fiscalYear: Filter by fiscal year
  - status: Filter by status (draft, approved, active, closed)
```

### Get Budget by ID
```
GET /:id
```

### Get Department Budget Summary
```
GET /department/:departmentId/summary
Response: {
  totalAllocated: number,
  totalSpent: number,
  totalRemaining: number,
  utilizationRate: string,
  budgetCount: number
}
```

### Create Budget
```
POST /
Body: {
  departmentId: string (required),
  fiscalYear: string (required),
  totalBudget: number (required),
  categories: [
    { name: string, allocated: number }
  ],
  notes: string
}
```

### Update Budget
```
PUT /:id
Body: {
  totalBudget: number,
  categories: [
    { name: string, allocated: number, spent: number }
  ],
  notes: string,
  status: string
}
```

### Approve Budget
```
PUT /:id/approve
```

### Record Expense
```
PUT /:id/expense
Body: {
  categoryName: string (required),
  amount: number (required)
}
```

### Delete Budget
```
DELETE /:id
```

## Database Schema

### DepartmentBudget Model
```typescript
{
  departmentId: ObjectId (ref: Department),
  fiscalYear: string,
  totalBudget: number,
  allocatedBudget: number,
  spentBudget: number,
  remainingBudget: number (calculated),
  categories: [
    {
      name: string,
      allocated: number,
      spent: number
    }
  ],
  status: 'draft' | 'approved' | 'active' | 'closed',
  approvedBy: ObjectId (ref: User),
  approvedAt: Date,
  notes: string,
  createdAt: Date,
  updatedAt: Date
}
```

## Usage Examples

### Create Department Budget
```javascript
const budget = {
  departmentId: "dept123",
  fiscalYear: "2024",
  totalBudget: 1000000,
  categories: [
    { name: "Salaries", allocated: 600000 },
    { name: "Equipment", allocated: 200000 },
    { name: "Training", allocated: 100000 },
    { name: "Miscellaneous", allocated: 100000 }
  ],
  notes: "Annual budget for IT department"
};

const response = await axios.post('/api/department-budgets', budget);
```

### Record Expense
```javascript
const expense = {
  categoryName: "Equipment",
  amount: 50000
};

await axios.put(`/api/department-budgets/${budgetId}/expense`, expense);
```

### Get Budget Summary
```javascript
const summary = await axios.get(`/api/department-budgets/department/${deptId}/summary`);
// Returns: { totalAllocated, totalSpent, totalRemaining, utilizationRate, budgetCount }
```

## Frontend Integration

### Access Department Budgets
Navigate to: `/dashboard/department-budgets`

### Features Available
1. **View All Budgets** - See all department budgets with status
2. **Create Budget** - Add new budget with categories
3. **Approve Budget** - Approve draft budgets
4. **Track Expenses** - Monitor spending per category
5. **Budget Summary** - View utilization and remaining amounts

### Budget Status Flow
1. **Draft** - Initial creation, can be edited
2. **Approved** - Approved by authorized user
3. **Active** - Currently in use
4. **Closed** - Fiscal year ended

## Best Practices

1. **Budget Planning**
   - Create budgets at the start of fiscal year
   - Define clear categories aligned with department needs
   - Ensure total allocated doesn't exceed total budget

2. **Expense Tracking**
   - Record expenses regularly
   - Use consistent category names
   - Review budget utilization monthly

3. **Approval Workflow**
   - Review budget allocations before approval
   - Verify category breakdowns
   - Document approval decisions in notes

4. **Monitoring**
   - Track utilization rates
   - Set alerts for high spending
   - Review remaining budget regularly

## Integration with Existing Features

### Department Model
- Department details now include budget summary
- GET `/api/departments/:id` returns budget information

### Financial Reports
- Budget data can be integrated with financial reports
- Expense tracking links to department budgets

## Security & Permissions

- All endpoints require authentication
- Budget approval requires appropriate role
- Department managers can view their department budgets
- Finance team has full access to all budgets

## Future Enhancements

- Budget forecasting and predictions
- Automated alerts for budget thresholds
- Budget vs actual comparison reports
- Multi-year budget planning
- Budget transfer between categories
- Integration with expense management system
