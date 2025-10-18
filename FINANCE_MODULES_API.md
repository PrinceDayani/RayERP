# 💰 Finance Modules API Documentation

This document outlines the complete finance modules backend implementation for the ERP system.

## 📋 Overview

The finance modules include:
- **Accounts** - Chart of accounts management
- **Transactions** - Financial transactions and journal entries
- **Invoices** - Invoice management and billing
- **Payments** - Payment processing and tracking
- **Expenses** - Expense tracking and approval workflow
- **Financial Reports** - P&L, Balance Sheet, Cash Flow reports

## 🔗 API Endpoints

Base URL: `http://localhost:5000/api`

### 📊 Accounts Management

#### Create Account
```
POST /accounts
```
**Body:**
```json
{
  "code": "1000",
  "name": "Cash",
  "type": "asset",
  "subType": "current_asset",
  "parentAccount": "optional_parent_id",
  "description": "Cash account"
}
```

#### Get All Accounts
```
GET /accounts
```

#### Get Account by ID
```
GET /accounts/:id
```

#### Update Account
```
PUT /accounts/:id
```

#### Delete Account (Deactivate)
```
DELETE /accounts/:id
```

### 💸 Transactions Management

#### Create Transaction
```
POST /transactions
```
**Body:**
```json
{
  "date": "2024-01-15",
  "description": "Sales transaction",
  "reference": "REF001",
  "entries": [
    {
      "accountId": "account_id_1",
      "accountName": "Cash",
      "debit": 1000,
      "credit": 0
    },
    {
      "accountId": "account_id_2",
      "accountName": "Sales Revenue",
      "debit": 0,
      "credit": 1000
    }
  ]
}
```

#### Get All Transactions
```
GET /transactions?page=1&limit=10&status=draft
```

#### Post Transaction (Update Account Balances)
```
PUT /transactions/:id/post
```

### 🧾 Invoice Management

#### Create Invoice
```
POST /invoices
```
**Body:**
```json
{
  "customerId": "customer_id",
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "issueDate": "2024-01-15",
  "dueDate": "2024-02-15",
  "items": [
    {
      "description": "Web Development",
      "quantity": 1,
      "unitPrice": 1000,
      "totalPrice": 1000,
      "taxRate": 10,
      "taxAmount": 100
    }
  ],
  "subtotal": 1000,
  "taxAmount": 100,
  "totalAmount": 1100,
  "notes": "Payment due in 30 days"
}
```

#### Get All Invoices
```
GET /invoices?page=1&limit=10&status=sent
```

#### Get Invoice by ID
```
GET /invoices/:id
```

#### Update Invoice
```
PUT /invoices/:id
```

#### Mark Invoice as Paid
```
PUT /invoices/:id/pay
```
**Body:**
```json
{
  "paidAmount": 1100
}
```

### 💳 Payment Management

#### Create Payment
```
POST /payments
```
**Body:**
```json
{
  "invoiceId": "invoice_id",
  "customerId": "customer_id",
  "customerName": "John Doe",
  "amount": 1100,
  "paymentDate": "2024-01-20",
  "paymentMethod": "bank_transfer",
  "reference": "TXN123456",
  "notes": "Payment received"
}
```

#### Get All Payments
```
GET /payments?page=1&limit=10&status=completed
```

#### Get Payment by ID
```
GET /payments/:id
```

#### Update Payment Status
```
PUT /payments/:id/status
```
**Body:**
```json
{
  "status": "completed"
}
```

### 💼 Expense Management

#### Create Expense
```
POST /expenses
```
**Body:**
```json
{
  "employeeId": "employee_id",
  "employeeName": "Jane Smith",
  "category": "Travel",
  "description": "Business trip to client",
  "amount": 500,
  "expenseDate": "2024-01-15",
  "receiptUrl": "https://example.com/receipt.pdf",
  "notes": "Client meeting expenses"
}
```

#### Get All Expenses
```
GET /expenses?page=1&limit=10&status=submitted&category=Travel
```

#### Get Expense by ID
```
GET /expenses/:id
```

#### Approve/Reject Expense
```
PUT /expenses/:id/approve
```
**Body:**
```json
{
  "status": "approved",
  "notes": "Approved for reimbursement"
}
```

#### Get Expense Categories
```
GET /expenses/categories
```

### 📈 Financial Reports

#### Profit & Loss Statement
```
GET /financial-reports/profit-loss?startDate=2024-01-01&endDate=2024-12-31
```

#### Balance Sheet
```
GET /financial-reports/balance-sheet
```

#### Cash Flow Statement
```
GET /financial-reports/cash-flow?startDate=2024-01-01&endDate=2024-12-31
```

#### Financial Summary
```
GET /financial-reports/summary
```

## 🗄️ Database Models

### Account Model
```typescript
{
  code: string;           // Unique account code
  name: string;           // Account name
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  subType: string;        // Account sub-type
  parentAccount?: ObjectId; // Parent account reference
  balance: number;        // Current balance
  isActive: boolean;      // Active status
  description?: string;   // Account description
  createdBy: ObjectId;    // User who created
  createdAt: Date;
  updatedAt: Date;
}
```

### Transaction Model
```typescript
{
  transactionNumber: string;  // Auto-generated unique number
  date: Date;                // Transaction date
  description: string;       // Transaction description
  reference?: string;        // External reference
  entries: [{               // Journal entries (double-entry)
    accountId: ObjectId;
    accountName: string;
    debit: number;
    credit: number;
  }];
  totalAmount: number;      // Total transaction amount
  status: 'draft' | 'posted' | 'reversed';
  createdBy: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
```

### Invoice Model
```typescript
{
  invoiceNumber: string;    // Auto-generated unique number
  customerId?: ObjectId;    // Customer reference
  customerName: string;     // Customer name
  customerEmail?: string;   // Customer email
  issueDate: Date;         // Invoice issue date
  dueDate: Date;           // Payment due date
  items: [{                // Invoice line items
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    taxRate?: number;
    taxAmount?: number;
  }];
  subtotal: number;        // Subtotal amount
  taxAmount: number;       // Total tax amount
  totalAmount: number;     // Total invoice amount
  paidAmount: number;      // Amount paid
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  notes?: string;          // Additional notes
  createdBy: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
```

### Payment Model
```typescript
{
  paymentNumber: string;    // Auto-generated unique number
  invoiceId?: ObjectId;     // Related invoice
  customerId?: ObjectId;    // Customer reference
  customerName: string;     // Customer name
  amount: number;          // Payment amount
  paymentDate: Date;       // Payment date
  paymentMethod: 'cash' | 'check' | 'bank_transfer' | 'credit_card' | 'other';
  reference?: string;       // Payment reference
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  notes?: string;          // Payment notes
  createdBy: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
```

### Expense Model
```typescript
{
  expenseNumber: string;    // Auto-generated unique number
  employeeId?: ObjectId;    // Employee reference
  employeeName: string;     // Employee name
  category: string;         // Expense category
  description: string;      // Expense description
  amount: number;          // Expense amount
  expenseDate: Date;       // Expense date
  receiptUrl?: string;     // Receipt file URL
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'paid';
  approvedBy?: ObjectId;   // Approver reference
  approvedAt?: Date;       // Approval date
  notes?: string;          // Additional notes
  createdBy: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
```

## 🚀 Setup Instructions

1. **Install Dependencies** (already done in main project)

2. **Seed Initial Data**:
```bash
cd backend
node scripts/seedFinanceData.js
```

3. **Start the Server**:
```bash
npm run dev
```

## 🔐 Authentication

All finance endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## 📊 Features

### Double-Entry Bookkeeping
- All transactions follow double-entry principles
- Automatic balance validation (debits = credits)
- Account balance updates when transactions are posted

### Invoice Management
- Automatic invoice numbering
- Multiple line items support
- Tax calculations
- Payment tracking
- Status management (draft → sent → paid)

### Payment Processing
- Multiple payment methods
- Invoice linking
- Automatic invoice status updates
- Payment status tracking

### Expense Management
- Employee expense submissions
- Approval workflow
- Receipt attachments
- Category-based reporting

### Financial Reporting
- Profit & Loss statements
- Balance sheets
- Cash flow reports
- Financial summaries with key metrics

## 🧪 Testing

Test the API endpoints using the provided test script or tools like Postman. All endpoints return standardized responses:

**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "pagination": { ... } // For paginated endpoints
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error description"
}
```

## 🔄 Integration

The finance modules integrate with existing ERP modules:
- **Employees** - For expense management
- **Contacts** - For customer invoicing
- **Projects** - For project-based billing
- **Users** - For authentication and audit trails

---

**Built with modern accounting principles and best practices** 💼