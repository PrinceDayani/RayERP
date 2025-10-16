# General Ledger Implementation

## Overview
This implementation provides a comprehensive General Ledger system for the RayERP application, following double-entry bookkeeping principles and modern accounting standards.

## Features Implemented

### 1. Core Models
- **Account**: Chart of accounts with hierarchical structure
- **JournalEntry**: Double-entry journal entries with validation
- **Ledger**: Individual account transaction history
- **Transaction**: Links business transactions to journal entries

### 2. Backend Controllers
- **Account Management**: Create, update, and manage chart of accounts
- **Journal Entries**: Create and post journal entries with automatic validation
- **Ledger Posting**: Automatic ledger entry creation when posting journals
- **Financial Reports**: Generate P&L, Balance Sheet, and Trial Balance
- **Account Ledger**: Detailed transaction history per account

### 3. Frontend Components
- **GeneralLedger**: Main GL interface with tabs for accounts, journals, and reports
- **AccountLedger**: Detailed account transaction history with filtering
- **FinancialReports**: Generate and view financial statements
- **JournalEntry**: Create manual journal entries with validation

### 4. Automation Features
- **GLAutomation**: Utility class for auto-generating journal entries
- **Transaction Integration**: Automatic GL posting from business transactions
- **Balance Updates**: Real-time account balance maintenance

## Database Schema

### Accounts Collection
```javascript
{
  code: String,           // Account code (e.g., "1000")
  name: String,           // Account name (e.g., "Cash")
  type: String,           // asset|liability|equity|revenue|expense
  subType: String,        // Current Asset, Fixed Asset, etc.
  balance: Number,        // Current balance
  openingBalance: Number, // Opening balance
  currency: String,       // Currency code (default: INR)
  parentId: ObjectId,     // Parent account for hierarchy
  isActive: Boolean,      // Active status
  description: String     // Account description
}
```

### Journal Entries Collection
```javascript
{
  entryNumber: String,    // Auto-generated (JE000001)
  date: Date,             // Transaction date
  reference: String,      // External reference
  description: String,    // Entry description
  lines: [{               // Journal lines
    accountId: ObjectId,
    debit: Number,
    credit: Number,
    description: String
  }],
  totalDebit: Number,     // Auto-calculated
  totalCredit: Number,    // Auto-calculated
  isPosted: Boolean,      // Posted status
  createdBy: ObjectId     // User who created
}
```

### Ledger Collection
```javascript
{
  accountId: ObjectId,    // Account reference
  date: Date,             // Transaction date
  description: String,    // Transaction description
  debit: Number,          // Debit amount
  credit: Number,         // Credit amount
  balance: Number,        // Running balance
  journalEntryId: ObjectId, // Source journal entry
  reference: String       // External reference
}
```

### Transactions Collection
```javascript
{
  transactionType: String, // invoice|bill|payment|receipt|adjustment
  transactionId: String,   // Business transaction ID
  journalEntryId: ObjectId, // Linked journal entry
  amount: Number,          // Transaction amount
  status: String,          // draft|posted|cancelled
  metadata: Object         // Additional data
}
```

## API Endpoints

### Account Management
- `GET /api/general-ledger/accounts` - Get all accounts
- `POST /api/general-ledger/accounts` - Create new account
- `PUT /api/general-ledger/accounts/:id` - Update account

### Journal Entries
- `GET /api/general-ledger/journal-entries` - Get journal entries
- `POST /api/general-ledger/journal-entries` - Create journal entry
- `POST /api/general-ledger/journal-entries/:id/post` - Post journal entry

### Reports
- `GET /api/general-ledger/trial-balance` - Generate trial balance
- `GET /api/general-ledger/accounts/:id/ledger` - Get account ledger
- `GET /api/general-ledger/reports` - Generate financial reports

### Transaction Automation
- `POST /api/general-ledger/transactions/journal` - Auto-create from transaction

## Usage Examples

### 1. Seed Chart of Accounts
```bash
cd backend
npm run seed:accounts
```

### 2. Create Manual Journal Entry
```javascript
const journalEntry = {
  date: "2025-01-15",
  reference: "PAY-001",
  description: "Office rent payment",
  lines: [
    {
      accountId: "rent_expense_account_id",
      debit: 2000,
      credit: 0,
      description: "Monthly office rent"
    },
    {
      accountId: "cash_account_id", 
      debit: 0,
      credit: 2000,
      description: "Cash payment for rent"
    }
  ]
};
```

### 3. Auto-Generate from Invoice
```javascript
import { GLAutomation } from '../utils/glAutomation';

const invoiceJournal = await GLAutomation.createInvoiceJournal({
  invoiceId: "INV-001",
  customerId: "customer_id",
  amount: 5000,
  taxAmount: 500,
  items: [
    { description: "Consulting services", amount: 4500 }
  ]
});
```

## Key Features

### 1. Double-Entry Validation
- Automatic validation that debits equal credits
- Pre-save hooks prevent unbalanced entries
- Real-time balance checking in UI

### 2. Automatic Posting
- Journal entries create ledger entries when posted
- Account balances updated atomically
- Transaction rollback on errors

### 3. Financial Reports
- **Trial Balance**: Verify accounting equation
- **Profit & Loss**: Revenue vs expenses
- **Balance Sheet**: Assets, liabilities, equity
- **Account Ledger**: Detailed transaction history

### 4. Transaction Integration
- Auto-generate journal entries from business transactions
- Link invoices, bills, payments to GL
- Maintain audit trail

### 5. User Interface
- Intuitive tabbed interface
- Real-time validation feedback
- Export capabilities
- Date range filtering

## Installation & Setup

1. **Backend Setup**:
   ```bash
   cd RayERP/backend
   npm install
   npm run seed:accounts  # Seed chart of accounts
   npm run dev
   ```

2. **Frontend Setup**:
   ```bash
   cd RayERP/frontend
   npm install
   npm run dev
   ```

3. **Access GL Module**:
   - Navigate to `/dashboard/finance`
   - Use tabs to access different GL functions
   - Create accounts and journal entries
   - Generate reports

## Best Practices

1. **Account Coding**: Use consistent numbering (1000s for assets, 2000s for liabilities, etc.)
2. **Journal References**: Always include meaningful references
3. **Regular Reconciliation**: Run trial balance regularly
4. **Backup**: Regular database backups before major transactions
5. **User Permissions**: Restrict GL posting to authorized users

## Troubleshooting

### Common Issues
1. **Unbalanced Entries**: Check that total debits equal total credits
2. **Missing Accounts**: Ensure required accounts exist before automation
3. **Permission Errors**: Verify user has GL posting permissions
4. **Date Issues**: Ensure dates are in correct format

### Error Messages
- "Total debits must equal total credits" - Journal entry validation failed
- "Required accounts not found" - Missing chart of accounts setup
- "Journal entry already posted" - Attempting to modify posted entry

This implementation provides a solid foundation for accounting operations while maintaining flexibility for future enhancements.