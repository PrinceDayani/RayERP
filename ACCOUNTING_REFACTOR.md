# Accounting System Refactor

## Changes Made

### 1. Renamed `ledgerId` → `accountId` in JournalEntry
- **File**: `backend/src/models/JournalEntry.ts`
- **Change**: Renamed `IJournalLine.ledgerId` to `accountId` for clarity
- **Reason**: Journal entries post to accounts, not ledgers. Ledgers are for parties (customers/vendors)

### 2. Renamed AccountLedger → PartyLedger
- **File**: `backend/src/models/PartyLedger.ts` (new)
- **Change**: Created PartyLedger model with backward compatibility alias
- **Reason**: Clarifies that this model is for parties (customers, vendors, suppliers) with additional contact/tax info
- **Note**: Old `AccountLedger` import still works via alias

### 3. Fixed Balance Updates
- **File**: `backend/src/controllers/generalLedgerController.ts`
- **Function**: `postJournalEntry`
- **Changes**:
  - Now updates both Account balance AND PartyLedger balance (if exists)
  - Account balance updated based on account type (asset/expense vs liability/revenue/equity)
  - PartyLedger balance updated based on balanceType (debit vs credit)
  - Added validation to throw error if account not found during posting

### 4. Added Validation
- **File**: `backend/src/controllers/generalLedgerController.ts`
- **Functions**: `createJournalEntry`, `updateJournalEntry`, `postJournalEntry`
- **Validations Added**:
  - Check account exists before creating journal entry
  - Check account is active before creating journal entry
  - Throw error (not continue) if account not found during posting
  - Validate account exists when updating journal entry lines

### 5. Added Tests
- **File**: `backend/src/tests/journalEntry.test.ts`
- **Tests**:
  - Balance updates for asset accounts
  - Balance updates for both Account and PartyLedger
  - Validation: reject posting if account doesn't exist
  - Validation: reject if debits ≠ credits
  - Validation: check inactive accounts

## Model Purposes

### Account
- **Purpose**: Chart of accounts - the accounting structure
- **Contains**: Code, name, type (asset/liability/equity/revenue/expense), balance
- **Used for**: Financial reporting, trial balance, balance sheet, P&L

### PartyLedger (formerly AccountLedger)
- **Purpose**: Party-specific ledgers for customers, vendors, suppliers
- **Contains**: Contact info, tax info (GST, PAN), bank details, credit terms
- **Links to**: Account (via accountId)
- **Used for**: Managing business relationships, tracking receivables/payables

### JournalEntry
- **Purpose**: Record financial transactions
- **Contains**: Lines with accountId (not ledgerId), debits, credits
- **Posts to**: Account balances and PartyLedger balances (if applicable)

## Migration Notes

### Breaking Changes
- `JournalEntry.lines[].ledgerId` → `JournalEntry.lines[].accountId`
- `AccountLedger` model → `PartyLedger` model (alias provided for compatibility)

### Backward Compatibility
- Import `AccountLedger` still works (alias to PartyLedger)
- Controllers accept both `accountId` and `ledgerId` in request body (for transition)

### Database Migration
No migration needed - MongoDB field rename happens automatically on next save.

## Testing

Run tests:
```bash
cd backend
npm test -- journalEntry.test.ts
```

## Next Steps

1. Update frontend to use `accountId` instead of `ledgerId`
2. Update API documentation
3. Consider adding migration script for existing data
4. Add more comprehensive tests for complex scenarios
