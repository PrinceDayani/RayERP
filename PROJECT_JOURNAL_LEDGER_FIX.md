# Project Journal Entry and Ledger Entry Fix

## Overview
This document outlines the fixes applied to the Journal Entry and Ledger Entry functionality for per-project finance management in the ERP system.

## Issues Fixed

### 1. User Authentication in Project Ledger Controller
**Problem**: The `req.user` object was not being properly accessed, causing journal entry creation to fail.

**Solution**: Updated the controller to handle both `req.user.id` and `req.user._id` formats:
```typescript
const userId = (req as any).user?.id || (req as any).user?._id;
```

### 2. Journal Entry Creation Flow
**Fixed Files**:
- `backend/src/controllers/projectLedgerController.ts`
- `frontend/src/components/projects/finance/ProjectLedger.tsx`
- `frontend/src/lib/api/projectFinanceApi.ts`

## Architecture

### Backend Structure

#### Models
1. **ProjectLedger.ts** (`backend/src/models/ProjectLedger.ts`)
   - `IProjectJournalEntry`: Main journal entry interface
   - `IProjectJournalLine`: Individual line items in journal entries
   - Status workflow: `draft` → `posted` → `approved`

2. **JournalEntry.ts** (`backend/src/models/JournalEntry.ts`)
   - General ledger journal entries (company-wide)
   - Validates debits equal credits

3. **Ledger.ts** (`backend/src/models/Ledger.ts`)
   - Individual ledger entries created when journal entries are posted
   - Tracks running balances per account

#### Controllers
**projectLedgerController.ts** (`backend/src/controllers/projectLedgerController.ts`)

Key Functions:
- `getProjectJournalEntries`: Fetch all journal entries for a project
- `getJournalEntryById`: Get specific journal entry details
- `createJournalEntry`: Create new journal entry (validates balance)
- `updateJournalEntry`: Update draft entries only
- `postJournalEntry`: Change status from draft to posted
- `approveJournalEntry`: Approve posted entries
- `deleteJournalEntry`: Delete draft entries only
- `getProjectLedgerEntries`: Get ledger view from journal entries
- `getProjectTrialBalance`: Generate trial balance for project

#### Routes
**projectLedger.routes.ts** (`backend/src/routes/projectLedger.routes.ts`)

Endpoints:
```
GET    /api/project-ledger/:projectId/journal-entries
GET    /api/project-ledger/:projectId/journal-entries/:entryId
POST   /api/project-ledger/:projectId/journal-entries
PUT    /api/project-ledger/:projectId/journal-entries/:entryId
PATCH  /api/project-ledger/:projectId/journal-entries/:entryId/post
PATCH  /api/project-ledger/:projectId/journal-entries/:entryId/approve
DELETE /api/project-ledger/:projectId/journal-entries/:entryId
GET    /api/project-ledger/:projectId/ledger-entries
GET    /api/project-ledger/:projectId/trial-balance
```

### Frontend Structure

#### Components
**ProjectLedger.tsx** (`frontend/src/components/projects/finance/ProjectLedger.tsx`)

Features:
- Three-tab interface: Ledger Entries, Journal Entries, Quick Entry
- Create balanced journal entries with multiple lines
- Real-time validation (debits must equal credits)
- Filter by date, account, and status
- Export ledger to CSV
- View journal entry details
- Status badges (Draft, Posted, Approved)

#### API Client
**projectFinanceApi.ts** (`frontend/src/lib/api/projectFinanceApi.ts`)

Functions:
- `getLedgerEntries`: Fetch ledger entries with filters
- `getJournalEntries`: Fetch journal entries with filters
- `createJournalEntry`: Create new journal entry
- `updateJournalEntry`: Update existing entry
- `postJournalEntry`: Post draft entry
- `deleteJournalEntry`: Delete draft entry

## Usage Guide

### Creating a Journal Entry

1. Navigate to Project → Finance Tab → Ledger & Journal
2. Click "New Journal Entry" button
3. Fill in:
   - Date
   - Reference (e.g., JV001)
   - Description
4. Add journal lines:
   - Select account from dropdown
   - Enter description
   - Enter debit OR credit amount (not both)
   - Add more lines as needed
5. Ensure Total Debits = Total Credits
6. Click "Save Entry"

### Journal Entry Workflow

```
Draft → Posted → Approved
  ↓       ↓
Edit    View Only
Delete
```

- **Draft**: Can be edited or deleted
- **Posted**: Cannot be edited, can be approved
- **Approved**: Final state, cannot be modified

### Account Codes

Pre-configured accounts:
- `1001` - Cash
- `1200` - Accounts Receivable
- `1300` - Inventory
- `1500` - Equipment
- `2001` - Accounts Payable
- `2100` - Accrued Expenses
- `3001` - Project Capital
- `4001` - Project Revenue
- `5001` - Direct Costs
- `5100` - Labor Costs
- `6001` - Operating Expenses

### Viewing Ledger Entries

The ledger view shows:
- Date of transaction
- Account code and name
- Description
- Voucher number
- Debit/Credit amounts
- Running balance

### Filtering

Available filters:
- **Date Range**: Filter by transaction date
- **Account**: Show entries for specific account
- **Status**: Filter by draft/posted/approved

### Exporting

Click "Export" to download ledger entries as CSV file with:
- All transaction details
- Debit/Credit columns
- Running balances

## API Examples

### Create Journal Entry
```bash
POST /api/project-ledger/:projectId/journal-entries
Content-Type: application/json
Authorization: Bearer <token>

{
  "date": "2024-01-15",
  "reference": "JV001",
  "description": "Initial project funding",
  "lines": [
    {
      "accountCode": "1001",
      "accountName": "Cash",
      "debit": 50000,
      "credit": 0,
      "description": "Cash received"
    },
    {
      "accountCode": "3001",
      "accountName": "Project Capital",
      "debit": 0,
      "credit": 50000,
      "description": "Capital contribution"
    }
  ]
}
```

### Get Ledger Entries
```bash
GET /api/project-ledger/:projectId/ledger-entries?startDate=2024-01-01&endDate=2024-12-31&accountCode=1001
Authorization: Bearer <token>
```

### Post Journal Entry
```bash
PATCH /api/project-ledger/:projectId/journal-entries/:entryId/post
Authorization: Bearer <token>
```

## Validation Rules

1. **Balanced Entry**: Total Debits must equal Total Credits
2. **Minimum Lines**: At least 2 lines required
3. **Account Selection**: Each line must have a valid account
4. **Amount**: Either debit OR credit (not both) per line
5. **Status Transitions**:
   - Draft → Posted (any user)
   - Posted → Approved (requires approval permission)
   - Cannot revert from Posted/Approved to Draft

## Database Schema

### ProjectJournalEntry Collection
```javascript
{
  projectId: ObjectId,
  entryNumber: String (unique),
  date: Date,
  reference: String,
  description: String,
  narration: String (optional),
  lines: [{
    accountCode: String,
    accountName: String,
    debit: Number,
    credit: Number,
    description: String
  }],
  totalDebit: Number,
  totalCredit: Number,
  attachments: [String],
  status: 'draft' | 'posted' | 'approved',
  createdBy: ObjectId,
  approvedBy: ObjectId (optional),
  approvedAt: Date (optional),
  createdAt: Date,
  updatedAt: Date
}
```

## Testing

### Manual Testing Steps

1. **Create Journal Entry**
   - Verify balanced entry validation
   - Check entry number generation
   - Confirm draft status

2. **Post Journal Entry**
   - Verify status changes to posted
   - Check ledger entries are created
   - Confirm balances are updated

3. **View Ledger**
   - Verify all entries appear
   - Check running balances
   - Test filters

4. **Export**
   - Download CSV
   - Verify data completeness

### Test Cases

```javascript
// Test 1: Balanced Entry
{
  lines: [
    { accountCode: '1001', debit: 1000, credit: 0 },
    { accountCode: '4001', debit: 0, credit: 1000 }
  ]
  // Expected: Success
}

// Test 2: Unbalanced Entry
{
  lines: [
    { accountCode: '1001', debit: 1000, credit: 0 },
    { accountCode: '4001', debit: 0, credit: 500 }
  ]
  // Expected: Error - "Journal entry must be balanced"
}

// Test 3: Edit Posted Entry
// Expected: Error - "Only draft entries can be updated"
```

## Troubleshooting

### Issue: "Failed to create journal entry"
**Solution**: Check that:
- User is authenticated
- Total debits equal total credits
- All required fields are filled
- Account codes are valid

### Issue: "Cannot update journal entry"
**Solution**: Only draft entries can be updated. Posted/approved entries are read-only.

### Issue: Ledger entries not showing
**Solution**: 
- Ensure journal entries are posted (not draft)
- Check date filters
- Verify project ID is correct

### Issue: User ID not found
**Solution**: This has been fixed in the controller. Ensure you're using the latest version.

## Future Enhancements

1. **Recurring Entries**: Template-based recurring journal entries
2. **Attachments**: Upload supporting documents
3. **Audit Trail**: Track all changes to entries
4. **Approval Workflow**: Multi-level approval process
5. **Reversing Entries**: Ability to reverse posted entries
6. **Account Reconciliation**: Match ledger with bank statements
7. **Batch Import**: Import multiple entries from Excel
8. **Custom Reports**: User-defined financial reports

## Related Documentation

- [General Ledger System](README_GENERAL_LEDGER.md)
- [Budget Management](BUDGET_PROJECT_CONNECTION.md)
- [Financial Reports](FINANCE_MODULES_API.md)
- [Project Management](EMPLOYEE_PROJECT_MANAGEMENT.md)

## Support

For issues or questions:
1. Check this documentation
2. Review API endpoint responses
3. Check browser console for errors
4. Verify backend logs
5. Contact development team

---

**Last Updated**: 2024
**Version**: 1.0.0
