# RayERP API Testing Guide

## Base URLs
- **Backend API**: `http://localhost:5000/api`
- **Frontend**: `http://localhost:3000`

## 🔐 Authentication Endpoints

### POST `http://localhost:5000/api/auth/register`
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "EMPLOYEE",
  "department": "IT"
}
```

### POST `http://localhost:5000/api/auth/login`
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

### POST `http://localhost:5000/api/auth/logout`
Headers: `Authorization: Bearer <token>`

### GET `http://localhost:5000/api/auth/me`
Headers: `Authorization: Bearer <token>`

---

## 👥 Employee Management

### GET `http://localhost:5000/api/employees`
Headers: `Authorization: Bearer <token>`

### POST `http://localhost:5000/api/employees`
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "phone": "+1234567890",
  "department": "HR",
  "position": "Manager",
  "salary": 75000,
  "hireDate": "2024-01-15"
}
```

### GET `http://localhost:5000/api/employees/:id`
### PUT `http://localhost:5000/api/employees/:id`
### DELETE `http://localhost:5000/api/employees/:id`

---

## ⏰ Attendance Management

### GET `http://localhost:5000/api/attendance`
Query params: `?date=2024-01-15&employeeId=123`

### POST `http://localhost:5000/api/attendance/checkin`
```json
{
  "employeeId": "employee_id_here"
}
```

### POST `http://localhost:5000/api/attendance/checkout`
```json
{
  "employeeId": "employee_id_here"
}
```

### GET `http://localhost:5000/api/attendance/today-stats`

---

## 📊 Project Management

### GET `http://localhost:5000/api/projects`
### POST `http://localhost:5000/api/projects`
```json
{
  "name": "New Website",
  "description": "Company website redesign",
  "startDate": "2024-01-01",
  "endDate": "2024-06-01",
  "status": "ACTIVE",
  "budget": 50000,
  "managerId": "manager_id_here"
}
```

### GET `http://localhost:5000/api/projects/:id`
### PUT `http://localhost:5000/api/projects/:id`
### DELETE `http://localhost:5000/api/projects/:id`
### GET `http://localhost:5000/api/projects/:id/tasks`

---

## 📁 Project File Sharing

### GET `http://localhost:5000/api/projects/:id/files`
### POST `http://localhost:5000/api/projects/:id/files`
Form data with file upload + sharing settings

### PUT `http://localhost:5000/api/projects/:id/files/:fileId/share`
```json
{
  "shareWithDepartments": ["IT", "HR"],
  "shareWithUsers": ["user_id_1", "user_id_2"]
}
```

### GET `http://localhost:5000/api/projects/shared/files`
### GET `http://localhost:5000/api/projects/:id/files/:fileId/download`
### DELETE `http://localhost:5000/api/projects/:id/files/:fileId`

---

## ✅ Task Management

### GET `http://localhost:5000/api/tasks`
Query params: `?projectId=123&status=PENDING&assignedTo=user_id`

### POST `http://localhost:5000/api/tasks`
```json
{
  "title": "Design Homepage",
  "description": "Create homepage mockup",
  "projectId": "project_id_here",
  "assignedTo": "user_id_here",
  "priority": "HIGH",
  "dueDate": "2024-02-01",
  "status": "PENDING"
}
```

### GET `http://localhost:5000/api/tasks/:id`
### PUT `http://localhost:5000/api/tasks/:id`
### DELETE `http://localhost:5000/api/tasks/:id`
### POST `http://localhost:5000/api/tasks/:id/comments`

---

## 📞 Contact Management

### GET `http://localhost:5000/api/contacts`
### POST `http://localhost:5000/api/contacts`
```json
{
  "name": "ABC Company",
  "email": "contact@abc.com",
  "phone": "+1234567890",
  "company": "ABC Corp",
  "position": "CEO",
  "address": "123 Main St"
}
```

### GET `http://localhost:5000/api/contacts/:id`
### PUT `http://localhost:5000/api/contacts/:id`
### DELETE `http://localhost:5000/api/contacts/:id`

---

## 💬 Chat & Messaging

### GET `http://localhost:5000/api/chat/chats`
### POST `http://localhost:5000/api/chat/chats`
```json
{
  "participantId": "user_id_here"
}
```

### POST `http://localhost:5000/api/chat/chats/message`
```json
{
  "chatId": "chat_id_here",
  "content": "Hello there!",
  "type": "text"
}
```

### POST `http://localhost:5000/api/chat/chats/upload`
Form data with file upload

### GET `http://localhost:5000/api/chat/chats/:chatId/messages`
### PUT `http://localhost:5000/api/chat/chats/:chatId/read`
### GET `http://localhost:5000/api/chat/users`

---

## 💰 Department Budget Management

### GET `http://localhost:5000/api/department-budgets`
Query params: `?department=IT&fiscalYear=2024`

### POST `http://localhost:5000/api/department-budgets`
```json
{
  "department": "IT",
  "fiscalYear": 2024,
  "totalBudget": 100000,
  "categories": [
    {
      "name": "Software",
      "allocatedAmount": 50000
    },
    {
      "name": "Hardware",
      "allocatedAmount": 30000
    }
  ]
}
```

### GET `http://localhost:5000/api/department-budgets/:id`
### PUT `http://localhost:5000/api/department-budgets/:id`
### PUT `http://localhost:5000/api/department-budgets/:id/approve`
### PUT `http://localhost:5000/api/department-budgets/:id/expense`
### GET `http://localhost:5000/api/department-budgets/department/:departmentId/summary`
### DELETE `http://localhost:5000/api/department-budgets/:id`

---

## 🧾 Voucher Management

### POST `http://localhost:5000/api/vouchers`
```json
{
  "voucherType": "PAYMENT",
  "date": "2024-01-15",
  "narration": "Office rent payment",
  "entries": [
    {
      "accountId": "rent_account_id",
      "debit": 5000,
      "credit": 0
    },
    {
      "accountId": "cash_account_id",
      "debit": 0,
      "credit": 5000
    }
  ]
}
```

### GET `http://localhost:5000/api/vouchers`
Query params: `?type=PAYMENT&status=DRAFT&fromDate=2024-01-01&toDate=2024-01-31`

### GET `http://localhost:5000/api/vouchers/stats`
### GET `http://localhost:5000/api/vouchers/:id`
### PUT `http://localhost:5000/api/vouchers/:id`
### POST `http://localhost:5000/api/vouchers/:id/post`
### POST `http://localhost:5000/api/vouchers/:id/cancel`
### DELETE `http://localhost:5000/api/vouchers/:id`

---

## 💳 Payment Management

### POST `http://localhost:5000/api/payments`
```json
{
  "amount": 1000,
  "currency": "USD",
  "paymentMethod": "BANK_TRANSFER",
  "payerId": "customer_id",
  "invoiceId": "invoice_id",
  "description": "Invoice payment"
}
```

### POST `http://localhost:5000/api/payments/batch`
### GET `http://localhost:5000/api/payments`
Query params: `?status=PENDING&method=BANK_TRANSFER&fromDate=2024-01-01`

### GET `http://localhost:5000/api/payments/analytics`
### GET `http://localhost:5000/api/payments/:id`
### PUT `http://localhost:5000/api/payments/:id/status`
### POST `http://localhost:5000/api/payments/:id/approve`
### POST `http://localhost:5000/api/payments/:id/refund`
### POST `http://localhost:5000/api/payments/:id/dispute`
### POST `http://localhost:5000/api/payments/:id/reconcile`
### POST `http://localhost:5000/api/payments/:id/journal-entry`
### POST `http://localhost:5000/api/payments/:id/reminder`

---

## 📊 Financial Reports

### GET `http://localhost:5000/api/financial-reports/balance-sheet`
Query params: `?asOfDate=2024-01-31&compareWith=2023-01-31`

### GET `http://localhost:5000/api/financial-reports/profit-loss`
Query params: `?fromDate=2024-01-01&toDate=2024-01-31&compareWithPreviousYear=true`

### GET `http://localhost:5000/api/financial-reports/comparative`
Query params: `?type=YoY&fromDate=2024-01-01&toDate=2024-01-31`

### GET `http://localhost:5000/api/financial-reports/multi-period`
Query params: `?period=monthly&year=2024`

### GET `http://localhost:5000/api/financial-reports/forecast`
Query params: `?months=3`

### GET `http://localhost:5000/api/financial-reports/cash-flow`
### GET `http://localhost:5000/api/financial-reports/export`
Query params: `?format=PDF&report=balance-sheet`

### GET `http://localhost:5000/api/financial-reports/account-transactions/:accountId`

---

## 🏦 Bank Reconciliation

### POST `http://localhost:5000/api/bank-reconciliation/statements`
Form data with bank statement file

### GET `http://localhost:5000/api/bank-reconciliation/statements`
### POST `http://localhost:5000/api/bank-reconciliation/statements/:id/reconcile`
### PUT `http://localhost:5000/api/bank-reconciliation/reconciliations/:id/complete`
### GET `http://localhost:5000/api/bank-reconciliation/reconciliations`
### POST `http://localhost:5000/api/bank-reconciliation/reconciliations/bulk-match`
### GET `http://localhost:5000/api/bank-reconciliation/reconciliations/outstanding/:accountId`

---

## 📊 GL Budgets

### POST `http://localhost:5000/api/gl-budgets`
```json
{
  "accountId": "account_id",
  "fiscalYear": 2024,
  "period": "MONTHLY",
  "amounts": {
    "january": 10000,
    "february": 12000,
    "march": 11000
  }
}
```

### GET `http://localhost:5000/api/gl-budgets`
Query params: `?fiscalYear=2024&accountId=123&status=APPROVED`

### GET `http://localhost:5000/api/gl-budgets/alerts`
### GET `http://localhost:5000/api/gl-budgets/comparison`
### GET `http://localhost:5000/api/gl-budgets/:id`
### PUT `http://localhost:5000/api/gl-budgets/:id`
### DELETE `http://localhost:5000/api/gl-budgets/:id`
### POST `http://localhost:5000/api/gl-budgets/:id/revise`
### POST `http://localhost:5000/api/gl-budgets/:id/submit-approval`
### POST `http://localhost:5000/api/gl-budgets/:id/approve`
### POST `http://localhost:5000/api/gl-budgets/:id/reject`
### POST `http://localhost:5000/api/gl-budgets/:id/freeze`
### PUT `http://localhost:5000/api/gl-budgets/:id/actuals`
### POST `http://localhost:5000/api/gl-budgets/from-template`
### POST `http://localhost:5000/api/gl-budgets/copy-previous-year`

---

## 💰 Interest Calculations

### POST `http://localhost:5000/api/interest-calculations`
```json
{
  "type": "SIMPLE",
  "principal": 100000,
  "rate": 8.5,
  "startDate": "2024-01-01",
  "endDate": "2024-12-31",
  "compoundingFrequency": "MONTHLY"
}
```

### GET `http://localhost:5000/api/interest-calculations`
### GET `http://localhost:5000/api/interest-calculations/summary`
### GET `http://localhost:5000/api/interest-calculations/accruals`
### GET `http://localhost:5000/api/interest-calculations/overdue`
### GET `http://localhost:5000/api/interest-calculations/:id`
### DELETE `http://localhost:5000/api/interest-calculations/:id`
### POST `http://localhost:5000/api/interest-calculations/:id/post`
### PUT `http://localhost:5000/api/interest-calculations/:id/emi-status`
### POST `http://localhost:5000/api/interest-calculations/schedule`
### POST `http://localhost:5000/api/interest-calculations/run-scheduled`

---

## 🧾 Invoice Management

### POST `http://localhost:5000/api/invoices`
```json
{
  "customerId": "customer_id",
  "invoiceDate": "2024-01-15",
  "dueDate": "2024-02-15",
  "currency": "USD",
  "items": [
    {
      "description": "Web Development",
      "quantity": 1,
      "rate": 5000,
      "taxRate": 18
    }
  ],
  "paymentTerms": "NET_30"
}
```

### GET `http://localhost:5000/api/invoices`
Query params: `?status=SENT&customerId=123&fromDate=2024-01-01`

### GET `http://localhost:5000/api/invoices/stats`
### GET `http://localhost:5000/api/invoices/aging-report`
### GET `http://localhost:5000/api/invoices/:id`
### PUT `http://localhost:5000/api/invoices/:id`
### DELETE `http://localhost:5000/api/invoices/:id`
### POST `http://localhost:5000/api/invoices/:id/approve`
### POST `http://localhost:5000/api/invoices/:id/send`
### POST `http://localhost:5000/api/invoices/:id/payment`
### POST `http://localhost:5000/api/invoices/:id/post`
### POST `http://localhost:5000/api/invoices/:id/attachment`
### POST `http://localhost:5000/api/invoices/batch`
### POST `http://localhost:5000/api/invoices/generate-recurring`
### POST `http://localhost:5000/api/invoices/send-reminders`
### POST `http://localhost:5000/api/invoices/calculate-late-fees`

---

## 📒 Journal Entry

### POST `http://localhost:5000/api/journal-entries`
```json
{
  "date": "2024-01-15",
  "reference": "JE-001",
  "description": "Monthly depreciation",
  "entries": [
    {
      "accountId": "depreciation_expense_id",
      "debit": 1000,
      "credit": 0,
      "costCenterId": "cost_center_id"
    },
    {
      "accountId": "accumulated_depreciation_id",
      "debit": 0,
      "credit": 1000
    }
  ]
}
```

### GET `http://localhost:5000/api/journal-entries`
Query params: `?status=DRAFT&fromDate=2024-01-01&accountId=123`

### GET `http://localhost:5000/api/journal-entries/stats`
### GET `http://localhost:5000/api/journal-entries/:id`
### PUT `http://localhost:5000/api/journal-entries/:id`
### DELETE `http://localhost:5000/api/journal-entries/:id`
### POST `http://localhost:5000/api/journal-entries/:id/approve`
### POST `http://localhost:5000/api/journal-entries/:id/post`
### POST `http://localhost:5000/api/journal-entries/:id/reverse`
### POST `http://localhost:5000/api/journal-entries/:id/copy`
### POST `http://localhost:5000/api/journal-entries/:id/attachment`
### POST `http://localhost:5000/api/journal-entries/batch-post`
### POST `http://localhost:5000/api/journal-entries/from-template/:templateId`
### POST `http://localhost:5000/api/journal-entries/generate-recurring`
### POST `http://localhost:5000/api/journal-entries/bulk-import`
### POST `http://localhost:5000/api/journal-entries/lock-period`

---

## 📄 Templates

### Invoice Templates
- GET `http://localhost:5000/api/invoice-templates`
- POST `http://localhost:5000/api/invoice-templates`
- GET `http://localhost:5000/api/invoice-templates/:id`
- PUT `http://localhost:5000/api/invoice-templates/:id`
- DELETE `http://localhost:5000/api/invoice-templates/:id`

### Journal Entry Templates
- GET `http://localhost:5000/api/journal-entry-templates`
- POST `http://localhost:5000/api/journal-entry-templates`
- GET `http://localhost:5000/api/journal-entry-templates/:id`
- PUT `http://localhost:5000/api/journal-entry-templates/:id`
- DELETE `http://localhost:5000/api/journal-entry-templates/:id`

---

## 📊 Project Ledger

### GET `http://localhost:5000/api/project-ledger/:projectId/budget-actual`
### PUT `http://localhost:5000/api/project-ledger/:projectId/budget`
```json
{
  "totalBudget": 100000,
  "categories": [
    {
      "name": "Development",
      "budget": 60000
    },
    {
      "name": "Testing",
      "budget": 20000
    }
  ]
}
```

### POST `http://localhost:5000/api/project-ledger/:projectId/recalculate-actuals`
### GET `http://localhost:5000/api/project-ledger/:projectId/profitability`
### POST `http://localhost:5000/api/project-ledger/:projectId/calculate-profitability`
### GET `http://localhost:5000/api/project-ledger/:projectId/financial-dashboard`

---

## 📈 Analytics & Reports

### GET `http://localhost:5000/api/analytics/dashboard`
### GET `http://localhost:5000/api/reports/employees`
### GET `http://localhost:5000/api/reports/projects`
### GET `http://localhost:5000/api/reports/tasks`

---

## 🌐 Frontend Routes

### Authentication
- `http://localhost:3000/login` - Login page
- `http://localhost:3000/signup` - Registration page

### Dashboard
- `http://localhost:3000/dashboard` - Main dashboard
- `http://localhost:3000/dashboard/employees` - Employee management
- `http://localhost:3000/dashboard/projects` - Project management
- `http://localhost:3000/dashboard/tasks` - Task management
- `http://localhost:3000/dashboard/contacts` - Contact management
- `http://localhost:3000/dashboard/chat` - Chat interface

### Financial
- `http://localhost:3000/dashboard/vouchers` - Voucher management
- `http://localhost:3000/dashboard/payments` - Payment management
- `http://localhost:3000/dashboard/invoices` - Invoice management
- `http://localhost:3000/dashboard/journal-entries` - Journal entries
- `http://localhost:3000/dashboard/budgets` - Budget management
- `http://localhost:3000/dashboard/reports` - Financial reports
- `http://localhost:3000/dashboard/bank-reconciliation` - Bank reconciliation

### Settings
- `http://localhost:3000/dashboard/settings` - System settings
- `http://localhost:3000/dashboard/users` - User management
- `http://localhost:3000/dashboard/departments` - Department management

---

## 🧪 Testing Tips

### Authentication Flow
1. Register a new user via POST `http://localhost:5000/api/auth/register`
2. Login via POST `http://localhost:5000/api/auth/login` to get JWT token
3. Use token in Authorization header for protected routes

### Sample Headers
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

### Testing Tools
- **Postman**: Import endpoints and test API
- **curl**: Command line testing
- **Frontend**: Use browser dev tools to inspect network requests

### Common Query Parameters
- `page=1&limit=10` - Pagination
- `sort=createdAt&order=desc` - Sorting
- `search=keyword` - Search functionality
- `status=ACTIVE` - Filter by status
- `fromDate=2024-01-01&toDate=2024-01-31` - Date range

---

## 🔍 Error Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

## 📝 Notes

1. All POST/PUT requests require `Content-Type: application/json`
2. File uploads use `multipart/form-data`
3. All protected routes require JWT token in Authorization header
4. Date format: `YYYY-MM-DD`
5. Currency codes: `USD`, `EUR`, `GBP`, `INR`
6. All amounts are in decimal format (e.g., 1000.50)