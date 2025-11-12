# Journal Entry & Ledger - Quick Reference Guide

## Quick Start

### Access Journal & Ledger
1. Go to **Projects** → Select a project
2. Click **Finance** tab
3. Select **Ledger & Journal** sub-tab

## Creating Journal Entries

### Step-by-Step
1. Click **"New Journal Entry"** button
2. Fill in header:
   - **Date**: Transaction date
   - **Reference**: Voucher number (e.g., JV001)
   - **Description**: Brief description
3. Add lines (minimum 2):
   - Select **Account** from dropdown
   - Enter **Description** for the line
   - Enter **Debit** OR **Credit** amount
   - Click **"Add Line"** for more entries
4. Verify **Total Debits = Total Credits**
5. Click **"Save Entry"**

### Example: Cash Receipt
```
Date: 2024-01-15
Reference: JV001
Description: Cash received from client

Lines:
1. Cash (1001)          Debit: $10,000    Credit: $0
2. Revenue (4001)       Debit: $0         Credit: $10,000

Total Debits: $10,000   Total Credits: $10,000  ✓ Balanced
```

### Example: Expense Payment
```
Date: 2024-01-16
Reference: JV002
Description: Office supplies purchase

Lines:
1. Operating Expenses (6001)  Debit: $500     Credit: $0
2. Cash (1001)                Debit: $0       Credit: $500

Total Debits: $500   Total Credits: $500  ✓ Balanced
```

## Journal Entry Status

### Status Flow
```
DRAFT → POST → APPROVE
  ↓       ↓       ↓
Edit    View    Final
Delete  Post    View
```

### Actions by Status

| Status | Can Edit | Can Delete | Can Post | Can Approve |
|--------|----------|------------|----------|-------------|
| Draft | ✓ | ✓ | ✓ | ✗ |
| Posted | ✗ | ✗ | ✗ | ✓ |
| Approved | ✗ | ✗ | ✗ | ✗ |

### Posting an Entry
1. Find draft entry in **Journal Entries** tab
2. Click green **checkmark** button
3. Status changes to **Posted**
4. Ledger entries are created

### Approving an Entry
1. Find posted entry in **Journal Entries** tab
2. Click blue **checkmark** button
3. Status changes to **Approved**
4. Entry is now final

## Account Codes Reference

### Assets (1000-1999)
- **1001** - Cash
- **1200** - Accounts Receivable
- **1300** - Inventory
- **1500** - Equipment

### Liabilities (2000-2999)
- **2001** - Accounts Payable
- **2100** - Accrued Expenses

### Equity (3000-3999)
- **3001** - Project Capital

### Revenue (4000-4999)
- **4001** - Project Revenue

### Expenses (5000-6999)
- **5001** - Direct Costs
- **5100** - Labor Costs
- **6001** - Operating Expenses

## Viewing Ledger

### Ledger Entries Tab
Shows all posted transactions:
- Date
- Account (Code & Name)
- Description
- Voucher Number
- Debit/Credit amounts
- Running Balance

### Filtering
Click **"Filter"** button:
- **Date Range**: From/To dates
- **Account**: Specific account
- **Status**: Draft/Posted/Approved

### Exporting
Click **"Export"** button to download CSV with all ledger data

## Common Transactions

### 1. Cash Receipt
```
Debit:  Cash
Credit: Revenue
```

### 2. Cash Payment
```
Debit:  Expense
Credit: Cash
```

### 3. Purchase on Credit
```
Debit:  Inventory/Expense
Credit: Accounts Payable
```

### 4. Payment to Supplier
```
Debit:  Accounts Payable
Credit: Cash
```

### 5. Invoice to Client
```
Debit:  Accounts Receivable
Credit: Revenue
```

### 6. Receive Payment from Client
```
Debit:  Cash
Credit: Accounts Receivable
```

## Validation Rules

### ✓ Valid Entry
- Total Debits = Total Credits
- At least 2 lines
- All lines have accounts selected
- All lines have amounts > 0
- Date, Reference, Description filled

### ✗ Invalid Entry
- Unbalanced (Debits ≠ Credits)
- Less than 2 lines
- Missing account selection
- Zero amounts
- Missing required fields

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| New Entry | Alt + N |
| Save Entry | Ctrl + S |
| Add Line | Ctrl + L |
| Remove Line | Ctrl + D |

## Tips & Best Practices

### 1. Naming Conventions
- Use consistent reference numbers (JV001, JV002, etc.)
- Clear, concise descriptions
- Detailed line descriptions

### 2. Organization
- Group related transactions
- Use consistent dates
- Regular posting (don't leave drafts)

### 3. Review Process
- Review draft before posting
- Double-check amounts
- Verify account selections
- Get approval before finalizing

### 4. Reconciliation
- Export ledger monthly
- Compare with bank statements
- Review trial balance regularly

## Troubleshooting

### "Entry must be balanced"
**Cause**: Total Debits ≠ Total Credits
**Fix**: Adjust amounts so they match

### "Cannot update entry"
**Cause**: Entry is posted/approved
**Fix**: Only draft entries can be edited

### "Failed to create entry"
**Cause**: Missing required fields or authentication
**Fix**: 
- Fill all required fields
- Check you're logged in
- Verify account selections

### Entries not showing
**Cause**: Filters applied or wrong project
**Fix**:
- Clear filters
- Verify correct project selected
- Check date range

## Summary Statistics

The dashboard shows:
- **Total Entries**: Count of journal entries
- **Total Debits**: Sum of all debit amounts
- **Total Credits**: Sum of all credit amounts
- **Net Balance**: Difference (should be 0 for balanced books)

## Quick Entry Tab

For common transactions:
- **Quick Debit Entry**: Fast debit posting
- **Quick Credit Entry**: Fast credit posting
- **Common Transactions**: Pre-configured templates

## Support

### Need Help?
1. Check this guide
2. Review [Full Documentation](PROJECT_JOURNAL_LEDGER_FIX.md)
3. Contact finance team
4. Submit support ticket

### Report Issues
- Describe the problem
- Include entry number
- Attach screenshots
- Note error messages

---

**Version**: 1.0.0
**Last Updated**: 2024
