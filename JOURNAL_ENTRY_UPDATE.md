# ✅ Journal Entry System Updated

## Changes Made

Journal entries now reference **AccountLedger** (Indian accounting hierarchy) instead of the old Account model.

### Model Changes

**JournalEntry.ts:**
- Changed `accountId` → `ledgerId`
- Now references `AccountLedger` model

### Controller Changes

**generalLedgerController.ts:**
- Updated all journal entry operations to use `AccountLedger`
- Changed balance calculation to respect `balanceType` (debit/credit)
- Removed old `Ledger` and `Transaction` model dependencies

### API Usage

**Create Journal Entry:**
```json
POST /api/general-ledger/journal-entries
{
  "date": "2024-01-15",
  "description": "Cash sale of products",
  "reference": "INV-001",
  "lines": [
    {
      "ledgerId": "673abc...",  // Cash in Hand ledger ID
      "debit": 10000,
      "credit": 0,
      "description": "Cash received"
    },
    {
      "ledgerId": "673def...",  // Sales Account ledger ID
      "debit": 0,
      "credit": 10000,
      "description": "Product sales"
    }
  ]
}
```

### Balance Calculation

- **Debit Balance Ledgers** (Assets, Expenses): Balance increases with debits
- **Credit Balance Ledgers** (Liabilities, Income): Balance increases with credits

### Posting Process

When a journal entry is posted:
1. Validates debits = credits
2. Updates each ledger's `currentBalance`
3. Marks entry as `isPosted: true`

---

**Your journal entry system now works with the Indian accounting hierarchy! 🎉**
