# Complete Finance Module URLs

## Frontend URLs (Next.js Pages)

### Main Dashboard
- `/dashboard/finance` - Finance & Accounting home page

### Finance Management Hub
- `/dashboard/finance/manage` - Unified hub with 8 advanced tools (tabbed interface)

### Core Accounting Pages
- `/dashboard/finance/accounts` - Account management
- `/dashboard/finance/chart-of-accounts` - Chart of accounts structure
- `/dashboard/finance/journal-entry` - Journal entry creation
- `/dashboard/finance/journal-entry/[id]` - View/edit specific journal entry
- `/dashboard/finance/master-ledger` - All entries across all accounts
- `/dashboard/finance/vouchers` - Payment, Receipt, Contra, Sales, Purchase vouchers
- `/dashboard/finance/account-ledger` - Account ledger listing
- `/dashboard/finance/account-ledger/[id]` - Specific account ledger details

### Transaction Management Pages
- `/dashboard/finance/bank-reconciliation` - Match bank statements with books
- `/dashboard/finance/recurring-entries` - Automate repetitive journal entries
- `/dashboard/finance/bills` - Invoice-level tracking & payments
- `/dashboard/finance/invoices` - Invoice management
- `/dashboard/finance/payments` - Payment processing & tracking

### Financial Reports Pages
- `/dashboard/finance/reports` - Advanced reports hub
- `/dashboard/finance/reports-enhanced` - Enhanced reporting features
- `/dashboard/finance/trial-balance` - Trial balance report
- `/dashboard/finance/balance-sheet` - Balance sheet report
- `/dashboard/finance/profit-loss` - Profit & loss statement
- `/dashboard/finance/cash-flow` - Cash flow statement

### Management Tools Pages
- `/dashboard/finance/cost-centers` - Department/project allocation
- `/dashboard/finance/gl-budgets` - Budget tracking & variance analysis
- `/dashboard/finance/interest` - Interest calculations
- `/dashboard/finance/project-ledger` - Project-wise financial tracking
- `/dashboard/finance/sales-reports` - Sales tracking & analysis

### Advanced Features Pages
- `/dashboard/finance/multi-currency` - Foreign exchange & currency conversion
- `/dashboard/finance/currency-settings` - Currency configuration
- `/dashboard/finance/tax-management` - GST, VAT, TDS & tax reports
- `/dashboard/finance/aging-analysis` - Receivables & payables aging
- `/dashboard/finance/year-end` - Financial year management & closing
- `/dashboard/finance/advanced-reports` - Advanced reporting tools

### Compliance & Security Pages
- `/dashboard/finance/audit-trail` - Complete activity & compliance logs
- `/dashboard/finance/approvals` - Multi-level entry approvals
- `/dashboard/finance/documents` - Attach invoices & receipts
- `/dashboard/finance/smart-alerts` - AI fraud detection & duplicates

---

## Backend API URLs

### Base Path: `/api/finance`
**Core Finance Reports & Dashboard**

#### Dashboard & Health
- `GET /api/finance/dashboard` - Finance dashboard summary with KPIs
- `GET /api/finance/health` - Financial health metrics

#### Financial Reports
- `GET /api/finance/trial-balance` - Trial balance report
- `GET /api/finance/balance-sheet` - Balance sheet report
- `GET /api/finance/profit-loss` - Profit & loss statement
- `GET /api/finance/cash-flow` - Cash flow statement

#### Account Operations
- `GET /api/finance/ledger/:accountId` - Account ledger details

#### Budget Reports
- `GET /api/finance/budget-vs-actual` - Budget comparison report

---

### Base Path: `/api/finance-advanced`
**Advanced Finance Features**

#### Multi-Currency
- `GET /api/finance-advanced/currencies` - List all currencies
- `POST /api/finance-advanced/currencies` - Create new currency
- `GET /api/finance-advanced/exchange-rates` - List exchange rates
- `POST /api/finance-advanced/exchange-rates` - Create exchange rate

#### Tax Management
- `GET /api/finance-advanced/taxes` - List tax configurations
- `POST /api/finance-advanced/taxes` - Create tax configuration

#### Aging Analysis
- `GET /api/finance-advanced/aging-analysis` - Receivables & payables aging report

#### Year-End Closing
- `GET /api/finance-advanced/financial-years` - List financial years
- `POST /api/finance-advanced/financial-years` - Create financial year
- `POST /api/finance-advanced/financial-years/close` - Close financial year

#### Audit Trail
- `GET /api/finance-advanced/audit-logs` - Get audit logs with filters

#### Approval Workflows
- `GET /api/finance-advanced/approvals` - List approval workflows
- `POST /api/finance-advanced/approvals` - Create approval workflow
- `PUT /api/finance-advanced/approvals/:id` - Update approval status

#### Document Manager
- `GET /api/finance-advanced/documents` - List financial documents
- `POST /api/finance-advanced/documents` - Upload document

#### Smart Alerts
- `GET /api/finance-advanced/alerts` - Get smart alerts
- `PUT /api/finance-advanced/alerts/:id/resolve` - Resolve alert
- `GET /api/finance-advanced/alerts/detect-duplicates` - Detect duplicate entries
- `POST /api/finance-advanced/alerts/auto-detect` - Auto-detect anomalies

---

### Base Path: `/api/integrated-finance`
**Budget-Ledger Integration**

#### Project Finance
- `POST /api/integrated-finance/:projectId/expense` - Record project expense with budget sync
- `GET /api/integrated-finance/:projectId/dashboard` - Integrated financial dashboard
- `GET /api/integrated-finance/:projectId/variance` - Budget variance analysis
- `GET /api/integrated-finance/:projectId/report` - Comprehensive financial report
- `GET /api/integrated-finance/:projectId/report?format=pdf` - Financial report as PDF (501 - Not Implemented)

#### Budget Operations
- `POST /api/integrated-finance/sync-all` - Sync all project budgets
- `GET /api/integrated-finance/budget-alerts` - Real-time budget alerts
- `GET /api/integrated-finance/monitoring-status` - Budget monitoring status

#### Account Analysis
- `GET /api/integrated-finance/account/:accountCode/projects` - Account balances with project breakdown

---

### Base Path: `/api/general-ledger`
**General Ledger Operations**

#### Accounts
- `GET /api/general-ledger/accounts` - List all accounts
- `POST /api/general-ledger/accounts` - Create account
- `PUT /api/general-ledger/accounts/:id` - Update account
- `DELETE /api/general-ledger/accounts/:id` - Delete account
- `GET /api/general-ledger/accounts/:id` - Get account details

#### Journal Entries
- `GET /api/general-ledger/journal-entries` - List journal entries
- `POST /api/general-ledger/journal-entries` - Create journal entry
- `GET /api/general-ledger/journal-entries/:id` - Get journal entry details
- `PUT /api/general-ledger/journal-entries/:id` - Update journal entry
- `DELETE /api/general-ledger/journal-entries/:id` - Delete journal entry
- `POST /api/general-ledger/journal-entries/:id/post` - Post journal entry

#### Ledger Queries
- `GET /api/general-ledger/ledger` - Get ledger entries
- `GET /api/general-ledger/ledger/:accountId` - Get account ledger

---

### Base Path: `/api/chart-of-accounts`
**Chart of Accounts Management**

- `GET /api/chart-of-accounts` - Get chart of accounts hierarchy
- `POST /api/chart-of-accounts` - Create account in chart
- `GET /api/chart-of-accounts/tree` - Get hierarchical tree structure

---

### Base Path: `/api/accounts`
**Account Management**

- `GET /api/accounts` - List all accounts
- `POST /api/accounts` - Create new account
- `GET /api/accounts/:id` - Get account details
- `PUT /api/accounts/:id` - Update account
- `DELETE /api/accounts/:id` - Delete account

---

### Base Path: `/api/journal-entries`
**Journal Entry Management**

- `GET /api/journal-entries` - List journal entries with filters
- `POST /api/journal-entries` - Create journal entry
- `GET /api/journal-entries/:id` - Get journal entry
- `PUT /api/journal-entries/:id` - Update journal entry
- `DELETE /api/journal-entries/:id` - Delete journal entry
- `POST /api/journal-entries/:id/approve` - Approve journal entry
- `POST /api/journal-entries/:id/post` - Post journal entry
- `POST /api/journal-entries/:id/reverse` - Reverse journal entry

---

### Base Path: `/api/vouchers`
**Voucher Management**

- `GET /api/vouchers` - List all vouchers
- `POST /api/vouchers` - Create voucher
- `GET /api/vouchers/:id` - Get voucher details
- `PUT /api/vouchers/:id` - Update voucher
- `DELETE /api/vouchers/:id` - Delete voucher
- `POST /api/vouchers/:id/post` - Post voucher

---

### Base Path: `/api/invoices`
**Invoice Management**

- `GET /api/invoices` - List invoices
- `POST /api/invoices` - Create invoice
- `GET /api/invoices/:id` - Get invoice
- `PUT /api/invoices/:id` - Update invoice
- `DELETE /api/invoices/:id` - Delete invoice
- `POST /api/invoices/:id/send` - Send invoice

---

### Base Path: `/api/payments`
**Payment Management**

- `GET /api/payments` - List payments
- `POST /api/payments` - Create payment
- `GET /api/payments/:id` - Get payment details
- `PUT /api/payments/:id` - Update payment
- `DELETE /api/payments/:id` - Delete payment

---

### Base Path: `/api/budgets`
**Budget Management**

- `GET /api/budgets` - List budgets
- `POST /api/budgets` - Create budget
- `GET /api/budgets/:id` - Get budget details
- `PUT /api/budgets/:id` - Update budget
- `DELETE /api/budgets/:id` - Delete budget
- `POST /api/budgets/:id/approve` - Approve budget

---

### Base Path: `/api/gl-budgets`
**General Ledger Budgets**

- `GET /api/gl-budgets` - List GL budgets
- `POST /api/gl-budgets` - Create GL budget
- `GET /api/gl-budgets/:id` - Get GL budget
- `PUT /api/gl-budgets/:id` - Update GL budget
- `DELETE /api/gl-budgets/:id` - Delete GL budget

---

### Base Path: `/api/cost-centers`
**Cost Center Management**

- `GET /api/cost-centers` - List cost centers
- `POST /api/cost-centers` - Create cost center
- `GET /api/cost-centers/:id` - Get cost center
- `PUT /api/cost-centers/:id` - Update cost center
- `DELETE /api/cost-centers/:id` - Delete cost center

---

### Base Path: `/api/recurring-entries`
**Recurring Entry Management**

- `GET /api/recurring-entries` - List recurring entries
- `POST /api/recurring-entries` - Create recurring entry
- `GET /api/recurring-entries/:id` - Get recurring entry
- `PUT /api/recurring-entries/:id` - Update recurring entry
- `DELETE /api/recurring-entries/:id` - Delete recurring entry
- `POST /api/recurring-entries/:id/generate` - Generate entries from template

---

### Base Path: `/api/bank-reconciliation`
**Bank Reconciliation**

- `GET /api/bank-reconciliation` - Get reconciliation data
- `POST /api/bank-reconciliation` - Create reconciliation
- `POST /api/bank-reconciliation/match` - Match transactions

---

### Base Path: `/api/period-closing`
**Period Closing**

- `GET /api/period-closing` - Get period status
- `POST /api/period-closing/close` - Close period
- `POST /api/period-closing/reopen` - Reopen period

---

### Base Path: `/api/interest-calculations`
**Interest Calculations**

- `GET /api/interest-calculations` - List interest calculations
- `POST /api/interest-calculations` - Calculate interest
- `POST /api/interest-calculations/post` - Post interest entries

---

### Base Path: `/api/bills`
**Bill Management**

- `GET /api/bills` - List bills
- `POST /api/bills` - Create bill
- `GET /api/bills/:id` - Get bill details
- `PUT /api/bills/:id` - Update bill
- `DELETE /api/bills/:id` - Delete bill

---

### Base Path: `/api/project-ledger`
**Project Ledger**

- `GET /api/project-ledger` - List project ledger entries
- `POST /api/project-ledger` - Create project ledger entry
- `GET /api/project-ledger/:projectId` - Get project ledger details

---

### Base Path: `/api/financial-reports`
**Financial Reports**

- `GET /api/financial-reports/trial-balance` - Trial balance
- `GET /api/financial-reports/balance-sheet` - Balance sheet
- `GET /api/financial-reports/profit-loss` - Profit & loss
- `GET /api/financial-reports/cash-flow` - Cash flow
- `GET /api/financial-reports/general-ledger` - General ledger report

---

## Summary

**Frontend Pages**: 34 routes under `/dashboard/finance/`
**Backend API Groups**: 28+ route groups
**Total API Endpoints**: 150+ endpoints

All routes require authentication, and most require specific permissions (`finance.view`, `finance.manage`, etc.)
