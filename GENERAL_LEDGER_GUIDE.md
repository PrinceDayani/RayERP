# 📊 General Ledger Module - Complete Guide

## Overview

The General Ledger module is a comprehensive, professional-grade accounting system with complete double-entry bookkeeping functionality and an intuitive user interface.

## 🌟 Key Features

### 1. Chart of Accounts
- **Hierarchical Structure**: Multi-level account organization
- **Account Types**: Assets, Liabilities, Equity, Revenue, Expenses
- **Group Accounts**: Create parent accounts to organize sub-accounts
- **Comprehensive Details**: Tax info, contact details, bank details, credit limits

### 2. Journal Entries
- **Double-Entry Bookkeeping**: Automatic validation that debits equal credits
- **Multi-Line Entries**: Support for complex transactions
- **Draft & Posted States**: Save drafts and post when ready
- **Reference Tracking**: Link entries to source documents

### 3. Financial Reports
- **Trial Balance**: Verify accounting accuracy
- **Balance Sheet**: Assets, Liabilities, and Equity (Coming Soon)
- **Profit & Loss**: Income and Expenses analysis (Coming Soon)

## 🚀 Getting Started

### 1. Seed the Chart of Accounts

```bash
cd backend
node scripts/seedChartOfAccounts.js
```

### 2. Access the Module

Navigate to: `http://localhost:3000/dashboard/general-ledger`

### 3. Create Your First Journal Entry

1. Go to **Journal Entries**
2. Click **New Entry**
3. Add account lines with debits and credits
4. Ensure debits = credits
5. Click **Create Entry** then **Post**

## 📊 Standard Chart of Accounts

### Assets (1000-1999)
- Current Assets: Cash, Bank, Receivables, Inventory
- Fixed Assets: Property, Equipment, Vehicles

### Liabilities (2000-2999)
- Current Liabilities: Payables, Short-term loans, Taxes
- Long-term Liabilities: Loans, Mortgages

### Equity (3000-3999)
- Capital, Retained Earnings, Current Year Earnings

### Revenue (4000-4999)
- Sales Revenue, Service Revenue, Other Income

### Expenses (5000-5999)
- COGS, Operating Expenses, Financial Expenses, Taxes

## 🎯 Common Transactions

### Cash Sale
```
Dr. Cash in Hand          ₹10,000
    Cr. Product Sales              ₹10,000
```

### Purchase on Credit
```
Dr. Raw Materials         ₹50,000
    Cr. Trade Creditors            ₹50,000
```

### Salary Payment
```
Dr. Employee Salaries     ₹200,000
    Cr. Bank Account               ₹200,000
```

## 🔧 API Endpoints

```
GET    /api/general-ledger/accounts
POST   /api/general-ledger/accounts
GET    /api/general-ledger/journal-entries
POST   /api/general-ledger/journal-entries
POST   /api/general-ledger/journal-entries/:id/post
GET    /api/general-ledger/trial-balance
```

## 🎨 UI Features

- Hierarchical tree view for accounts
- Real-time validation for journal entries
- Interactive trial balance reports
- Search and filter capabilities
- Export options for reports

---

**Built with ❤️ for professional accounting**
